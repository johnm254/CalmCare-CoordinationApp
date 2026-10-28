'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

type CrisisResource = {
  id: string;
  country: string;
  language: string;
  name: string;
  phone: string | null;
  description: string | null;
  url: string | null;
  active: boolean;
};

type FormState = {
  country: string;
  language: string;
  name: string;
  phone: string;
  description: string;
  url: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  country: '',
  language: 'en',
  name: '',
  phone: '',
  description: '',
  url: '',
  active: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#22C87A]' : 'bg-[#2E2B50]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function ResourceForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const inputCls =
    'w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-2.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none text-sm';
  const labelCls = 'block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5';

  return (
    <tr>
      <td colSpan={7} className="px-6 py-5 bg-[#1C1A35] border-b border-[#2E2B50]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Country</label>
            <input
              className={inputCls}
              placeholder="Kenya"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select
              className={inputCls}
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              placeholder="Befrienders Kenya"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={inputCls}
              placeholder="+254 722 178 177"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>URL (optional)</label>
            <input
              className={inputCls}
              placeholder="https://..."
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Toggle checked={form.active} onChange={(v) => set('active', v)} />
            <span className="text-[#9B96C0] text-sm">Active</span>
          </div>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Description (optional)</label>
          <textarea
            className={inputCls + ' resize-none'}
            placeholder="Free, confidential support line…"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-[#2E2B50] text-[#9B96C0] text-sm font-semibold hover:bg-[#2E2B50] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.country || !form.name}
            onClick={() => onSave(form)}
            className="px-5 py-2 rounded-xl bg-[#8B5CF6] text-[#09090F] text-sm font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CrisisResourcesPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crisis_resources')
      .select('id, country, language, name, phone, description, url, active')
      .order('country')
      .order('name');
    setResources(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  async function handleAdd(form: FormState) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('crisis_resources').insert({
      country: form.country,
      language: form.language,
      name: form.name,
      phone: form.phone || null,
      description: form.description || null,
      url: form.url || null,
      active: form.active,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowAddForm(false);
    fetchResources();
  }

  async function handleEdit(id: string, form: FormState) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('crisis_resources')
      .update({
        country: form.country,
        language: form.language,
        name: form.name,
        phone: form.phone || null,
        description: form.description || null,
        url: form.url || null,
        active: form.active,
      })
      .eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditId(null);
    fetchResources();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    await supabase.from('crisis_resources').delete().eq('id', id);
    setDeleting(false);
    setDeleteId(null);
    fetchResources();
  }

  // Group by country
  const grouped = resources.reduce<Record<string, CrisisResource[]>>((acc, r) => {
    (acc[r.country] = acc[r.country] ?? []).push(r);
    return acc;
  }, {});

  const countries = Object.keys(grouped).sort();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F0FF]">Crisis Resources</h1>
          <p className="text-[#9B96C0] text-sm mt-0.5">
            Contacts patients can always access — shown in the app regardless of connectivity.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditId(null); }}
          className="flex items-center gap-2 bg-[#8B5CF6] text-[#09090F] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#00A896] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add resource
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 text-[#EF4444] rounded-xl px-5 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
        {/* Add form at top */}
        {showAddForm && (
          <table className="w-full">
            <tbody>
              <ResourceForm
                initial={EMPTY_FORM}
                onSave={handleAdd}
                onCancel={() => setShowAddForm(false)}
                saving={saving}
              />
            </tbody>
          </table>
        )}

        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_1fr_120px_80px_80px_100px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
          {['Name', 'Lang', 'Description', 'Phone', 'URL', 'Active', ''].map((h) => (
            <span key={h} className="text-[#504C78] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#9B96C0] text-sm">Loading resources…</p>
          </div>
        ) : countries.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-10 h-10 text-[#2E2B50] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-[#9B96C0] text-sm font-medium">No crisis resources.</p>
            <p className="text-[#504C78] text-xs mt-1">Add contacts patients can always access.</p>
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {countries.map((country) => (
                <>
                  <tr key={`group-${country}`}>
                    <td colSpan={7} className="px-6 py-2 bg-[#09090F] border-b border-[#2E2B50]">
                      <span className="text-[#8B5CF6] text-xs font-bold uppercase tracking-widest">
                        {country}
                      </span>
                    </td>
                  </tr>
                  {grouped[country].map((r) =>
                    editId === r.id ? (
                      <ResourceForm
                        key={r.id}
                        initial={{
                          country: r.country,
                          language: r.language,
                          name: r.name,
                          phone: r.phone ?? '',
                          description: r.description ?? '',
                          url: r.url ?? '',
                          active: r.active,
                        }}
                        onSave={(form) => handleEdit(r.id, form)}
                        onCancel={() => setEditId(null)}
                        saving={saving}
                      />
                    ) : (
                      <tr
                        key={r.id}
                        className="border-b border-[#2E2B50] last:border-0 hover:bg-[#1C1A35] transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <p className="text-[#F5F0FF] text-sm font-semibold">{r.name}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center text-xs font-semibold text-[#9B96C0] bg-[#09090F] border border-[#2E2B50] rounded-full px-2 py-0.5">
                            {r.language.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-[#9B96C0] text-xs truncate max-w-[200px]">
                            {r.description ?? '—'}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-[#F5F0FF] text-xs font-mono">{r.phone ?? '—'}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8B5CF6] text-xs underline underline-offset-2 truncate block max-w-[80px]"
                            >
                              Link
                            </a>
                          ) : (
                            <span className="text-[#504C78] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {r.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C87A] bg-[rgba(34,200,122,0.10)] border border-[#22C87A]/20 rounded-full px-2.5 py-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C87A]" />
                              On
                            </span>
                          ) : (
                            <span className="text-xs text-[#504C78]">Off</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditId(r.id); setShowAddForm(false); }}
                              className="text-[#8B5CF6] border border-[#2E2B50] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#8B5CF6]/10 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteId(r.id)}
                              className="text-[#EF4444] border border-[#EF4444]/20 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#EF4444]/10 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-[#F5F0FF] font-bold text-lg mb-2">Delete resource?</h2>
            <p className="text-[#9B96C0] text-sm mb-6">
              This will permanently remove the resource. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-[#2E2B50] text-[#9B96C0] text-sm font-semibold hover:bg-[#1C1A35] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
