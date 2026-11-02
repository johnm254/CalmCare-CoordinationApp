// alert-tick — evaluates alert_rules against recent vital_samples and mood_checkins.
//
// Run every minute via pg_cron:
//   SELECT cron.schedule('alert-tick', '* * * * *',
//     $$SELECT net.http_post(...)$$);
//
// Logic per rule:
//   1. Get the most recent vital sample (or mood check-in) for the metric.
//   2. Evaluate: does the value breach the threshold for >= duration_s?
//   3. If yes, check whether a non-resolved alert for this rule already exists
//      (to avoid storm). If none, insert one and let escalation-tick drive it.
//
// Supported vital_samples metrics: heart_rate, spo2, skin_temp, resp_rate, hrv
// Mood metric: 'mood' → queries mood_checkins.score
// Other metrics (glucose_mmol, systolic, etc.) are skipped until wearable data arrives.

import { createClient } from "jsr:@supabase/supabase-js@2"

type Rule = {
  id: string
  patient_id: string
  metric: string
  operator: string
  threshold: number
  duration_s: number
  severity: string
  pathway: string
  active: boolean
}

// Metrics sourced from vital_samples
const VITAL_METRICS = new Set([
  "heart_rate", "spo2", "skin_temp", "resp_rate", "hrv",
  "steps", "activity_level",
])

// Normalise both symbol ('>', '>=') and word ('gt', 'gte') operators
function evalOperator(op: string, value: number, threshold: number): boolean {
  switch (op) {
    case ">":
    case "gt":
      return value > threshold
    case "<":
    case "lt":
      return value < threshold
    case ">=":
    case "gte":
      return value >= threshold
    case "<=":
    case "lte":
      return value <= threshold
    default:
      return false
  }
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

    // 1. Load all active rules
    const { data: rules, error: rulesErr } = await supabase
      .from("alert_rules")
      .select("id, patient_id, metric, operator, threshold, duration_s, severity, pathway, active")
      .eq("active", true)

    if (rulesErr) throw rulesErr
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ raised: 0 }), { status: 200 })
    }

    const now = new Date()
    let raised = 0

    for (const rule of rules as Rule[]) {
      const isVital = VITAL_METRICS.has(rule.metric)
      const isMood = rule.metric === "mood"

      if (!isVital && !isMood) continue // metric not yet available in DB

      // 2. Get the most recent reading within (now - duration_s - buffer) to now
      // We look back at most 10 minutes to keep queries cheap.
      const lookbackMs = Math.max((rule.duration_s + 60) * 1000, 10 * 60 * 1000)
      const since = new Date(now.getTime() - lookbackMs).toISOString()

      let breachValue: number | null = null

      if (isVital) {
        const { data: samples } = await supabase
          .from("vital_samples")
          .select("value, measured_at")
          .eq("patient_id", rule.patient_id)
          .eq("metric", rule.metric)
          .gte("measured_at", since)
          .order("measured_at", { ascending: false })
          .limit(20)

        if (!samples || samples.length === 0) continue

        // Check if ALL samples in the duration window breach the threshold
        // (sustained breach, not a spike)
        const windowStart = new Date(now.getTime() - rule.duration_s * 1000).toISOString()
        const windowSamples =
          rule.duration_s === 0
            ? [samples[0]]
            : samples.filter((s: any) => s.measured_at >= windowStart)

        if (windowSamples.length === 0) continue

        const allBreach = windowSamples.every((s: any) =>
          evalOperator(rule.operator, Number(s.value), rule.threshold)
        )

        if (allBreach) breachValue = Number(samples[0].value)
      } else if (isMood) {
        const { data: checkins } = await supabase
          .from("mood_checkins")
          .select("score, occurred_at")
          .eq("patient_id", rule.patient_id)
          .gte("occurred_at", since)
          .order("occurred_at", { ascending: false })
          .limit(1)

        if (!checkins || checkins.length === 0) continue
        const score = Number(checkins[0].score)
        if (evalOperator(rule.operator, score, rule.threshold)) {
          breachValue = score
        }
      }

      if (breachValue === null) continue

      // 3. Check for an existing open alert for this rule (dedup)
      const { data: existing } = await supabase
        .from("alerts")
        .select("id")
        .eq("patient_id", rule.patient_id)
        .eq("rule_id", rule.id)
        .not("state", "in", '("resolved","cancelled","false_alarm","dispatched")')
        .limit(1)

      if (existing && existing.length > 0) continue // already open, escalation-tick handles it

      // 4. Raise a new alert
      const { error: insertErr } = await supabase.from("alerts").insert({
        patient_id: rule.patient_id,
        rule_id: rule.id,
        source: isMood ? "mood" : "vitals",
        severity: rule.severity,
        pathway: rule.pathway === "Mental Health" ? "mental_health" : "medical",
        state: "raised",
        opened_at: now.toISOString(),
      })

      if (insertErr) {
        console.warn("[alert-tick] insert failed:", insertErr.message)
        continue
      }

      raised++
    }

    return new Response(JSON.stringify({ raised, evaluated: rules.length }), { status: 200 })
  } catch (err) {
    console.error("[alert-tick]", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
