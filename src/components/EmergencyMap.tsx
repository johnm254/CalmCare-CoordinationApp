import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../lib/supabase";

interface Props {
  onCancel: () => void;
}

const PATIENT_POS: [number, number] = [-1.2921, 36.8219];

const HOSPITALS: { name: string; pos: [number, number] }[] = [
  { name: "Kenyatta National Hospital", pos: [-1.3009, 36.8070] },
  { name: "Nairobi Hospital", pos: [-1.2966, 36.8075] },
  { name: "Aga Khan Hospital", pos: [-1.2635, 36.8141] },
  { name: "MP Shah Hospital", pos: [-1.2709, 36.8139] },
];

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const sin_dLat = Math.sin(dLat / 2);
  const sin_dLon = Math.sin(dLon / 2);
  const ac =
    sin_dLat * sin_dLat +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      sin_dLon *
      sin_dLon;
  return R * 2 * Math.atan2(Math.sqrt(ac), Math.sqrt(1 - ac));
}

function nearestHospital(patient: [number, number]): [number, number] {
  let best = HOSPITALS[0];
  let bestDist = distanceKm(patient, HOSPITALS[0].pos);
  for (const h of HOSPITALS) {
    const d = distanceKm(patient, h.pos);
    if (d < bestDist) { bestDist = d; best = h; }
  }
  return best.pos;
}

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function makeIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="font-size:28px">${emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function makeHospitalIcon(): L.DivIcon {
  return L.divIcon({
    html: '<div style="font-size:24px">🏥</div>',
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function EmergencyMap({ onCancel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const ambulanceMarker = useRef<L.Marker | null>(null);
  const ambulancePosRef = useRef<[number, number]>(nearestHospital(PATIENT_POS));
  const [eta, setEta] = useState(12);
  const [toast, setToast] = useState("");
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Determine patient position (try geolocation, fall back to Nairobi CBD)
    const initMap = (patientPos: [number, number]) => {
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false });
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      map.setView(patientPos, 14);

      // Patient pin
      L.marker(patientPos, { icon: makeIcon("📍") }).addTo(map);

      // Hospital pins
      HOSPITALS.forEach(h => {
        L.marker(h.pos, { icon: makeHospitalIcon() })
          .bindPopup(`<strong>${h.name}</strong>`)
          .addTo(map);
      });

      // Ambulance pin — starts at nearest hospital
      const startPos = nearestHospital(patientPos);
      ambulancePosRef.current = startPos;
      const amb = L.marker(startPos, { icon: makeIcon("🚑") }).addTo(map);
      ambulanceMarker.current = amb;
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => initMap([pos.coords.latitude, pos.coords.longitude]),
        () => initMap(PATIENT_POS),
        { timeout: 4000 }
      );
    } else {
      initMap(PATIENT_POS);
    }

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // Ambulance movement simulation
  useEffect(() => {
    let usedRealtime = false;

    // Supabase realtime broadcast
    const channel = supabase.channel("ambulance-tracking");
    channel.on("broadcast", { event: "position" }, (payload: { payload?: { lat?: number; lng?: number } }) => {
      const { lat, lng } = payload.payload ?? {};
      if (typeof lat === "number" && typeof lng === "number" && ambulanceMarker.current) {
        usedRealtime = true;
        ambulancePosRef.current = [lat, lng];
        ambulanceMarker.current.setLatLng([lat, lng]);
      }
    }).subscribe();

    // Local fallback simulation — runs every 2s
    const moveInterval = setInterval(() => {
      if (usedRealtime) return;
      if (!ambulanceMarker.current || arrivedRef.current) return;

      const current = ambulancePosRef.current;
      const next = lerp(current, PATIENT_POS, 0.08);
      ambulancePosRef.current = next;
      ambulanceMarker.current.setLatLng(next);

      const dist = distanceKm(next, PATIENT_POS);
      if (dist < 0.05 && !arrivedRef.current) {
        arrivedRef.current = true;
        setToast("Ambulance arrived!");
        setTimeout(() => onCancel(), 2000);
      }
    }, 2000);

    // ETA countdown — every 30s
    const etaInterval = setInterval(() => {
      setEta(prev => (prev > 1 ? prev - 1 : 1));
    }, 30000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(etaInterval);
      supabase.removeChannel(channel);
    };
  }, [onCancel]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {toast && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#3DD6B5", color: "#062A24", padding: "10px 20px",
          borderRadius: 99, fontWeight: 800, zIndex: 1000, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <div className="ambulance-card">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 15 }}>KNH Ambulance Unit 3</strong>
          <span style={{ fontSize: 13, color: "#86A3A1" }}>En route · ETA {eta} min</span>
        </div>
        <button
          style={{
            background: "#22C55E", color: "#fff", border: 0,
            borderRadius: 99, padding: "10px 18px", fontWeight: 700,
            fontSize: 14, cursor: "pointer",
          }}
          onClick={onCancel}
        >
          I&apos;m safe, cancel
        </button>
      </div>
    </div>
  );
}
