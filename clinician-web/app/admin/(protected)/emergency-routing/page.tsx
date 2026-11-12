'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

type Provider = {
  id: string;
  region: string;
  name: string;
  priority: number;
  type: 'phone' | 'api' | 'call_centre';
  phone: string | null;
  api_config_ref: string | null;
  active: boolean;
  mode: 'sandbox' | 'live';
};

type ProviderForm = {
  region: string;
  name: string;
  type: 'phone' | 'api' | 'call_centre';
  phone: string;
  api_config_ref: string;
  priority: string;
  active: boolean;
};

const EMPTY_PROVIDER_FORM: ProviderForm = {
  region: '',
  name: '',
  type: 'phone',
  phone: '',
  api_config_ref: '',
  priority: '1',
  active: true,
};

const ADAPTER_LABELS: Record<string, string> = {
  phone: 'Phone call',
  api: 'API',
  call_centre: 'Call centre',
};

const ADAPTER_STYLES: Record<string, string> = {
  phone: 'text-[#1F7A72] bg-[rgba(31,122,114,0.10)] border-[#1F7A72]/20',
  api: 'text-[#1F7A72] bg-[rgba(31,122,114,0.10)] border-[#1F7A72]/20',
  call_centre: 'text-[#F1C76B] bg-[rgba(241,199,107,0.10)] border-[#F1C76B]/20',
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-[#1F7A72]' : 'bg-[#D6CFC4]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function EmergencyRoutingPage() {
  const supabase = createClient();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<ProviderForm>(EMPTY_PROVIDER_FORM);
  const [editForm, setEditForm] = useState<ProviderForm>(EMPTY_PROVIDER_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [liveDispatch, setLiveDispatch] = useState<boolean>(false);
  const [flagLoading, setFlagLoading] = useState(true);
  const [flagSaving, setFlagSaving] = useState(false);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('emergency_providers')
      .select('id, region, name, priority, type, phone, api_config_ref, active, mode')
      .order('priority');
    setProviders(data ?? []);
    if (fetchError) setError(`Could not load providers: ${fetchError.message}`);
    setLoading(false);
  }, []);

  const fetchFlag = useCallback(async () => {
    setFlagLoading(true);
    const { data, error: fetchError } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'live_dispatch')
      .single();
    setLiveDispatch(data?.enabled ?? false);
    if (fetchError && fetchError.code !== 'PGRST116') {
      setError(`Could not load dispatch settings: ${fetchError.message}`);
    }
    setFlagLoading(false);
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchFlag();
  }, [fetchProviders, fetchFlag]);

  async function toggleLiveDispatch(newValue: boolean) {
    if (newValue && !showLiveConfirm) {
      setShowLiveConfirm(true);
      return;
    }
    setShowLiveConfirm(false);
    setFlagSaving(true);
    const { data: existing } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('key', 'live_dispatch')
      .single();
    let saveError;
    if (existing) {
      ({ error: saveError } = await supabase.from('feature_flags').update({ enabled: newValue }).eq('key', 'live_dispatch'));
    } else {
      ({ error: saveError } = await supabase.from('feature_flags').insert({ key: 'live_dispatch', enabled: newValue }));
    }
    if (saveError) {
      setError(`Could not update live dispatch: ${saveError.message}`);
      setFlagSaving(false);
      return;
    }
    setLiveDispatch(newValue);
    setFlagSaving(false);
  }

  async function handleAddProvider() {
    const validationError = validateProviderForm(addForm);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('emergency_providers').insert({
      region: addForm.region,
      name: addForm.name,
      type: addForm.type,
      phone: addForm.phone || null,
      api_config_ref: addForm.api_config_ref || null,
      priority: parseInt(addForm.priority, 10) || 1,
      active: addForm.active,
      mode: liveDispatch ? 'live' : 'sandbox',
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowAddForm(false);
    setAddForm(EMPTY_PROVIDER_FORM);
    fetchProviders();
  }

  async function handleEditProvider(id: string) {
    const validationError = validateProviderForm(editForm);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('emergency_providers')
      .update({
        region: editForm.region,
        name: editForm.name,
        type: editForm.type,
        phone: editForm.phone || null,
        api_config_ref: editForm.api_config_ref || null,
        priority: parseInt(editForm.priority, 10) || 1,
        active: editForm.active,
      })
      .eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditId(null);
    fetchProviders();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const { error: deleteError } = await supabase.from('emergency_providers').delete().eq('id', id);
    setDeleting(false);
    if (deleteError) { setError(`Could not delete provider: ${deleteError.message}`); return; }
    setDeleteId(null);
    fetchProviders();
  }

  function validateProviderForm(form: ProviderForm) {
    if (!form.region.trim() || !form.name.trim()) return 'Region and provider name are required.';
    const priority = Number(form.priority);
    if (!Number.isInteger(priority) || priority < 1) return 'Priority must be a whole number greater than zero.';
    if (form.type === 'phone' && !form.phone.trim()) return 'Phone is required for phone-call providers.';
    return null;
  }

  async function handleTestCall(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/emergency-routing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: id }),
      });
      const json = await res.json();
      setTestResult({ id, msg: json.message ?? 'Done', ok: res.ok });
    } catch {
      setTestResult({ id, msg: 'Request failed', ok: false });
    } finally {
      setTestingId(null);
    }
  }

  function startEdit(p: Provider) {
    setEditForm({
      region: p.region,
      name: p.name,
      type: p.type,
      phone: p.phone ?? '',
      api_config_ref: p.api_config_ref ?? '',
      priority: String(p.priority),
      active: p.active,
    });
    setEditId(p.id);
    setShowAddForm(false);
  }

  const inputCls =
    'w-full bg-[#F5EFE3] border border-[#D6CFC4] rounded-xl px-4 py-2.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none text-sm';
  const labelCls = 'block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-1.5';

  function ProviderFormFields({
    form,
    setForm,
    onSave,
    onCancel,
  }: {
    form: ProviderForm;
    setForm: (f: ProviderForm) => void;
    onSave: () => void;
    onCancel: () => void;
  }) {
    function set(field: keyof ProviderForm, value: string | boolean) {
      setForm({ ...form, [field]: value });
    }
    return (
      <div className="px-6 py-5 bg-[#EDE8DF] border-b border-[#D6CFC4]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Region</label>
            <input className={inputCls} placeholder="Nairobi" value={form.region} onChange={(e) => set('region', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} placeholder="Kenya Red Cross" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Adapter type</label>
            <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value as ProviderForm['type'])}>
              <option value="phone">Phone call</option>
              <option value="api">API</option>
              <option value="call_centre">Call centre</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} placeholder="+254 20 123 456" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>API endpoint (optional)</label>
            <input className={inputCls} placeholder="Environment variable name (optional)" value={form.api_config_ref} onChange={(e) => set('api_config_ref', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Priority (lower = first)</label>
            <input className={inputCls} type="number" min={1} placeholder="1" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Toggle checked={form.active} onChange={(v) => set('active', v)} />
          <span className="text-[#3A5255] text-sm">Active</span>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl border border-[#D6CFC4] text-[#3A5255] text-sm font-semibold hover:bg-[#D6CFC4] transition-colors">
            Cancel
          </button>
          <button type="button" disabled={saving || !form.region || !form.name} onClick={onSave} className="px-5 py-2 rounded-xl bg-[#1F7A72] text-[#F5EFE3] text-sm font-bold hover:bg-[#12383A] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0C1F20]">Emergency Routing</h1>
          <p className="text-[#3A5255] text-sm mt-0.5">
            Configure ambulance dispatch providers by region and adapter type.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditId(null); }}
          className="flex items-center gap-2 bg-[#1F7A72] text-[#F5EFE3] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#12383A] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add provider
        </button>
      </div>

      {/* Sandbox/Live toggle card */}
      <div className={`border rounded-2xl px-5 py-5 mb-6 ${liveDispatch ? 'bg-[rgba(0,217,126,0.06)] border-[#1F7A72]/30' : 'bg-[rgba(244,63,94,0.06)] border-[#C8102E]/30'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {liveDispatch ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1F7A72] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1F7A72]" />
                  </span>
                  <p className="text-[#1F7A72] font-black text-sm">LIVE mode enabled</p>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#F1C76B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[#F1C76B] font-black text-sm">SANDBOX mode — no real calls</p>
                </>
              )}
            </div>
            <p className="text-[#3A5255] text-xs max-w-lg">
              {liveDispatch
                ? 'Real ambulance calls are enabled. Disable sandbox mode to stop real dispatches.'
                : 'Switching to LIVE mode will send real ambulance calls. This requires a signed provider agreement. Confirm with a second admin.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[#3A5255] text-sm">{flagLoading ? '…' : liveDispatch ? 'Live' : 'Sandbox'}</span>
            <Toggle checked={liveDispatch} onChange={toggleLiveDispatch} disabled={flagLoading || flagSaving} />
          </div>
        </div>

        {/* Live confirm prompt */}
        {showLiveConfirm && (
          <div className="mt-4 pt-4 border-t border-[#C8102E]/20">
            <p className="text-[#C8102E] text-sm font-semibold mb-3">
              Are you sure? This will route real SOS activations to emergency services.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLiveConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#D6CFC4] text-[#3A5255] text-sm font-semibold hover:bg-[#EDE8DF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleLiveDispatch(true)}
                className="px-4 py-2 rounded-xl bg-[#C8102E] text-white text-sm font-bold hover:bg-red-500 transition-colors"
              >
                Yes, enable LIVE mode
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 text-[#C8102E] rounded-xl px-5 py-3 text-sm">
          {error}
        </div>
      )}

      {testResult && (
        <div className={`mb-4 border rounded-xl px-5 py-3 text-sm ${testResult.ok ? 'bg-[rgba(0,217,126,0.08)] border-[#1F7A72]/30 text-[#1F7A72]' : 'bg-[rgba(244,63,94,0.08)] border-[#C8102E]/30 text-[#C8102E]'}`}>
          Test call result: {testResult.msg}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-3 bg-[#F5EFE3] border-b border-[#D6CFC4]">
            <span className="text-[#3A5255] text-xs font-semibold uppercase tracking-widest">New provider</span>
          </div>
          <ProviderFormFields
            form={addForm}
            setForm={setAddForm}
            onSave={handleAddProvider}
            onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_PROVIDER_FORM); }}
          />
        </div>
      )}

      {/* Providers table */}
      <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl overflow-hidden overflow-x-auto">
        <div className="grid grid-cols-[1fr_1fr_120px_70px_80px_80px_140px] min-w-[700px] px-6 py-3 bg-[#F5EFE3] border-b border-[#D6CFC4]">
          {['Region', 'Name', 'Adapter', 'Priority', 'Active', 'Sandbox', ''].map((h) => (
            <span key={h} className="text-[#6B8588] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#1F7A72] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#3A5255] text-sm">Loading providers…</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-10 h-10 text-[#D6CFC4] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-[#3A5255] text-sm font-medium">No emergency providers configured.</p>
            <p className="text-[#6B8588] text-xs mt-1">Add providers to route SOS events by region.</p>
          </div>
        ) : (
          providers.map((p) => (
            <div key={p.id}>
              {editId === p.id ? (
                <div className="border-b border-[#D6CFC4]">
                  <ProviderFormFields
                    form={editForm}
                    setForm={setEditForm}
                    onSave={() => handleEditProvider(p.id)}
                    onCancel={() => setEditId(null)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_1fr_120px_70px_80px_80px_140px] min-w-[700px] px-6 py-4 border-b border-[#D6CFC4] last:border-0 items-center hover:bg-[#EDE8DF] transition-colors">
                  <p className="text-[#0C1F20] text-sm font-semibold">{p.region}</p>
                  <p className="text-[#3A5255] text-sm">{p.name}</p>
                  <span className={`inline-flex items-center text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${ADAPTER_STYLES[p.type] ?? ''}`}>
                    {ADAPTER_LABELS[p.type] ?? p.type}
                  </span>
                  <p className="text-[#0C1F20] text-sm font-mono">{p.priority}</p>
                  <div>
                    {p.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F7A72] bg-[rgba(31,122,114,0.10)] border border-[#1F7A72]/20 rounded-full px-2.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A72]" />On
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B8588]">Off</span>
                    )}
                  </div>
                  <div>
                    {p.mode === 'sandbox' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F1C76B] bg-[rgba(241,199,107,0.10)] border border-[#F1C76B]/20 rounded-full px-2.5 py-0.5">
                        Sandbox
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C8102E] bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/20 rounded-full px-2.5 py-0.5">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleTestCall(p.id)}
                      disabled={testingId === p.id}
                      className="text-[#3A5255] border border-[#D6CFC4] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#D6CFC4] transition-colors disabled:opacity-50"
                    >
                      {testingId === p.id ? 'Testing…' : 'Test call'}
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[#1F7A72] border border-[#D6CFC4] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#1F7A72]/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="text-[#C8102E] border border-[#C8102E]/20 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#C8102E]/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-[#0C1F20] font-bold text-lg mb-2">Delete provider?</h2>
            <p className="text-[#3A5255] text-sm mb-6">This will permanently remove the provider and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-[#D6CFC4] text-[#3A5255] text-sm font-semibold hover:bg-[#EDE8DF] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
