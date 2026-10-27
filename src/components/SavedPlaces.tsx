import { useState } from "react";
import { supabase } from "../lib/supabase";

type PlaceLabel = "home" | "work" | "other";

interface SavedPlace {
  id: string;
  patient_id: string;
  label: PlaceLabel;
  name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  created_at: string;
}

interface AddForm {
  label: PlaceLabel;
  name: string;
  address: string;
}

const DEMO_PATIENT_UUID = "00000000-0000-0000-0000-000000000001";

const INITIAL_PLACES: SavedPlace[] = [
  {
    id: "sp-1",
    patient_id: DEMO_PATIENT_UUID,
    label: "home",
    name: "Amina's home",
    address: "Westlands, Nairobi",
    lat: -1.2641,
    lon: 36.8037,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "sp-2",
    patient_id: DEMO_PATIENT_UUID,
    label: "work",
    name: "Office",
    address: "Upper Hill, Nairobi",
    lat: -1.2988,
    lon: 36.8167,
    created_at: "2026-09-01T08:10:00Z",
  },
];

const LABEL_ICONS: Record<PlaceLabel, React.ReactNode> = {
  home: (
    <svg
      aria-hidden="true"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  work: (
    <svg
      aria-hidden="true"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  other: (
    <svg
      aria-hidden="true"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  ),
};

const LABEL_DISPLAY: Record<PlaceLabel, string> = {
  home: "Home",
  work: "Work",
  other: "Other",
};

const BLANK_FORM: AddForm = { label: "home", name: "", address: "" };

export default function SavedPlaces({ back }: { back: () => void }) {
  const [places, setPlaces] = useState<SavedPlace[]>(INITIAL_PLACES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>(BLANK_FORM);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const openForm = () => {
    setForm(BLANK_FORM);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
  };

  const savePlace = () => {
    if (!form.name.trim() || !form.address.trim()) return;
    const newPlace: SavedPlace = {
      id: `sp-${Date.now()}`,
      patient_id: DEMO_PATIENT_UUID,
      label: form.label,
      name: form.name.trim(),
      address: form.address.trim(),
      lat: null,
      lon: null,
      created_at: new Date().toISOString(),
    };
    setPlaces((prev) => [...prev, newPlace]);
    supabase
      .from("saved_places")
      .insert({
        patient_id: newPlace.patient_id,
        label: newPlace.label,
        name: newPlace.name,
        address: newPlace.address,
        lat: null,
        lon: null,
      })
      .then(() => undefined);
    setShowForm(false);
    showToast("Place saved");
  };

  const deletePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    supabase.from("saved_places").delete().eq("id", id).then(() => undefined);
    showToast("Place removed");
  };

  const inputStyle: React.CSSProperties = {
    background: "#12272D",
    border: "1px solid rgba(255,255,255,.12)",
    color: "#EAF4F1",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#9DB6B4",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div className="phone dark scroll-phone" style={{ position: "relative" }}>
      {/* Header */}
      <div className="mobile-head">
        <button
          onClick={back}
          style={{
            border: 0,
            background: "none",
            color: "#3DD6B5",
            fontSize: 22,
            lineHeight: 1,
            padding: 0,
            marginRight: 4,
          }}
          aria-label="Back"
        >
          &#8249;
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ color: "#86A3A1", fontSize: 13 }}>Patient</span>
          <h1 style={{ fontSize: 22, margin: "2px 0 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Saved places
          </h1>
        </div>
      </div>

      <div className="mobile-content" style={{ paddingBottom: 40 }}>
        {/* Places list */}
        {places.length === 0 && !showForm && (
          <p style={{ color: "#9DB6B4", fontSize: 14, margin: "8px 0" }}>
            No saved places yet. Add one below.
          </p>
        )}

        {places.map((place) => (
          <div
            key={place.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#183239",
                color: "#3DD6B5",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {LABEL_ICONS[place.label]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#3DD6B5",
                  }}
                >
                  {LABEL_DISPLAY[place.label]}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#EAF4F1",
                  marginBottom: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {place.name}
              </div>
              <div style={{ fontSize: 13, color: "#9DB6B4" }}>{place.address}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  className="button danger"
                  style={{ minHeight: 36, padding: "4px 14px", fontSize: 12, borderRadius: 10 }}
                  onClick={() => deletePlace(place.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add place form */}
        {showForm && (
          <div
            className="card"
            style={{
              background: "#12272D",
              border: "1px solid rgba(255,255,255,.1)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "18px",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: "#EAF4F1", marginBottom: 2 }}>
              Add a place
            </div>

            <div>
              <label style={labelStyle}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["home", "work", "other"] as PlaceLabel[]).map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setForm({ ...form, label: lbl })}
                    style={{
                      flex: 1,
                      border: "1.5px solid",
                      borderColor: form.label === lbl ? "#3DD6B5" : "rgba(255,255,255,.15)",
                      borderRadius: 10,
                      padding: "8px 4px",
                      background: form.label === lbl ? "#16443f" : "transparent",
                      color: form.label === lbl ? "#3DD6B5" : "#9DB6B4",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {LABEL_DISPLAY[lbl]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Amina's home"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Westlands, Nairobi"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="button"
                style={{ flex: 1, minHeight: 44 }}
                onClick={savePlace}
                disabled={!form.name.trim() || !form.address.trim()}
              >
                Save place
              </button>
              <button
                className="button outline"
                style={{ minHeight: 44, padding: "10px 18px" }}
                onClick={cancelForm}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add place button */}
        {!showForm && (
          <button className="button full" style={{ minHeight: 50 }} onClick={openForm}>
            + Add place
          </button>
        )}

        {/* Privacy note */}
        <p
          style={{
            fontSize: 12,
            color: "#86A3A1",
            lineHeight: 1.6,
            margin: "4px 0 0",
            textAlign: "center",
          }}
        >
          These addresses are only shared with your emergency contacts during an active SOS. They
          are never uploaded to any other service.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#EAF4F1",
            color: "#0B1A1F",
            padding: "12px 18px",
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
