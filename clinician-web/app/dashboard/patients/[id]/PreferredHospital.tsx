'use client';

import { useState } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

interface Props {
  clinicianId: string;
  patientId: string;
  initialName: string | null;
}

export default function PreferredHospital({ clinicianId, patientId, initialName }: Props) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? '');
  const [savedName, setSavedName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('clinician_patient_preferences').upsert(
      {
        clinician_id: clinicianId,
        patient_id: patientId,
        preferred_hospital_name: name.trim() || null,
      },
      { onConflict: 'clinician_id,patient_id' }
    );
    setSavedName(name.trim() || null);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#0F1B2D] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Preferred Hospital
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-[#14B8A6] hover:underline transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <input
            type="text"
            className="w-full bg-[#F6F9FC] border border-[#E6ECF2] rounded-xl px-3 py-2 text-[#0F1B2D] text-sm placeholder:text-[#8C9AAB] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-colors"
            placeholder="e.g. Kenyatta National Hospital"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#14B8A6] text-[#F6F9FC] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setName(savedName ?? '');
                setEditing(false);
              }}
              className="text-[#5B6B7F] text-xs hover:text-[#0F1B2D] transition-colors px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-sm ${savedName ? 'text-[#0F1B2D]' : 'text-[#8C9AAB] italic'}`}>
          {savedName ?? 'Not set'}
        </p>
      )}
    </div>
  );
}
