import { useState } from "react"

import { supabase } from "../lib/supabase"

type Props = {
  patientName: string

  drugName: string

  scheduledFor: string

  onRemind: () => void

  onMarkTaken: () => void

  onDismiss: () => void
}

type ConfirmState = "idle" | "confirming"

type RemindState = "idle" | "sent"

export default function CaregiverMissedDose({
  patientName,

  drugName,

  scheduledFor,

  onRemind,

  onMarkTaken,

  onDismiss,
}: Props) {
  const [remindState, setRemindState] = useState<RemindState>("idle")

  const [confirmState, setConfirmState] = useState<ConfirmState>("idle")

  const [markLoading, setMarkLoading] = useState(false)

  function handleRemind() {
    onRemind()

    setRemindState("sent")

    setTimeout(() => setRemindState("idle"), 2000)
  }

  async function handleConfirmMark() {
    setMarkLoading(true)

    try {
      await supabase

        .from("dose_events")

        .insert({
          confirmed_via: "caregiver",

          status: "taken",

          confirmed_at: new Date().toISOString(),
        })

        .then(() => undefined)

      onMarkTaken()
    } finally {
      setMarkLoading(false)
    }
  }

  return (
    <div
      style={{
        background: "#FFF8E1",

        border: "1px solid #FFE082",

        borderRadius: 24,

        padding: 20,

        position: "relative",

        display: "flex",

        flexDirection: "column",

        gap: 14,
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",

          top: 14,

          right: 14,

          border: "none",

          background: "rgba(0,0,0,0.07)",

          borderRadius: "50%",

          width: 30,

          height: 30,

          display: "grid",

          placeItems: "center",

          cursor: "pointer",

          fontSize: 16,

          color: "#5D4037",

          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Pill icon */}
        <span
          style={{
            width: 36,

            height: 36,

            borderRadius: 10,

            background: "#FFF0CC",

            display: "grid",

            placeItems: "center",

            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B45309"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7a4 4 0 0 0-6-6L1 11a4 4 0 0 0 6 6Z" />
            <path d="m7 5 6 6" />
          </svg>
        </span>
        <h2
          style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#3E2723" }}
        >
          Missed dose
        </h2>
      </div>

      {/* Description */}
      <p
        style={{ margin: 0, fontSize: 14, color: "#5D4037", lineHeight: 1.55 }}
      >
        <strong>{patientName}</strong> has not confirmed{" "}
        <strong>{drugName}</strong> due at <strong>{scheduledFor}</strong>.
      </p>

      {/* Actions */}
      {confirmState === "idle" ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleRemind}
            disabled={remindState === "sent"}
            style={{
              flex: 1,

              minHeight: 44,

              borderRadius: 999,

              border: "1px solid #F59E0B",

              background:
                remindState === "sent"
                  ? "rgba(245,158,11,0.12)"
                  : "transparent",

              color: "#92400E",

              fontWeight: 800,

              fontSize: 14,

              cursor: remindState === "sent" ? "default" : "pointer",

              transition: "0.15s",
            }}
          >
            {remindState === "sent" ? "Reminder sent" : "Remind them"}
          </button>
          <button
            onClick={() => setConfirmState("confirming")}
            style={{
              flex: 1,

              minHeight: 44,

              borderRadius: 999,

              border: "none",

              background: "#F59E0B",

              color: "#3E2723",

              fontWeight: 800,

              fontSize: 13,

              cursor: "pointer",
            }}
          >
            Mark taken (I gave it)
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "#FFF3CD",

            border: "1px solid #FFD54F",

            borderRadius: 16,

            padding: "14px 16px",

            display: "flex",

            flexDirection: "column",

            gap: 12,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#5D4037",
              lineHeight: 1.55,
            }}
          >
            Are you sure? This will log the dose as given by you.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setConfirmState("idle")}
              disabled={markLoading}
              style={{
                flex: 1,

                minHeight: 40,

                borderRadius: 999,

                border: "1px solid rgba(0,0,0,0.15)",

                background: "transparent",

                color: "#5D4037",

                fontWeight: 700,

                fontSize: 13,

                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmMark}
              disabled={markLoading}
              style={{
                flex: 1,

                minHeight: 40,

                borderRadius: 999,

                border: "none",

                background: "#D97706",

                color: "#fff",

                fontWeight: 800,

                fontSize: 13,

                cursor: markLoading ? "default" : "pointer",

                opacity: markLoading ? 0.6 : 1,
              }}
            >
              {markLoading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer note */}
      <p
        style={{
          margin: 0,

          fontSize: 11,

          color: "#8D6E63",

          lineHeight: 1.55,

          borderTop: "1px solid rgba(0,0,0,0.07)",

          paddingTop: 12,
        }}
      >
        Medication alerts are never sent as emergency dispatches. Only your
        clinician or the patient can change dose timing.
      </p>
    </div>
  )
}
