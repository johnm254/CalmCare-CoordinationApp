'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase-browser';

export default function SettingsPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [verification, setVerification] = useState<{ status: string; expires_at: string | null } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setFullName(profile?.full_name ?? '');
      const { data: ver } = await supabase
        .from('clinician_verifications')
        .select('status, expires_at')
        .eq('clinician_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerification(ver);
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id);
    setSavingProfile(false);
    setProfileMsg(error ? error.message : 'Profile updated.');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setPwdMsg('Passwords do not match.'); return; }
    if (newPwd.length < 8) { setPwdMsg('Password must be at least 8 characters.'); return; }
    setSavingPwd(true);
    setPwdMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) { setPwdMsg(error.message); } else { setPwdMsg('Password updated successfully.'); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }
  }

  const verStatus = verification?.status ?? 'unknown';
  const verColor = verStatus === 'verified' ? 'text-[#1F7A72]' : verStatus === 'pending' ? 'text-[#F1C76B]' : 'text-[#C8102E]';
  const verBg = verStatus === 'verified' ? 'bg-[rgba(31,122,114,0.10)]' : verStatus === 'pending' ? 'bg-[rgba(241,199,107,0.10)]' : 'bg-[rgba(200,16,46,0.08)]';

  const inputClass = "w-full bg-[#F5EFE3] border border-[#D6CFC4] rounded-xl px-4 py-3 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors";
  const labelClass = "block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0C1F20] mb-1">Settings</h1>
      <p className="text-[#3A5255] text-sm mb-8">Manage your clinician profile and account.</p>

      {/* Profile */}
      <section className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 mb-6">
        <h2 className="text-base font-bold text-[#0C1F20] mb-5">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="Dr. Jane Mwangi" />
          </div>
          <div>
            <label className={labelClass}>Email address</label>
            <input type="email" value={email} disabled className={inputClass + ' opacity-60 cursor-not-allowed'} />
            <p className="text-[#6B8588] text-xs mt-1.5">Email cannot be changed here. Contact support if needed.</p>
          </div>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.includes('updated') ? 'text-[#1F7A72]' : 'text-[#C8102E]'}`}>{profileMsg}</p>
          )}
          <button type="submit" disabled={savingProfile} className="bg-[#1F7A72] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#12383A] transition-colors disabled:opacity-50">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Verification status */}
      <section className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 mb-6">
        <h2 className="text-base font-bold text-[#0C1F20] mb-4">Licence verification</h2>
        {verification ? (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${verBg} ${verColor} border-current/20 capitalize`}>
              {verStatus}
            </span>
            {verification.expires_at && (
              <span className="text-xs text-[#6B8588]">
                Expires {new Date(verification.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[#6B8588] text-sm">No verification on record.</p>
        )}
        <p className="text-[#6B8588] text-xs mt-3">To renew or update your verification, contact your administrator.</p>
      </section>

      {/* Change password */}
      <section className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
        <h2 className="text-base font-bold text-[#0C1F20] mb-5">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelClass}>New password</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} className={inputClass} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required className={inputClass} placeholder="Repeat new password" />
          </div>
          {pwdMsg && (
            <p className={`text-sm ${pwdMsg.includes('successfully') ? 'text-[#1F7A72]' : 'text-[#C8102E]'}`}>{pwdMsg}</p>
          )}
          <button type="submit" disabled={savingPwd} className="bg-[#0C1F20] text-[#F5EFE3] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#1F7A72] transition-colors disabled:opacity-50">
            {savingPwd ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
