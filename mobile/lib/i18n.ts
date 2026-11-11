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
  home_hero_fallback: 'Your care, your control',
  home_banner_sub: (name: string) => name ? `${name}.` : "",
  home_weather_feels: (temp: number) => `Feels ${temp}°`,
  home_weather_humidity: (h: number) => `${h}% humidity`,
  home_weather_wind: (w: number) => `${w} km/h wind`,
  home_weather_map: 'Map →',
  home_event_seizure: 'Seizure',
  home_event_headache: 'Headache',
  home_event_dizziness: 'Dizziness',
  home_event_other: 'Other',
  home_grid_conditions: 'Conditions',
  home_grid_conditions_sub: 'Types and triggers',
  home_grid_circle: 'Care Circle',
  home_grid_circle_sub: 'You decide who sees what',
  home_grid_doctor: 'My Doctor',
  home_grid_doctor_sub: 'Verified clinician link',
  home_grid_records: 'Records',
  home_grid_records_sub: 'Events, notes, reports',

  // ── Meds screen
  meds_disclaimer: 'Your reminders follow the schedule your clinician entered. epimoyo never changes your dose.',
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
  sos_queued_sub: 'Your SOS has not been sent yet. epimoyo will send it automatically as soon as a signal is available.',
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

  // ── SOS screen — additional labels
  sos_counting_heading: 'SOS is being sent',
  sos_counting_sub_pre: 'Your care circle will be alerted with your location. Tap ',
  sos_counting_ok: '"I\'m OK"',
  sos_counting_sub_post: ' to cancel.',
  sos_countdown_label: 'seconds',
  sos_cancelled_label: 'Cancelled',
  sos_paramedics_label: 'Paramedics called',
  sos_sms_sent_label: 'SMS sent',
  sos_alert_sent_label: 'Alert sent',
  sos_queued_label: 'Queued',
  sos_escalated_heading: 'Paramedics have been called',
  sos_cancelled_heading: 'SOS cancelled',
  sos_sent_push_sub: (name?: string) =>
    name ? `SOS sent. We've told ${name}.` : 'SOS sent. Your care circle has been alerted.',
  sos_escalate_warning: (time: string) =>
    `Still need help? We'll call paramedics at ${time} unless you tap "I'm OK".`,
  sos_escalated_sub: (name?: string) =>
    name
      ? `Paramedics have been called to your location. ${name} has been told.`
      : 'Paramedics have been called to your location.',
  sos_cancelled_sub: (name?: string) =>
    name
      ? `${name} has been told you're OK. Nothing else is needed.`
      : "Your care circle has been told you're OK. Nothing else is needed.",
  sos_sent_sms_sub: (hasLoc: boolean) =>
    hasLoc
      ? 'SMS sent. Your contact has been alerted with your location.'
      : 'SMS sent. Your contact has been alerted.',

  // ── SOS Alert screen (caregiver view)
  sos_alert_tag: 'SOS ALERT',
  sos_alert_close: 'Close',
  sos_alert_ago: (mins: number) => mins < 1 ? 'just now' : mins === 1 ? '1 minute ago' : `${mins} minutes ago`,
  sos_alert_needs_help: 'needs immediate help',
  sos_alert_loc_title: 'Location shared',
  sos_alert_loc_sub: 'Tap for turn-by-turn directions',
  sos_alert_get_directions: 'Get Directions',
  sos_alert_no_location: 'No location available',
  sos_alert_nearest_hospital: 'Nearest hospital',
  sos_alert_call: 'Call',
  sos_alert_on_way: (name: string) => `${name} is on their way`,
  sos_alert_also_responded: (name: string) => `${name} also responded`,
  sos_alert_respond_btn: "I'm on my way",
  sos_alert_responded: (name: string) => `You responded — ${name} is on the way`,
  sos_alert_emergency: 'Call 999 / 112 — Ambulance',
  sos_alert_disclaimer: (name: string) =>
    `Your response is shown to ${name} and all their emergency contacts immediately.`,

  // ── Appointments screen
  appts_title: 'Appointments',
  appts_empty_title: 'No upcoming appointments',
  appts_empty_body: 'Your clinician will schedule appointments here.',
  appts_request: 'Request appointment',
  appts_notes_label: 'Notes',
  appts_notes_placeholder: 'Reason for visit...',
  appts_request_submit: 'Submit request',
  appts_status_confirmed: 'Confirmed',
  appts_status_pending: 'Pending',
  appts_status_cancelled: 'Cancelled',

  // ── Circle invite screen
  circle_invite_title: 'Add to your Circle',
  circle_invite_mode_email: 'epimoyo user',
  circle_invite_mode_sms: 'SMS only',
  circle_invite_name_label: 'Name',
  circle_invite_email_label: 'Email',
  circle_invite_phone_label: 'Phone number',
  circle_invite_relationship_label: 'Relationship',
  circle_invite_emergency_label: 'Emergency contact',
  circle_invite_emergency_sub: 'They receive your SOS alerts',
  circle_invite_submit_email: 'Add to Circle',
  circle_invite_submit_sms: 'Add & send SMS invite',
  circle_invite_success: 'Added to your Circle',
  circle_invite_not_found: 'No epimoyo account found for that email.',

  // ── Saved places screen
  saved_places_title: 'Saved Places',
  saved_places_sub: 'Named locations added to your SOS alert automatically.',
  saved_places_empty_title: 'No saved places yet',
  saved_places_empty_body: 'Add your home, work or any regular location.',
  saved_places_add: 'Add place',
  saved_places_use_current: 'Use current location',
  saved_places_name_label: 'Place name',
  saved_places_name_placeholder: 'e.g. Home',
  saved_places_save: 'Save place',
  saved_places_delete_confirm: 'Remove this place?',

  // ── Circle observation screen
  obs_title: 'Log observation',
  obs_sub: 'Record what you witnessed. This is shared with the patient and their clinician.',
  obs_type_label: 'Event type',
  obs_duration_label: 'Duration (seconds)',
  obs_duration_placeholder: 'e.g. 45',
  obs_severity_label: 'Severity',
  obs_notes_label: 'Notes',
  obs_notes_placeholder: 'Describe what you observed...',
  obs_submit: 'Submit observation',
  obs_success: 'Observation logged',

  // ── Insights screen
  insights_title: 'AI Insights',
  insights_live: 'Live data',
  insights_empty_title: 'No insights yet.',
  insights_empty_body: 'Log a few events to see patterns here.',
  insights_this_week: 'THIS WEEK',
  insights_see_logs: 'See the logs',
  insights_voice_title: 'Log by voice',
  insights_voice_offline: 'Works offline',
  insights_voice_body: 'Tap the mic and type what happened. Voice transcription is coming soon.',
  insights_brief_title: 'Visit brief is ready',
  insights_brief_sub: 'Review it, then share with your clinician',
  insights_brief_review: 'Review',
  insights_disclaimer: 'epimoyo never diagnoses or changes your medication. Summaries are drafts built from what you and your Circle logged.',
  insights_note_modal_title: 'Log a note',
  insights_note_modal_sub: 'Describe what happened. It will be saved as an event log.',
  insights_note_placeholder: 'e.g. Felt dizzy for about 2 minutes after lunch…',
  insights_note_save: 'Save note',
  insights_note_saved_title: 'Saved',
  insights_note_saved_body: 'Your note has been logged.',
  insights_brief_modal_title: 'Visit brief',
  insights_brief_modal_sub: 'A snapshot of your week to share with your clinician.',
  insights_brief_week_events: 'Events this week',
  insights_brief_med_checkins: 'Medication check-ins',
  insights_brief_pattern: 'Pattern',
  insights_brief_disclaimer: 'This is a draft. Review with your clinician before making any changes to your care plan.',
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
  home_hero_fallback: 'Matibabu yako, udhibiti wako', // review_needed
  home_banner_sub: (name: string) => name ? `${name}.` : '', // review_needed
  home_weather_feels: (temp: number) => `Inahisi ${temp}°`, // review_needed
  home_weather_humidity: (h: number) => `${h}% unyevunyevu`, // review_needed
  home_weather_wind: (w: number) => `${w} km/h upepo`, // review_needed
  home_weather_map: 'Ramani →', // review_needed
  home_event_seizure: 'Mshtuko', // review_needed
  home_event_headache: 'Maumivu ya kichwa', // review_needed
  home_event_dizziness: 'Kizunguzungu', // review_needed
  home_event_other: 'Nyingine', // review_needed
  home_grid_conditions: 'Hali za kiafya', // review_needed
  home_grid_conditions_sub: 'Aina na visababishi', // review_needed
  home_grid_circle: 'Mzunguko wa Matunzo', // review_needed
  home_grid_circle_sub: 'Wewe unaamua nani anaona nini', // review_needed
  home_grid_doctor: 'Daktari Wangu', // review_needed
  home_grid_doctor_sub: 'Kiungo cha daktari kilichothibitishwa', // review_needed
  home_grid_records: 'Rekodi', // review_needed
  home_grid_records_sub: 'Matukio, maelezo, ripoti', // review_needed

  meds_disclaimer: 'Vikumbusho vyako vinafuata ratiba iliyowekwa na daktari wako. epimoyo haibadilishi dozi yako.', // review_needed
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
  sos_queued_sub: 'SOS yako bado haijatumwa. epimoyo itatuma mara mtandao utakapopatikana.', // review_needed
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
  sos_counting_heading: 'SOS inatumwa', // review_needed
  sos_counting_sub_pre: 'Mzunguko wako utaarifiwa na mahali ulipo. Gusa ', // review_needed
  sos_counting_ok: '"Niko sawa"', // review_needed
  sos_counting_sub_post: ' kughairi.', // review_needed
  sos_countdown_label: 'sekunde', // review_needed
  sos_cancelled_label: 'Imeghairiwa', // review_needed
  sos_paramedics_label: 'Madaktari wameitwa', // review_needed
  sos_sms_sent_label: 'SMS imetumwa', // review_needed
  sos_alert_sent_label: 'Tahadhari imetumwa', // review_needed
  sos_queued_label: 'Imepangwa', // review_needed
  sos_escalated_heading: 'Madaktari wameitwa', // review_needed
  sos_cancelled_heading: 'SOS imeghairiwa', // review_needed
  sos_sent_push_sub: (name?: string) => name ? `SOS imetumwa. Tumemwambia ${name}.` : 'SOS imetumwa. Mzunguko wako umearifiwa.', // review_needed
  sos_escalate_warning: (time: string) => `Bado unahitaji msaada? Tutawapigia madaktari saa ${time} bila kupiga "Niko sawa".`, // review_needed
  sos_escalated_sub: (name?: string) => name ? `Madaktari wameitwa mahali ulipo. ${name} amearifiwa.` : 'Madaktari wameitwa mahali ulipo.', // review_needed
  sos_cancelled_sub: (name?: string) => name ? `${name} amearifiwa uko sawa. Hakuna kingine kinachohitajika.` : 'Mzunguko wako umearifiwa uko sawa. Hakuna kingine kinachohitajika.', // review_needed
  sos_sent_sms_sub: (hasLoc: boolean) => hasLoc ? 'SMS imetumwa. Mwasiliani wako amearifiwa na mahali ulipo.' : 'SMS imetumwa. Mwasiliani wako amearifiwa.', // review_needed
  sos_alert_tag: 'TAHADHARI YA SOS', // review_needed
  sos_alert_close: 'Funga', // review_needed
  sos_alert_ago: (mins: number) => mins < 1 ? 'sasa hivi' : mins === 1 ? 'dakika 1 iliyopita' : `dakika ${mins} zilizopita`, // review_needed
  sos_alert_needs_help: 'anahitaji msaada wa haraka', // review_needed
  sos_alert_loc_title: 'Mahali pameshirikiwa', // review_needed
  sos_alert_loc_sub: 'Gusa kwa maelekezo ya hatua kwa hatua', // review_needed
  sos_alert_get_directions: 'Pata Maelekezo', // review_needed
  sos_alert_no_location: 'Mahali haipatikani', // review_needed
  sos_alert_nearest_hospital: 'Hospitali iliyo karibu', // review_needed
  sos_alert_call: 'Piga simu', // review_needed
  sos_alert_on_way: (name: string) => `${name} anakuja`, // review_needed
  sos_alert_also_responded: (name: string) => `${name} pia alijibu`, // review_needed
  sos_alert_respond_btn: 'Ninakuja', // review_needed
  sos_alert_responded: (name: string) => `Ulijibu — ${name} anakuja`, // review_needed
  sos_alert_emergency: 'Piga simu 999 / 112 — Ambulensi', // review_needed
  sos_alert_disclaimer: (name: string) => `Jibu lako linaonyeshwa kwa ${name} na anayewasiliana naye mara moja.`, // review_needed

  appts_title: 'Miadi', // review_needed
  appts_empty_title: 'Hakuna miadi inayokuja', // review_needed
  appts_empty_body: 'Daktari wako atapanga miadi hapa.', // review_needed
  appts_request: 'Omba miadi', // review_needed
  appts_notes_label: 'Maelezo', // review_needed
  appts_notes_placeholder: 'Sababu ya ziara...', // review_needed
  appts_request_submit: 'Tuma ombi', // review_needed
  appts_status_confirmed: 'Imethibitishwa', // review_needed
  appts_status_pending: 'Inasubiri', // review_needed
  appts_status_cancelled: 'Imeghairiwa', // review_needed

  circle_invite_title: 'Ongeza kwenye Mzunguko wako', // review_needed
  circle_invite_mode_email: 'Mtumiaji wa epimoyo', // review_needed
  circle_invite_mode_sms: 'SMS peke yake', // review_needed
  circle_invite_name_label: 'Jina', // review_needed
  circle_invite_email_label: 'Barua pepe', // review_needed
  circle_invite_phone_label: 'Nambari ya simu', // review_needed
  circle_invite_relationship_label: 'Uhusiano', // review_needed
  circle_invite_emergency_label: 'Mwasiliani wa dharura', // review_needed
  circle_invite_emergency_sub: 'Watapokea arifa za SOS', // review_needed
  circle_invite_submit_email: 'Ongeza kwenye Mzunguko', // review_needed
  circle_invite_submit_sms: 'Ongeza na tuma mwaliko wa SMS', // review_needed
  circle_invite_success: 'Imeongezwa kwenye Mzunguko wako', // review_needed
  circle_invite_not_found: 'Hakuna akaunti ya epimoyo iliyopatikana kwa barua pepe hiyo.', // review_needed

  saved_places_title: 'Maeneo Yaliyohifadhiwa', // review_needed
  saved_places_sub: 'Maeneo yenye majina yaliyoongezwa kwa arifa yako ya SOS moja kwa moja.', // review_needed
  saved_places_empty_title: 'Hakuna maeneo yaliyohifadhiwa bado', // review_needed
  saved_places_empty_body: 'Ongeza nyumba yako, kazi au mahali popote unapokwenda mara kwa mara.', // review_needed
  saved_places_add: 'Ongeza mahali', // review_needed
  saved_places_use_current: 'Tumia mahali ulipo sasa', // review_needed
  saved_places_name_label: 'Jina la mahali', // review_needed
  saved_places_name_placeholder: 'mf. Nyumbani', // review_needed
  saved_places_save: 'Hifadhi mahali', // review_needed
  saved_places_delete_confirm: 'Ondoa mahali hapa?', // review_needed

  obs_title: 'Rekodi uchunguzi', // review_needed
  obs_sub: 'Rekodi ulichoshuhudia. Hii inashirikiwa na mgonjwa na daktari wao.', // review_needed
  obs_type_label: 'Aina ya tukio', // review_needed
  obs_duration_label: 'Muda (sekunde)', // review_needed
  obs_duration_placeholder: 'mf. 45', // review_needed
  obs_severity_label: 'Ukali', // review_needed
  obs_notes_label: 'Maelezo', // review_needed
  obs_notes_placeholder: 'Elezea ulichoshuhudia...', // review_needed
  obs_submit: 'Tuma uchunguzi', // review_needed
  obs_success: 'Uchunguzi umerekodiwa', // review_needed

  insights_title: 'Maarifa ya AI', // review_needed
  insights_live: 'Data halisi', // review_needed
  insights_empty_title: 'Hakuna maarifa bado.', // review_needed
  insights_empty_body: 'Rekodi matukio machache kuona mifumo hapa.', // review_needed
  insights_this_week: 'WIKI HII', // review_needed
  insights_see_logs: 'Angalia rekodi', // review_needed
  insights_voice_title: 'Rekodi kwa sauti', // review_needed
  insights_voice_offline: 'Inafanya kazi bila mtandao', // review_needed
  insights_voice_body: 'Gusa maikrofoni na andika kilichotokea. Uandishi wa sauti unakuja hivi karibuni.', // review_needed
  insights_brief_title: 'Muhtasari wa ziara uko tayari', // review_needed
  insights_brief_sub: 'Ukaguzi, kisha ushiriki na daktari wako', // review_needed
  insights_brief_review: 'Kagua', // review_needed
  insights_disclaimer: 'epimoyo haigundui au kubadilisha dawa yako. Muhtasari ni rasimu zilizojengwa kutoka ulichorekodia wewe na Mzunguko wako.', // review_needed
  insights_note_modal_title: 'Rekodi maelezo', // review_needed
  insights_note_modal_sub: 'Elezea kilichotokea. Itahifadhiwa kama rekodi ya tukio.', // review_needed
  insights_note_placeholder: 'mf. Nilihisi kizunguzungu kwa takriban dakika 2 baada ya chakula cha mchana…', // review_needed
  insights_note_save: 'Hifadhi maelezo', // review_needed
  insights_note_saved_title: 'Imehifadhiwa', // review_needed
  insights_note_saved_body: 'Maelezo yako yamerekodiwa.', // review_needed
  insights_brief_modal_title: 'Muhtasari wa ziara', // review_needed
  insights_brief_modal_sub: 'Picha ya wiki yako ya kushiriki na daktari wako.', // review_needed
  insights_brief_week_events: 'Matukio wiki hii', // review_needed
  insights_brief_med_checkins: 'Ukaguzi wa dawa', // review_needed
  insights_brief_pattern: 'Mfumo', // review_needed
  insights_brief_disclaimer: 'Hii ni rasimu. Kagua na daktari wako kabla ya kufanya mabadiliko yoyote kwenye mpango wako wa matunzo.', // review_needed
}

const catalogs = { en, sw }

export function t(key: keyof typeof en, locale: Locale, ...args: any[]): string {
  const val = (catalogs[locale] as any)[key] ?? (catalogs.en as any)[key]
  if (typeof val === 'function') return val(...args)
  return val ?? key
}
