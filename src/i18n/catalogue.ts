/**
 * Mojo copy catalogue — section 8.2 of MOJO_REQUIREMENTS.md
 *
 * Every user-facing string lives here with:
 *   id       — playbook copy ID (e.g. SOS-01, CON-02) or generated AREA-NN
 *   en       — English text
 *   sw       — Swahili text (marked needs_review until approved by a human reviewer)
 *   surface  — where it appears: strap_a | strap_b | push | sms | app | web | voice
 *   review   — approval gate: none | clinician | legal | both
 *   status   — draft | approved
 *   version  — copy version string
 *   source   — playbook section reference
 *
 * CI checks (from section 8.2):
 *   - strap_a strings: ≤ 3 lines × 20 characters per line
 *   - push/sms: no condition or medicine names
 *   - no "!", no ALL-CAPS words, no avoid-list words
 *   - sentences ≤ 15 words for app copy
 *   - buttons start with a verb
 *   - every entry has both en and sw
 *
 * Release build policy: entries where review !== 'none' and status === 'draft'
 * must show a DRAFT watermark in dev mode and FAIL the release build.
 */

export interface CopyEntry {
  id: string;
  en: string;
  sw: string;
  surface: "strap_a" | "strap_b" | "push" | "sms" | "app" | "web" | "voice";
  review: "none" | "clinician" | "legal" | "both";
  status: "draft" | "approved";
  version: string;
  source: string;
}

export const catalogue: CopyEntry[] = [

  // ── Project 5: SOS flow copy ──────────────────────────────────────────────

  {
    id: "SOS-00-STRAP-A",
    en: "Fall detected\nAre you OK?\n[I'm OK]",
    sw: "Ulianguka\nUko sawa?\n[Niko sawa]",
    surface: "strap_a",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 0",
  },
  {
    id: "SOS-00-APP",
    en: "We think you may have fallen. Tap \"I'm OK\" if you're fine. If we don't hear from you in 30 seconds, we'll alert your SOS contact.",
    sw: "Tunafikiri unaweza kuwa umeanguka. Bonyeza \"Niko sawa\" ikiwa uko sawa. Tukisikia neno lako ndani ya sekunde 30, tutaarifiha SOS wako.",
    surface: "app",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 0",
  },
  {
    id: "SOS-01-STRAP-A",
    en: "SOS sent\nContact alerted\nHold to cancel",
    sw: "SOS imetumwa\nWasiliana amearifishwa\nShika kufuta",
    surface: "strap_a",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 1",
  },
  {
    id: "SOS-01-APP",
    en: "SOS sent. We've told your SOS contact. If you're OK, tap \"I'm OK\" to cancel.",
    sw: "SOS imetumwa. Tumemwambia SOS wako. Ikiwa uko sawa, bonyeza \"Niko sawa\" kufuta.",
    surface: "app",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 1",
  },
  {
    id: "SOS-01-PUSH",
    en: "[Name] pressed SOS. Please check they are safe. Tap to respond.",
    sw: "[Jina] alibonyeza SOS. Tafadhali angalia ikiwa wako salama. Gusa kujibu.",
    surface: "push",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 1",
  },
  {
    id: "SOS-01-SMS",
    en: "Mojo SOS: [Name] needs help (sent [time]). Can you reach them? Reply 1 = yes, 2 = no.",
    sw: "Mojo SOS: [Jina] anahitaji msaada (imetumwa [wakati]). Je, unaweza kumfikia? Jibu 1 = ndiyo, 2 = hapana.",
    surface: "sms",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 1",
  },
  {
    id: "SOS-02-PUSH",
    en: "No reply yet. Please confirm [Name] is safe. Paramedics will be called at [time] if no one responds.",
    sw: "Bado hakuna jibu. Tafadhali thibitisha kwamba [Jina] yuko salama. Madaktari wataitwa saa [wakati] ikiwa hakuna jibu.",
    surface: "push",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 2",
  },
  {
    id: "SOS-03-VOICE",
    en: "This is an automated emergency alert from Mojo. A person may need urgent help. Location: [location]. Name: [name]. Alert raised at [time]. Call-back number: [phone]. I will repeat this message.",
    sw: "Hii ni arifa ya dharura ya kiotomatiki kutoka Mojo. Mtu anaweza kuhitaji msaada wa haraka. Eneo: [eneo]. Jina: [jina]. Arifa ilitolewa saa [wakati]. Nambari ya kupigiwa simu: [simu]. Nitarudia ujumbe huu.",
    surface: "voice",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 3",
  },
  {
    id: "SOS-04-PUSH",
    en: "Paramedics called for [Name]. No one responded. Emergency services have been contacted.",
    sw: "Madaktari wameitwa kwa [Jina]. Hakuna aliyejibu. Huduma za dharura zimewasiliana.",
    surface: "push",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, Step 4",
  },
  {
    id: "SOS-FA-APP",
    en: "SOS cancelled. Your SOS contact has been told you're OK. Nothing else is needed.",
    sw: "SOS imefutwa. SOS wako amearifishwa kwamba uko sawa. Hakuna kingine kinachohitajika.",
    surface: "app",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 5, False alarm",
  },

  // ── Project 6: Concept A strap screen text ────────────────────────────────
  // Budget: 3 lines × 20 characters per line
  // Sent to strap as string IDs; placeholders filled on the phone.

  {
    id: "STRAP-A-DOSE-DUE",
    en: "[time]\nTime for your dose\n[Confirm]",
    sw: "[wakati]\nWakati wa dawa yako\n[Thibitisha]",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-DOSE-CONFIRMED",
    en: "Dose logged\nThank you",
    sw: "Dawa imerekodi\nAsante",
    surface: "strap_a",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-DOSE-NOT-CONFIRMED",
    en: "Dose not confirmed\nPress to confirm",
    sw: "Dawa haijathib.\nBonyeza kuthibitisha",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-ECG-START",
    en: "Touch the top strip\nwith your other hand\nRest your arm",
    sw: "Gusa ukanda wa juu\nkwa mkono wako mwingine\nPumzisha mkono",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-ECG-RECORDING",
    en: "Keep still\n12 sec left",
    sw: "Kaa bado\nSekunde 12 zimebaki",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-ECG-DONE",
    en: "ECG saved\nYou can let go",
    sw: "ECG imehifadhiwa\nUnaweza kuacha",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-ECG-RETAKE",
    en: "Signal weak\nRest your arm\nTry again",
    sw: "Ishara dhaifu\nPumzisha mkono\nJaribu tena",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-ECG-CONTACT-LOST",
    en: "Contact lost\nKeep finger on strip",
    sw: "Mawasiliano yamepotea\nWeka kidole ukandani",
    surface: "strap_a",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-FALL-CHECK",
    en: "Fall detected\nAre you OK?\n[I'm OK]",
    sw: "Anguko limegunduliwa\nUko sawa?\n[Niko sawa]",
    surface: "strap_a",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-SOS-SENT",
    en: "SOS sent\nContact alerted\nHold to cancel",
    sw: "SOS imetumwa\nMawasiliano amearifishwa\nShika kufuta",
    surface: "strap_a",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-HELP-CALLED",
    en: "Help called\nParamedics alerted",
    sw: "Msaada umeitwa\nMadaktari wamearifishwa",
    surface: "strap_a",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-BATTERY-LOW",
    en: "Battery low\nCharge today",
    sw: "Betri inaisha\nChaji leo",
    surface: "strap_a",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },
  {
    id: "STRAP-A-PHONE-NOT-LINKED",
    en: "Phone not linked\nOpen the Mojo app",
    sw: "Simu haijaungwa\nFungua programu ya Mojo",
    surface: "strap_a",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept A",
  },

  // ── Project 6: Concept B patterns (named firmware IDs) ───────────────────
  // Light and vibration patterns — implemented as named IDs the firmware resolves.
  // Pulse descriptions: count + length distinguish events (not colour alone).

  {
    id: "STRAP-B-DOSE-DUE",
    en: "Time for your [time] dose. Tap the strap or this button to confirm.",
    sw: "Wakati wa dawa yako ya saa [wakati]. Gusa ukanda au kitufe hiki kuthibitisha.",
    surface: "strap_b",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-DOSE-CONFIRMED",
    en: "Dose logged. Thank you.",
    sw: "Dawa imerekodi. Asante.",
    surface: "strap_b",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-ECG-RECORDING",
    en: "ECG recording. Keep still.",
    sw: "ECG inapigiwa. Kaa bado.",
    surface: "strap_b",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-ECG-RETAKE",
    en: "Signal weak. Rest your arm and try again.",
    sw: "Ishara dhaifu. Pumzisha mkono na ujaribu tena.",
    surface: "strap_b",
    review: "clinician",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-FALL-CHECK",
    en: "We think you may have fallen. Tap \"I'm OK\" if you're fine.",
    sw: "Tunafikiri unaweza kuwa umeanguka. Bonyeza \"Niko sawa\" ikiwa uko sawa.",
    surface: "strap_b",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-SOS-SENT",
    en: "SOS sent. Your SOS contact has been alerted.",
    sw: "SOS imetumwa. SOS wako amearifishwa.",
    surface: "strap_b",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-BATTERY-LOW",
    en: "Battery low. Charge today.",
    sw: "Betri inaisha. Chaji leo.",
    surface: "strap_b",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },
  {
    id: "STRAP-B-PHONE-NOT-LINKED",
    en: "Your Mojo strap is not linked to a phone. Open the Mojo app.",
    sw: "Ukanda wako wa Mojo haujaungwa na simu. Fungua programu ya Mojo.",
    surface: "strap_b",
    review: "none",
    status: "draft",
    version: "v1",
    source: "Playbook Project 6, Concept B",
  },

  // ── Project 7: Consent screens ────────────────────────────────────────────

  {
    id: "CON-01",
    en: "Mojo helps you and your care team track your health. We store your data securely and share it only with people you choose.",
    sw: "Mojo inakusaidia wewe na timu yako ya afya kufuatilia afya yako. Tunahifadhi data yako kwa usalama na kuishiriki tu na watu unaochagua.",
    surface: "app",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 7, Welcome",
  },
  {
    id: "CON-02",
    en: "Mojo shares your location only to help paramedics find you during an SOS. You can change this in Settings.",
    sw: "Mojo inashiriki eneo lako tu kusaidia madaktari kukupata wakati wa SOS. Unaweza kubadilisha hili katika Mipangilio.",
    surface: "app",
    review: "legal",
    status: "draft",
    version: "v1",
    source: "Playbook Project 7, Location",
  },
  {
    id: "CON-03",
    en: "Your medical details are shared with paramedics only if you choose to allow it on this screen.",
    sw: "Maelezo yako ya kimatibabu yanashirikiwa na madaktari tu ikiwa utachagua kuruhusu hilo kwenye skrini hii.",
    surface: "app",
    review: "both",
    status: "draft",
    version: "v1",
    source: "Playbook Project 7, Medical details",
  },
];

/** Get a copy entry by ID. Returns undefined if not found. */
export function getCopy(id: string): CopyEntry | undefined {
  return catalogue.find(e => e.id === id);
}

/** Get all entries for a given surface. */
export function getSurface(surface: CopyEntry["surface"]): CopyEntry[] {
  return catalogue.filter(e => e.surface === surface);
}
