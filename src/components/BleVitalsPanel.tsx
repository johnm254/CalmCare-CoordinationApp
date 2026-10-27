import { BLE_AVAILABLE, formatVital, useBle } from "../lib/ble"

import type { BleVitals } from "../lib/ble"

type QualityDotProps = { quality: number }

function QualityDot({ quality }: QualityDotProps) {
  const color = quality > 80 ? "#3DD6B5" : quality >= 50 ? "#F59E0B" : "#FF6B6B"

  return (
    <span
      style={{
        display: "inline-block",

        width: 8,

        height: 8,

        borderRadius: "50%",

        background: color,

        flexShrink: 0,
      }}
    />
  )
}

type MetricTileProps = {
  label: string

  valueStr: string

  quality: number

  dimmed?: boolean
}

function MetricTile({ label, valueStr, quality, dimmed }: MetricTileProps) {
  return (
    <div
      style={{
        background: "#12272D",

        border: "1px solid rgba(255,255,255,0.08)",

        borderRadius: 16,

        padding: "14px 12px",

        display: "flex",

        flexDirection: "column",

        gap: 6,

        opacity: dimmed ? 0.45 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <QualityDot quality={quality} />
        <span
          style={{
            fontSize: 11,
            color: "#9DB6B4",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontWeight: 700,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#EAF4F1",
          lineHeight: 1,
        }}
      >
        {valueStr}
      </span>
    </div>
  )
}

function SimBadge() {
  return (
    <span
      style={{
        background: "#FFF0CC",

        color: "#7A5200",

        borderRadius: 99,

        padding: "5px 11px",

        fontSize: 11,

        fontWeight: 700,
      }}
    >
      Simulated data
    </span>
  )
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()

  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 1) return "just now"

  if (diffMin < 60) return `${diffMin}m ago`

  const diffHrs = Math.round(diffMin / 60)

  if (diffHrs < 24) return `${diffHrs}h ago`

  return `${Math.round(diffHrs / 24)}d ago`
}

type Props = {
  compact?: boolean
}

export default function BleVitalsPanel({ compact = false }: Props) {
  const { vitals, motionEvents, scanning, scan } = useBle()

  const dimmed = (key: keyof BleVitals) =>
    vitals.quality < 80 && key !== "batteryPct" && key !== "quality"

  if (compact) {
    const tiles: { key: keyof BleVitals label: string }[] = [
      { key: "heartRate", label: "HR" },

      { key: "spo2", label: "SpO2" },

      { key: "tempC", label: "Temp" },

      { key: "batteryPct", label: "Battery" },
    ]

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!BLE_AVAILABLE && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SimBadge />
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
          }}
        >
          {tiles.map(({ key, label }) => (
            <MetricTile
              key={key}
              label={label}
              valueStr={formatVital(key, vitals[key] as number)}
              quality={vitals.quality}
              dimmed={dimmed(key)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Full panel

  const gridTiles: { key: keyof BleVitals label: string }[] = [
    { key: "heartRate", label: "Heart Rate" },

    { key: "spo2", label: "SpO2" },

    { key: "tempC", label: "Temperature" },

    { key: "hrv", label: "HRV" },

    { key: "steps", label: "Steps" },

    { key: "batteryPct", label: "Battery" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Connection status bar */}
      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          background: "#12272D",

          borderRadius: 16,

          padding: "12px 16px",

          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scanning ? (
            <>
              <span
                style={{
                  display: "inline-block",

                  width: 10,

                  height: 10,

                  borderRadius: "50%",

                  background: "#F59E0B",

                  animation: "sos-pulse 1.4s infinite",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#EAF4F1" }}>
                Scanning…
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  display: "inline-block",

                  width: 10,

                  height: 10,

                  borderRadius: "50%",

                  background: vitals.connected ? "#3DD6B5" : "#FF6B6B",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#EAF4F1" }}>
                {vitals.connected
                  ? "Mojo Strap A connected"
                  : "Strap disconnected"}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!BLE_AVAILABLE && <SimBadge />}
          <button
            className="button outline"
            style={{ fontSize: 12, padding: "6px 14px", minHeight: 32 }}
            onClick={scan}
            disabled={scanning}
          >
            {scanning ? "Scanning…" : "Scan"}
          </button>
        </div>
      </div>

      {/* 2×3 metric grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {gridTiles.map(({ key, label }) => (
          <MetricTile
            key={key}
            label={label}
            valueStr={formatVital(key, vitals[key] as number)}
            quality={vitals.quality}
            dimmed={dimmed(key)}
          />
        ))}
      </div>

      {/* Quality note — CR-STRAP-09 */}
      <p style={{ margin: 0, fontSize: 12, color: "#86A3A1", lineHeight: 1.5 }}>
        Readings below 80% quality are greyed and excluded from alerts.
      </p>

      {/* Motion events */}
      <div
        style={{
          background: "#12272D",

          border: "1px solid rgba(255,255,255,0.08)",

          borderRadius: 16,

          padding: "14px 16px",

          display: "flex",

          flexDirection: "column",

          gap: 10,
        }}
      >
        <span
          className="eyebrow jade"
          style={{ fontSize: 11, letterSpacing: "0.08em" }}
        >
          Motion Events
        </span>

        {motionEvents.length === 0 ? (
          <p style={{ margin: 0, color: "#9DB6B4", fontSize: 14 }}>
            No motion events detected.
          </p>
        ) : (
          motionEvents.map((evt) => (
            <div
              key={evt.id}
              style={{
                display: "flex",

                flexDirection: "column",

                gap: 6,

                paddingBottom: 10,

                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#EAF4F1",
                    fontSize: 14,
                    flex: 1,
                  }}
                >
                  {evt.type.charAt(0).toUpperCase() + evt.type.slice(1)}
                </span>
                <span style={{ fontSize: 12, color: "#9DB6B4" }}>
                  {formatRelativeTime(evt.detectedAt)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9DB6B4",
                    width: 64,
                    flexShrink: 0,
                  }}
                >
                  Confidence
                </span>
                <div
                  style={{
                    flex: 1,

                    height: 6,

                    borderRadius: 3,

                    background: "rgba(255,255,255,0.1)",

                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",

                      width: `${Math.round(evt.confidence * 100)}%`,

                      background: "#3DD6B5",

                      borderRadius: 3,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9DB6B4",
                    width: 32,
                    textAlign: "right",
                  }}
                >
                  {Math.round(evt.confidence * 100)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
