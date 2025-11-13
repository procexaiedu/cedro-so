/**
 * Process Google Calendar Sync Queue - Cron Endpoint
 *
 * Processa jobs pendentes na fila gcal_sync_queue (Cedro → Google Calendar)
 *
 * Fluxo:
 * 1. Buscar lotes de jobs com status='pending'
 * 2. Marcar como 'processing'
 * 3. Executar create/update/delete no Google Calendar
 * 4. Marcar como 'completed' ou incrementar retry_count
 * 5. Com backoff exponencial para falhas
 *
 * Segurança: Requer CRON_SECRET válido no header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { googleCalendarService } from '@/lib/google-calendar/service';
import type { CedroAppointmentForSync } from '@/lib/google-calendar/types';

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 10; // Processar até 10 jobs por execução
const BACKOFF_DELAYS = [2000, 4000, 8000, 16000]; // ms para retry (2s, 4s, 8s, 16s)

interface SyncJob {
  id: string;
  appointment_id: string;
  action: 'create' | 'update' | 'delete';
  status: string;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

/**
 * POST /api/cron/process-gcal-sync
 * Processa fila de sincronização
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

    // Criar cliente Supabase após validação
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Starting Google Calendar sync queue processing...');

    // 1. Buscar lote de jobs pendentes
    const { data: jobs, error: fetchError } = await supabase
      .from('gcal_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch sync queue: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending sync jobs found');
      return NextResponse.json({
        success: true,
        message: 'No pending jobs',
        processed: 0,
      });
    }

    console.log(`Processing ${jobs.length} pending sync jobs...`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
      errors: [] as Array<{ jobId: string; error: string }>,
    };

    // 2. Processar cada job
    for (const job of jobs as SyncJob[]) {
      try {
        // Marcar como processing
        await supabase
          .from('gcal_sync_queue')
          .update({ status: 'processing' })
          .eq('id', job.id);

        // Buscar dados do agendamento com terapeuta
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .select(
            `
            id,
            summary,
            start_at,
            end_at,
            notes,
            patient_id,
            external_event_id,
            external_calendar_id,
            gcal_etag,
            therapist_id,
            therapist:therapist_id (
              id,
              google_calendar_id
            ),
            patient:patient_id (
              name
            )
          `
          )
          .eq('id', job.appointment_id)
          .single();

        if (appointmentError || !appointment) {
          throw new Error(
            `Appointment not found: ${appointmentError?.message || 'unknown'}`
          );
        }

        // Handle therapist as array or object from Supabase
        const therapistData = Array.isArray(appointment.therapist)
          ? appointment.therapist[0]
          : appointment.therapist;

        // Verificar se terapeuta tem Google Calendar configurado
        if (!therapistData?.google_calendar_id) {
          throw new Error(
            `Therapist has no Google Calendar configured (therapist_id: ${appointment.therapist_id})`
          );
        }

        const calendarId = therapistData.google_calendar_id;

        // 3. Executar ação apropriada
        console.log(`Processing job ${job.id}: ${job.action} for appointment ${job.appointment_id}`);

        switch (job.action) {
          case 'create': {
            await googleCalendarService.createEvent(
              appointment as CedroAppointmentForSync,
              calendarId
            );
            break;
          }

          case 'update': {
            await googleCalendarService.updateEvent(
              appointment as CedroAppointmentForSync,
              {
                summary: appointment.summary,
                description: appointment.notes,
                start_at: appointment.start_at,
                end_at: appointment.end_at,
              }
            );
            break;
          }

          case 'delete': {
            if (!appointment.external_event_id) {
              throw new Error('Cannot delete: missing external_event_id');
            }
            await googleCalendarService.deleteEvent(
              calendarId,
              appointment.external_event_id
            );
            break;
          }

          default:
            throw new Error(`Unknown action: ${job.action}`);
        }

        // 4. Marcar como completed
        await supabase
          .from('gcal_sync_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.succeeded++;
        console.log(`Job ${job.id} completed successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Se ainda temos retries disponíveis, reagendar
        if (job.retry_count < job.max_retries) {
          const nextRetryDelay = BACKOFF_DELAYS[job.retry_count] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
          const nextRetryAt = new Date(Date.now() + nextRetryDelay);

          await supabase
            .from('gcal_sync_queue')
            .update({
              status: 'pending', // Volta para pending para nova tentativa
              retry_count: job.retry_count + 1,
              last_error: errorMessage,
              processed_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          results.retried++;
          console.log(
            `Job ${job.id} will retry in ${nextRetryDelay}ms (attempt ${job.retry_count + 1}/${job.max_retries})`
          );
        } else {
          // Max retries atingido, marcar como failed
          await supabase
            .from('gcal_sync_queue')
            .update({
              status: 'failed',
              last_error: errorMessage,
              processed_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          results.failed++;
          results.errors.push({
            jobId: job.id,
            error: errorMessage,
          });

          console.error(`Job ${job.id} failed after ${job.max_retries} retries:`, errorMessage);
        }
      }

      results.processed++;
    }

    console.log('Sync queue processing completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Critical error in sync queue processor:', error);

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
 * GET /api/cron/process-gcal-sync
 * Health check e status da fila
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

    // Criar cliente Supabase após validação
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Contar jobs por status
    const { data: stats } = await supabase
      .from('gcal_sync_queue')
      .select('status', { count: 'exact' });

    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    if (stats) {
      for (const row of stats) {
        statusCounts[row.status as keyof typeof statusCounts]++;
      }
    }

    return NextResponse.json({
      status: 'healthy',
      queue_stats: statusCounts,
      batch_size: BATCH_SIZE,
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
