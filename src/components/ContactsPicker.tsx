import { useState } from "react";
import { supabase } from "../lib/supabase";

type Role = "Emergency contact" | "Caregiver" | "Family" | "Friend";

const ROLES: Role[] = ["Emergency contact", "Caregiver", "Family", "Friend"];

const E164_RE = /^\+[1-9]\d{6,14}$/;

type Props = {
  onAdd: (name: string, phone: string) => void;
  onClose: () => void;
};

export default function ContactsPicker({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [role, setRole] = useState<Role>("Emergency contact");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function validatePhone(value: string) {
    if (!E164_RE.test(value.trim())) {
      setPhoneError("Enter a valid phone number including country code");
    } else {
      setPhoneError("");
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    E164_RE.test(phone.trim()) &&
    !loading &&
    !successMsg;

  async function handleSend() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await supabase
        .from("care_circle")
        .insert({
          contact_name: name.trim(),
          phone_number: phone.trim(),
          role,
          contact_status: "pending",
          invited_at: new Date().toISOString(),
        })
        .then(() => undefined);

      setSuccessMsg(`Invite sent to ${name.trim()}. They'll receive an SMS with instructions.`);
      setTimeout(() => onAdd(name.trim(), phone.trim()), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Card */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#12272D",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#EAF4F1" }}>
          Add to Care Circle
        </h2>

        <p style={{ margin: 0, fontSize: 13, color: "#9DB6B4", lineHeight: 1.55 }}>
          Mojo only stores their name and phone number. We never access or upload your address book.
        </p>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Full name
          </label>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: "#0B1A1F",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "12px 14px",
              color: "#EAF4F1",
              fontSize: 15,
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Phone number
          </label>
          <input
            type="tel"
            placeholder="+254 700 000 000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) validatePhone(e.target.value);
            }}
            onBlur={() => validatePhone(phone)}
            style={{
              background: "#0B1A1F",
              border: `1px solid ${phoneError ? "#FF6B6B" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 12,
              padding: "12px 14px",
              color: "#EAF4F1",
              fontSize: 15,
              outline: "none",
              width: "100%",
            }}
          />
          {phoneError && (
            <span style={{ fontSize: 12, color: "#FF6B6B" }}>{phoneError}</span>
          )}
        </div>

        {/* Role selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Role
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ROLES.map((r) => (
              <label
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: role === r ? "rgba(61,214,181,0.1)" : "transparent",
                  border: `1px solid ${role === r ? "rgba(61,214,181,0.4)" : "rgba(255,255,255,0.07)"}`,
                  transition: "0.15s",
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  style={{ accentColor: "#3DD6B5" }}
                />
                <span style={{ fontSize: 14, color: "#EAF4F1" }}>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Success state */}
        {successMsg && (
          <div
            style={{
              background: "rgba(61,214,181,0.12)",
              border: "1px solid rgba(61,214,181,0.3)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              color: "#3DD6B5",
              lineHeight: 1.5,
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            className="button outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="button primary"
            style={{
              flex: 2,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            onClick={handleSend}
            disabled={!canSubmit}
          >
            {loading ? "Sending…" : "Send SMS invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
