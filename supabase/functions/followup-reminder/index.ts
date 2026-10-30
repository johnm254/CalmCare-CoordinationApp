// followup-reminder — runs on a schedule via pg_cron.
//
// Sends push notifications to clinicians when a follow-up is due within 24
// hours and has not yet had a reminder sent.
//
// Voice: no emoji, no ALL-CAPS, sentences <= 15 words (Content Playbook v1).

import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

type FollowupRow = {
  id: string
  patient_id: string
  clinician_id: string
  title: string
  due_at: string
  status: string
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // 1. Query follow-ups due in the next 24 hours that have not been reminded
    const { data: followups, error: followupsErr } = await supabase
      .from("followups")
      .select("id, patient_id, clinician_id, title, due_at, status")
      .eq("status", "open")
      .lte("due_at", in24h.toISOString())
      .gte("due_at", now.toISOString())
      .is("reminder_sent_at", null)

    if (followupsErr) throw followupsErr

    if (!followups || followups.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    let sent = 0

    for (const followup of followups as FollowupRow[]) {
      // 2a. Get clinician push token
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", followup.clinician_id)

      if (!tokenRows || tokenRows.length === 0) continue

      // 2b. Get patient first name for the notification title
      const { data: patient } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", followup.patient_id)
        .single()

      const fullName: string = (patient as any)?.full_name ?? "Patient"
      const firstName = fullName.split(" ")[0] ?? fullName

      // Format due date: "Mon 3 Nov"
      const dueDate = new Date(followup.due_at).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Africa/Nairobi",
      })

      const title = `Follow-up due soon — ${firstName}`
      const body = `${followup.title}. Due ${dueDate}.`

      const messages = (tokenRows as { token: string }[]).map((t) => ({
        to: t.token,
        sound: "default",
        title,
        body,
        data: {
          type: "followup_reminder",
          followup_id: followup.id,
          patient_id: followup.patient_id,
        },
        priority: "normal",
        channelId: "followups",
      }))

      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages),
      })

      // 2c. Mark reminder sent so it is not sent again
      try {
        await supabase
          .from("followups")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", followup.id)
      } catch (updateErr) {
        // reminder_sent_at column may not exist yet — log and continue
        console.warn(
          "[followup-reminder] could not set reminder_sent_at:",
          updateErr,
        )
      }

      sent++
    }

    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    console.error("[followup-reminder]", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
