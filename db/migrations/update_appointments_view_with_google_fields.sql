-- ============================================================================
-- Update appointments_with_details view to include Google Calendar fields
-- This migration ensures all Google Calendar sync data is available in the view
-- ============================================================================

-- Drop existing view (it depends on no other views)
DROP VIEW IF EXISTS cedro.appointments_with_details CASCADE;

-- Recreate the view with all fields including Google Calendar sync data
CREATE OR REPLACE VIEW cedro.appointments_with_details AS
SELECT
    a.id,
    a.patient_id,
    a.therapist_id,
    a.service_id,
    a.care_plan_id,
    a.status,
    a.start_at,
    a.end_at,
    a.channel,
    a.origin_message_id,
    a.notes,
    a.meet_link,
    a.created_at,
    a.updated_at,
    -- Google Calendar sync fields
    a.origin,
    a.summary,
    a.external_event_id,
    a.external_calendar_id,
    a.source_updated_at,
    a.recurring_event_id,
    a.ical_uid,
    a.html_link,
    a.gcal_etag,
    -- Related data
    p.full_name as patient_name,
    p.email as patient_email,
    p.phone as patient_phone,
    u.name as therapist_name,
    u.email as therapist_email,
    s.name as service_name,
    s.description as service_description,
    s.default_duration_min as service_duration,
    s.base_price_cents as service_price
FROM cedro.appointments a
LEFT JOIN cedro.patients p ON a.patient_id = p.id
LEFT JOIN cedro.users u ON a.therapist_id = u.id
LEFT JOIN cedro.services s ON a.service_id = s.id;

-- Add comment about the view
COMMENT ON VIEW cedro.appointments_with_details IS 'View otimizada com dados relacionados de agendamentos, incluindo campos de sincronização com Google Calendar';
