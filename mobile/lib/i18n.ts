export type Locale = 'en' | 'sw'

const en = {
  // ── Common
  done: 'Done',
  cancel: 'Cancel',
  save: 'Save',
  back: 'Back',
  loading: 'Loading...',
  error_generic: 'Something went wrong. Please try again.',

  // ── Home screen
  home_greeting_morning: 'Good morning',
  home_greeting_afternoon: 'Good afternoon',
  home_greeting_evening: 'Good evening',
  home_streak_label: 'SEIZURE-FREE STREAK',
  home_streak_days: 'days',
  home_protected: 'PROTECTED',
  home_circle_active: 'Your Circle is active',
  home_circle_sub_plural: (n: number) => `${n} trusted contacts ready to be alerted.`,
  home_circle_sub_default: 'Trusted contacts are ready to be alerted the moment you need them.',
  home_sos_title: 'Hold to send SOS',
  home_sos_sub: 'Alerts your Circle with live location',
  home_next_med: 'Next medication',
  home_taken: 'Taken',
  home_taken_done: '✓ Done',
  home_ambulance_label: 'Call ambulance',
  home_ambulance_num: '999 / 112 — free, always on',
  home_nearest_hospital: 'Nearest hospital',
  home_log_event: 'Log event',
  home_last_synced_just_now: 'Last synced: just now',
  home_last_synced_mins: (n: number) => `Last synced: ${n} min ago`,
  home_active_alert: 'Active alert — tap to view',

  // ── Meds screen
  meds_disclaimer: 'Your reminders follow the schedule your clinician entered. Mojo never changes your dose.',
  meds_adherence_title: '30-DAY ADHERENCE',
  meds_due_today: 'DUE TODAY',
  meds_taken_today: 'TAKEN TODAY',
  meds_missed: 'MISSED',
  meds_taken_btn: 'Taken',
  meds_taken_badge: 'Taken',
  meds_missed_badge: 'Missed',
  meds_empty_title: 'No doses scheduled today',
  meds_empty_body: 'Your clinician will add medication schedules here.',
  meds_adherence_label: (pct: number) => `30-day adherence: ${pct}%`,

  // ── Mood screen
  mood_heading: 'How are you feeling today?',
  mood_score_1: 'Very low',
  mood_score_2: 'Low',
  mood_score_3: 'Okay',
  mood_score_4: 'Good',
  mood_score_5: 'Great',
  mood_note_placeholder: 'Add a note (optional)',
  mood_log_btn: 'Log mood',
  mood_logged_title: 'Mood logged',
  mood_log_again: 'Log again',
  mood_privacy: 'Mood data is private by default — only you and your doctor can see it. Caregivers cannot access mood logs.',
  mood_history_label: 'Last 7 days',
  mood_history_empty: 'No mood logs yet. Start tracking today.',
  mood_crisis_title: 'Feeling very low?',
  mood_crisis_org: 'Befrienders Kenya',
  mood_crisis_line: '0800 723 253 (free, 24/7)',
  mood_crisis_call: 'Call now',
  mood_crisis_sos: 'Medical emergency — Start SOS',

  // ── SOS screen
  sos_heading: 'SOS Alert',
  sos_sending: 'Sending SOS...',
  sos_countdown: (s: number) => `Sending in ${s}s`,
  sos_sent: 'SOS Sent',
  sos_escalated: 'Help is on the way',
  sos_queued_title: 'No signal',
  sos_queued_sub: 'Your SOS has not been sent yet. Mojo will send it automatically as soon as a signal is available.',
  sos_sms_error: 'SMS failed — alert queued for retry.',
  sos_push_alert: 'Push alert',
  sos_push_sub: 'Online path',
  sos_sms_fallback: 'SMS fallback',
  sos_sms_sub: 'No internet path',
  sos_contacts: 'Emergency contacts',
  sos_contacts_sub: 'First to respond is shown to all',
  sos_location_shared: 'Location shared',
  sos_status_sent: 'Sent',
  sos_status_ready: 'Ready',
  sos_send_now: 'Send now',
  sos_false_alarm: "I'm OK — false alarm",
  sos_cancel: "I'm OK — cancel",
  sos_done: 'Done',
  sos_paramedics: (time: string) => `Paramedics alerted — ETA shown at ${time}`,
} as const

// All Swahili values marked // review_needed — requires clinical Swahili translator sign-off
const sw: Record<keyof typeof en, string | ((...args: any[]) => string)> = {
  done: 'Imekamilika', // review_needed
  cancel: 'Ghairi', // review_needed
  save: 'Hifadhi', // review_needed
  back: 'Rudi', // review_needed
  loading: 'Inapakia...', // review_needed
  error_generic: 'Kuna hitilafu. Tafadhali jaribu tena.', // review_needed

  home_greeting_morning: 'Habari za asubuhi', // review_needed
  home_greeting_afternoon: 'Habari za mchana', // review_needed
  home_greeting_evening: 'Habari za jioni', // review_needed
  home_streak_label: 'SIKU BILA MSHTUKO', // review_needed
  home_streak_days: 'siku', // review_needed
  home_protected: 'UMELINDWA', // review_needed
  home_circle_active: 'Mzunguko wako uko hai', // review_needed
  home_circle_sub_plural: (n: number) => `Anayewasiliana nawe ${n} wako tayari kukuarifu.`, // review_needed
  home_circle_sub_default: 'Watu wanaokusaidia wako tayari kukuarifu unapohitaji.', // review_needed
  home_sos_title: 'Shikilia kutuma SOS', // review_needed
  home_sos_sub: 'Inaarifu Mzunguko wako na mahali ulipo', // review_needed
  home_next_med: 'Dawa inayofuata', // review_needed
  home_taken: 'Imechukuliwa', // review_needed
  home_taken_done: '✓ Imekwisha', // review_needed
  home_ambulance_label: 'Piga simu ambulensi', // review_needed
  home_ambulance_num: '999 / 112 — bure, daima inapatikana', // review_needed
  home_nearest_hospital: 'Hospitali iliyo karibu', // review_needed
  home_log_event: 'Rekodi tukio', // review_needed
  home_last_synced_just_now: 'Ilisawazishwa: sasa hivi', // review_needed
  home_last_synced_mins: (n: number) => `Ilisawazishwa: dakika ${n} zilizopita`, // review_needed
  home_active_alert: 'Tahadhari inayoendelea — gusa kuona', // review_needed

  meds_disclaimer: 'Vikumbusho vyako vinafuata ratiba iliyowekwa na daktari wako. Mojo haibadilishi dozi yako.', // review_needed
  meds_adherence_title: 'UFUATAJI WA SIKU 30', // review_needed
  meds_due_today: 'INASTAHILI LEO', // review_needed
  meds_taken_today: 'IMECHUKULIWA LEO', // review_needed
  meds_missed: 'IMEKOSEKANA', // review_needed
  meds_taken_btn: 'Imechukuliwa', // review_needed
  meds_taken_badge: 'Imechukuliwa', // review_needed
  meds_missed_badge: 'Imekosekana', // review_needed
  meds_empty_title: 'Hakuna dozi zilizopangwa leo', // review_needed
  meds_empty_body: 'Daktari wako ataongeza ratiba ya dawa hapa.', // review_needed
  meds_adherence_label: (pct: number) => `Ufuataji wa siku 30: ${pct}%`, // review_needed

  mood_heading: 'Unajisikiaje leo?', // review_needed
  mood_score_1: 'Chini sana', // review_needed
  mood_score_2: 'Chini', // review_needed
  mood_score_3: 'Sawa', // review_needed
  mood_score_4: 'Nzuri', // review_needed
  mood_score_5: 'Bora', // review_needed
  mood_note_placeholder: 'Ongeza maelezo (si lazima)', // review_needed
  mood_log_btn: 'Rekodi hisia', // review_needed
  mood_logged_title: 'Hisia zimerekodiwa', // review_needed
  mood_log_again: 'Rekodi tena', // review_needed
  mood_privacy: 'Data ya hisia ni ya siri — wewe na daktari wako peke yenu wanaweza kuona. Walezi hawawezi kufikia rekodi za hisia.', // review_needed
  mood_history_label: 'Siku 7 zilizopita', // review_needed
  mood_history_empty: 'Hakuna rekodi za hisia bado. Anza kufuatilia leo.', // review_needed
  mood_crisis_title: 'Unajisikia vibaya sana?', // review_needed
  mood_crisis_org: 'Befrienders Kenya', // review_needed (proper noun — keep as-is)
  mood_crisis_line: '0800 723 253 (bure, saa 24/7)', // review_needed
  mood_crisis_call: 'Piga simu sasa', // review_needed
  mood_crisis_sos: 'Dharura ya kimatibabu — Anzisha SOS', // review_needed

  sos_heading: 'Tahadhari ya SOS', // review_needed
  sos_sending: 'Inatuma SOS...', // review_needed
  sos_countdown: (s: number) => `Inatuma baada ya sekunde ${s}`, // review_needed
  sos_sent: 'SOS Imetumwa', // review_needed
  sos_escalated: 'Msaada unakuja', // review_needed
  sos_queued_title: 'Hakuna mtandao', // review_needed
  sos_queued_sub: 'SOS yako bado haijatumwa. Mojo itatuma mara mtandao utakapopatikana.', // review_needed
  sos_sms_error: 'SMS imeshindwa — tahadhari imepangwa kwa jaribio jingine.', // review_needed
  sos_push_alert: 'Arifa ya msukumo', // review_needed
  sos_push_sub: 'Njia ya mtandaoni', // review_needed
  sos_sms_fallback: 'SMS mbadala', // review_needed
  sos_sms_sub: 'Njia bila intaneti', // review_needed
  sos_contacts: 'Anwani za dharura', // review_needed
  sos_contacts_sub: 'Anayejibu kwanza anaonyeshwa kwa wote', // review_needed
  sos_location_shared: 'Mahali pameshirikiwa', // review_needed
  sos_status_sent: 'Imetumwa', // review_needed
  sos_status_ready: 'Iko tayari', // review_needed
  sos_send_now: 'Tuma sasa', // review_needed
  sos_false_alarm: 'Niko sawa — tahadhari ya uongo', // review_needed
  sos_cancel: 'Niko sawa — ghairi', // review_needed
  sos_done: 'Imekamilika', // review_needed
  sos_paramedics: (time: string) => `Madaktari wamearifiwa — ETA inaonyeshwa saa ${time}`, // review_needed
}

const catalogs = { en, sw }

export function t(key: keyof typeof en, locale: Locale, ...args: any[]): string {
  const val = (catalogs[locale] as any)[key] ?? (catalogs.en as any)[key]
  if (typeof val === 'function') return val(...args)
  return val ?? key
}
