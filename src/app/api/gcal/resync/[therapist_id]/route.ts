/**
 * Manual Google Calendar Resync
 *
 * Força sincronização completa da janela móvel (últimos 30 dias + próximos 365)
 * Útil quando syncToken expira (410) ou para sincronização manual
 *
 * Fluxo:
 * 1. Buscar terapeuta e seu google_calendar_id
 * 2. Fazer list completo com timeMin/timeMax
 * 3. Processar eventos como webhook (mesmo código)
 * 4. Atualizar sync_state.sync_token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { googleCalendarService } from '@/lib/google-calendar/service';

interface ResyncParams {
  therapist_id: string;
}

interface ResyncResponse {
  success: boolean;
  message: string;
  processed?: number;
  ignored?: number;
  errors?: number;
}

/**
 * GET /api/gcal/resync/[therapist_id]
 *
 * Params:
 * - therapist_id: UUID do terapeuta
 *
 * Query params:
 * - days_back: Dias para voltar (default 30)
 * - days_forward: Dias para frente (default 365)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Resync completed",
 *   "processed": 15,
 *   "ignored": 2,
 *   "errors": 0
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: ResyncParams }
) {
  try {
    // Criar cliente Supabase (com schema cedro configurado)
    const supabase = createClient();

    const { therapist_id } = context.params;
    const { searchParams } = new URL(request.url);

    const daysBack = parseInt(searchParams.get('days_back') || '30');
    const daysForward = parseInt(searchParams.get('days_forward') || '365');

    console.log(`Starting manual resync for therapist: ${therapist_id}`, {
      daysBack,
      daysForward,
    });

    // 1. Buscar terapeuta
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('id, email, google_calendar_id')
      .eq('id', therapist_id)
      .single();

    if (therapistError || !therapist) {
      return NextResponse.json(
        {
          success: false,
          message: `Therapist not found: ${therapistError?.message}`,
        },
        { status: 404 }
      );
    }

    if (!therapist.google_calendar_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Therapist has no Google Calendar configured',
        },
        { status: 400 }
      );
    }

    const calendarId = therapist.google_calendar_id;

    // 2. Fazer list completo
    const timeMin = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + daysForward * 24 * 60 * 60 * 1000).toISOString();

    console.log(`Fetching events from ${timeMin} to ${timeMax}`);

    const listResult = await googleCalendarService.listEvents(calendarId, {
      singleEvents: true,
      timeMin,
      timeMax,
    });

    const events = listResult.events;
    const newSyncToken = listResult.nextSyncToken;

    console.log(`Retrieved ${events.length} events, nextSyncToken available`);

    // 3. Processar eventos (mesmo código do webhook)
    let processedCount = 0;
    let ignoredCount = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const event of events) {
      try {
        // Ignorar transparent
        if (event.transparency === 'transparent') {
          ignoredCount++;
          continue;
        }

        // Mapear
        const cedroData = await googleCalendarService.mapGoogleEventToCedro(event);

        if (!cedroData) {
          ignoredCount++;
          continue;
        }

        // Handle cancelled
        if (cedroData.status === 'cancelled') {
          await supabase
            .from('appointments')
            .update({
              status: 'cancelled',
              source_updated_at: cedroData.source_updated_at,
              updated_at: new Date().toISOString(),
            })
            .eq('external_event_id', event.id)
            .eq('external_calendar_id', calendarId);

          processedCount++;
          continue;
        }

        // Upsert
        const upsertData = {
          ...cedroData,
          external_calendar_id: calendarId,
          origin: 'google',
          updated_at: new Date().toISOString(),
        };

        // Check if exists
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('external_event_id', event.id)
          .eq('external_calendar_id', calendarId)
          .single();

        if (existingAppointment) {
          // Update
          await supabase
            .from('appointments')
            .update(upsertData)
            .eq('external_event_id', event.id)
            .eq('external_calendar_id', calendarId);
        } else {
          // Insert
          const { data: therapistChannel } = await supabase
            .from('google_calendar_channels')
            .select('therapist_id')
            .eq('calendar_id', calendarId)
            .single();

          if (therapistChannel) {
            await supabase.from('appointments').insert({
              ...upsertData,
              therapist_id: therapistChannel.therapist_id,
              patient_id: null,
              status: upsertData.status || 'scheduled',
            });
          }
        }

        processedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          eventId: event.id,
          error: errorMessage,
        });
        console.error(`Error processing event ${event.id}:`, errorMessage);
      }
    }

    // 4. Atualizar sync_token
    if (newSyncToken) {
      await supabase
        .from('google_calendar_sync_state')
        .update({
          sync_token: newSyncToken,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('calendar_id', calendarId);

      console.log(`Sync token updated for calendar ${calendarId}`);
    }

    console.log('Resync completed:', {
      calendar: calendarId,
      processed: processedCount,
      ignored: ignoredCount,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Resync completed',
      processed: processedCount,
      ignored: ignoredCount,
      errors: errors.length > 0 ? errors.length : undefined,
    });
  } catch (error) {
    console.error('Error in resync:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
