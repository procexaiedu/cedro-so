import { supabase } from '@/lib/supabase'

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'todos'

export type Invoice = {
  id: string
  patient_id: string
  therapist_id: string | null
  appointment_id: string | null
  care_plan_id: string | null
  status: InvoiceStatus
  amount_cents: number
  currency: string
  due_date: string | null
  paid_at: string | null
  asaas_customer_id: string | null
  asaas_invoice_id: string | null
  breakdown_json: any
  created_at: string
  updated_at: string
  // Joined data
  patient_name?: string
  therapist_name?: string
  paid_amount_cents?: number
}

export type Payment = {
  id: string
  invoice_id: string
  amount_cents: number
  method: string | null
  status: string | null
  asaas_payment_id: string | null
  gateway_payload_json: any
  paid_at: string | null
  created_at: string
  updated_at: string
}

export type InvoiceFilters = {
  status?: InvoiceStatus
  startDate?: string
  endDate?: string
  therapistId?: string
  patientName?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type InvoiceListResponse = {
  data: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Lista faturas com filtros e paginação
 */
export async function getInvoices(
  filters: InvoiceFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<InvoiceListResponse> {
  const { page, limit } = pagination
  const offset = (page - 1) * limit

  let query = supabase
    .schema('cedro')
    .from('vw_invoice_basic')
    .select(`
      invoice_id,
      patient_id,
      therapist_id,
      status,
      amount_cents,
      due_date,
      paid_at,
      paid_amount_cents,
      patients!inner(full_name),
      users(name)
    `, { count: 'exact' })

  // Aplicar filtros
  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }

  if (filters.startDate && filters.endDate) {
    query = query.gte('due_date', filters.startDate).lte('due_date', filters.endDate)
  }

  if (filters.therapistId) {
    query = query.eq('therapist_id', filters.therapistId)
  }

  if (filters.patientName) {
    query = query.ilike('patients.full_name', `%${filters.patientName}%`)
  }

  // Ordenação e paginação
  query = query
    .order('due_date', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Erro ao buscar faturas:', error)
    throw new Error('Erro ao buscar faturas')
  }

  const invoices: Invoice[] = (data || []).map((item: any) => ({
    id: item.invoice_id,
    patient_id: item.patient_id,
    therapist_id: item.therapist_id,
    status: item.status,
    amount_cents: item.amount_cents,
    due_date: item.due_date,
    paid_at: item.paid_at,
    paid_amount_cents: item.paid_amount_cents || 0,
    patient_name: item.patients?.full_name,
    therapist_name: item.users?.name,
    appointment_id: null,
    care_plan_id: null,
    currency: 'BRL',
    asaas_customer_id: null,
    asaas_invoice_id: null,
    breakdown_json: {},
    created_at: '',
    updated_at: ''
  }))

  const totalPages = Math.ceil((count || 0) / limit)

  return {
    data: invoices,
    total: count || 0,
    page,
    limit,
    totalPages
  }
}

/**
 * Busca detalhes de uma fatura específica
 */
export async function getInvoiceDetails(invoiceId: string): Promise<{
  invoice: Invoice | null
  payments: Payment[]
}> {
  // Buscar fatura
  const { data: invoiceData, error: invoiceError } = await supabase
    .schema('cedro')
    .from('invoices')
    .select(`
      *,
      patients(full_name),
      users(name)
    `)
    .eq('id', invoiceId)
    .single()

  if (invoiceError) {
    console.error('Erro ao buscar fatura:', invoiceError)
    throw new Error('Erro ao buscar fatura')
  }

  // Buscar pagamentos
  const { data: paymentsData, error: paymentsError } = await supabase
    .schema('cedro')
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })

  if (paymentsError) {
    console.error('Erro ao buscar pagamentos:', paymentsError)
    throw new Error('Erro ao buscar pagamentos')
  }

  const invoice: Invoice | null = invoiceData ? {
    id: invoiceData.id,
    patient_id: invoiceData.patient_id,
    therapist_id: invoiceData.therapist_id,
    appointment_id: invoiceData.appointment_id,
    care_plan_id: invoiceData.care_plan_id,
    status: invoiceData.status,
    amount_cents: invoiceData.amount_cents,
    currency: invoiceData.currency,
    due_date: invoiceData.due_date,
    paid_at: invoiceData.paid_at,
    asaas_customer_id: invoiceData.asaas_customer_id,
    asaas_invoice_id: invoiceData.asaas_invoice_id,
    breakdown_json: invoiceData.breakdown_json,
    created_at: invoiceData.created_at,
    updated_at: invoiceData.updated_at,
    patient_name: invoiceData.patients?.full_name,
    therapist_name: invoiceData.users?.name
  } : null

  const payments: Payment[] = paymentsData || []

  return { invoice, payments }
}

/**
 * Busca lista de terapeutas para filtro
 */
export async function getTherapistsForFilter(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .schema('cedro')
    .from('users')
    .select('id, name')
    .eq('role', 'therapist')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Erro ao buscar terapeutas:', error)
    return []
  }

  return data || []
}

/**
 * Formata valor em centavos para moeda brasileira
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

/**
 * Retorna a cor do badge baseada no status
 */
export function getStatusBadgeVariant(status: InvoiceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid':
      return 'default' // verde
    case 'partial':
      return 'secondary' // azul
    case 'overdue':
      return 'destructive' // vermelho
    case 'cancelled':
      return 'outline' // cinza
    default:
      return 'secondary'
  }
}

/**
 * Retorna o texto do status em português
 */
export function getStatusText(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'open':
      return 'Em aberto'
    case 'paid':
      return 'Pago'
    case 'partial':
      return 'Parcial'
    case 'overdue':
      return 'Vencido'
    case 'cancelled':
      return 'Cancelado'
    case 'todos':
      return 'Todos'
    default:
      return status
  }
}