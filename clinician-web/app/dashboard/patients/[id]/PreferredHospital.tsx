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
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#F5F0FF] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Preferred Hospital
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-[#8B5CF6] hover:underline transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <input
            type="text"
            className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-3 py-2 text-[#F5F0FF] text-sm placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors"
            placeholder="e.g. Kenyatta National Hospital"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#8B5CF6] text-[#09090F] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setName(savedName ?? '');
                setEditing(false);
              }}
              className="text-[#9B96C0] text-xs hover:text-[#F5F0FF] transition-colors px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-sm ${savedName ? 'text-[#F5F0FF]' : 'text-[#504C78] italic'}`}>
          {savedName ?? 'Not set'}
        </p>
      )}
    </div>
  );
}
