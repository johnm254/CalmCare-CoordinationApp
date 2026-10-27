import { useState } from "react";

type Period = "7" | "30" | "90";
type Patient = "All" | "Patient A" | "Patient B" | "Patient C";

interface BreakdownRow {
  patient: string;
  drug: string;
  schedule: string;
  taken: number;
  missed: number;
  adherence: number;
  lastTaken: string;
}

const BREAKDOWN_ROWS: BreakdownRow[] = [
  { patient: "Patient A", drug: "Levetiracetam 500 mg", schedule: "Twice daily", taken: 52, missed: 6, adherence: 90, lastTaken: "Today 08:02" },
  { patient: "Patient A", drug: "Amlodipine 5 mg", schedule: "Once daily (AM)", taken: 28, missed: 2, adherence: 93, lastTaken: "Today 08:02" },
  { patient: "Patient B", drug: "Metformin 1000 mg", schedule: "Twice daily with meals", taken: 48, missed: 8, adherence: 86, lastTaken: "Yesterday 19:30" },
  { patient: "Patient B", drug: "Lisinopril 10 mg", schedule: "Once daily", taken: 27, missed: 3, adherence: 90, lastTaken: "Yesterday 08:15" },
  { patient: "Patient C", drug: "Atorvastatin 40 mg", schedule: "Once daily (PM)", taken: 26, missed: 4, adherence: 87, lastTaken: "Yesterday 21:00" },
  { patient: "Patient C", drug: "Aspirin 75 mg", schedule: "Once daily", taken: 29, missed: 1, adherence: 97, lastTaken: "Today 07:50" },
];

// 14-day mock adherence % values
const DAILY_DATA: { label: string; pct: number }[] = [
  { label: "Oct 14", pct: 92 },
  { label: "Oct 15", pct: 85 },
  { label: "Oct 16", pct: 100 },
  { label: "Oct 17", pct: 78 },
  { label: "Oct 18", pct: 43 },
  { label: "Oct 19", pct: 88 },
  { label: "Oct 20", pct: 95 },
  { label: "Oct 21", pct: 67 },
  { label: "Oct 22", pct: 83 },
  { label: "Oct 23", pct: 100 },
  { label: "Oct 24", pct: 36 },
  { label: "Oct 25", pct: 91 },
  { label: "Oct 26", pct: 75 },
  { label: "Oct 27", pct: 84 },
];

function barColor(pct: number): string {
  if (pct >= 80) return "#3DD6B5";
  if (pct >= 50) return "#F5C26B";
  return "#FF6B6B";
}

function ClinicianSidebar({ activeItem }: { activeItem: string }) {
  const items = [
    "Patient management",
    "Health trends",
    "Events review",
    "Follow-up management",
    "Alerts inbox",
    "Adherence report",
    "Alert limit editor",
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>M</span>
        <strong>Mojo</strong>
      </div>
      <nav>
        {items.map((item) => (
          <button key={item} className={item === activeItem ? "active" : ""}>
            {item}
          </button>
        ))}
      </nav>
      <div className="verified">
        <div>
          <svg aria-hidden="true" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 6 }}>
            <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
          </svg>
          Verified clinician
        </div>
        <p>Every record view is consent-checked and written to an audit trail.</p>
      </div>
    </aside>
  );
}

export default function AdherenceReport({ back }: { back: () => void }) {
  const [patient, setPatient] = useState<Patient>("All");
  const [period, setPeriod] = useState<Period>("30");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const filteredRows =
    patient === "All" ? BREAKDOWN_ROWS : BREAKDOWN_ROWS.filter((r) => r.patient === patient);

  const handleExportCSV = () => {
    const header = "Patient,Drug,Schedule,Taken,Missed,Adherence %,Last taken\n";
    const rows = filteredRows
      .map(
        (r) =>
          `${r.patient},${r.drug},${r.schedule},${r.taken},${r.missed},${r.adherence}%,${r.lastTaken}`
      )
      .join("\n");
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adherence.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    showToast("PDF export requires a PDF library. Install pdfmake or jspdf to enable.");
  };

  // SVG chart constants
  const chartW = 600;
  const chartH = 160;
  const padLeft = 42;
  const padBottom = 28;
  const padTop = 12;
  const padRight = 12;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padBottom - padTop;
  const barCount = DAILY_DATA.length;
  const barGap = 4;
  const barW = (innerW - barGap * (barCount - 1)) / barCount;

  return (
    <div className="clinician-shell">
      <ClinicianSidebar activeItem="Adherence report" />
      <main className="dashboard" style={{ overflowY: "auto" }}>
        <button className="back-link" onClick={back}>
          &#8249; Back to dashboard
        </button>
        <div className="dash-head">
          <div>
            <span className="eyebrow jade">Clinician tools</span>
            <h1>Adherence report</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button outline"
              onClick={handleExportCSV}
              style={{ fontSize: 12 }}
            >
              &#8595; Export CSV
            </button>
            <button
              className="button outline"
              onClick={handleExportPDF}
              style={{ fontSize: 12 }}
            >
              &#8595; Export PDF
            </button>
          </div>
        </div>

        {/* Selectors row */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 22, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#4F6866" }}>Patient</label>
            <select
              value={patient}
              onChange={(e) => setPatient(e.target.value as Patient)}
              style={{
                border: "1px solid #DCE6E4",
                borderRadius: 10,
                padding: "7px 12px",
                fontSize: 13,
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="All">All patients</option>
              <option value="Patient A">Patient A</option>
              <option value="Patient B">Patient B</option>
              <option value="Patient C">Patient C</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4F6866" }}>Period</span>
            {(["7", "30", "90"] as Period[]).map((p) => (
              <label
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: period === p ? 700 : 400,
                  color: period === p ? "#0B1A1F" : "#4F6866",
                }}
              >
                <input
                  type="radio"
                  name="period"
                  value={p}
                  checked={period === p}
                  onChange={() => setPeriod(p)}
                  style={{ accentColor: "#3DD6B5" }}
                />
                Last {p} days
              </label>
            ))}
          </div>
        </div>

        {/* Summary stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <section className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4F6866", marginBottom: 8 }}>
              Overall adherence
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#0E7C6B", lineHeight: 1 }}>84%</div>
            <div style={{ fontSize: 12, color: "#4F6866", marginTop: 6 }}>Across all patients &amp; drugs</div>
          </section>
          <section className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4F6866", marginBottom: 8 }}>
              Doses taken on time
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#0B1A1F", lineHeight: 1 }}>127</div>
            <div style={{ fontSize: 12, color: "#4F6866", marginTop: 6 }}>of 151 scheduled doses</div>
          </section>
          <section className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4F6866", marginBottom: 8 }}>
              Missed and not made up
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#9B1C1C", lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 12, color: "#4F6866", marginTop: 6 }}>doses in selected period</div>
          </section>
        </div>

        {/* Adherence bar chart */}
        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Daily adherence — last 14 days</h2>
          <div style={{ overflowX: "auto" }}>
            <svg
              width={chartW}
              height={chartH}
              viewBox={`0 0 ${chartW} ${chartH}`}
              aria-label="Daily adherence bar chart"
              role="img"
            >
              {/* Y-axis labels and grid lines */}
              {[0, 50, 100].map((pct) => {
                const y = padTop + innerH - (pct / 100) * innerH;
                return (
                  <g key={pct}>
                    <line
                      x1={padLeft}
                      x2={chartW - padRight}
                      y1={y}
                      y2={y}
                      stroke="#DCE6E4"
                      strokeWidth={1}
                    />
                    <text
                      x={padLeft - 6}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={9}
                      fill="#86A3A1"
                      fontFamily="DM Mono, monospace"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {DAILY_DATA.map((d, i) => {
                const barHeight = (d.pct / 100) * innerH;
                const x = padLeft + i * (barW + barGap);
                const y = padTop + innerH - barHeight;
                return (
                  <g key={d.label}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barHeight}
                      fill={barColor(d.pct)}
                      rx={3}
                    />
                    {/* X-axis label — every other one to avoid crowding */}
                    {i % 2 === 0 && (
                      <text
                        x={x + barW / 2}
                        y={chartH - 4}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#86A3A1"
                        fontFamily="DM Mono, monospace"
                      >
                        {d.label.slice(4)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#4F6866" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#3DD6B5" }} />
              &#8805;80% (on target)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#F5C26B" }} />
              50–79% (borderline)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#FF6B6B" }} />
              &lt;50% (poor)
            </span>
          </div>
        </section>

        {/* Per-patient breakdown table */}
        <section className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid #DCE6E4" }}>
            <h2 style={{ margin: 0 }}>Per-patient breakdown</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr 1.4fr 0.7fr 0.7fr 0.8fr 1fr",
              padding: "10px 20px",
              background: "#F3F6F5",
              borderBottom: "1px solid #DCE6E4",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4F6866",
            }}
          >
            <span>Patient</span>
            <span>Drug</span>
            <span>Schedule</span>
            <span>Taken</span>
            <span>Missed</span>
            <span>Adherence</span>
            <span>Last taken</span>
          </div>
          {filteredRows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.6fr 1.4fr 0.7fr 0.7fr 0.8fr 1fr",
                padding: "13px 20px",
                borderBottom: "1px solid #edf0ef",
                fontSize: 12,
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600 }}>{row.patient}</span>
              <span>{row.drug}</span>
              <span style={{ color: "#4F6866" }}>{row.schedule}</span>
              <span style={{ color: "#0A5D50", fontWeight: 700 }}>{row.taken}</span>
              <span style={{ color: row.missed > 4 ? "#9B1C1C" : "#4F6866", fontWeight: row.missed > 4 ? 700 : 400 }}>
                {row.missed}
              </span>
              <span>
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    background: row.adherence >= 80 ? "#DDF3EE" : row.adherence >= 50 ? "#FFF0CC" : "#FDE3E3",
                    color: row.adherence >= 80 ? "#0A5D50" : row.adherence >= 50 ? "#7A5200" : "#9B1C1C",
                  }}
                >
                  {row.adherence}%
                </span>
              </span>
              <span style={{ color: "#4F6866", fontSize: 11 }}>{row.lastTaken}</span>
            </div>
          ))}
          {filteredRows.length === 0 && (
            <div style={{ padding: "20px", color: "#4F6866", fontSize: 13, textAlign: "center" }}>
              No data for selected patient.
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#EAF4F1",
            color: "#0B1A1F",
            padding: "12px 20px",
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
