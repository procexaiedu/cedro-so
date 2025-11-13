/**
 * Google Calendar API Functions
 * Query/mutation helpers para gerenciar agendamentos sincronizados
 */

import { createClient } from '@supabase/supabase-js';
import type { Appointment } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: 'cedro' },
  }
);

/**
 * Buscar agendamentos sincronizados com Google Calendar
 * (origin='google' ou external_event_id NOT NULL)
 */
export async function getSyncedAppointments(
  therapistId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('appointments')
      .select(
        `
        id,
        therapist_id,
        patient_id,
        service_id,
        summary,
        start_at,
        end_at,
        notes,
        status,
        origin,
        external_event_id,
        external_calendar_id,
        html_link,
        gcal_etag,
        source_updated_at,
        recurring_event_id,
        patient:patient_id (name, email),
        therapist:therapist_id (name, email, google_calendar_id),
        service:service_id (name, duration_minutes),
        created_at,
        updated_at
      `
      )
      .not('external_event_id', 'is', null)
      .order('start_at', { ascending: true });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    if (startDate) {
      query = query.gte('start_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('start_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch synced appointments: ${error.message}`);
    }

    return (data || []) as any[];
  } catch (error) {
    console.error('Error fetching synced appointments:', error);
    throw error;
  }
}

/**
 * Buscar agendamentos com patient_id = NULL (requerem vinculação)
 */
export async function getUnlinkedGoogleAppointments(
  therapistId?: string
): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('appointments')
      .select(
        `
        id,
        therapist_id,
        summary,
        start_at,
        end_at,
        notes,
        status,
        external_event_id,
        html_link,
        recurring_event_id,
        therapist:therapist_id (name),
        created_at
      `
      )
      .eq('origin', 'google')
      .is('patient_id', null)
      .neq('status', 'cancelled')
      .gt('start_at', new Date().toISOString())
      .order('start_at', { ascending: true });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch unlinked appointments: ${error.message}`);
    }

    return (data || []) as any[];
  } catch (error) {
    console.error('Error fetching unlinked appointments:', error);
    throw error;
  }
}

/**
 * Vincular paciente a agendamento do Google Calendar
 * Dispara trigger de propagação para série recorrente
 */
export async function linkPatientToAppointment(
  appointmentId: string,
  patientId: string
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        patient_id: patientId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select();

    if (error) {
      throw new Error(`Failed to link patient: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Appointment not found');
    }

    return data[0] as Appointment;
  } catch (error) {
    console.error('Error linking patient:', error);
    throw error;
  }
}

/**
 * Buscar histórico de sincronização de um agendamento
 */
export async function getSyncHistory(
  eventId?: string,
  calendarId?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('calendar_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    if (calendarId) {
      query = query.eq('calendar_id', calendarId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sync history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sync history:', error);
    throw error;
  }
}

/**
 * Buscar status da fila de sincronização
 */
export async function getSyncQueueStatus(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  try {
    const { data, error } = await supabase
      .from('gcal_sync_queue')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch queue status: ${error.message}`);
    }

    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of data || []) {
      counts[row.status as keyof typeof counts]++;
    }

    return counts;
  } catch (error) {
    console.error('Error fetching sync queue status:', error);
    throw error;
  }
}

/**
 * Setup webhook para um terapeuta
 * Chamada ao endpoint /api/gcal/setup-watch
 */
export async function setupGoogleCalendarWatch(
  therapistId: string
): Promise<{
  success: boolean;
  message: string;
  channel?: {
    id: string;
    resource_id: string;
    expiration: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/gcal/setup-watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ therapist_id: therapistId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to setup watch');
    }

    return data;
  } catch (error) {
    console.error('Error setting up Google Calendar watch:', error);
    throw error;
  }
}

/**
 * Verificar status do webhook configurado
 */
export async function checkGoogleCalendarWatchStatus(
  therapistId: string
): Promise<any> {
  try {
    const response = await fetch(
      `/api/gcal/setup-watch?therapist_id=${therapistId}`
    );

    if (!response.ok) {
      throw new Error('Failed to check watch status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking watch status:', error);
    throw error;
  }
}

/**
 * Forçar resync manual
 */
export async function manualResyncGoogleCalendar(
  therapistId: string,
  daysBack: number = 30,
  daysForward: number = 365
): Promise<{
  success: boolean;
  message: string;
  processed?: number;
  ignored?: number;
}> {
  try {
    const params = new URLSearchParams({
      days_back: String(daysBack),
      days_forward: String(daysForward),
    });

    const response = await fetch(
      `/api/gcal/resync/${therapistId}?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resync');
    }

    return data;
  } catch (error) {
    console.error('Error in manual resync:', error);
    throw error;
  }
}
