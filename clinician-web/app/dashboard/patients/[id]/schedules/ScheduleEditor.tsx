'use client';
import { useState } from 'react';
import { createClient } from '../../../../../lib/supabase-browser';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SNOOZE_OPTIONS = [5, 10, 15, 30] as const;
const MISSED_OPTIONS = [30, 45, 60, 90, 120] as const;
const ESCALATE_OPTIONS = [
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'both', label: 'Both' },
] as const;

interface Medication {
  id: string;
  name: string;
  dose: string;
  form?: string;
  strength?: string;
}

interface ScheduleData {
  id?: string;
  medication_id: string;
  times: string[];
  days: string[];
  dose_amount: string;
  snooze_interval: number;
  max_repeats: number;
  missed_after: number;
  escalate_to: string;
  version?: number;
}

interface Props {
  medication: Medication;
  initialSchedule: ScheduleData | null;
  patientId: string;
}

export default function ScheduleEditor({ medication, initialSchedule, patientId }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleData | null>(initialSchedule);

  const defaultSchedule: ScheduleData = {
    medication_id: medication.id,
    times: ['08:00'],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dose_amount: medication.dose ?? '',
    snooze_interval: 10,
    max_repeats: 3,
    missed_after: 60,
    escalate_to: 'caregiver',
  };

  const [draft, setDraft] = useState<ScheduleData>(currentSchedule ?? defaultSchedule);

  function startEdit() {
    setDraft(currentSchedule ?? defaultSchedule);
    setSaveError('');
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError('');
  }

  function setTime(index: number, value: string) {
    const newTimes = [...draft.times];
    newTimes[index] = value;
    setDraft({ ...draft, times: newTimes });
  }

  function addTime() {
    if (draft.times.length >= 4) return;
    setDraft({ ...draft, times: [...draft.times, '12:00'] });
  }

  function removeTime(index: number) {
    if (draft.times.length <= 1) return;
    setDraft({ ...draft, times: draft.times.filter((_, i) => i !== index) });
  }

  function toggleDay(day: string) {
    const current = draft.days;
    if (current.includes(day)) {
      if (current.length === 1) return; // at least one day required
      setDraft({ ...draft, days: current.filter((d) => d !== day) });
    } else {
      setDraft({ ...draft, days: [...current, day] });
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const supabase = createClient();
      const payload: any = {
        medication_id: medication.id,
        patient_id: patientId,
        times: draft.times.filter(Boolean),
        days: draft.days,
        dose_amount: draft.dose_amount,
        snooze_interval: draft.snooze_interval,
        max_repeats: draft.max_repeats,
        missed_after: draft.missed_after,
        escalate_to: draft.escalate_to,
        version: (currentSchedule?.version ?? 0) + 1,
      };

      if (currentSchedule?.id) {
        payload.id = currentSchedule.id;
      }

      const { data, error } = await supabase
        .from('medication_schedules')
        .upsert(payload, { onConflict: 'medication_id' })
        .select()
        .single();

      if (error) {
        setSaveError(error.message);
        return;
      }

      setCurrentSchedule(data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'bg-[#14122A] border border-[#2E2B50] rounded-xl px-3 py-2.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-colors disabled:opacity-50';

  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.10)] border border-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-[#F5F0FF] font-bold text-sm">{medication.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {medication.strength && (
                <span className="text-[#9B96C0] text-xs">{medication.strength}</span>
              )}
              {medication.form && (
                <span className="text-[#504C78] text-xs">{medication.form}</span>
              )}
              {medication.dose && (
                <span className="bg-[#1C1A35] text-[#9B96C0] text-xs px-2 py-0.5 rounded-md">{medication.dose}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && (
            <span className="text-[#22C87A] text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {!editing && (
            <button
              onClick={startEdit}
              className="border border-[#2E2B50] text-[#9B96C0] text-xs font-medium px-3.5 py-2 rounded-xl hover:bg-[#1C1A35] hover:text-[#F5F0FF] transition-colors"
            >
              Edit schedule
            </button>
          )}
        </div>
      </div>

      {/* Current schedule summary */}
      {!editing && currentSchedule && (
        <div className="px-6 pb-5 border-t border-[#2E2B50] pt-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-[#504C78] text-xs mb-1.5">Times</p>
              <div className="flex flex-wrap gap-1.5">
                {currentSchedule.times.map((t) => (
                  <span key={t} className="bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] text-xs px-2.5 py-1 rounded-full border border-[#8B5CF6]/20 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#504C78] text-xs mb-1.5">Days</p>
              <div className="flex flex-wrap gap-1">
                {DAYS.map((d) => (
                  <span
                    key={d}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      currentSchedule.days.includes(d)
                        ? 'bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20'
                        : 'bg-[#1C1A35] text-[#504C78] border border-[#2E2B50]'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#504C78] text-xs mb-1">Escalate to</p>
              <span className="text-[#9B96C0] text-xs capitalize">{currentSchedule.escalate_to}</span>
            </div>
            <div>
              <p className="text-[#504C78] text-xs mb-1">Missed after</p>
              <span className="text-[#9B96C0] text-xs">{currentSchedule.missed_after} min</span>
            </div>
          </div>
        </div>
      )}

      {!editing && !currentSchedule && (
        <div className="px-6 pb-5 border-t border-[#2E2B50] pt-4">
          <p className="text-[#504C78] text-sm">No schedule configured yet.</p>
        </div>
      )}

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-[#2E2B50] bg-[#1C1A35] px-6 py-6">
          <div className="space-y-6">
            {/* Times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#9B96C0] text-xs font-semibold uppercase tracking-widest">
                  Times of day
                </label>
                {draft.times.length < 4 && (
                  <button
                    type="button"
                    onClick={addTime}
                    className="text-[#8B5CF6] text-xs hover:text-[#00A896] transition-colors flex items-center gap-1"
                    aria-label="Add a time"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add time
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {draft.times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => setTime(i, e.target.value)}
                      className={inputClass + ' font-mono'}
                      aria-label={`Dose time ${i + 1}`}
                    />
                    {draft.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(i)}
                        className="text-[#504C78] hover:text-[#EF4444] transition-colors"
                        aria-label={`Remove time ${i + 1}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Days of week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={draft.days.includes(day)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      draft.days.includes(day)
                        ? 'bg-[rgba(139,92,246,0.15)] border-[#8B5CF6]/40 text-[#8B5CF6]'
                        : 'bg-[#14122A] border-[#2E2B50] text-[#504C78] hover:border-[#3D3A65] hover:text-[#9B96C0]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Dose amount */}
            <div>
              <label htmlFor={`dose-amount-${medication.id}`} className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Dose amount
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`dose-amount-${medication.id}`}
                  type="text"
                  value={draft.dose_amount}
                  onChange={(e) => setDraft({ ...draft, dose_amount: e.target.value })}
                  placeholder="e.g. 500mg"
                  className={inputClass + ' w-40'}
                  aria-label="Dose amount"
                />
                <span className="text-[#504C78] text-xs">Patients cannot change this value</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Snooze interval */}
              <div>
                <label htmlFor={`snooze-${medication.id}`} className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                  Snooze interval
                </label>
                <select
                  id={`snooze-${medication.id}`}
                  value={draft.snooze_interval}
                  onChange={(e) => setDraft({ ...draft, snooze_interval: Number(e.target.value) })}
                  className={inputClass + ' w-full cursor-pointer'}
                  aria-label="Snooze interval in minutes"
                >
                  {SNOOZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt} min</option>
                  ))}
                </select>
              </div>

              {/* Max repeats */}
              <div>
                <label htmlFor={`repeats-${medication.id}`} className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                  Max snoozes
                </label>
                <select
                  id={`repeats-${medication.id}`}
                  value={draft.max_repeats}
                  onChange={(e) => setDraft({ ...draft, max_repeats: Number(e.target.value) })}
                  className={inputClass + ' w-full cursor-pointer'}
                  aria-label="Maximum number of snooze repeats"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Missed after */}
              <div>
                <label htmlFor={`missed-${medication.id}`} className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                  Mark missed after
                </label>
                <select
                  id={`missed-${medication.id}`}
                  value={draft.missed_after}
                  onChange={(e) => setDraft({ ...draft, missed_after: Number(e.target.value) })}
                  className={inputClass + ' w-full cursor-pointer'}
                  aria-label="Minutes after which dose is marked as missed"
                >
                  {MISSED_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt} min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Escalate to */}
            <div>
              <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Escalate missed dose to
              </label>
              <div className="flex gap-2">
                {ESCALATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, escalate_to: opt.value })}
                    aria-pressed={draft.escalate_to === opt.value}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                      draft.escalate_to === opt.value
                        ? 'bg-[rgba(139,92,246,0.15)] border-[#8B5CF6]/40 text-[#8B5CF6]'
                        : 'bg-[#14122A] border-[#2E2B50] text-[#504C78] hover:border-[#3D3A65] hover:text-[#9B96C0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <div role="alert" className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3">
                <p className="text-[#EF4444] text-sm">{saveError}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-10 px-6 text-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Saving…
                  </span>
                ) : 'Save schedule'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="border border-[#2E2B50] text-[#9B96C0] font-medium rounded-xl hover:bg-[#14122A] hover:text-[#F5F0FF] transition-colors min-h-10 px-5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
