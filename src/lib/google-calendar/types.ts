/**
 * Google Calendar Integration Types
 * Types para integração com Google Calendar API v3
 */

export interface GoogleCalendarEvent {
  id: string;
  etag: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurringEventId?: string;
  iCalUID?: string;
  htmlLink?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  creator?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  createdTime?: string;
  updatedTime?: string;
}

export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  summary?: string;
  timeZone?: string;
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface GoogleCalendarWatchRequest {
  id: string;
  token: string;
  type: 'web_hook';
  address: string;
  expiration?: string;
}

export interface GoogleCalendarWatchResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  start_at: string; // ISO 8601
  end_at: string; // ISO 8601
  notes?: string;
  cedro_appointment_id: string;
  patient_name?: string;
}

export interface UpdateEventInput {
  summary?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  notes?: string;
}

export interface GoogleCalendarSyncError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

export interface CedroAppointmentForSync {
  id: string;
  therapist_id: string;
  summary?: string;
  start_at: string;
  end_at: string;
  notes?: string;
  patient_id?: string;
  patient?: {
    name?: string;
  };
  external_event_id?: string;
  external_calendar_id?: string;
  gcal_etag?: string;
}
