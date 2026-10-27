import { supabase } from "./supabase"

/**
 * Log a clinician or caregiver data access to audit_log via RPC.
 * Call this whenever a clinician or caregiver view loads patient data.
 * Fire-and-forget — never throws.
 */

export async function logAccess(
  patientId: string,

  tableName: string,

  purpose: string,

  recordIds: string[] = [],
): Promise<void> {
  supabase

    .rpc("log_access", {
      p_patient_id: patientId,

      p_table_name: tableName,

      p_record_ids: recordIds,

      p_purpose: purpose,
    })

    .then(
      () => undefined,
      () => undefined,
    )
}
