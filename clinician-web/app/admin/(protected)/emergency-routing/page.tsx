'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

type Provider = {
  id: string;
  region: string;
  name: string;
  priority: number;
  adapter_type: 'phone_call' | 'api' | 'call_centre';
  phone: string | null;
  api_endpoint: string | null;
  active: boolean;
  sandbox_mode: boolean;
};

type ProviderForm = {
  region: string;
  name: string;
  adapter_type: 'phone_call' | 'api' | 'call_centre';
  phone: string;
  api_endpoint: string;
  priority: string;
  active: boolean;
};

const EMPTY_PROVIDER_FORM: ProviderForm = {
  region: '',
  name: '',
  adapter_type: 'phone_call',
  phone: '',
  api_endpoint: '',
  priority: '1',
  active: true,
};

const ADAPTER_LABELS: Record<string, string> = {
  phone_call: 'Phone call',
  api: 'API',
  call_centre: 'Call centre',
};

const ADAPTER_STYLES: Record<string, string> = {
  phone_call: 'text-[#22C87A] bg-[rgba(0,217,126,0.10)] border-[#22C87A]/20',
  api: 'text-[#14B8A6] bg-[rgba(20,184,166,0.10)] border-[#14B8A6]/20',
  call_centre: 'text-[#F4B860] bg-[rgba(244,184,96,0.10)] border-[#F4B860]/20',
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-[#22C87A]' : 'bg-[#E6ECF2]'}`}
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
    const { data } = await supabase
      .from('emergency_providers')
      .select('id, region, name, priority, adapter_type, phone, api_endpoint, active, sandbox_mode')
      .order('priority');
    setProviders(data ?? []);
    setLoading(false);
  }, []);

  const fetchFlag = useCallback(async () => {
    setFlagLoading(true);
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'live_dispatch')
      .single();
    setLiveDispatch(data?.enabled ?? false);
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
    if (existing) {
      await supabase.from('feature_flags').update({ enabled: newValue }).eq('key', 'live_dispatch');
    } else {
      await supabase.from('feature_flags').insert({ key: 'live_dispatch', enabled: newValue });
    }
    setLiveDispatch(newValue);
    setFlagSaving(false);
  }

  async function handleAddProvider() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('emergency_providers').insert({
      region: addForm.region,
      name: addForm.name,
      adapter_type: addForm.adapter_type,
      phone: addForm.phone || null,
      api_endpoint: addForm.api_endpoint || null,
      priority: parseInt(addForm.priority, 10) || 1,
      active: addForm.active,
      sandbox_mode: !liveDispatch,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowAddForm(false);
    setAddForm(EMPTY_PROVIDER_FORM);
    fetchProviders();
  }

  async function handleEditProvider(id: string) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('emergency_providers')
      .update({
        region: editForm.region,
        name: editForm.name,
        adapter_type: editForm.adapter_type,
        phone: editForm.phone || null,
        api_endpoint: editForm.api_endpoint || null,
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
    await supabase.from('emergency_providers').delete().eq('id', id);
    setDeleting(false);
    setDeleteId(null);
    fetchProviders();
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
      adapter_type: p.adapter_type,
      phone: p.phone ?? '',
      api_endpoint: p.api_endpoint ?? '',
      priority: String(p.priority),
      active: p.active,
    });
    setEditId(p.id);
    setShowAddForm(false);
  }

  const inputCls =
    'w-full bg-[#F6F9FC] border border-[#E6ECF2] rounded-xl px-4 py-2.5 text-[#0F1B2D] placeholder:text-[#8C9AAB] focus:border-[#14B8A6] focus:outline-none text-sm';
  const labelCls = 'block text-[#5B6B7F] text-xs font-semibold uppercase tracking-widest mb-1.5';

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
      <div className="px-6 py-5 bg-[#F1F5FA] border-b border-[#E6ECF2]">
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
            <select className={inputCls} value={form.adapter_type} onChange={(e) => set('adapter_type', e.target.value as ProviderForm['adapter_type'])}>
              <option value="phone_call">Phone call</option>
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
            <input className={inputCls} placeholder="https://api.provider.co/dispatch" value={form.api_endpoint} onChange={(e) => set('api_endpoint', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Priority (lower = first)</label>
            <input className={inputCls} type="number" min={1} placeholder="1" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Toggle checked={form.active} onChange={(v) => set('active', v)} />
          <span className="text-[#5B6B7F] text-sm">Active</span>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl border border-[#E6ECF2] text-[#5B6B7F] text-sm font-semibold hover:bg-[#E6ECF2] transition-colors">
            Cancel
          </button>
          <button type="button" disabled={saving || !form.region || !form.name} onClick={onSave} className="px-5 py-2 rounded-xl bg-[#14B8A6] text-[#F6F9FC] text-sm font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50">
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
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Emergency Routing</h1>
          <p className="text-[#5B6B7F] text-sm mt-0.5">
            Configure ambulance dispatch providers by region and adapter type.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditId(null); }}
          className="flex items-center gap-2 bg-[#14B8A6] text-[#F6F9FC] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#00A896] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add provider
        </button>
      </div>

      {/* Sandbox/Live toggle card */}
      <div className={`border rounded-2xl px-5 py-5 mb-6 ${liveDispatch ? 'bg-[rgba(0,217,126,0.06)] border-[#22C87A]/30' : 'bg-[rgba(244,63,94,0.06)] border-[#F43F5E]/30'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {liveDispatch ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C87A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C87A]" />
                  </span>
                  <p className="text-[#22C87A] font-black text-sm">LIVE mode enabled</p>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#F4B860]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[#F4B860] font-black text-sm">SANDBOX mode — no real calls</p>
                </>
              )}
            </div>
            <p className="text-[#5B6B7F] text-xs max-w-lg">
              {liveDispatch
                ? 'Real ambulance calls are enabled. Disable sandbox mode to stop real dispatches.'
                : 'Switching to LIVE mode will send real ambulance calls. This requires a signed provider agreement. Confirm with a second admin.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[#5B6B7F] text-sm">{flagLoading ? '…' : liveDispatch ? 'Live' : 'Sandbox'}</span>
            <Toggle checked={liveDispatch} onChange={toggleLiveDispatch} disabled={flagLoading || flagSaving} />
          </div>
        </div>

        {/* Live confirm prompt */}
        {showLiveConfirm && (
          <div className="mt-4 pt-4 border-t border-[#F43F5E]/20">
            <p className="text-[#F43F5E] text-sm font-semibold mb-3">
              Are you sure? This will route real SOS activations to emergency services.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLiveConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#E6ECF2] text-[#5B6B7F] text-sm font-semibold hover:bg-[#F1F5FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleLiveDispatch(true)}
                className="px-4 py-2 rounded-xl bg-[#F43F5E] text-white text-sm font-bold hover:bg-red-500 transition-colors"
              >
                Yes, enable LIVE mode
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-[rgba(244,63,94,0.10)] border border-[#F43F5E]/30 text-[#F43F5E] rounded-xl px-5 py-3 text-sm">
          {error}
        </div>
      )}

      {testResult && (
        <div className={`mb-4 border rounded-xl px-5 py-3 text-sm ${testResult.ok ? 'bg-[rgba(0,217,126,0.08)] border-[#22C87A]/30 text-[#22C87A]' : 'bg-[rgba(244,63,94,0.08)] border-[#F43F5E]/30 text-[#F43F5E]'}`}>
          Test call result: {testResult.msg}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-3 bg-[#F6F9FC] border-b border-[#E6ECF2]">
            <span className="text-[#5B6B7F] text-xs font-semibold uppercase tracking-widest">New provider</span>
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
      <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl overflow-hidden overflow-x-auto">
        <div className="grid grid-cols-[1fr_1fr_120px_70px_80px_80px_140px] min-w-[700px] px-6 py-3 bg-[#F6F9FC] border-b border-[#E6ECF2]">
          {['Region', 'Name', 'Adapter', 'Priority', 'Active', 'Sandbox', ''].map((h) => (
            <span key={h} className="text-[#8C9AAB] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#5B6B7F] text-sm">Loading providers…</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-10 h-10 text-[#E6ECF2] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-[#5B6B7F] text-sm font-medium">No emergency providers configured.</p>
            <p className="text-[#8C9AAB] text-xs mt-1">Add providers to route SOS events by region.</p>
          </div>
        ) : (
          providers.map((p) => (
            <div key={p.id}>
              {editId === p.id ? (
                <div className="border-b border-[#E6ECF2]">
                  <ProviderFormFields
                    form={editForm}
                    setForm={setEditForm}
                    onSave={() => handleEditProvider(p.id)}
                    onCancel={() => setEditId(null)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_1fr_120px_70px_80px_80px_140px] min-w-[700px] px-6 py-4 border-b border-[#E6ECF2] last:border-0 items-center hover:bg-[#F1F5FA] transition-colors">
                  <p className="text-[#0F1B2D] text-sm font-semibold">{p.region}</p>
                  <p className="text-[#5B6B7F] text-sm">{p.name}</p>
                  <span className={`inline-flex items-center text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${ADAPTER_STYLES[p.adapter_type] ?? ''}`}>
                    {ADAPTER_LABELS[p.adapter_type] ?? p.adapter_type}
                  </span>
                  <p className="text-[#0F1B2D] text-sm font-mono">{p.priority}</p>
                  <div>
                    {p.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C87A] bg-[rgba(0,217,126,0.10)] border border-[#22C87A]/20 rounded-full px-2.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C87A]" />On
                      </span>
                    ) : (
                      <span className="text-xs text-[#8C9AAB]">Off</span>
                    )}
                  </div>
                  <div>
                    {p.sandbox_mode ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F4B860] bg-[rgba(244,184,96,0.10)] border border-[#F4B860]/20 rounded-full px-2.5 py-0.5">
                        Sandbox
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F43F5E] bg-[rgba(244,63,94,0.10)] border border-[#F43F5E]/20 rounded-full px-2.5 py-0.5">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleTestCall(p.id)}
                      disabled={testingId === p.id}
                      className="text-[#5B6B7F] border border-[#E6ECF2] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#E6ECF2] transition-colors disabled:opacity-50"
                    >
                      {testingId === p.id ? 'Testing…' : 'Test call'}
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[#14B8A6] border border-[#E6ECF2] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#14B8A6]/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="text-[#F43F5E] border border-[#F43F5E]/20 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#F43F5E]/10 transition-colors"
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
          <div className="relative w-full max-w-sm bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-[#0F1B2D] font-bold text-lg mb-2">Delete provider?</h2>
            <p className="text-[#5B6B7F] text-sm mb-6">This will permanently remove the provider and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-[#E6ECF2] text-[#5B6B7F] text-sm font-semibold hover:bg-[#F1F5FA] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-[#F43F5E] text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
