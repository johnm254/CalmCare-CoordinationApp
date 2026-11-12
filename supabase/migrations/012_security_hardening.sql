-- Security hardening for event and caregiver-observation writes.

DROP POLICY IF EXISTS "events_patient_access" ON events;

CREATE POLICY "events_read_access" ON events
  FOR SELECT USING (
    patient_id = auth.uid()
    OR logged_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = events.patient_id
        AND grantee_id = auth.uid()
        AND category = 'event_summaries'
        AND revoked_at IS NULL
    )
  );

CREATE POLICY "events_insert_access" ON events
  FOR INSERT WITH CHECK (
    logged_by = auth.uid()
    AND (
      patient_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM grants
        WHERE patient_id = events.patient_id
          AND grantee_id = auth.uid()
          AND category = 'event_summaries'
          AND revoked_at IS NULL
      )
    )
  );

CREATE POLICY "events_update_access" ON events
  FOR UPDATE
  USING (patient_id = auth.uid() OR logged_by = auth.uid())
  WITH CHECK (
    logged_by = auth.uid()
    AND (
      patient_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM grants
        WHERE patient_id = events.patient_id
          AND grantee_id = auth.uid()
          AND category = 'event_summaries'
          AND revoked_at IS NULL
      )
    )
  );

CREATE POLICY "events_delete_access" ON events
  FOR DELETE USING (patient_id = auth.uid() OR logged_by = auth.uid());

DROP POLICY IF EXISTS "caregiver inserts own observations" ON caregiver_observations;
CREATE POLICY "caregiver inserts linked observations"
  ON caregiver_observations FOR INSERT
  WITH CHECK (
    caregiver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM care_circle
      WHERE patient_id = caregiver_observations.patient_id
        AND member_id = auth.uid()
        AND contact_status = 'accepted'
    )
    AND (
      event_id IS NULL
      OR EXISTS (
        SELECT 1 FROM events
        WHERE events.id = caregiver_observations.event_id
          AND events.patient_id = caregiver_observations.patient_id
      )
    )
  );
