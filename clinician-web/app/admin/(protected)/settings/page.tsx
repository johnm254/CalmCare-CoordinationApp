'use client';

import { useState } from 'react';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[#E8F0F6] font-bold text-base">{title}</h2>
        {description && <p className="text-[#7B93A8] text-sm mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[#E8F0F6] text-sm font-medium">{label}</p>
        {sub && <p className="text-[#7B93A8] text-xs mt-0.5">{sub}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#4FC3B7]' : 'bg-[#1A2F4A]'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[#7B93A8] text-xs font-semibold uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0B1629] border border-[#1A2F4A] rounded-xl px-4 py-2.5 text-[#E8F0F6] placeholder:text-[#4A6578] focus:border-[#4FC3B7]/60 focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/20 text-sm"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[#7B93A8] text-xs font-semibold uppercase tracking-wide mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0B1629] border border-[#1A2F4A] rounded-xl px-4 py-2.5 text-[#E8F0F6] focus:border-[#4FC3B7]/60 focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/20 text-sm appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const [siteUrl, setSiteUrl] = useState('https://epi.duara.health');
  const [supportEmail, setSupportEmail] = useState('support@duara.health');
  const [platformName, setPlatformName] = useState('Duara Epi');

  const [inviteExpiry, setInviteExpiry] = useState('48');
  const [requireEmailConfirm, setRequireEmailConfirm] = useState(true);
  const [allowSelfSignup, setAllowSelfSignup] = useState(false);

  const [inactivityTimeout, setInactivityTimeout] = useState('15');
  const [auditRetention, setAuditRetention] = useState('365');
  const [twoFactor, setTwoFactor] = useState(false);

  const [eventAlerts, setEventAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [inviteNotify, setInviteNotify] = useState(true);
  const [sosNotify, setSosNotify] = useState(true);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8F0F6]">Platform settings</h1>
          <p className="text-[#7B93A8] text-sm mt-1">Configure global behaviour for the Epi platform.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#4FC3B7] text-[#0B1620] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#3DADA2] transition-colors"
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>

      <div className="space-y-5">
        <Section title="General" description="Basic platform identity and contact details.">
          <Field label="Platform name" value={platformName} onChange={setPlatformName} placeholder="Duara Epi" />
          <Field label="Site URL" value={siteUrl} onChange={setSiteUrl} type="url" placeholder="https://epi.duara.health" />
          <Field label="Support email" value={supportEmail} onChange={setSupportEmail} type="email" placeholder="support@duara.health" />
        </Section>

        <Section title="Clinician onboarding" description="How new clinicians are added to the platform.">
          <Select
            label="Invite link expiry"
            value={inviteExpiry}
            onChange={setInviteExpiry}
            options={[
              { value: '24', label: '24 hours' },
              { value: '48', label: '48 hours' },
              { value: '72', label: '72 hours' },
              { value: '168', label: '7 days' },
            ]}
          />
          <Toggle
            label="Require email confirmation"
            sub="Clinicians must click the link in their invitation email before they can log in."
            checked={requireEmailConfirm}
            onChange={setRequireEmailConfirm}
          />
          <Toggle
            label="Allow self-signup"
            sub="Anyone with a valid email can create a clinician account. Turn off to restrict to invites only."
            checked={allowSelfSignup}
            onChange={setAllowSelfSignup}
          />
        </Section>

        <Section title="Security" description="Session and access-control settings.">
          <Select
            label="Inactivity logout (minutes)"
            value={inactivityTimeout}
            onChange={setInactivityTimeout}
            options={[
              { value: '5', label: '5 minutes' },
              { value: '10', label: '10 minutes' },
              { value: '15', label: '15 minutes (recommended)' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
            ]}
          />
          <Select
            label="Audit log retention (days)"
            value={auditRetention}
            onChange={setAuditRetention}
            options={[
              { value: '90', label: '90 days' },
              { value: '180', label: '180 days' },
              { value: '365', label: '1 year (recommended)' },
              { value: '730', label: '2 years' },
              { value: '0', label: 'Forever' },
            ]}
          />
          <Toggle
            label="Require two-factor authentication"
            sub="Clinicians must set up 2FA before accessing patient data."
            checked={twoFactor}
            onChange={setTwoFactor}
          />
        </Section>

        <Section title="Notifications" description="What email notifications the platform sends automatically.">
          <Toggle
            label="SOS alerts"
            sub="Notify clinicians when one of their patients sends an SOS."
            checked={sosNotify}
            onChange={setSosNotify}
          />
          <Toggle
            label="New event alerts"
            sub="Notify clinicians when a patient logs a high-severity event."
            checked={eventAlerts}
            onChange={setEventAlerts}
          />
          <Toggle
            label="Weekly digest"
            sub="Send clinicians a Sunday summary of their patients' week."
            checked={weeklyDigest}
            onChange={setWeeklyDigest}
          />
          <Toggle
            label="Invite accepted notification"
            sub="Notify admin when a clinician accepts their invitation."
            checked={inviteNotify}
            onChange={setInviteNotify}
          />
        </Section>

        <div className="bg-[#3A1A18]/40 border border-[#FF7A6B]/20 rounded-2xl p-5">
          <h2 className="text-[#FF7A6B] font-bold text-sm mb-1">Danger zone</h2>
          <p className="text-[#7B93A8] text-xs mb-4">These actions are irreversible. Proceed with caution.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-xl border border-[#FF7A6B]/40 text-[#FF7A6B] text-sm font-semibold hover:bg-[#FF7A6B]/10 transition-colors">
              Purge audit log
            </button>
            <button className="px-4 py-2 rounded-xl border border-[#FF7A6B]/40 text-[#FF7A6B] text-sm font-semibold hover:bg-[#FF7A6B]/10 transition-colors">
              Revoke all sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
