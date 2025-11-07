import { supabase } from '@/lib/supabase'
import type { PeriodType } from '@/components/dashboard/period-selector'

// Helper para calcular datas baseado no período
export function getPeriodDates(period: PeriodType) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case '7d':
      return {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case '30d':
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case '3m':
      return {
        startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case '6m':
      return {
        startDate: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    default:
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
  }
}

export interface DashboardMetrics {
  consultasHoje: number
  pacientesAtivos: number
  receitaMensal: number
  taxaOcupacao: number
  ticketMedio: number
  taxaInadimplencia: number
  noShows: number
  contasReceber: number
  // Variações
  consultasHojeVariacao?: number
  pacientesAtivosVariacao?: number
  receitaMensalVariacao?: number
  taxaOcupacaoVariacao?: number
  ticketMedioVariacao?: number
  contasReceberVariacao?: number
}

export async function getDashboardMetricsExpanded(
  period: PeriodType = '30d',
  therapistId?: string
): Promise<DashboardMetrics> {
  try {
    const { startDate, endDate } = getPeriodDates(period)
    const startDateISO = startDate.toISOString()
    const endDateISO = endDate.toISOString()

    // Consultas no período
    let appointmentsQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_at', startDateISO)
      .lt('start_at', endDateISO)

    if (therapistId) {
      appointmentsQuery = appointmentsQuery.eq('therapist_id', therapistId)
    }

    const { count: consultasHoje } = await appointmentsQuery

    // Pacientes únicos no período
    let pacientesQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('patient_id')
      .gte('start_at', startDateISO)
      .lt('start_at', endDateISO)

    if (therapistId) {
      pacientesQuery = pacientesQuery.eq('therapist_id', therapistId)
    }

    const { data: pacientesData } = await pacientesQuery
    const pacientesAtivos = new Set(pacientesData?.map(a => a.patient_id)).size

    // Receita no período (só paid)
    let invoicesQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('amount_cents')
      .gte('created_at', startDateISO)
      .lt('created_at', endDateISO)
      .eq('status', 'paid')

    if (therapistId) {
      invoicesQuery = invoicesQuery.eq('therapist_id', therapistId)
    }

    const { data: invoicesData } = await invoicesQuery
    const receitaMensal = invoicesData?.reduce((sum, inv) => sum + (inv.amount_cents || 0), 0) || 0

    // Taxa de ocupação (consultas vs slots disponíveis)
    let slotsQuery = supabase
      .schema('cedro')
      .from('therapist_schedules')
      .select('*', { count: 'exact', head: true })

    if (therapistId) {
      slotsQuery = slotsQuery.eq('therapist_id', therapistId)
    }

    const { count: totalSlots } = await slotsQuery
    const diasUteis = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * 5 / 7)
    const slotsEsperados = (totalSlots || 0) * diasUteis
    const taxaOcupacao = slotsEsperados > 0 ? Math.round(((consultasHoje || 0) / slotsEsperados) * 100) : 0

    // Ticket médio (receita / consultas completadas)
    const ticketMedio = (consultasHoje || 0) > 0 ? Math.round(receitaMensal / (consultasHoje || 1)) : 0

    // Taxa de inadimplência (faturas vencidas / total de faturas abertas)
    let overdueInvoicesQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    if (therapistId) {
      overdueInvoicesQuery = overdueInvoicesQuery.eq('therapist_id', therapistId)
    }

    const { count: faturaVencida } = await overdueInvoicesQuery

    let totalInvoicesQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'overdue', 'paid'])

    if (therapistId) {
      totalInvoicesQuery = totalInvoicesQuery.eq('therapist_id', therapistId)
    }

    const { count: totalInvoices } = await totalInvoicesQuery
    const taxaInadimplencia = totalInvoices ? Math.round(((faturaVencida || 0) / totalInvoices) * 100) : 0

    // No-shows
    let noShowsQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'no_show')
      .gte('start_at', startDateISO)
      .lt('start_at', endDateISO)

    if (therapistId) {
      noShowsQuery = noShowsQuery.eq('therapist_id', therapistId)
    }

    const { count: noShows } = await noShowsQuery

    // Contas a receber (invoices open + overdue)
    let contasReceberQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('amount_cents')
      .in('status', ['open', 'overdue'])

    if (therapistId) {
      contasReceberQuery = contasReceberQuery.eq('therapist_id', therapistId)
    }

    const { data: contasReceberData } = await contasReceberQuery
    const contasReceber = contasReceberData?.reduce((sum, inv) => sum + (inv.amount_cents || 0), 0) || 0

    return {
      consultasHoje: consultasHoje || 0,
      pacientesAtivos,
      receitaMensal,
      taxaOcupacao,
      ticketMedio,
      taxaInadimplencia,
      noShows: noShows || 0,
      contasReceber,
      // Variações (podem ser calculadas em outro tempo para comparativa)
      consultasHojeVariacao: 0,
      pacientesAtivosVariacao: 0,
      receitaMensalVariacao: 0,
      taxaOcupacaoVariacao: 0,
      ticketMedioVariacao: 0,
      contasReceberVariacao: 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return {
      consultasHoje: 0,
      pacientesAtivos: 0,
      receitaMensal: 0,
      taxaOcupacao: 0,
      ticketMedio: 0,
      taxaInadimplencia: 0,
      noShows: 0,
      contasReceber: 0,
    }
  }
}

// Dados para gráfico de receita (últimos 6 meses)
export async function getRevenueChartData(therapistId?: string) {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let query = supabase
      .schema('cedro')
      .from('invoices')
      .select('created_at, amount_cents')
      .eq('status', 'paid')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) throw error

    // Agrupar por mês
    const groupedByMonth: Record<string, number> = {}
    data?.forEach((invoice) => {
      const date = new Date(invoice.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      groupedByMonth[monthKey] = (groupedByMonth[monthKey] || 0) + (invoice.amount_cents || 0)
    })

    return Object.entries(groupedByMonth).map(([month, amount]) => ({
      month: new Date(`${month}-01`).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
      revenue: Math.round(amount / 100),
    }))
  } catch (error) {
    console.error('Error fetching revenue chart data:', error)
    return []
  }
}

// Consultas por terapeuta (admin only)
export async function getAppointmentsByTherapist(period: PeriodType = '30d') {
  try {
    const { startDate, endDate } = getPeriodDates(period)
    const startDateISO = startDate.toISOString()
    const endDateISO = endDate.toISOString()

    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .select(`
        therapist_id,
        users (
          name
        )
      `)
      .gte('start_at', startDateISO)
      .lt('start_at', endDateISO)

    if (error) throw error

    // Agrupar por terapeuta
    const grouped: Record<string, { name: string; count: number }> = {}
    data?.forEach((appointment: any) => {
      const therapistId = appointment.therapist_id
      if (!grouped[therapistId]) {
        grouped[therapistId] = {
          name: appointment.users?.name || 'Desconhecido',
          count: 0,
        }
      }
      grouped[therapistId].count++
    })

    return Object.values(grouped).sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error fetching appointments by therapist:', error)
    return []
  }
}

// Funil CRM
export async function getCRMFunnelData() {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('stage')

    if (error) throw error

    const stages: Record<string, number> = {
      lead: 0,
      mql: 0,
      sql: 0,
      won: 0,
      lost: 0,
    }

    data?.forEach((lead: any) => {
      if (lead.stage && stages.hasOwnProperty(lead.stage)) {
        stages[lead.stage]++
      }
    })

    return stages
  } catch (error) {
    console.error('Error fetching CRM funnel:', error)
    return { lead: 0, mql: 0, sql: 0, won: 0, lost: 0 }
  }
}

// Status de pagamentos
export async function getPaymentStatusData(therapistId?: string) {
  try {
    let query = supabase
      .schema('cedro')
      .from('invoices')
      .select('status')

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) throw error

    const statuses: Record<string, number> = {
      draft: 0,
      open: 0,
      paid: 0,
      partial: 0,
      overdue: 0,
      cancelled: 0,
    }

    data?.forEach((invoice: any) => {
      if (invoice.status && statuses.hasOwnProperty(invoice.status)) {
        statuses[invoice.status]++
      }
    })

    return statuses
  } catch (error) {
    console.error('Error fetching payment status:', error)
    return { draft: 0, open: 0, paid: 0, partial: 0, overdue: 0, cancelled: 0 }
  }
}

// Faturas vencidas
export async function getOverdueInvoices(limit = 10, therapistId?: string) {
  try {
    let query = supabase
      .schema('cedro')
      .from('invoices')
      .select(`
        id,
        patient_id,
        amount_cents,
        due_date,
        status,
        patients (
          full_name
        )
      `)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(limit)

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching overdue invoices:', error)
    return []
  }
}

// Leads não convertidos
export async function getUnconvertedLeads(limit = 10) {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('*')
      .in('stage', ['lead', 'mql'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching unconverted leads:', error)
    return []
  }
}

// Pacientes em pausa
export async function getPausedPatients(therapistId?: string) {
  try {
    let query = supabase
      .schema('cedro')
      .from('patients')
      .select(`
        id,
        full_name,
        therapist_id,
        users (
          name
        )
      `)
      .eq('is_on_hold', true)
      .limit(5)

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching paused patients:', error)
    return []
  }
}
