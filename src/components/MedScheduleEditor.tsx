import { useState } from "react";
import { supabase } from "../lib/supabase";

type SelectedPatient = "Patient A" | "Patient B" | "Patient C";
type Frequency = "once_daily" | "twice_daily" | "three_times_daily" | "as_needed";

const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAYS_OF_WEEK)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
  sun: "S",
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "Three times daily",
  as_needed: "As needed",
};

const ESCALATE_OPTIONS = [
  { value: "", label: "None" },
  { value: "cc-member-a", label: "Care circle member A" },
  { value: "cc-member-b", label: "Care circle member B" },
];

interface MedSchedule {
  id: string;
  patient_id: string;
  medication_id: string;
  drug_name: string;
  prescribed_dose: number;
  unit: string;
  frequency: Frequency;
  times_of_day: string[];
  days_of_week: DayKey[];
  start_date: string;
  end_date: string;
  snooze_interval_min: number;
  max_repeats: number;
  missed_after_min: number;
  escalate_to: string;
  stock_count: number;
  refill_threshold: number;
  is_active: boolean;
}

interface EditFormState {
  id: string;
  prescribed_dose: string;
  unit: string;
  frequency: Frequency;
  times_of_day: string;
  days_of_week: DayKey[];
  start_date: string;
  end_date: string;
  snooze_interval_min: string;
  max_repeats: string;
  missed_after_min: string;
  escalate_to: string;
  stock_count: string;
  refill_threshold: string;
}

const DEMO_PATIENT_UUID = "00000000-0000-0000-0000-000000000001";

const SCHEDULES_BY_PATIENT: Record<SelectedPatient, MedSchedule[]> = {
  "Patient A": [
    {
      id: "ms-1",
      patient_id: DEMO_PATIENT_UUID,
      medication_id: "med-1",
      drug_name: "Levetiracetam",
      prescribed_dose: 500,
      unit: "mg",
      frequency: "twice_daily",
      times_of_day: ["08:00", "20:00"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2026-01-15",
      end_date: "",
      snooze_interval_min: 15,
      max_repeats: 3,
      missed_after_min: 60,
      escalate_to: "cc-member-a",
      stock_count: 14,
      refill_threshold: 14,
      is_active: true,
    },
    {
      id: "ms-2",
      patient_id: DEMO_PATIENT_UUID,
      medication_id: "med-2",
      drug_name: "Valproic acid",
      prescribed_dose: 250,
      unit: "mg",
      frequency: "three_times_daily",
      times_of_day: ["08:00", "13:00", "20:00"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2026-02-01",
      end_date: "",
      snooze_interval_min: 15,
      max_repeats: 3,
      missed_after_min: 60,
      escalate_to: "",
      stock_count: 30,
      refill_threshold: 10,
      is_active: true,
    },
    {
      id: "ms-3",
      patient_id: DEMO_PATIENT_UUID,
      medication_id: "med-3",
      drug_name: "Diazepam (rescue)",
      prescribed_dose: 5,
      unit: "mg",
      frequency: "as_needed",
      times_of_day: [],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2026-01-15",
      end_date: "",
      snooze_interval_min: 30,
      max_repeats: 1,
      missed_after_min: 120,
      escalate_to: "cc-member-b",
      stock_count: 4,
      refill_threshold: 5,
      is_active: false,
    },
  ],
  "Patient B": [
    {
      id: "ms-4",
      patient_id: "00000000-0000-0000-0000-000000000002",
      medication_id: "med-4",
      drug_name: "Metformin",
      prescribed_dose: 1000,
      unit: "mg",
      frequency: "twice_daily",
      times_of_day: ["07:30", "19:30"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2025-11-01",
      end_date: "",
      snooze_interval_min: 15,
      max_repeats: 3,
      missed_after_min: 60,
      escalate_to: "",
      stock_count: 60,
      refill_threshold: 14,
      is_active: true,
    },
    {
      id: "ms-5",
      patient_id: "00000000-0000-0000-0000-000000000002",
      medication_id: "med-5",
      drug_name: "Empagliflozin",
      prescribed_dose: 10,
      unit: "mg",
      frequency: "once_daily",
      times_of_day: ["08:00"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2026-03-10",
      end_date: "",
      snooze_interval_min: 20,
      max_repeats: 2,
      missed_after_min: 90,
      escalate_to: "cc-member-a",
      stock_count: 8,
      refill_threshold: 10,
      is_active: true,
    },
  ],
  "Patient C": [
    {
      id: "ms-6",
      patient_id: "00000000-0000-0000-0000-000000000003",
      medication_id: "med-6",
      drug_name: "Bisoprolol",
      prescribed_dose: 5,
      unit: "mg",
      frequency: "once_daily",
      times_of_day: ["09:00"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2025-09-20",
      end_date: "",
      snooze_interval_min: 15,
      max_repeats: 3,
      missed_after_min: 60,
      escalate_to: "cc-member-a",
      stock_count: 28,
      refill_threshold: 7,
      is_active: true,
    },
    {
      id: "ms-7",
      patient_id: "00000000-0000-0000-0000-000000000003",
      medication_id: "med-7",
      drug_name: "Atorvastatin",
      prescribed_dose: 40,
      unit: "mg",
      frequency: "once_daily",
      times_of_day: ["21:00"],
      days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      start_date: "2025-10-01",
      end_date: "",
      snooze_interval_min: 15,
      max_repeats: 2,
      missed_after_min: 60,
      escalate_to: "",
      stock_count: 5,
      refill_threshold: 7,
      is_active: true,
    },
  ],
};

const PATIENT_LABELS: Record<SelectedPatient, string> = {
  "Patient A": "Patient A (epilepsy)",
  "Patient B": "Patient B (diabetes)",
  "Patient C": "Patient C (heart disease)",
};

function scheduleToEditForm(s: MedSchedule): EditFormState {
  return {
    id: s.id,
    prescribed_dose: String(s.prescribed_dose),
    unit: s.unit,
    frequency: s.frequency,
    times_of_day: s.times_of_day.join(", "),
    days_of_week: [...s.days_of_week],
    start_date: s.start_date,
    end_date: s.end_date,
    snooze_interval_min: String(s.snooze_interval_min),
    max_repeats: String(s.max_repeats),
    missed_after_min: String(s.missed_after_min),
    escalate_to: s.escalate_to,
    stock_count: String(s.stock_count),
    refill_threshold: String(s.refill_threshold),
  };
}

function blankEditForm(): EditFormState {
  return {
    id: `new-${Date.now()}`,
    prescribed_dose: "",
    unit: "mg",
    frequency: "once_daily",
    times_of_day: "08:00",
    days_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    snooze_interval_min: "15",
    max_repeats: "3",
    missed_after_min: "60",
    escalate_to: "",
    stock_count: "",
    refill_threshold: "10",
  };
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
    "Med Schedules",
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
          <svg
            aria-hidden="true"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "inline", marginRight: 6 }}
          >
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

interface InlineFormProps {
  form: EditFormState;
  onChange: (updated: EditFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  drugNameEditable?: boolean;
  drugName?: string;
  onDrugNameChange?: (v: string) => void;
}

function InlineForm({
  form,
  onChange,
  onSave,
  onCancel,
  title,
  drugNameEditable,
  drugName,
  onDrugNameChange,
}: InlineFormProps) {
  const inputStyle: React.CSSProperties = {
    border: "1px solid #DCE6E4",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    width: "100%",
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#4F6866",
    display: "block",
    marginBottom: 4,
  };

  const toggleDay = (day: DayKey) => {
    const days = form.days_of_week.includes(day)
      ? form.days_of_week.filter((d) => d !== day)
      : [...form.days_of_week, day];
    onChange({ ...form, days_of_week: days });
  };

  return (
    <div
      style={{
        padding: "16px 20px 20px",
        background: "#F9FDFB",
        borderBottom: "1px solid #DCE6E4",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0B1A1F" }}>{title}</div>

      {drugNameEditable && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Drug name</span>
          <input
            type="text"
            value={drugName ?? ""}
            onChange={(e) => onDrugNameChange?.(e.target.value)}
            placeholder="e.g. Levetiracetam"
            style={inputStyle}
          />
        </label>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Dose</span>
          <input
            type="number"
            value={form.prescribed_dose}
            onChange={(e) => onChange({ ...form, prescribed_dose: e.target.value })}
            placeholder="e.g. 500"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Unit</span>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => onChange({ ...form, unit: e.target.value })}
            placeholder="mg"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Frequency</span>
          <select
            value={form.frequency}
            onChange={(e) => onChange({ ...form, frequency: e.target.value as Frequency })}
            style={inputStyle}
          >
            {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Times of day</span>
          <input
            type="text"
            value={form.times_of_day}
            onChange={(e) => onChange({ ...form, times_of_day: e.target.value })}
            placeholder="08:00, 20:00"
            style={inputStyle}
          />
          <span style={{ fontSize: 10, color: "#86A3A1" }}>comma-separated</span>
        </label>
      </div>

      <div>
        <span style={labelStyle}>Days of week</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1.5px solid",
                borderColor: form.days_of_week.includes(day) ? "#0E7C6B" : "#DCE6E4",
                background: form.days_of_week.includes(day) ? "#DDF3EE" : "#fff",
                color: form.days_of_week.includes(day) ? "#0A5D50" : "#4F6866",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Start date</span>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => onChange({ ...form, start_date: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>End date</span>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => onChange({ ...form, end_date: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Snooze (min)</span>
          <input
            type="number"
            value={form.snooze_interval_min}
            onChange={(e) => onChange({ ...form, snooze_interval_min: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Max repeats</span>
          <input
            type="number"
            value={form.max_repeats}
            onChange={(e) => onChange({ ...form, max_repeats: e.target.value })}
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Missed after (min)</span>
          <input
            type="number"
            value={form.missed_after_min}
            onChange={(e) => onChange({ ...form, missed_after_min: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Stock count</span>
          <input
            type="number"
            value={form.stock_count}
            onChange={(e) => onChange({ ...form, stock_count: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Refill threshold</span>
          <input
            type="number"
            value={form.refill_threshold}
            onChange={(e) => onChange({ ...form, refill_threshold: e.target.value })}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Escalate to</span>
          <select
            value={form.escalate_to}
            onChange={(e) => onChange({ ...form, escalate_to: e.target.value })}
            style={inputStyle}
          >
            {ESCALATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="button ink" style={{ fontSize: 12 }} onClick={onSave}>
          Save
        </button>
        <button className="button outline" style={{ fontSize: 12 }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function MedScheduleEditor({ back }: { back: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient>("Patient A");
  const [schedules, setSchedules] =
    useState<Record<SelectedPatient, MedSchedule[]>>(SCHEDULES_BY_PATIENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editDrugName, setEditDrugName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<EditFormState>(blankEditForm());
  const [newDrugName, setNewDrugName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const currentSchedules = schedules[selectedPatient];

  const openEdit = (s: MedSchedule) => {
    setEditingId(s.id);
    setEditForm(scheduleToEditForm(s));
    setEditDrugName(s.drug_name);
    setAddingNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    const parsedDose = parseFloat(editForm.prescribed_dose);
    const updatedSchedule: MedSchedule = {
      ...(currentSchedules.find((s) => s.id === editForm.id) as MedSchedule),
      drug_name: editDrugName,
      prescribed_dose: isNaN(parsedDose) ? 0 : parsedDose,
      unit: editForm.unit,
      frequency: editForm.frequency,
      times_of_day: editForm.times_of_day
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      days_of_week: editForm.days_of_week,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      snooze_interval_min: parseInt(editForm.snooze_interval_min) || 15,
      max_repeats: parseInt(editForm.max_repeats) || 3,
      missed_after_min: parseInt(editForm.missed_after_min) || 60,
      escalate_to: editForm.escalate_to,
      stock_count: parseInt(editForm.stock_count) || 0,
      refill_threshold: parseInt(editForm.refill_threshold) || 10,
    };
    setSchedules((prev) => ({
      ...prev,
      [selectedPatient]: prev[selectedPatient].map((s) =>
        s.id === editForm.id ? updatedSchedule : s
      ),
    }));
    supabase
      .from("medication_schedules")
      .upsert({
        id: updatedSchedule.id,
        patient_id: updatedSchedule.patient_id,
        medication_id: updatedSchedule.medication_id,
        prescribed_dose: updatedSchedule.prescribed_dose,
        unit: updatedSchedule.unit,
        frequency: updatedSchedule.frequency,
        times_of_day: updatedSchedule.times_of_day,
        days_of_week: updatedSchedule.days_of_week,
        start_date: updatedSchedule.start_date || null,
        end_date: updatedSchedule.end_date || null,
        snooze_interval_min: updatedSchedule.snooze_interval_min,
        max_repeats: updatedSchedule.max_repeats,
        missed_after_min: updatedSchedule.missed_after_min,
        escalate_to: updatedSchedule.escalate_to || null,
        stock_count: updatedSchedule.stock_count,
        refill_threshold: updatedSchedule.refill_threshold,
        is_active: updatedSchedule.is_active,
      })
      .then(() => undefined);
    cancelEdit();
    showToast("Schedule saved");
  };

  const deactivate = (id: string) => {
    setSchedules((prev) => ({
      ...prev,
      [selectedPatient]: prev[selectedPatient].map((s) =>
        s.id === id ? { ...s, is_active: false } : s
      ),
    }));
    supabase
      .from("medication_schedules")
      .update({ is_active: false })
      .eq("id", id)
      .then(() => undefined);
    showToast("Schedule deactivated");
  };

  const openAddNew = () => {
    setAddingNew(true);
    setNewForm(blankEditForm());
    setNewDrugName("");
    setEditingId(null);
    setEditForm(null);
  };

  const cancelAddNew = () => {
    setAddingNew(false);
  };

  const saveNew = () => {
    const parsedDose = parseFloat(newForm.prescribed_dose);
    const newSchedule: MedSchedule = {
      id: `ms-${Date.now()}`,
      patient_id: DEMO_PATIENT_UUID,
      medication_id: `med-${Date.now()}`,
      drug_name: newDrugName || "Unnamed drug",
      prescribed_dose: isNaN(parsedDose) ? 0 : parsedDose,
      unit: newForm.unit,
      frequency: newForm.frequency,
      times_of_day: newForm.times_of_day
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      days_of_week: newForm.days_of_week,
      start_date: newForm.start_date,
      end_date: newForm.end_date,
      snooze_interval_min: parseInt(newForm.snooze_interval_min) || 15,
      max_repeats: parseInt(newForm.max_repeats) || 3,
      missed_after_min: parseInt(newForm.missed_after_min) || 60,
      escalate_to: newForm.escalate_to,
      stock_count: parseInt(newForm.stock_count) || 0,
      refill_threshold: parseInt(newForm.refill_threshold) || 10,
      is_active: true,
    };
    setSchedules((prev) => ({
      ...prev,
      [selectedPatient]: [...prev[selectedPatient], newSchedule],
    }));
    supabase
      .from("medication_schedules")
      .upsert({
        id: newSchedule.id,
        patient_id: newSchedule.patient_id,
        medication_id: newSchedule.medication_id,
        prescribed_dose: newSchedule.prescribed_dose,
        unit: newSchedule.unit,
        frequency: newSchedule.frequency,
        times_of_day: newSchedule.times_of_day,
        days_of_week: newSchedule.days_of_week,
        start_date: newSchedule.start_date || null,
        end_date: newSchedule.end_date || null,
        snooze_interval_min: newSchedule.snooze_interval_min,
        max_repeats: newSchedule.max_repeats,
        missed_after_min: newSchedule.missed_after_min,
        escalate_to: newSchedule.escalate_to || null,
        stock_count: newSchedule.stock_count,
        refill_threshold: newSchedule.refill_threshold,
        is_active: true,
      })
      .then(() => undefined);
    setAddingNew(false);
    showToast("Schedule added");
  };

  return (
    <div className="clinician-shell">
      <ClinicianSidebar activeItem="Med Schedules" />
      <main className="dashboard" style={{ overflowY: "auto" }}>
        <button className="back-link" onClick={back}>
          &#8249; Back to dashboard
        </button>
        <div className="dash-head">
          <div>
            <span className="eyebrow jade">Clinician tools</span>
            <h1>Medication schedule editor</h1>
          </div>
          <button className="button ink" style={{ fontSize: 12 }} onClick={openAddNew}>
            + Add new schedule
          </button>
        </div>

        {/* Patient selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#4F6866" }}>Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => {
              setSelectedPatient(e.target.value as SelectedPatient);
              cancelEdit();
              setAddingNew(false);
            }}
            style={{
              border: "1px solid #DCE6E4",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {(Object.keys(PATIENT_LABELS) as SelectedPatient[]).map((p) => (
              <option key={p} value={p}>
                {PATIENT_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Schedules table */}
        <section className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr 0.6fr 1.4fr",
              padding: "12px 20px",
              background: "#F3F6F5",
              borderBottom: "1px solid #DCE6E4",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4F6866",
            }}
          >
            <span>Drug</span>
            <span>Dose + Unit</span>
            <span>Frequency</span>
            <span>Times</span>
            <span>Stock</span>
            <span>Active</span>
            <span>Actions</span>
          </div>

          {currentSchedules.length === 0 && (
            <div
              style={{ padding: "24px 20px", color: "#4F6866", fontSize: 13, textAlign: "center" }}
            >
              No schedules configured for this patient.
            </div>
          )}

          {currentSchedules.map((s) => {
            const lowStock = s.stock_count <= s.refill_threshold;
            return (
              <div key={s.id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr 0.6fr 1.4fr",
                    padding: "13px 20px",
                    borderBottom: "1px solid #edf0ef",
                    fontSize: 12,
                    alignItems: "center",
                    background: editingId === s.id ? "#F0FAF7" : "transparent",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{s.drug_name}</span>
                  <span>
                    {s.prescribed_dose} {s.unit}
                  </span>
                  <span style={{ color: "#4F6866" }}>{FREQUENCY_LABELS[s.frequency]}</span>
                  <span style={{ color: "#4F6866" }}>
                    {s.times_of_day.length > 0 ? s.times_of_day.join(", ") : "—"}
                  </span>
                  <span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 700,
                        color: lowStock ? "#7A5200" : "#0B1A1F",
                      }}
                    >
                      {s.stock_count}
                      {lowStock && (
                        <span
                          style={{
                            background: "#FFF0CC",
                            color: "#7A5200",
                            borderRadius: 99,
                            padding: "2px 7px",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Refill
                        </span>
                      )}
                    </span>
                  </span>
                  <span>
                    <span className={s.is_active ? "status s2" : "status"} style={{ fontSize: 10, background: s.is_active ? undefined : "#F3F6F5", color: s.is_active ? undefined : "#86A3A1" }}>
                      {s.is_active ? "On" : "Off"}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      className="button outline"
                      style={{ minHeight: 30, padding: "3px 10px", fontSize: 11, borderRadius: 8 }}
                      onClick={() => openEdit(s)}
                    >
                      Edit
                    </button>
                    {s.is_active && (
                      <button
                        className="button danger"
                        style={{ minHeight: 30, padding: "3px 10px", fontSize: 11, borderRadius: 8 }}
                        onClick={() => deactivate(s.id)}
                      >
                        Deactivate
                      </button>
                    )}
                  </span>
                </div>

                {editingId === s.id && editForm && (
                  <InlineForm
                    form={editForm}
                    onChange={setEditForm}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    title={`Editing: ${s.drug_name}`}
                    drugNameEditable
                    drugName={editDrugName}
                    onDrugNameChange={setEditDrugName}
                  />
                )}
              </div>
            );
          })}

          {/* Add new schedule inline form */}
          {addingNew && (
            <InlineForm
              form={newForm}
              onChange={setNewForm}
              onSave={saveNew}
              onCancel={cancelAddNew}
              title="New schedule"
              drugNameEditable
              drugName={newDrugName}
              onDrugNameChange={setNewDrugName}
            />
          )}
        </section>

        {/* Safety note */}
        <p
          style={{
            fontSize: 11,
            color: "#86A3A1",
            lineHeight: 1.6,
            margin: "0 0 8px",
            padding: "0 4px",
          }}
        >
          Mojo syncs this schedule to the patient&apos;s app. Changes take effect on next sync.
          Never adjust a dose you haven&apos;t verified — confirm with the patient or their records
          first.
        </p>
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
