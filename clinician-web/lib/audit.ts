import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Log a clinician data-access event via the SECURITY DEFINER RPC.
 * Call this at the top of every server component that reads patient data.
 */
export async function logAccess(
  supabase: SupabaseClient,
  patientId: string,
  action: string,
  entity: string,
  entityId?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.rpc("log_access", {
    p_clinician_id: user.id,
    p_patient_id: patientId,
    p_action: action,
    p_entity: entity,
    p_entity_id: entityId ?? null,
  })
}
