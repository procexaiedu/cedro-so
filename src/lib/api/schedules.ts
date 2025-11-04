/**
 * CEDRO Schedules API
 * CLEAN ARCHITECTURE - Agendas e Disponibilidades
 *
 * Handles therapist schedules and schedule exceptions (blocks/extras)
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { TherapistSchedule, ScheduleException } from './types'

// ============ THERAPIST SCHEDULES ============

/**
 * Get all therapist schedules
 */
export async function getAllTherapistSchedules(): Promise<TherapistSchedule[]> {
  return api.executeQuery<TherapistSchedule>('therapist_schedules', {
    columns: 'id, therapist_id, weekday, start_time, end_time, note, created_at, updated_at',
    order: { column: 'weekday', ascending: true }
  })
}

/**
 * Get therapist schedules by therapist ID
 * Grouped by day of week
 */
export async function getTherapistSchedulesByTherapist(
  therapistId: string
): Promise<Record<number, TherapistSchedule[]>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .select('id, therapist_id, weekday, start_time, end_time, note, created_at, updated_at')
      .eq('therapist_id', therapistId)
      .order('weekday', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    // Group by weekday
    const grouped: Record<number, TherapistSchedule[]> = {}
    ;(data || []).forEach((schedule) => {
      if (!grouped[schedule.weekday]) {
        grouped[schedule.weekday] = []
      }
      grouped[schedule.weekday].push(schedule)
    })

    return grouped
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Get therapist schedule for specific weekday
 */
export async function getTherapistSchedulesByWeekday(
  therapistId: string,
  weekday: number
): Promise<TherapistSchedule[]> {
  return api.executeQuery<TherapistSchedule>('therapist_schedules', {
    columns: 'id, therapist_id, weekday, start_time, end_time, note, created_at, updated_at',
    filter: [
      { key: 'therapist_id', value: therapistId },
      { key: 'weekday', value: String(weekday) }
    ]
  })
}

/**
 * Get single therapist schedule
 */
export async function getTherapistScheduleById(scheduleId: string): Promise<TherapistSchedule | null> {
  return api.getById<TherapistSchedule>('therapist_schedules', scheduleId)
}

// ============ SCHEDULE EXCEPTIONS ============

/**
 * Get all schedule exceptions
 */
export async function getAllScheduleExceptions(): Promise<ScheduleException[]> {
  return api.executeQuery<ScheduleException>('therapist_schedule_exceptions', {
    columns: 'id, therapist_id, date, kind, start_time, end_time, note, created_at',
    order: { column: 'date', ascending: false }
  })
}

/**
 * Get schedule exceptions by therapist
 */
export async function getScheduleExceptionsByTherapist(therapistId: string): Promise<ScheduleException[]> {
  return api.executeQuery<ScheduleException>('therapist_schedule_exceptions', {
    columns: 'id, therapist_id, date, kind, start_time, end_time, note, created_at',
    filter: [{ key: 'therapist_id', value: therapistId }],
    order: { column: 'date', ascending: false }
  })
}

/**
 * Get schedule exceptions by therapist and date range
 */
export async function getScheduleExceptionsByDateRange(
  therapistId: string,
  startDate: Date,
  endDate: Date
): Promise<ScheduleException[]> {
  try {
    const startISO = startDate.toISOString().split('T')[0]
    const endISO = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .select('id, therapist_id, date, kind, start_time, end_time, note, created_at')
      .eq('therapist_id', therapistId)
      .gte('date', startISO)
      .lte('date', endISO)
      .order('date', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as ScheduleException[]
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Get schedule exception by ID
 */
export async function getScheduleExceptionById(exceptionId: string): Promise<ScheduleException | null> {
  return api.getById<ScheduleException>('therapist_schedule_exceptions', exceptionId)
}

/**
 * Check if therapist is available on specific date/time
 */
export async function isTherapistAvailable(
  therapistId: string,
  dateTime: Date
): Promise<boolean> {
  try {
    const dayOfWeek = dateTime.getDay()
    const dateISO = dateTime.toISOString().split('T')[0]
    const timeISO = dateTime.toISOString().split('T')[1].substring(0, 5)

    // Check for blocks on this date
    const { data: blocks, error: blockError } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('date', dateISO)
      .eq('kind', 'block')
      .gte('start_time', timeISO)
      .lt('end_time', timeISO)

    if (blockError) throw blockError

    // If there's a block, not available
    if (blocks && blocks.length > 0) {
      return false
    }

    // Check regular schedule for this day
    const { data: schedules, error: schedError } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('weekday', dayOfWeek)

    if (schedError) throw schedError

    // If no schedules for this day, not available
    if (!schedules || schedules.length === 0) {
      return false
    }

    // Check if time falls within any schedule slot
    const isInSlot = schedules.some((sched) => {
      return timeISO >= sched.start_time && timeISO < sched.end_time
    })

    return isInSlot
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

// ============ MUTATIONS ============

/**
 * Create therapist schedule
 */
export async function createTherapistSchedule(
  data: Omit<TherapistSchedule, 'id' | 'created_at' | 'updated_at'>
): Promise<TherapistSchedule> {
  return api.insert<TherapistSchedule>('therapist_schedules', data)
}

/**
 * Update therapist schedule
 */
export async function updateTherapistSchedule(
  scheduleId: string,
  data: Partial<Omit<TherapistSchedule, 'id' | 'created_at' | 'updated_at'>>
): Promise<TherapistSchedule> {
  return api.update<TherapistSchedule>('therapist_schedules', scheduleId, data)
}

/**
 * Delete therapist schedule
 */
export async function deleteTherapistSchedule(scheduleId: string): Promise<void> {
  return api.delete('therapist_schedules', scheduleId)
}

/**
 * Create schedule exception (block or extra time)
 */
export async function createScheduleException(
  data: Omit<ScheduleException, 'id' | 'created_at'>
): Promise<ScheduleException> {
  return api.insert<ScheduleException>('therapist_schedule_exceptions', data)
}

/**
 * Update schedule exception
 */
export async function updateScheduleException(
  exceptionId: string,
  data: Partial<Omit<ScheduleException, 'id' | 'created_at'>>
): Promise<ScheduleException> {
  return api.update<ScheduleException>('therapist_schedule_exceptions', exceptionId, data)
}

/**
 * Delete schedule exception
 */
export async function deleteScheduleException(exceptionId: string): Promise<void> {
  return api.delete('therapist_schedule_exceptions', exceptionId)
}

/**
 * Bulk delete schedule exceptions
 */
export async function bulkDeleteScheduleExceptions(exceptionIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .delete()
      .in('id', exceptionIds)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}
