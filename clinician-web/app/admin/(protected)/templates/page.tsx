'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConditionTemplate {
  id: string;
  name: string;
  seizure_types: string;
  severity_scale: string;
  notes: string | null;
  created_at: string | null;
}

interface FormState {
  name: string;
  seizure_types: string;
  severity_scale: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  seizure_types: '',
  severity_scale: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Inline form component (shared for add and edit)
// ---------------------------------------------------------------------------

function TemplateForm({
  initial,
  onSave,
  onCancel,
  saving,
  saveError,
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="bg-[#1C1A35] border border-[#2E2B50] rounded-2xl p-5 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">
          Template name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Focal Onset Impaired Awareness"
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/15 text-sm"
        />
      </div>

      {/* Seizure types */}
      <div>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">
          Seizure types <span className="normal-case font-normal text-[#504C78]">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={form.seizure_types}
          onChange={(e) => set('seizure_types', e.target.value)}
          placeholder="e.g. Absence, Tonic-clonic, Atonic"
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/15 text-sm"
        />
      </div>

      {/* Severity scale */}
      <div>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">
          Severity scale <span className="normal-case font-normal text-[#504C78]">(JSON or plain description)</span>
        </label>
        <textarea
          value={form.severity_scale}
          onChange={(e) => set('severity_scale', e.target.value)}
          placeholder={'e.g. {"1":"Mild - brief absence","2":"Moderate","3":"Severe - convulsion"}'}
          rows={3}
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/15 text-sm font-mono resize-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">
          Notes <span className="normal-case font-normal text-[#504C78]">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Additional clinical context, references, etc."
          rows={2}
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/15 text-sm resize-none"
        />
      </div>

      {saveError && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[#EF4444]/30 rounded-xl px-4 py-3">
          <p className="text-[#EF4444] text-sm">{saveError}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="bg-[#8B5CF6] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save template'}
        </button>
        <button
          onClick={onCancel}
          className="text-[#9B96C0] text-sm px-5 py-2.5 rounded-xl border border-[#2E2B50] hover:bg-[#2E2B50] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onEdit,
  onDelete,
  deleting,
}: {
  template: ConditionTemplate;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const types = template.seizure_types
    ? template.seizure_types.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-[#F5F0FF] font-semibold text-base">{template.name}</h3>
          <p className="text-[#504C78] text-xs mt-0.5">Created {fmtDate(template.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[#EF4444]/20 hover:bg-[rgba(239,68,68,0.15)] transition-colors disabled:opacity-50"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Seizure types */}
      {types.length > 0 && (
        <div className="mb-3">
          <p className="text-[#504C78] text-xs font-semibold uppercase tracking-widest mb-1.5">Seizure types</p>
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.08)] text-[#9B96C0] border border-[#2E2B50]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Severity scale */}
      {template.severity_scale && (
        <div className="mb-2">
          <p className="text-[#504C78] text-xs font-semibold uppercase tracking-widest mb-1">Severity scale</p>
          <p className="text-[#9B96C0] text-xs font-mono bg-[#09090F] border border-[#2E2B50] rounded-lg px-3 py-2 whitespace-pre-wrap break-all">
            {template.severity_scale}
          </p>
        </div>
      )}

      {/* Notes */}
      {template.notes && (
        <p className="text-[#504C78] text-xs mt-2 italic">{template.notes}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<ConditionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('condition_templates')
        .select('id, name, seizure_types, severity_scale, notes, created_at')
        .order('name');
      if (error) throw error;
      setTemplates((data ?? []) as ConditionTemplate[]);
    } catch {
      setFetchError('Template table not set up yet — run the DB migration first.');
      setTemplates([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleSave(form: FormState, id?: string) {
    setSaving(true);
    setSaveError(null);
    try {
      if (id) {
        const { error } = await supabase
          .from('condition_templates')
          .update({
            name: form.name,
            seizure_types: form.seizure_types,
            severity_scale: form.severity_scale,
            notes: form.notes || null,
          })
          .eq('id', id);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('condition_templates')
          .insert({
            name: form.name,
            seizure_types: form.seizure_types,
            severity_scale: form.severity_scale,
            notes: form.notes || null,
          });
        if (error) throw error;
        setShowAddForm(false);
      }
      fetchTemplates();
    } catch {
      setSaveError('Template table not set up yet — run the DB migration first.');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('condition_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silently ignore — table may not exist
    }
    setDeletingId(null);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F0FF]">Condition Templates</h1>
          <p className="text-[#9B96C0] text-sm mt-1 max-w-2xl">
            Define seizure types, severity scales, and medication categories that clinicians and patients use.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setSaveError(null); }}
            className="flex items-center gap-2 bg-[#8B5CF6] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#7C3AED] transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add template
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6">
          <p className="text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-3">New template</p>
          <TemplateForm
            initial={EMPTY_FORM}
            onSave={(form) => handleSave(form)}
            onCancel={() => { setShowAddForm(false); setSaveError(null); }}
            saving={saving}
            saveError={saveError}
          />
        </div>
      )}

      {/* Fetch error */}
      {fetchError && !loading && (
        <div className="flex items-start gap-3 bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/25 rounded-2xl px-5 py-4 mb-6">
          <svg className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[#F4B860] text-sm font-medium">{fetchError}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[#9B96C0] text-sm">Loading templates…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(139,92,246,0.10)] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[#F5F0FF] font-semibold text-base">No templates yet</p>
          <p className="text-[#9B96C0] text-sm mt-1">
            Click "Add template" to create your first condition template.
          </p>
        </div>
      )}

      {/* Template list */}
      {!loading && templates.length > 0 && (
        <div className="space-y-4">
          {templates.map((t) =>
            editingId === t.id ? (
              <div key={t.id}>
                <p className="text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-3">
                  Editing: {t.name}
                </p>
                <TemplateForm
                  initial={{
                    name: t.name,
                    seizure_types: t.seizure_types,
                    severity_scale: t.severity_scale,
                    notes: t.notes ?? '',
                  }}
                  onSave={(form) => handleSave(form, t.id)}
                  onCancel={() => { setEditingId(null); setSaveError(null); }}
                  saving={saving}
                  saveError={saveError}
                />
              </div>
            ) : (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => { setEditingId(t.id); setShowAddForm(false); setSaveError(null); }}
                onDelete={() => handleDelete(t.id)}
                deleting={deletingId === t.id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
