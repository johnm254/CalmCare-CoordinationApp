// med-reminder — fires push notifications at scheduled medication times.
//
// Runs every minute via pg_cron:
//   SELECT cron.schedule('med-reminder', '* * * * *',
//     $$SELECT net.http_post(...)$$);
//
// Logic:
//   1. Get current time in Africa/Nairobi (HH:MM).
//   2. Query active medications whose schedule.time matches now.
//   3. Check schedule.days includes today (or is empty = every day).
//   4. Skip if a dose_event for this med was already logged today (taken/scheduled).
//   5. Push notification to patient's registered Expo push tokens.
//   6. Insert a dose_event with status = 'scheduled' as a reminder record.
//
// Voice: no emoji, no ALL-CAPS, sentences <= 15 words (Content Playbook v1).

import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

// Day-of-week abbreviations used in schedule.days
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Current time and day in Africa/Nairobi
    const now = new Date()
    const currentHHMM = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
      hour12: false,
    })
    // "Sun", "Mon" … "Sat" in Nairobi timezone
    const todayDay = now.toLocaleDateString("en-US", {
      timeZone: "Africa/Nairobi",
      weekday: "short",
    })

    // Start of today in ISO (midnight Nairobi)
    const startOfDayISO = new Date(
      new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }) + "T00:00:00+03:00"
    ).toISOString()

    // 1. Get all active medications
    const { data: meds, error: medsErr } = await supabase
      .from("medications")
      .select("id, patient_id, name, dose, schedule")
      .eq("active", true)

    if (medsErr) throw medsErr
    if (!meds || meds.length === 0) {
      return new Response(JSON.stringify({ fired: 0 }), { status: 200 })
    }

    let fired = 0

    // Group by patient to avoid per-med token lookups
    const patientTokenCache: Record<string, string[]> = {}

    for (const med of meds as any[]) {
      const schedule = med.schedule as { time: string; days: string[] } | null
      if (!schedule?.time) continue

      // Check time matches (exact HH:MM)
      if (schedule.time !== currentHHMM) continue

      // Check day matches (empty days array = every day)
      const days: string[] = schedule.days ?? []
      if (days.length > 0 && !days.includes(todayDay)) continue

      // 2. Skip if a dose event already exists today for this medication
      const { data: existing } = await supabase
        .from("dose_events")
        .select("id")
        .eq("medication_id", med.id)
        .gte("scheduled_for", startOfDayISO)
        .limit(1)

      if (existing && existing.length > 0) continue

      // 3. Get push tokens (cached per patient)
      if (!patientTokenCache[med.patient_id]) {
        const { data: tokenRows } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", med.patient_id)

        patientTokenCache[med.patient_id] = (tokenRows ?? []).map((t: any) => t.token)
      }

      const tokens = patientTokenCache[med.patient_id]
      if (tokens.length === 0) continue

      // 4. Send push notification
      const scheduledFor = new Date().toISOString()
      const title = `Time for ${med.name}`
      const body = `${med.dose}. Tap to log it as taken.`

      const messages = tokens.map((token: string) => ({
        to: token,
        sound: "default",
        title,
        body,
        data: {
          type: "med_reminder",
          medication_id: med.id,
          patient_id: med.patient_id,
        },
        priority: "normal",
        channelId: "medications",
      }))

      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      })

      // 5. Insert scheduled dose_event so the reminder isn't re-sent this minute
      try {
        await supabase.from("dose_events").insert({
          medication_id: med.id,
          patient_id: med.patient_id,
          scheduled_for: scheduledFor,
          status: "scheduled",
        })
      } catch {
        // Non-fatal — push was already sent
      }

      fired++
    }

    return new Response(JSON.stringify({ fired, time: currentHHMM, day: todayDay }), { status: 200 })
  } catch (err) {
    console.error("[med-reminder]", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
