/**
 * CEDRO Invoices API
 * CLEAN ARCHITECTURE - Faturamento e Faturas
 *
 * Handles invoice management, payment tracking, and financial operations
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { Invoice } from './types'

// ============ QUERIES ============

/**
 * Get all invoices
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  return api.executeQuery<Invoice>('invoices', {
    columns: 'id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at',
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get invoices by patient
 */
export async function getInvoicesByPatient(patientId: string): Promise<Invoice[]> {
  return api.executeQuery<Invoice>('invoices', {
    columns: 'id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at',
    filter: [{ key: 'patient_id', value: patientId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get invoices by status
 */
export async function getInvoicesByStatus(
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
): Promise<Invoice[]> {
  return api.executeQuery<Invoice>('invoices', {
    columns: 'id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at',
    filter: [{ key: 'status', value: status }],
    order: { column: 'due_date', ascending: true }
  })
}

/**
 * Get invoices by therapist
 */
export async function getInvoicesByTherapist(therapistId: string): Promise<Invoice[]> {
  return api.executeQuery<Invoice>('invoices', {
    columns: 'id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at',
    filter: [{ key: 'therapist_id', value: therapistId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get invoices by care plan
 */
export async function getInvoicesByCarePlan(carePlanId: string): Promise<Invoice[]> {
  return api.executeQuery<Invoice>('invoices', {
    columns: 'id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at',
    filter: [{ key: 'care_plan_id', value: carePlanId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get single invoice
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  return api.getById<Invoice>('invoices', invoiceId)
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(): Promise<Invoice[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .schema('cedro')
      .from('invoices')
      .select('id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at')
      .eq('status', 'open')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Invoice[]
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
 * Get invoices by date range
 */
export async function getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
  try {
    const startISO = startDate.toISOString().split('T')[0]
    const endISO = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .schema('cedro')
      .from('invoices')
      .select('id, patient_id, appointment_id, care_plan_id, therapist_id, status, amount_cents, currency, due_date, paid_at, asaas_customer_id, asaas_invoice_id, breakdown_json, google_docs_contract_id, contract_generated_at, contract_status, contract_id, created_at, updated_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Invoice[]
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
 * Count invoices by status
 */
export async function countInvoicesByStatus(
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
): Promise<number> {
  return api.count('invoices', [{ key: 'status', value: status }])
}

/**
 * Count overdue invoices
 */
export async function countOverdueInvoices(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { count, error } = await supabase
      .schema('cedro')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .lt('due_date', today)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return count || 0
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
 * Get financial summary
 */
export async function getFinancialSummary(): Promise<{
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  overdueAmount: number
}> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('invoices')
      .select('status, amount_cents, due_date')

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    const today = new Date().toISOString().split('T')[0]
    const summary = {
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      overdueAmount: 0
    }

    ;(data || []).forEach((invoice: any) => {
      summary.totalAmount += invoice.amount_cents || 0

      if (invoice.status === 'paid' || invoice.status === 'partial') {
        summary.paidAmount += invoice.amount_cents || 0
      } else {
        summary.unpaidAmount += invoice.amount_cents || 0

        if (invoice.due_date && invoice.due_date < today) {
          summary.overdueAmount += invoice.amount_cents || 0
        }
      }
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
 * Create invoice
 */
export async function createInvoice(
  data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
): Promise<Invoice> {
  return api.insert<Invoice>('invoices', data)
}

/**
 * Update invoice
 */
export async function updateInvoice(
  invoiceId: string,
  data: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>
): Promise<Invoice> {
  return api.update<Invoice>('invoices', invoiceId, data)
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
): Promise<Invoice> {
  return updateInvoice(invoiceId, { status })
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(invoiceId: string): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    status: 'paid',
    paid_at: new Date().toISOString()
  })
}

/**
 * Delete invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  return api.delete('invoices', invoiceId)
}

/**
 * Bulk update invoices status
 */
export async function bulkUpdateInvoicesStatus(
  invoiceIds: string[],
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('invoices')
      .update({ status })
      .in('id', invoiceIds)

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

/**
 * Sync invoice with external payment processor (Asaas)
 */
export async function syncInvoiceWithAsaas(
  invoiceId: string,
  asaasInvoiceId: string,
  asaasCustomerId: string
): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    asaas_invoice_id: asaasInvoiceId,
    asaas_customer_id: asaasCustomerId
  })
}

/**
 * Generate invoice contract
 */
export async function generateInvoiceContract(
  invoiceId: string,
  contractId: string,
  googleDocsId: string
): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    contract_id: contractId,
    google_docs_contract_id: googleDocsId,
    contract_generated_at: new Date().toISOString(),
    contract_status: 'generated'
  })
}
