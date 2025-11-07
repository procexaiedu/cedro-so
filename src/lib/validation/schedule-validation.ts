/**
 * Schedule validation utilities
 */

import type { TherapistSchedule } from '@/data/agenda'

export interface TimeSlot {
  start_time: string
  end_time: string
}

export interface ScheduleOverlap {
  hasOverlap: boolean
  conflictingSchedules: TherapistSchedule[]
  message?: string
}

/**
 * Check if two time slots overlap
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Convert time strings to comparable numbers (e.g., "09:00" -> 900)
  const start1 = timeToMinutes(slot1.start_time)
  const end1 = timeToMinutes(slot1.end_time)
  const start2 = timeToMinutes(slot2.start_time)
  const end2 = timeToMinutes(slot2.end_time)

  // Check for overlap: slot1 starts before slot2 ends AND slot1 ends after slot2 starts
  return start1 < end2 && end1 > start2
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Check if a schedule overlaps with existing schedules for the same weekday
 */
export function checkScheduleOverlap(
  newSchedule: TimeSlot & { weekday: number; id?: string },
  existingSchedules: TherapistSchedule[]
): ScheduleOverlap {
  const conflictingSchedules = existingSchedules.filter((existing) => {
    // Skip self when editing
    if (newSchedule.id && existing.id === newSchedule.id) {
      return false
    }

    // Only check schedules for the same weekday
    if (existing.weekday !== newSchedule.weekday) {
      return false
    }

    return timeSlotsOverlap(newSchedule, existing)
  })

  const hasOverlap = conflictingSchedules.length > 0

  let message: string | undefined
  if (hasOverlap) {
    const conflictTimes = conflictingSchedules
      .map((s) => `${s.start_time} - ${s.end_time}`)
      .join(', ')
    message = `Conflito com horário(s) existente(s): ${conflictTimes}`
  }

  return {
    hasOverlap,
    conflictingSchedules,
    message
  }
}

/**
 * Validate time range (end must be after start)
 */
export function validateTimeRange(startTime: string, endTime: string): {
  isValid: boolean
  message?: string
} {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (endMinutes <= startMinutes) {
    return {
      isValid: false,
      message: 'O horário de fim deve ser posterior ao horário de início'
    }
  }

  return { isValid: true }
}

/**
 * Check if schedule duration exceeds a certain threshold (e.g., 12 hours)
 */
export function validateScheduleDuration(
  startTime: string,
  endTime: string,
  maxHours: number = 12
): {
  isValid: boolean
  isWarning: boolean
  message?: string
} {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const durationMinutes = endMinutes - startMinutes
  const durationHours = durationMinutes / 60

  if (durationMinutes <= 0) {
    return {
      isValid: false,
      isWarning: false,
      message: 'Duração inválida'
    }
  }

  if (durationHours > maxHours) {
    return {
      isValid: true,
      isWarning: true,
      message: `Atenção: jornada de ${durationHours.toFixed(1)}h é muito longa`
    }
  }

  return {
    isValid: true,
    isWarning: false
  }
}

/**
 * Format time validation errors for display
 */
export function formatValidationError(
  timeRangeValidation: ReturnType<typeof validateTimeRange>,
  durationValidation: ReturnType<typeof validateScheduleDuration>,
  overlapValidation?: ScheduleOverlap
): string | undefined {
  const errors: string[] = []

  if (!timeRangeValidation.isValid && timeRangeValidation.message) {
    errors.push(timeRangeValidation.message)
  }

  if (!durationValidation.isValid && durationValidation.message) {
    errors.push(durationValidation.message)
  }

  if (overlapValidation?.hasOverlap && overlapValidation.message) {
    errors.push(overlapValidation.message)
  }

  return errors.length > 0 ? errors.join('. ') : undefined
}

/**
 * Get warning message (non-blocking)
 */
export function getValidationWarning(
  durationValidation: ReturnType<typeof validateScheduleDuration>
): string | undefined {
  if (durationValidation.isWarning && durationValidation.message) {
    return durationValidation.message
  }

  return undefined
}
