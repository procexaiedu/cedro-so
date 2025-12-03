/**
 * Google Calendar Webhook Handler
 *
 * Recebe notificações em tempo real quando eventos mudam no Google Calendar
 * Validação: headers x-goog-channel-id, x-goog-resource-id, x-goog-resource-state, x-goog-channel-token
 *
 * Fluxo:
 * 1. Validar canal (channel_token)
 * 2. Se state='sync': fazer full sync (primeiro sync)
 * 3. Se state='exists': fazer sync incremental com syncToken
 * 4. Ignorar eventos transparent
 * 5. Upsert por (external_calendar_id, external_event_id) com origin='google'
 * 6. Atualizar sync_token na google_calendar_sync_state
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { googleCalendarService } from '@/lib/google-calendar/service';
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'cedro',
    },
  }
);

interface WebhookHeaders {
  'x-goog-channel-id'?: string;
  'x-goog-resource-id'?: string;
  'x-goog-resource-state'?: string;
  'x-goog-channel-token'?: string;
}

interface ChannelRecord {
  id: string;
  channel_id: string;
  resource_id: string;
  channel_token: string;
  calendar_id: string;
  is_active: boolean;
}

/**
 * POST /api/gcal/webhook
 * Recebe notificações do Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    // Extrair headers do webhook
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const channelToken = request.headers.get('x-goog-channel-token');

    console.log('Received Google Calendar webhook:', {
      channelId,
      resourceId,
      resourceState,
    });

    // Validar headers obrigatórios
    if (!channelId || !resourceId || !resourceState || !channelToken) {
      console.warn('Missing required webhook headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // 1. Validar canal
    const { data: channel, error: channelError } = await supabase
      .from('google_calendar_channels')
      .select('*')
      .eq('channel_id', channelId)
      .eq('resource_id', resourceId)
      .eq('channel_token', channelToken)
      .eq('is_active', true)
      .single();

    if (channelError || !channel) {
      console.warn('Channel not found or inactive:', {
        channelId,
        error: channelError?.message,
      });
      return NextResponse.json(
        { error: 'Channel not found or inactive' },
        { status: 401 }
      );
    }

    const channelRecord = channel as ChannelRecord;
    const calendarId = channelRecord.calendar_id;

    console.log(`Webhook validated for calendar: ${calendarId}`);

    // 2. Buscar sync_state atual
    const { data: syncState, error: syncStateError } = await supabase
      .from('google_calendar_sync_state')
      .select('sync_token, last_sync_at')
      .eq('calendar_id', calendarId)
      .single();

    if (syncStateError) {
      console.error(`Sync state not found for calendar ${calendarId}:`, syncStateError);
      return NextResponse.json(
        { error: 'Sync state not found' },
        { status: 404 }
      );
    }

    let syncToken = syncState?.sync_token;

    // 3. Determinar se é primeiro sync ou incremental
    let events: GoogleCalendarEvent[] = [];

    if (resourceState === 'sync' || !syncToken) {
      // Primeiro sync: buscar janela móvel (últimos 30 dias + próximos 365)
      console.log(`Doing full sync for calendar ${calendarId}`);

      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const listResult = await googleCalendarService.listEvents(calendarId, {
        singleEvents: true,
        timeMin,
        timeMax,
      });

      events = listResult.events;
      syncToken = listResult.nextSyncToken;

      console.log(`Full sync completed: ${events.length} events, new syncToken`);
    } else if (resourceState === 'exists') {
      // Sync incremental: usar syncToken
      console.log(`Doing incremental sync for calendar ${calendarId} with syncToken`);

      const listResult = await googleCalendarService.listEvents(calendarId, {
        syncToken,
      });

      events = listResult.events;
      syncToken = listResult.nextSyncToken;

      console.log(`Incremental sync completed: ${events.length} changes`);
    }

    // 4. Processar cada evento
    let processedCount = 0;
    let ignoredCount = 0;
    const errors: { eventId: string; error: string }[] = [];

    for (const event of events) {
      try {
        // Ignorar eventos transparent (não bloqueiam tempo)
        if (event.transparency === 'transparent') {
          console.debug(`Ignoring transparent event: ${event.id}`);
          ignoredCount++;
          continue;
        }

        // Mapear para formato Cedro
        const cedroData = await googleCalendarService.mapGoogleEventToCedro(event);

        if (!cedroData) {
          ignoredCount++;
          continue;
        }

        // Se evento foi deletado, atualizar status
        if (cedroData.status === 'cancelled') {
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'cancelled',
              source_updated_at: cedroData.source_updated_at,
              updated_at: new Date().toISOString(),
            })
            .eq('external_event_id', event.id)
            .eq('external_calendar_id', calendarId);

          if (updateError) {
            throw new Error(`Failed to cancel event: ${updateError.message}`);
          }

          console.log(`Event cancelled: ${event.id}`);
          processedCount++;
          continue;
        }

        // 5. Upsert evento (by external_calendar_id + external_event_id)
        // Usar origem='google' para evitar loop
        const upsertData = {
          ...cedroData,
          external_calendar_id: calendarId,
          origin: 'google', // IMPORTANTE: previne loop
          updated_at: new Date().toISOString(),
        };

        // Buscar agendamento existente
        const { data: existingAppointment, error: existingError } = await supabase
          .from('appointments')
          .select('id')
          .eq('external_event_id', event.id)
          .eq('external_calendar_id', calendarId)
          .single();

        if (existingAppointment) {
          // UPDATE
          const { error: updateError } = await supabase
            .from('appointments')
            .update(upsertData)
            .eq('external_event_id', event.id)
            .eq('external_calendar_id', calendarId);

          if (updateError) {
            throw new Error(`Failed to update event: ${updateError.message}`);
          }

          console.log(`Event updated: ${event.id}`);
        } else {
          // INSERT - Precisa de therapist_id e status
          // O therapist_id vem do calendário. Buscar relationship.
          const { data: therapistChannel } = await supabase
            .from('google_calendar_channels')
            .select('therapist_id')
            .eq('calendar_id', calendarId)
            .single();

          if (!therapistChannel) {
            throw new Error(`Cannot find therapist for calendar ${calendarId}`);
          }

          const insertData = {
            ...upsertData,
            therapist_id: therapistChannel.therapist_id,
            patient_id: null, // Será vinculado manualmente ou automaticamente
            status: upsertData.status || 'scheduled',
          };

          const { error: insertError } = await supabase
            .from('appointments')
            .insert(insertData);

          if (insertError) {
            // Se falhar por constraint unique, pode ser race condition - tentar update
            if (insertError.code === '23505') {
              const { error: updateError } = await supabase
                .from('appointments')
                .update(upsertData)
                .eq('external_event_id', event.id)
                .eq('external_calendar_id', calendarId);

              if (updateError) {
                throw updateError;
              }

              console.log(`Event updated (race condition): ${event.id}`);
            } else {
              throw insertError;
            }
          } else {
            console.log(`Event created: ${event.id}`);
          }
        }

        processedCount++;

        // Log sucesso
        await supabase.from('calendar_sync_log').insert({
          event_id: event.id,
          calendar_id: calendarId,
          action: 'sync',
          direction: 'google_to_cedro',
          status: 'success',
          payload: { event },
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing event ${event.id}:`, errorMessage);

        errors.push({
          eventId: event.id,
          error: errorMessage,
        });

        // Log erro
        await supabase.from('calendar_sync_log').insert({
          event_id: event.id,
          calendar_id: calendarId,
          action: 'sync',
          direction: 'google_to_cedro',
          status: 'error',
          error_message: errorMessage,
          payload: { event },
          created_at: new Date().toISOString(),
        });
      }
    }

    // 6. Atualizar sync_token
    if (syncToken) {
      const { error: updateSyncError } = await supabase
        .from('google_calendar_sync_state')
        .update({
          sync_token: syncToken,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('calendar_id', calendarId);

      if (updateSyncError) {
        console.error('Error updating sync token:', updateSyncError);
      } else {
        console.log(`Sync token updated for calendar ${calendarId}`);
      }
    }

    console.log('Webhook processing completed:', {
      calendar: calendarId,
      processed: processedCount,
      ignored: ignoredCount,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      processed: processedCount,
      ignored: ignoredCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Critical error in webhook handler:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gcal/webhook
 * Health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'webhook_ready',
    message: 'POST events here with Google Calendar webhook headers',
  });
}
