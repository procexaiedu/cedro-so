/**
 * CEDRO Care Plans API
 * CLEAN ARCHITECTURE - Planos de Cuidado
 *
 * Handles care plan management, session tracking, and patient treatment plans
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { CarePlan } from './types'

// ============ QUERIES ============

/**
 * Get all care plans
 */
export async function getAllCarePlans(): Promise<CarePlan[]> {
  return api.executeQuery<CarePlan>('care_plans', {
    columns: 'id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at',
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get care plans by patient
 */
export async function getCarePlansByPatient(patientId: string): Promise<CarePlan[]> {
  return api.executeQuery<CarePlan>('care_plans', {
    columns: 'id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at',
    filter: [{ key: 'patient_id', value: patientId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get active care plans by patient
 */
export async function getActiveCarePlansByPatient(patientId: string): Promise<CarePlan[]> {
  return api.executeQuery<CarePlan>('care_plans', {
    columns: 'id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at',
    filter: [
      { key: 'patient_id', value: patientId },
      { key: 'status', value: 'active' }
    ],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get care plans by therapist
 */
export async function getCarePlansByTherapist(therapistId: string): Promise<CarePlan[]> {
  return api.executeQuery<CarePlan>('care_plans', {
    columns: 'id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at',
    filter: [{ key: 'therapist_id', value: therapistId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get care plans by status
 */
export async function getCarePlansByStatus(status: 'active' | 'paused' | 'ended'): Promise<CarePlan[]> {
  return api.executeQuery<CarePlan>('care_plans', {
    columns: 'id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at',
    filter: [{ key: 'status', value: status }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get single care plan
 */
export async function getCarePlanById(planId: string): Promise<CarePlan | null> {
  return api.getById<CarePlan>('care_plans', planId)
}

/**
 * Count care plans by patient
 */
export async function countCarePlansByPatient(patientId: string): Promise<number> {
  return api.count('care_plans', [{ key: 'patient_id', value: patientId }])
}

/**
 * Count active care plans
 */
export async function countActiveCarePlans(): Promise<number> {
  return api.count('care_plans', [{ key: 'status', value: 'active' }])
}

/**
 * Get care plans needing sessions
 * (active plans with used_sessions < total_sessions)
 */
export async function getCarePlansNeedingSessions(): Promise<CarePlan[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('care_plans')
      .select('id, patient_id, therapist_id, service_id, plan_type, total_sessions, used_sessions, price_cents, discount_percent, status, created_at, updated_at')
      .eq('status', 'active')
      .lt('used_sessions', 'total_sessions')
      .order('updated_at', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as CarePlan[]
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
 * Get care plan summary for patient (current active plan progress)
 */
export async function getCarePlanSummaryByPatient(patientId: string): Promise<{
  activePlanCount: number
  totalSessionsScheduled: number
  totalSessionsUsed: number
  remainingSessionsTotal: number
} | null> {
  try {
    const plans = await getActiveCarePlansByPatient(patientId)

    if (plans.length === 0) {
      return null
    }

    const summary = {
      activePlanCount: plans.length,
      totalSessionsScheduled: 0,
      totalSessionsUsed: 0,
      remainingSessionsTotal: 0
    }

    plans.forEach((plan) => {
      summary.totalSessionsScheduled += plan.total_sessions
      summary.totalSessionsUsed += plan.used_sessions
      summary.remainingSessionsTotal += plan.total_sessions - plan.used_sessions
    })

    return summary
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
 * Create care plan
 */
export async function createCarePlan(
  data: Omit<CarePlan, 'id' | 'created_at' | 'updated_at'>
): Promise<CarePlan> {
  return api.insert<CarePlan>('care_plans', data)
}

/**
 * Update care plan
 */
export async function updateCarePlan(
  planId: string,
  data: Partial<Omit<CarePlan, 'id' | 'created_at' | 'updated_at'>>
): Promise<CarePlan> {
  return api.update<CarePlan>('care_plans', planId, data)
}

/**
 * Consume a session from care plan
 */
export async function consumeSessionFromCarePlan(planId: string): Promise<CarePlan> {
  try {
    const plan = await getCarePlanById(planId)

    if (!plan) {
      throw new Error('Care plan not found')
    }

    if (plan.used_sessions >= plan.total_sessions) {
      throw new Error('All sessions have been used')
    }

    return updateCarePlan(planId, {
      used_sessions: plan.used_sessions + 1
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Care plan not found' || error.message === 'All sessions have been used')) {
      throw error
    }
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
 * Update care plan status
 */
export async function updateCarePlanStatus(
  planId: string,
  status: 'active' | 'paused' | 'ended'
): Promise<CarePlan> {
  return updateCarePlan(planId, { status })
}

/**
 * Delete care plan
 */
export async function deleteCarePlan(planId: string): Promise<void> {
  return api.delete('care_plans', planId)
}

/**
 * Bulk update care plans status
 */
export async function bulkUpdateCarePlansStatus(
  planIds: string[],
  status: 'active' | 'paused' | 'ended'
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('care_plans')
      .update({ status })
      .in('id', planIds)

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
