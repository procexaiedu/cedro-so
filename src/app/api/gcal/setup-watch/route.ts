/**
 * Setup Google Calendar Watch (Webhook)
 *
 * Configura monitoramento em tempo real para um calendário do Google
 * Cada terapeuta pode ter um único watch ativo por calendário
 *
 * Fluxo:
 * 1. Ler users.google_calendar_id do terapeuta
 * 2. Gerar channel_id (UUID) e channel_token (UUID)
 * 3. Chamar events.watch() na API Google
 * 4. Inserir/atualizar google_calendar_sync_state e google_calendar_channels
 * 5. Não mexer no sync_token ao renovar (reutilizar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { googleCalendarService } from '@/lib/google-calendar/service';
import { v4 as uuidv4 } from 'uuid';

const APP_URL = process.env.APP_URL;

interface SetupWatchRequest {
  therapist_id: string;
}

interface SetupWatchResponse {
  success: boolean;
  message: string;
  channel?: {
    id: string;
    resource_id: string;
    expiration: string;
  };
  error?: string;
}

/**
 * POST /api/gcal/setup-watch
 *
 * Body:
 * {
 *   "therapist_id": "uuid"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Watch configured for calendar X",
 *   "channel": {
 *     "id": "channel-uuid",
 *     "resource_id": "google-resource-id",
 *     "expiration": "2024-11-13T23:24:00Z"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação: se necessário, validar token JWT aqui
    // Por enquanto, assumir que a chamada é autorizada (de rota protegida)

    // Validar APP_URL
    if (!APP_URL) {
      throw new Error('Missing APP_URL environment variable');
    }

    // Criar cliente Supabase (com schema cedro configurado)
    const supabase = createClient();

    const body = (await request.json()) as SetupWatchRequest;
    const { therapist_id } = body;

    if (!therapist_id) {
      return NextResponse.json(
        { success: false, error: 'therapist_id is required' },
        { status: 400 }
      );
    }

    console.log(`Setting up Google Calendar watch for therapist: ${therapist_id}`);

    // 1. Buscar terapeuta e seu Google Calendar
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('id, email, google_calendar_id')
      .eq('id', therapist_id)
      .single();

    if (therapistError || !therapist) {
      console.warn(`Therapist not found: ${therapist_id}`);
      return NextResponse.json(
        {
          success: false,
          error: `Therapist not found or error: ${therapistError?.message}`,
        },
        { status: 404 }
      );
    }

    if (!therapist.google_calendar_id) {
      console.warn(`Therapist has no Google Calendar configured: ${therapist_id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Therapist has no Google Calendar ID configured',
        },
        { status: 400 }
      );
    }

    const calendarId = therapist.google_calendar_id;

    console.log(`Therapist calendar: ${calendarId}`);

    // 2. Gerar channel_id (UUID local) e channel_token (para validação)
    const channelId = uuidv4();
    const channelToken = uuidv4();
    const webhookAddress = `${APP_URL}/api/gcal/webhook`;

    console.log(`Webhook address: ${webhookAddress}`);

    // 3. Chamar events.watch na API Google
    let watchResponse;
    try {
      watchResponse = await googleCalendarService.watchCalendar(
        calendarId,
        webhookAddress,
        channelToken
      );
    } catch (error) {
      console.error(`Failed to watch calendar on Google:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to set up watch on Google Calendar: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
        { status: 500 }
      );
    }

    const resourceId = watchResponse.resourceId;
    // Converter expiration de timestamp em ms para ISO string
    const expiration = watchResponse.expiration
      ? new Date(parseInt(watchResponse.expiration)).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Fallback para 24h a partir de agora

    // 4. Inserir/atualizar google_calendar_sync_state (se não existe)
    const { error: syncStateError } = await supabase
      .from('google_calendar_sync_state')
      .upsert(
        {
          calendar_id: calendarId,
          sync_token: null, // Será preenchido no primeiro webhook
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'calendar_id' }
      );

    if (syncStateError) {
      console.error(`Error upserting sync state:`, syncStateError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create sync state: ${syncStateError.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Inserir/atualizar google_calendar_channels
    // Se já existir channel para este terapeuta/calendário, deletar o antigo
    await supabase
      .from('google_calendar_channels')
      .delete()
      .eq('therapist_id', therapist_id)
      .eq('calendar_id', calendarId);

    const { error: channelError } = await supabase
      .from('google_calendar_channels')
      .insert({
        therapist_id,
        calendar_id: calendarId,
        channel_id: channelId,
        resource_id: resourceId,
        channel_token: channelToken,
        expiration,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (channelError) {
      console.error(`Error inserting channel:`, channelError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save channel: ${channelError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(`Watch configured successfully:`, {
      therapist_id,
      calendar_id: calendarId,
      channel_id: channelId,
      resource_id: resourceId,
      expiration,
    });

    return NextResponse.json({
      success: true,
      message: `Watch configured for calendar ${calendarId}`,
      channel: {
        id: channelId,
        resource_id: resourceId,
        expiration,
      },
    });
  } catch (error) {
    console.error('Critical error in setup-watch:', error);

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
 * GET /api/gcal/setup-watch?therapist_id=uuid
 * Verificar status do watch
 */
export async function GET(request: NextRequest) {
  try {
    // Criar cliente Supabase (com schema cedro configurado)
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_id');

    if (!therapistId) {
      return NextResponse.json(
        { error: 'therapist_id is required' },
        { status: 400 }
      );
    }

    const { data: channels } = await supabase
      .from('google_calendar_channels')
      .select('*, google_calendar_sync_state(*)')
      .eq('therapist_id', therapistId);

    return NextResponse.json({
      therapist_id: therapistId,
      channels: channels || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
