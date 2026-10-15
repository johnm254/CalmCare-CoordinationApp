'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DueBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="text-xs font-semibold text-[#FF7A6B]">Overdue</span>;
  if (days === 0) return <span className="text-xs font-semibold text-[#F4B860]">Due today</span>;
  if (days <= 3) return <span className="text-xs font-semibold text-[#F4B860]">Due in {days}d</span>;
  return <span className="text-xs font-semibold text-[#A8BDCA]">Due in {days}d</span>;
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('followups')
        .select('*, profiles!followups_patient_id_fkey(id, full_name)')
        .eq('clinician_id', user.id)
        .eq('status', 'open')
        .order('due_at', { ascending: true });

      setItems(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function markComplete(id: string) {
    const supabase = createClient();
    await supabase.from('followups').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    setItems((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#EAF2F6]">Follow-ups</h1>
          <p className="text-[#A8BDCA] text-sm mt-1">{items.length} outstanding</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#A8BDCA]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-[#112230] border border-[#1E3A52] rounded-2xl">
          <p className="text-[#4FC3B7] text-2xl mb-3">✓</p>
          <p className="text-[#EAF2F6] font-semibold">All caught up</p>
          <p className="text-[#A8BDCA] text-sm mt-1">No open follow-ups right now.</p>
        </div>
      ) : (
        <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_120px_130px] px-6 py-3 border-b border-[#1E3A52] text-[#4F6D84] text-xs font-semibold uppercase tracking-wide">
            <span>Task</span>
            <span>Patient</span>
            <span>Due date</span>
            <span>Actions</span>
          </div>
          {items.map((fu) => (
            <div key={fu.id} className="grid grid-cols-[1fr_160px_120px_130px] px-6 py-4 border-b border-[#1E3A52] last:border-0 items-center">
              <p className="text-[#EAF2F6] text-sm font-medium pr-4">{fu.title}</p>
              <Link href={`/dashboard/patients/${fu.patient_id}`} className="text-[#A8BDCA] text-sm hover:text-[#4FC3B7] transition-colors">
                {fu.profiles?.full_name ?? '—'}
              </Link>
              <div>
                <p className="text-[#EAF2F6] text-sm">
                  {new Date(fu.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <DueBadge dateStr={fu.due_at} />
              </div>
              <button
                onClick={() => markComplete(fu.id)}
                className="text-[#4FC3B7] border border-[#4FC3B7]/30 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#1A3A3A] transition-colors min-h-[36px]"
              >
                Complete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
