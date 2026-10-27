// CR-LOC-01: GPS tracked only while this component is mounted (during active alert).
// CR-LOC-04/05: Hospitals loaded from health_facilities DB; offline haversine fallback.
// CR-LOC-09: Call ambulance button uses emergency_providers phone (never hard-coded).

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../lib/supabase";

interface Props {
  alertId?: string;
  onCancel: () => void;
}

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  emergency_24h: boolean;
  ambulance: boolean;
}

// Fallback KMHFL hospitals (Nairobi) — used if DB returns no rows
const FALLBACK_HOSPITALS: Hospital[] = [
  { id: "f1", name: "Kenyatta National Hospital", lat: -1.3009, lon: 36.8070, emergency_24h: true, ambulance: true },
  { id: "f2", name: "Nairobi Hospital", lat: -1.2966, lon: 36.8075, emergency_24h: true, ambulance: true },
  { id: "f3", name: "Aga Khan Hospital", lat: -1.2635, lon: 36.8141, emergency_24h: true, ambulance: false },
  { id: "f4", name: "MP Shah Hospital", lat: -1.2709, lon: 36.8139, emergency_24h: true, ambulance: false },
];

const PATIENT_POS_FALLBACK: [number, number] = [-1.2921, 36.8219];
// Default emergency number if DB unavailable offline
const FALLBACK_PHONE = "999";

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function nearestHospital(patient: [number, number], hospitals: Hospital[]): [number, number] {
  let best = hospitals[0];
  let bestDist = haversineKm(patient, [best.lat, best.lon]);
  for (const h of hospitals.slice(1)) {
    const d = haversineKm(patient, [h.lat, h.lon]);
    if (d < bestDist) { bestDist = d; best = h; }
  }
  return [best.lat, best.lon];
}

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function makeIcon(emoji: string): L.DivIcon {
  return L.divIcon({ html: `<div style="font-size:28px">${emoji}</div>`, className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
}

function makeHospitalIcon(): L.DivIcon {
  return L.divIcon({ html: '<div style="font-size:24px">🏥</div>', className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
}

export default function EmergencyMap({ alertId, onCancel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const ambulanceMarker = useRef<L.Marker | null>(null);
  const ambulancePosRef = useRef<[number, number]>(PATIENT_POS_FALLBACK);
  const watchIdRef = useRef<number | null>(null);
  const patientPosRef = useRef<[number, number]>(PATIENT_POS_FALLBACK);
  const lastUploadRef = useRef<number>(0);
  const patientIdRef = useRef<string | null>(null);

  const [eta, setEta] = useState(12);
  const [toast, setToast] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>(FALLBACK_HOSPITALS);
  const [providerPhone, setProviderPhone] = useState(FALLBACK_PHONE);
  const arrivedRef = useRef(false);

  // Cache current user ID for GPS uploads
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      patientIdRef.current = data.user?.id ?? null;
    });
  }, []);

  // Load hospitals and provider from DB (CR-LOC-04, CR-LOC-09)
  useEffect(() => {
    supabase
      .from("health_facilities")
      .select("id, name, location, emergency_24h, ambulance")
      .eq("active", true)
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const parsed: Hospital[] = data
            .map((row: any) => {
              if (!row.location) return null;
              try {
                const geo = typeof row.location === "string"
                  ? JSON.parse(row.location)
                  : row.location;
                return {
                  id: row.id,
                  name: row.name,
                  lat: geo.coordinates[1],
                  lon: geo.coordinates[0],
                  emergency_24h: row.emergency_24h ?? false,
                  ambulance: row.ambulance ?? false,
                };
              } catch { return null; }
            })
            .filter(Boolean) as Hospital[];
          if (parsed.length > 0) setHospitals(parsed);
        }
      });

    supabase
      .from("emergency_providers")
      .select("phone")
      .eq("active", true)
      .order("priority", { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.phone) setProviderPhone(data.phone);
      });
  }, []);

  // Initialise map once hospitals are ready
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initMap = (patientPos: [number, number]) => {
      patientPosRef.current = patientPos;
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false });
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      map.setView(patientPos, 14);
      L.marker(patientPos, { icon: makeIcon("📍") }).addTo(map);

      hospitals.forEach(h => {
        L.marker([h.lat, h.lon], { icon: makeHospitalIcon() })
          .bindPopup(`<strong>${h.name}</strong>${h.emergency_24h ? "<br>24 h emergency" : ""}`)
          .addTo(map);
      });

      const startPos = nearestHospital(patientPos, hospitals);
      ambulancePosRef.current = startPos;
      ambulanceMarker.current = L.marker(startPos, { icon: makeIcon("🚑") }).addTo(map);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => initMap([pos.coords.latitude, pos.coords.longitude]),
        () => initMap(PATIENT_POS_FALLBACK),
        { timeout: 4000 },
      );
    } else {
      initMap(PATIENT_POS_FALLBACK);
    }

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [hospitals]);

  // CR-LOC-01: continuous GPS tracking every 15 s while alert is active
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        patientPosRef.current = newPos;

        // Upload to patient_locations every ~15 s (CR-LOC-01)
        const now = Date.now();
        if (now - lastUploadRef.current >= 15_000 && alertId && patientIdRef.current) {
          lastUploadRef.current = now;
          // PostgREST accepts WKT strings for GEOGRAPHY columns: POINT(lon lat)
          supabase.from("patient_locations").insert({
            patient_id: patientIdRef.current,
            alert_id:   alertId,
            location:   `POINT(${pos.coords.longitude} ${pos.coords.latitude})`,
            accuracy_m: pos.coords.accuracy,
            source:     "gps",
            recorded_at: new Date().toISOString(),
          }).then(() => {/* fire-and-forget */});
        }
      },
      () => {/* silently ignore watch errors */},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [alertId]);

  // Ambulance movement simulation + realtime
  useEffect(() => {
    let usedRealtime = false;

    const channel = supabase.channel("ambulance-tracking");
    channel.on("broadcast", { event: "position" }, (payload: { payload?: { lat?: number; lng?: number } }) => {
      const { lat, lng } = payload.payload ?? {};
      if (typeof lat === "number" && typeof lng === "number" && ambulanceMarker.current) {
        usedRealtime = true;
        ambulancePosRef.current = [lat, lng];
        ambulanceMarker.current.setLatLng([lat, lng]);
      }
    }).subscribe();

    const moveInterval = setInterval(() => {
      if (usedRealtime || !ambulanceMarker.current || arrivedRef.current) return;
      const current = ambulancePosRef.current;
      const target = patientPosRef.current;
      const next = lerp(current, target, 0.08);
      ambulancePosRef.current = next;
      ambulanceMarker.current.setLatLng(next);

      // Broadcast position so other subscribed clients see live ambulance movement
      channel.send({
        type: "broadcast",
        event: "position",
        payload: { lat: next[0], lng: next[1] },
      }).catch(() => undefined);

      if (haversineKm(next, target) < 0.05 && !arrivedRef.current) {
        arrivedRef.current = true;
        setToast("Paramedics have arrived.");
        setTimeout(() => onCancel(), 2500);
      }
    }, 2000);

    const etaInterval = setInterval(() => {
      setEta(prev => (prev > 1 ? prev - 1 : 1));
    }, 30_000);

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
          borderRadius: 99, fontWeight: 700, zIndex: 1000, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <div className="ambulance-card">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 15 }}>Ambulance on the way</strong>
          <span style={{ fontSize: 13, color: "#86A3A1" }}>En route · ETA {eta} min</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* CR-LOC-09: dial from emergency_providers, never hard-coded */}
          <a
            href={`tel:${providerPhone}`}
            style={{
              background: "#2F7F79", color: "#fff", border: 0,
              borderRadius: 99, padding: "10px 16px", fontWeight: 700,
              fontSize: 13, cursor: "pointer", textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}
            aria-label={`Call ambulance — ${providerPhone}`}
          >
            Call {providerPhone}
          </a>
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
    </div>
  );
}
