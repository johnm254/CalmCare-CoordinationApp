type Props = {
  patientAddress: string

  hospitalName: string

  hospitalAddress: string

  patientLat: number

  patientLon: number

  hospitalLat: number

  hospitalLon: number

  onClose: () => void
}

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function RouteCard({
  step,

  title,

  address,

  distance,

  mapsUrl,
}: {
  step: 1 | 2

  title: string

  address: string

  distance: string

  mapsUrl: string
}) {
  return (
    <div
      style={{
        background: "#12272D",

        border: "1px solid rgba(255,255,255,0.08)",

        borderRadius: 20,

        padding: "18px 16px",

        display: "flex",

        flexDirection: "column",

        gap: 12,
      }}
    >
      {/* Step badge + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 28,

            height: 28,

            borderRadius: "50%",

            background: step === 1 ? "#3DD6B5" : "#2f7f79",

            color: step === 1 ? "#062A24" : "#3DD6B5",

            display: "grid",

            placeItems: "center",

            fontWeight: 800,

            fontSize: 13,

            flexShrink: 0,
          }}
        >
          {step}
        </span>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#EAF4F1" }}>
          {title}
        </span>
      </div>

      {/* Address */}
      <p style={{ margin: 0, fontSize: 13, color: "#9DB6B4", lineHeight: 1.5 }}>
        {address}
      </p>

      {/* Distance + Maps button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Map pin icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3DD6B5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#3DD6B5" }}>
            {distance}
          </span>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",

            alignItems: "center",

            gap: 6,

            background: "#3DD6B5",

            color: "#062A24",

            borderRadius: 999,

            padding: "8px 14px",

            fontWeight: 800,

            fontSize: 13,

            textDecoration: "none",
          }}
        >
          Open in Maps
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  )
}

export default function CaregiverDirections({
  patientAddress,

  hospitalName,

  hospitalAddress,

  patientLat,

  patientLon,

  hospitalLat,

  hospitalLon,

  onClose,
}: Props) {
  const patientMapsUrl = `https://maps.google.com/?q=${patientLat},${patientLon}`

  const hospitalMapsUrl = `https://maps.google.com/?q=${hospitalLat},${hospitalLon}`

  return (
    /* Full-screen dark overlay */

    <div
      style={{
        position: "fixed",

        inset: 0,

        background: "rgba(3,22,22,0.96)",

        zIndex: 1000,

        display: "flex",

        flexDirection: "column",

        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          padding: "24px 20px 16px",

          borderBottom: "1px solid rgba(255,255,255,0.08)",

          position: "sticky",

          top: 0,

          background: "rgba(3,22,22,0.96)",

          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Navigation arrow icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3DD6B5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#EAF4F1",
            }}
          >
            Directions
          </h1>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Route cards */}
      <div
        style={{
          flex: 1,

          display: "flex",

          flexDirection: "column",

          gap: 14,

          padding: "20px 20px 0",
        }}
      >
        <RouteCard
          step={1}
          title="Get to Amina"
          address={patientAddress}
          distance="~2.4 km"
          mapsUrl={patientMapsUrl}
        />
        <RouteCard
          step={2}
          title={`Then to ${hospitalName}`}
          address={hospitalAddress}
          distance="~1.8 km from patient"
          mapsUrl={hospitalMapsUrl}
        />

        {/* Disclaimer */}
        <p
          style={{
            margin: "4px 0 0",

            fontSize: 12,

            color: "#86A3A1",

            lineHeight: 1.6,

            textAlign: "center",
          }}
        >
          Distances are straight-line estimates. Open in Maps for live traffic
          routing.
        </p>
      </div>

      {/* Primary CTA */}
      <div style={{ padding: "20px 20px 32px" }}>
        <button
          className="button"
          style={{ width: "100%", height: 56, fontSize: 16 }}
          onClick={onClose}
        >
          {/* Checkmark icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {"I've arrived at the patient"}
        </button>
      </div>
    </div>
  )
}
