/**
 * Setup all Google Calendar Webhooks - Cron Endpoint
 *
 * Configura webhooks para TODOS os terapeutas que têm google_calendar_id
 * mas ainda não têm webhook ativo.
 *
 * Fluxo:
 * 1. Buscar terapeutas com google_calendar_id configurado
 * 2. Para cada um, verificar se já tem webhook ativo
 * 3. Se não tiver ou estiver expirado, criar novo webhook
 * 4. Registrar resultado da operação
 *
 * Segurança: Requer CRON_SECRET válido no header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { googleCalendarService } from '@/lib/google-calendar/service';
import { v4 as uuidv4 } from 'uuid';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.APP_URL;

interface TherapistWithCalendar {
  id: string;
  email: string;
  google_calendar_id: string;
}

interface SetupResult {
  therapist_id: string;
  email: string;
  calendar_id: string;
  status: 'created' | 'already_active' | 'error';
  message: string;
}

/**
 * POST /api/cron/setup-all-gcal-webhooks
 * Configura webhooks para todos os terapeutas
 */
export async function POST(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validar APP_URL
    if (!APP_URL) {
      throw new Error('Missing APP_URL environment variable');
    }

    // Criar cliente Supabase (com schema cedro configurado)
    const supabase = createClient();

    console.log('Starting automatic Google Calendar webhook setup for all therapists...');

    // 1. Buscar terapeutas com google_calendar_id configurado
    const { data: therapists, error: therapistError } = await supabase
      .from('users')
      .select('id, email, google_calendar_id')
      .not('google_calendar_id', 'is', null)
      .eq('role', 'therapist');

    if (therapistError) {
      throw new Error(`Failed to fetch therapists: ${therapistError.message}`);
    }

    if (!therapists || therapists.length === 0) {
      console.log('No therapists found with google_calendar_id configured');
      return NextResponse.json({
        success: true,
        message: 'No therapists with google_calendar_id configured',
        results: [],
        stats: {
          total: 0,
          created: 0,
          already_active: 0,
          errors: 0,
        },
      });
    }

    console.log(`Found ${therapists.length} therapists with google_calendar_id configured`);

    const results: SetupResult[] = [];
    let createdCount = 0;
    let alreadyActiveCount = 0;
    let errorCount = 0;

    // 2. Para cada terapeuta, verificar e configurar webhook
    for (const therapist of therapists as TherapistWithCalendar[]) {
      try {
        const { data: existingChannel, error: channelError } = await supabase
          .from('google_calendar_channels')
          .select('*')
          .eq('therapist_id', therapist.id)
          .eq('calendar_id', therapist.google_calendar_id)
          .eq('is_active', true)
          .single();

        // Se já tem webhook ativo e não expirado, pular
        if (existingChannel && !channelError) {
          const expirationDate = new Date(existingChannel.expiration);
          const hoursUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60);

          if (hoursUntilExpiration > 1) {
            // Webhook ainda válido por mais de 1 hora
            results.push({
              therapist_id: therapist.id,
              email: therapist.email,
              calendar_id: therapist.google_calendar_id,
              status: 'already_active',
              message: `Webhook already active, expires in ${Math.round(hoursUntilExpiration)}h`,
            });
            alreadyActiveCount++;
            continue;
          }
        }

        // 3. Criar novo webhook
        const channelId = uuidv4().replace(/-/g, '');
        const channelToken = uuidv4();
        const webhookAddress = `${APP_URL}/api/gcal/webhook`;

        console.log(`Setting up webhook for therapist ${therapist.email} (${therapist.google_calendar_id})`);

        const watchResponse = await googleCalendarService.watchCalendar(
          therapist.google_calendar_id,
          webhookAddress,
          channelToken
        );

        const resourceId = watchResponse.resourceId;
        const expiration = watchResponse.expiration
          ? new Date(parseInt(watchResponse.expiration)).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // 4. Criar/atualizar sync state
        await supabase
          .from('google_calendar_sync_state')
          .upsert(
            {
              calendar_id: therapist.google_calendar_id,
              sync_token: null,
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'calendar_id' }
          );

        // 5. Deletar webhooks antigos
        await supabase
          .from('google_calendar_channels')
          .delete()
          .eq('therapist_id', therapist.id)
          .eq('calendar_id', therapist.google_calendar_id);

        // 6. Inserir novo webhook
        const { error: insertError } = await supabase
          .from('google_calendar_channels')
          .insert({
            therapist_id: therapist.id,
            calendar_id: therapist.google_calendar_id,
            channel_id: channelId,
            resource_id: resourceId,
            channel_token: channelToken,
            expiration,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        results.push({
          therapist_id: therapist.id,
          email: therapist.email,
          calendar_id: therapist.google_calendar_id,
          status: 'created',
          message: `Webhook configured, expires at ${expiration}`,
        });
        createdCount++;

        console.log(`✓ Webhook configured for ${therapist.email}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        results.push({
          therapist_id: therapist.id,
          email: therapist.email,
          calendar_id: therapist.google_calendar_id,
          status: 'error',
          message: errorMessage,
        });
        errorCount++;

        console.error(`✗ Failed to configure webhook for ${therapist.email}: ${errorMessage}`);
      }
    }

    console.log(`Webhook setup complete: ${createdCount} created, ${alreadyActiveCount} already active, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: 'Webhook setup process completed',
      results,
      stats: {
        total: therapists.length,
        created: createdCount,
        already_active: alreadyActiveCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error in setup-all-gcal-webhooks:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup webhooks',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/setup-all-gcal-webhooks
 * Health check - mostra estatísticas dos webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Contar status dos webhooks
    const { data: allChannels } = await supabase
      .from('google_calendar_channels')
      .select('is_active, expiration');

    let activeCount = 0;
    let expiredCount = 0;
    let expiringIn24h = 0;

    if (allChannels) {
      for (const channel of allChannels) {
        if (!channel.is_active) {
          continue;
        }

        const expirationDate = new Date(channel.expiration);
        const hoursUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60);

        if (hoursUntilExpiration <= 0) {
          expiredCount++;
        } else if (hoursUntilExpiration <= 24) {
          expiringIn24h++;
        } else {
          activeCount++;
        }
      }
    }

    return NextResponse.json({
      status: 'healthy',
      webhooks: {
        active: activeCount,
        expiring_in_24h: expiringIn24h,
        expired: expiredCount,
        total: allChannels?.length || 0,
      },
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
