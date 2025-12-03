/**
 * Google Calendar Service
 * Implementa sincronização bidirecional com Google Calendar
 * - Cedro → Google (create/update/delete)
 * - Google → Cedro (via webhook + sync incremental)
 */

import { getGoogleCalendar, refreshAccessToken } from './client';
import type {
  CreateEventInput,
  UpdateEventInput,
  GoogleCalendarEvent,
  GoogleCalendarListResponse,
  GoogleCalendarWatchResponse,
  GoogleCalendarSyncError,
  CedroAppointmentForSync,
} from './types';
import { createClient } from '@supabase/supabase-js';

// Supabase client para persistir dados
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'cedro',
    },
  }
);

const TIMEZONE = 'America/Sao_Paulo';

export class GoogleCalendarService {
  /**
   * Cria evento no Google Calendar
   * Salva external_event_id, html_link, gcal_etag de volta no Cedro
   */
  async createEvent(
    appointment: CedroAppointmentForSync,
    calendarId: string
  ): Promise<GoogleCalendarEvent> {
    try {
      const calendar = getGoogleCalendar();

      const eventBody: any = {
        summary: appointment.summary || 'Sessão - Cedro',
        description: appointment.notes || 'Criado via Cedro',
        start: {
          dateTime: appointment.start_at,
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: appointment.end_at,
          timeZone: TIMEZONE,
        },
        // Marca como ocupado (opaque = bloqueia tempo)
        transparency: 'opaque',
        // Extensão privada para rastrear origem
        extendedProperties: {
          private: {
            cedro_appointment_id: appointment.id,
            cedro_patient_name: appointment.patient?.name || '',
          },
        },
      };

      console.log(`Creating event on Google Calendar (${calendarId}):`, {
        id: appointment.id,
        summary: eventBody.summary,
        start: eventBody.start.dateTime,
      });

      const response = await calendar.events.insert(
        {
          calendarId,
          requestBody: eventBody,
        },
        {
          headers: {
            'X-Goog-API-Client': 'gl-node/16.0.0 gapic/1.0.0',
          },
        }
      );

      const event = response.data;

      // Persistir dados de volta no Cedro
      await supabase.from('appointments').update({
        external_event_id: event.id,
        external_calendar_id: calendarId,
        html_link: event.htmlLink ?? null,
        gcal_etag: event.etag ?? null,
        ical_uid: event.iCalUID ?? null,
        origin: 'system', // Mantém origem como sistema
        updated_at: new Date().toISOString(),
      });
      /*.eq('id', appointment.id);

      if (error) {
        throw new Error(
          `Failed to update appointment with external IDs: ${error.message}`
        );
      }*/

      console.log(`Event created on Google Calendar:`, {
        id: event.id,
        calendarId,
        htmlLink: event.htmlLink,
      });

      return event as unknown as GoogleCalendarEvent;
    } catch (error) {
      await this.logSync({
        event_id: appointment.id,
        calendar_id: calendarId,
        action: 'create',
        direction: 'cedro_to_google',
        status: 'error',
        error_message: this.extractErrorMessage(error),
        payload: { appointment },
      });

      throw this.parseError(error);
    }
  }

  /**
   * Atualiza evento existente no Google Calendar
   * Suporta If-Match com gcal_etag para evitar conflitos
   */
  async updateEvent(
    appointment: CedroAppointmentForSync,
    updates: UpdateEventInput
  ): Promise<GoogleCalendarEvent> {
    try {
      if (!appointment.external_event_id || !appointment.external_calendar_id) {
        throw new Error(
          'Event has no external_event_id or external_calendar_id'
        );
      }

      const calendar = getGoogleCalendar();

      const updateBody: any = {};

      if (updates.summary) updateBody.summary = updates.summary;
      if (updates.description) updateBody.description = updates.description;
      if (updates.start_at) {
        updateBody.start = {
          dateTime: updates.start_at,
          timeZone: TIMEZONE,
        };
      }
      if (updates.end_at) {
        updateBody.end = {
          dateTime: updates.end_at,
          timeZone: TIMEZONE,
        };
      }
      if (updates.notes) updateBody.description = updates.notes;

      const headers: any = {};

      // Fase 4: Se tiver etag salvo, usar If-Match para evitar conflitos
      if (appointment.gcal_etag) {
        headers['If-Match'] = appointment.gcal_etag;
      }

      console.log(`Patching event on Google Calendar:`, {
        id: appointment.external_event_id,
        calendarId: appointment.external_calendar_id,
        updates: Object.keys(updateBody),
      });

      const response = await calendar.events.patch(
        {
          calendarId: appointment.external_calendar_id,
          eventId: appointment.external_event_id,
          requestBody: updateBody,
        },
        { headers }
      );

      const event = response.data;

      // Atualizar etag no Cedro
      await supabase.from('appointments').update({
        gcal_etag: event.etag ?? null,
        html_link: event.htmlLink ?? null,
        updated_at: new Date().toISOString(),
      });
      /*.eq('id', appointment.id);

      if (error) {
        throw new Error(`Failed to update appointment etag: ${error.message}`);
      }*/

      console.log(`Event patched on Google Calendar:`, {
        id: event.id,
        etag: event.etag,
      });

      return event as unknown as GoogleCalendarEvent;
    } catch (error) {
      await this.logSync({
        event_id: appointment.external_event_id,
        calendar_id: appointment.external_calendar_id,
        action: 'update',
        direction: 'cedro_to_google',
        status: 'error',
        error_message: this.extractErrorMessage(error),
        payload: { appointment, updates },
      });

      throw this.parseError(error);
    }
  }

  /**
   * Deleta evento do Google Calendar
   * Se já foi deletado (410), ignora o erro
   */
  async deleteEvent(
    calendarId: string,
    eventId: string
  ): Promise<void> {
    try {
      const calendar = getGoogleCalendar();

      console.log(`Deleting event from Google Calendar:`, {
        id: eventId,
        calendarId,
      });

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      console.log(`Event deleted from Google Calendar:`, { eventId });
    } catch (error: any) {
      // 410 = já foi deletado, não é erro
      if (error.code === 410) {
        console.log(`Event already deleted on Google Calendar:`, { eventId });
        return;
      }

      await this.logSync({
        event_id: eventId,
        calendar_id: calendarId,
        action: 'delete',
        direction: 'cedro_to_google',
        status: 'error',
        error_message: this.extractErrorMessage(error),
        payload: null,
      });

      throw this.parseError(error);
    }
  }

  /**
   * Lista eventos do Google Calendar com sincronização incremental
   * Usa syncToken se disponível, senão faz listagem completa
   */
  async listEvents(
    calendarId: string,
    options?: {
      syncToken?: string;
      timeMin?: string; // ISO 8601
      timeMax?: string; // ISO 8601
      singleEvents?: boolean;
    }
  ): Promise<{
    events: GoogleCalendarEvent[];
    nextSyncToken?: string;
  }> {
    try {
      const calendar = getGoogleCalendar();

      const requestBody: any = {
        calendarId,
        singleEvents: options?.singleEvents !== false, // Expandir ocorrências
        timeZone: TIMEZONE,
      };

      if (options?.syncToken) {
        requestBody.syncToken = options.syncToken;
      } else {
        // Se não tiver syncToken, fazer list completa com janela de tempo
        if (options?.timeMin) {
          requestBody.timeMin = options.timeMin;
        }
        if (options?.timeMax) {
          requestBody.timeMax = options.timeMax;
        }
      }

      console.log(`Listing events from Google Calendar:`, {
        calendarId,
        hasSyncToken: !!options?.syncToken,
        timeMin: options?.timeMin,
        timeMax: options?.timeMax,
      });

      const response = await calendar.events.list(requestBody);

      const data = response.data as GoogleCalendarListResponse;

      console.log(
        `Retrieved ${data.items?.length || 0} events from Google Calendar`,
        { nextSyncToken: !!data.nextSyncToken }
      );

      return {
        events: (data.items || []) as unknown as GoogleCalendarEvent[],
        nextSyncToken: data.nextSyncToken,
      };
    } catch (error: any) {
      // 410 = syncToken expirou, fazer resync completo
      if (error.code === 410) {
        console.warn(`Sync token expired for calendar ${calendarId}, doing full resync`);
        return this.listEvents(calendarId, {
          singleEvents: true,
          timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // -30 dias
          timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 ano
        });
      }

      throw this.parseError(error);
    }
  }

  /**
   * Registra webhook para notificações em tempo real
   * Google notificará em {address} quando eventos mudarem
   */
  async watchCalendar(
    calendarId: string,
    address: string,
    token: string
  ): Promise<GoogleCalendarWatchResponse> {
    try {
      const calendar = getGoogleCalendar();

      console.log(`Setting up watch on Google Calendar:`, {
        calendarId,
        address,
      });

      const response = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: `cedro-${calendarId}-${Date.now()}`,
          type: 'web_hook',
          address,
          token,
          // Google expira webhooks após ~24h, mas pode ser renovado
          // Não especificamos expiration aqui, deixa Google decidir
        },
      });

      const watchData = response.data as GoogleCalendarWatchResponse;

      console.log(`Watch registered on Google Calendar:`, {
        resourceId: watchData.resourceId,
        expiration: watchData.expiration,
      });

      return watchData;
    } catch (error) {
      console.error(`Error setting up watch on calendar ${calendarId}:`, error);
      throw this.parseError(error);
    }
  }

  /**
   * Para um webhook ativo
   */
  async stopWatch(
    calendarId: string,
    resourceId: string,
    token: string
  ): Promise<void> {
    try {
      const calendar = getGoogleCalendar();

      console.log(`Stopping watch on Google Calendar:`, {
        calendarId,
        resourceId,
      });

      // Nota: Google Calendar API não tem endpoint explícito para stop watch
      // Webhooks expiram naturalmente após 24h
      // Esta função é para referência futura
    } catch (error) {
      console.error(`Error stopping watch:`, error);
    }
  }

  /**
   * Mapeia evento do Google para formato Cedro
   * Ignora eventos transparent (não bloqueiam tempo)
   */
  async mapGoogleEventToCedro(event: GoogleCalendarEvent): Promise<any> {
    // Ignorar eventos transparent
    if (event.transparency === 'transparent') {
      return null;
    }

    // Ignorar eventos deletados
    if (event.status === 'cancelled') {
      return {
        status: 'cancelled',
        external_event_id: event.id,
        source_updated_at: event.updatedTime,
      };
    }

    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;

    if (!startTime || !endTime) {
      console.warn(`Event missing start or end time:`, event.id);
      return null;
    }

    // Extrair cedro_appointment_id das extensões privadas
    const cedroAppointmentId =
      event.extendedProperties?.private?.cedro_appointment_id;

    return {
      summary: event.summary,
      notes: event.description,
      start_at: startTime,
      end_at: endTime,
      source_updated_at: event.updatedTime,
      recurring_event_id: event.recurringEventId || null,
      ical_uid: event.iCalUID,
      html_link: event.htmlLink,
      gcal_etag: event.etag,
      external_event_id: event.id,
      status: event.status === 'confirmed' ? 'scheduled' : 'tentative',
      cedro_appointment_id: cedroAppointmentId,
    };
  }

  /**
   * Log de operação de sincronização
   */
  private async logSync(log: {
    event_id?: string;
    calendar_id?: string;
    action: string;
    direction: string;
    status: string;
    error_message?: string;
    payload?: any;
  }): Promise<void> {
    try {
      await supabase.from('calendar_sync_log').insert({
        event_id: log.event_id,
        calendar_id: log.calendar_id,
        action: log.action,
        direction: log.direction,
        status: log.status,
        error_message: log.error_message,
        payload: log.payload,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging sync operation:', error);
      // Não falhar se logging falhar
    }
  }

  /**
   * Extrai mensagem de erro de diferentes tipos
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.errors?.[0]?.message) return error.errors[0].message;
    return 'Unknown error';
  }

  /**
   * Parseia erros da Google API e lança de forma consistente
   */
  private parseError(error: any): GoogleCalendarSyncError {
    const code = error?.code || error?.status || 500;
    const message = this.extractErrorMessage(error);

    const syncError: GoogleCalendarSyncError = {
      code,
      message,
      details: error?.errors,
    };

    console.error('Google Calendar API Error:', syncError);

    return syncError;
  }
}

// Exportar instância singleton
export const googleCalendarService = new GoogleCalendarService();
