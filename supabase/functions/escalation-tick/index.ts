// escalation-tick — runs every minute via pg_cron.

// State machine:

//   fall_check        → (T+30 s)  raised             : patient window expired

//   raised            → (T+0)     notifying          : push to SOS contacts

//   notifying         → (T+2 min) awaiting_response  : reminder push

//   awaiting_response → (T+4 min) dispatching        : paramedics (medical + critical only)

//                                                       crisis-line push (mental_health OR warning)

//

// CR-CG-06: only response_type 'reached' or 'ok' stops escalation.

//           'not_reached' ("I can't reach them") does NOT stop escalation.

// CR-SOS-05: severity 'warning' never dispatches paramedics.

// CR-SOS-06: dispatch payload leads with location, then patient name, then time.

// Voice: no emoji, no ALL-CAPS, sentences ≤ 15 words (Content Playbook v1).

import { createClient } from "jsr:@supabase/supabase-js@2"

const T_FALL_CHECK_MS = 30 * 1000 // 30 s patient confirmation window

const T2_MS = 2 * 60 * 1000 // 2 min — reminder

const T4_MS = 4 * 60 * 1000 // 4 min — dispatch

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

type AlertRow = {
  id: string

  patient_id: string

  pathway: "medical" | "mental_health"

  severity: "critical" | "warning" | "info"

  state: string

  opened_at: string

  sos_events: Array<{
    id: string
    location: string | null
    recipients: string | null
  }>
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

    const now = Date.now()

    const { data: alerts, error: alertsErr } = await supabase

      .from("alerts")

      .select(
        "id, patient_id, pathway, severity, state, opened_at, sos_events(id, location, recipients)",
      )

      .in("state", ["fall_check", "raised", "notifying", "awaiting_response"])

      .order("opened_at", { ascending: true })

    if (alertsErr) throw alertsErr

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
    }

    let processed = 0

    for (const alert of alerts as AlertRow[]) {
      const ageMs = now - new Date(alert.opened_at).getTime()

      // ── fall_check: 30-second patient confirmation window (CR-SOS-01a) ──

      // Patient cancels via "I'm OK" which sets state = 'cancelled'.

      // If no cancel arrives within 30 s, advance to raised.

      if (alert.state === "fall_check") {
        if (ageMs >= T_FALL_CHECK_MS) {
          await supabase

            .from("alerts")

            .update({ state: "raised", updated_at: new Date().toISOString() })

            .eq("id", alert.id)

          processed++
        }

        continue
      }

      // ── response check (CR-CG-06) ─────────────────────────────────────

      // Only 'reached' or 'ok' stops escalation.

      // 'not_reached' ("I can't reach them") does NOT stop the clock.

      const sosEventId = alert.sos_events?.[0]?.id ?? ""

      if (sosEventId) {
        const { data: responses } = await supabase

          .from("sos_responses")

          .select("id")

          .eq("sos_event_id", sosEventId)

          .in("response_type", ["reached", "ok"])

          .limit(1)

        if ((responses?.length ?? 0) > 0) {
          await supabase

            .from("alerts")

            .update({
              state: "responded",
              updated_at: new Date().toISOString(),
            })

            .eq("id", alert.id)

          continue
        }
      }

      // ── raised → notifying (T+0) ──────────────────────────────────────

      if (alert.state === "raised") {
        await escalate(supabase, alert, 1, "notify_contacts", "push")

        await supabase

          .from("alerts")

          .update({ state: "notifying", updated_at: new Date().toISOString() })

          .eq("id", alert.id)

        processed++

        continue
      }

      // ── notifying → awaiting_response (T+2 min) ───────────────────────

      if (alert.state === "notifying" && ageMs >= T2_MS) {
        await escalate(supabase, alert, 2, "reminder", "push")

        await supabase

          .from("alerts")

          .update({
            state: "awaiting_response",
            updated_at: new Date().toISOString(),
          })

          .eq("id", alert.id)

        processed++

        continue
      }

      // ── awaiting_response → dispatching (T+4 min) ─────────────────────

      // CR-SOS-05: only medical + critical dispatches paramedics.

      if (alert.state === "awaiting_response" && ageMs >= T4_MS) {
        const callParamedics =
          alert.pathway === "medical" && alert.severity === "critical"

        if (callParamedics) {
          await escalate(
            supabase,
            alert,
            3,
            "call_paramedics",
            "call_centre_api",
          )

          await sendDispatch(supabase, alert)
        } else {
          // mental_health pathway OR warning severity → crisis-line push, no paramedics

          await escalate(supabase, alert, 3, "crisis_line", "push")
        }

        await supabase

          .from("alerts")

          .update({
            state: "dispatching",
            updated_at: new Date().toISOString(),
          })

          .eq("id", alert.id)

        processed++
      }
    }

    return new Response(JSON.stringify({ processed }), { status: 200 })
  } catch (err) {
    console.error("[escalation-tick]", err)

    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function escalate(
  supabase: ReturnType<typeof createClient>,

  alert: AlertRow,

  step: number,

  action: string,

  channel: string,
): Promise<void> {
  await supabase.from("alert_escalations").insert({
    alert_id: alert.id,

    step,

    action,

    channel,

    sent_at: new Date().toISOString(),

    delivery_status: "sent",
  })

  const sosEvent = alert.sos_events?.[0]

  const recipientIds: string[] = sosEvent?.recipients
    ? (() => {
        try {
          return JSON.parse(sosEvent.recipients)
        } catch {
          return []
        }
      })()
    : []

  if (recipientIds.length === 0) return

  const { data: patient } = await supabase

    .from("profiles")
    .select("full_name")
    .eq("id", alert.patient_id)
    .single()

  const patientName = (patient as any)?.full_name ?? "Your contact"

  const { data: tokenRows } = await supabase

    .from("push_tokens")
    .select("token")
    .in("user_id", recipientIds)

  if (!tokenRows || tokenRows.length === 0) return

  // Content Playbook Project 5 copy: no emoji, no ALL-CAPS, ≤ 15 words per sentence

  let title: string

  let body: string

  if (action === "notify_contacts") {
    // Step 1 — initial SOS contact push

    title = `${patientName} pressed SOS`

    body = "Please check they are safe. Tap to respond."
  } else if (action === "reminder") {
    // Step 2 — reminder; include implied dispatch time

    const dispatchAt = new Date(new Date(alert.opened_at).getTime() + T4_MS)

      .toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Nairobi",
      })

    title = `No reply yet — ${patientName}`

    body = `Please confirm ${patientName} is safe. Paramedics will be called at ${dispatchAt} if no one responds.`
  } else if (action === "call_paramedics") {
    // Step 4 — after dispatch

    title = `Paramedics called for ${patientName}`

    body = "No one responded. Emergency services have been contacted."
  } else {
    // crisis_line

    title = `Support alert — ${patientName}`

    body =
      "A support alert has been raised. Please check in with them directly."
  }

  const messages = (tokenRows as { token: string }[]).map((t) => ({
    to: t.token,

    sound: "default",

    title,

    body,

    data: {
      type: "sos_alert",

      sos_id: sosEvent?.id ?? "",

      alert_id: alert.id,

      patient_id: alert.patient_id,

      patient_name: patientName,
    },

    priority: "high",

    channelId: "sos",

    categoryIdentifier: "SOS_ALERT",
  }))

  await fetch(EXPO_PUSH_URL, {
    method: "POST",

    headers: { "Content-Type": "application/json", Accept: "application/json" },

    body: JSON.stringify(messages),
  })
}

async function sendDispatch(
  supabase: ReturnType<typeof createClient>,

  alert: AlertRow,
): Promise<void> {
  const { data: provider } = await supabase

    .from("emergency_providers")

    .select("id, mode, type, phone")

    .eq("active", true)

    .order("priority", { ascending: true })

    .limit(1)

    .single()

  if (!provider) return

  // CR-SOS-06: location first, then patient name, then time (paramedic call-taker priority order)

  const sosEvent = alert.sos_events?.[0]

  let location: { lat: number lon: number } | null = null

  if (sosEvent?.location) {
    try {
      location = JSON.parse(sosEvent.location)
    } catch {
      /* ignore */
    }
  }

  const { data: patient } = await supabase

    .from("profiles")
    .select("full_name, phone")
    .eq("id", alert.patient_id)
    .single()

  const alertTimeStr = new Date(alert.opened_at)

    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    })

  const patientName = (patient as any)?.full_name ?? "Unknown"

  const callbackPhone = (patient as any)?.phone ?? "not available"

  const locationStr = location ? `${location.lat}, ${location.lon}` : "unknown"

  // Playbook Step 3 script: location first, repeated once

  const script =
    `This is an automated emergency alert from Mojo. ` +
    `A person may need urgent help. ` +
    `Location: ${locationStr}. ` +
    `Name: ${patientName}. ` +
    `Alert raised at ${alertTimeStr}. ` +
    `Call-back number: ${callbackPhone}. ` +
    `I will repeat this message.`

  await supabase.from("paramedic_dispatches").insert({
    alert_id: alert.id,

    provider_id: (provider as any).id,

    status:
      (provider as any).mode === "sandbox" ? "sandbox_skipped" : "requested",

    payload: {
      location_lat: location?.lat ?? null,

      location_lon: location?.lon ?? null,

      patient_name: patientName,

      alert_raised_at: alert.opened_at,

      alert_time_str: alertTimeStr,

      callback_phone: callbackPhone,

      alert_id: alert.id,

      source: "mojo_sos",

      script,
    },
  })
}
