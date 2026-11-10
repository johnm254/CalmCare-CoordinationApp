'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase-browser';

interface Note {
  id: string;
  body: string;
  created_at: string;
}

interface Props {
  clinicianId: string;
  patientId: string;
}

export default function ClinicalNotes({ clinicianId, patientId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  async function fetchNotes() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('id, body, created_at')
      .eq('clinician_id', clinicianId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') setMigrationNeeded(true); // table doesn't exist
    } else {
      setNotes(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchNotes(); }, [clinicianId, patientId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('clinical_notes').insert({
      clinician_id: clinicianId,
      patient_id: patientId,
      body: body.trim(),
    });
    setSaving(false);
    if (!error) { setBody(''); fetchNotes(); }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('clinical_notes').delete().eq('id', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
      <h2 className="text-base font-bold text-[#0C1F20] mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#3A5255]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Clinical notes
      </h2>

      {migrationNeeded ? (
        <div className="bg-[rgba(241,199,107,0.08)] border border-[#F1C76B]/30 rounded-xl px-4 py-3">
          <p className="text-[#F1C76B] text-sm font-semibold">Database migration required</p>
          <p className="text-[#6B8588] text-xs mt-1">Run this SQL in your Supabase dashboard to enable clinical notes:</p>
          <pre className="text-xs font-mono text-[#3A5255] bg-[#EDE8DF] rounded-lg px-3 py-2 mt-2 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE clinical_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinician_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinicians_own_notes" ON clinical_notes
  FOR ALL USING (clinician_id = auth.uid());`}</pre>
        </div>
      ) : (
        <>
          <form onSubmit={handleAdd} className="mb-5">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a clinical note…"
              rows={3}
              className="w-full bg-[#F5EFE3] border border-[#D6CFC4] rounded-xl px-4 py-3 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm resize-none transition-colors"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={saving || !body.trim()}
                className="bg-[#1F7A72] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#12383A] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </form>

          {loading ? (
            <p className="text-[#6B8588] text-sm">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="text-[#6B8588] text-sm text-center py-4">No notes yet. Add a note above.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="bg-[#F5EFE3] border border-[#E8E0D4] rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[#0C1F20] text-sm leading-relaxed flex-1">{note.body}</p>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-[#6B8588] hover:text-[#C8102E] transition-colors flex-shrink-0"
                      aria-label="Delete note"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[#6B8588] text-xs mt-2">
                    {new Date(note.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
