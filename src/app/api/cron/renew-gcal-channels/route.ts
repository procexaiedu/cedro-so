/**
 * Renew Google Calendar Channels - Cron Endpoint
 *
 * Google Calendar webhooks expiram após ~24h
 * Este cron renova channels que estão para expirar
 *
 * Fluxo:
 * 1. Buscar channels que expiram em < 24h
 * 2. Para cada um, chamar events.watch novamente
 * 3. Atualizar google_calendar_channels mantendo sync_token
 *
 * Segurança: Requer CRON_SECRET válido no header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { googleCalendarService } from '@/lib/google-calendar/service';
import { v4 as uuidv4 } from 'uuid';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.APP_URL;

interface ChannelRecord {
  id: string;
  therapist_id: string;
  calendar_id: string;
  channel_id: string;
  resource_id: string;
  channel_token: string;
  expiration: string;
  is_active: boolean;
}

/**
 * POST /api/cron/renew-gcal-channels
 * Renova channels que estão para expirar
 */
export async function POST(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validar APP_URL
    if (!APP_URL) {
      throw new Error('Missing APP_URL environment variable');
    }

    // Criar cliente Supabase após validação (com schema cedro configurado)
    const supabase = createClient();

    console.log('Starting Google Calendar channels renewal...');

    // 1. Buscar channels que expiram em < 24h
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: channelsToRenew, error: fetchError } = await supabase
      .from('google_calendar_channels')
      .select('*')
      .eq('is_active', true)
      .lt('expiration', expirationThreshold.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch channels: ${fetchError.message}`);
    }

    if (!channelsToRenew || channelsToRenew.length === 0) {
      console.log('No channels need renewal');
      return NextResponse.json({
        success: true,
        message: 'No channels need renewal',
        renewed: 0,
      });
    }

    console.log(`${channelsToRenew.length} channels need renewal`);

    const results = {
      renewed: 0,
      failed: 0,
      errors: [] as Array<{ calendarId: string; error: string }>,
    };

    // 2. Renovar cada channel
    for (const channel of channelsToRenew as ChannelRecord[]) {
      try {
        const webhookAddress = `${APP_URL}/api/gcal/webhook`;
        const newChannelToken = uuidv4();
        const newChannelId = uuidv4();

        console.log(`Renewing channel for calendar ${channel.calendar_id}`);

        // Chamar events.watch
        const watchResponse = await googleCalendarService.watchCalendar(
          channel.calendar_id,
          webhookAddress,
          newChannelToken
        );

        // 3. Atualizar canal mantendo sync_token (IMPORTANTE!)
        const { error: updateError } = await supabase
          .from('google_calendar_channels')
          .update({
            channel_id: newChannelId,
            resource_id: watchResponse.resourceId,
            channel_token: newChannelToken,
            expiration: watchResponse.expiration,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id);

        if (updateError) {
          throw new Error(`Failed to update channel: ${updateError.message}`);
        }

        results.renewed++;
        console.log(`Channel renewed for calendar ${channel.calendar_id}`, {
          new_expiration: watchResponse.expiration,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        results.failed++;
        results.errors.push({
          calendarId: channel.calendar_id,
          error: errorMessage,
        });

        console.error(
          `Failed to renew channel for calendar ${channel.calendar_id}:`,
          errorMessage
        );

        // Marcar canal como inativo se falhar renovação
        await supabase
          .from('google_calendar_channels')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id);
      }
    }

    console.log('Channel renewal completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Critical error in channel renewal:', error);

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
 * GET /api/cron/renew-gcal-channels
 * Health check e status dos canais
 */
export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Criar cliente Supabase após validação (com schema cedro configurado)
    const supabase = createClient();

    // Contar status dos canais
    const { data: activeChannels } = await supabase
      .from('google_calendar_channels')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { data: expiringSoon } = await supabase
      .from('google_calendar_channels')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .lt('expiration', expirationThreshold.toISOString());

    return NextResponse.json({
      status: 'healthy',
      active_channels: activeChannels?.length || 0,
      expiring_soon: expiringSoon?.length || 0,
      next_renewal_window: '< 24 hours',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
