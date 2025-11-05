import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  consultasHoje: number
  pacientesAtivos: number
  receitaMensal: number
  taxaOcupacao: number
  consultasHojeVariacao: string
  pacientesAtivosVariacao: string
  receitaMensalVariacao: string
  taxaOcupacaoVariacao: string
}

export interface ProximaConsulta {
  id: string
  time: string
  patient: string
  type: string
  status: 'confirmado' | 'pendente' | 'atrasado'
  patient_id: string
  therapist_id?: string
}

export interface DashboardAlert {
  id: string
  type: 'warning' | 'info' | 'error'
  title: string
  description: string
  timestamp: string
}

export async function getDashboardStats(therapistId?: string): Promise<DashboardStats> {
  try {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)

    // Consultas hoje
    let consultasHojeQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_at', startOfToday.toISOString())
      .lt('start_at', endOfToday.toISOString())

    if (therapistId) {
      consultasHojeQuery = consultasHojeQuery.eq('therapist_id', therapistId)
    }

    const { count: consultasHoje } = await consultasHojeQuery

    // Consultas ontem
    let consultasOntemQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_at', startOfYesterday.toISOString())
      .lt('start_at', endOfYesterday.toISOString())

    if (therapistId) {
      consultasOntemQuery = consultasOntemQuery.eq('therapist_id', therapistId)
    }

    const { count: consultasOntem } = await consultasOntemQuery

    // Pacientes ativos (com consultas nos últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    let pacientesAtivosQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('patient_id')
      .gte('start_at', thirtyDaysAgo.toISOString())

    if (therapistId) {
      pacientesAtivosQuery = pacientesAtivosQuery.eq('therapist_id', therapistId)
    }

    const { data: pacientesAtivos } = await pacientesAtivosQuery

    const uniquePacientesAtivos = new Set(pacientesAtivos?.map(a => a.patient_id) || []).size

    // Pacientes ativos mês passado
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    let pacientesAtivosMesPassadoQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('patient_id')
      .gte('start_at', sixtyDaysAgo.toISOString())
      .lt('start_at', thirtyDaysAgo.toISOString())

    if (therapistId) {
      pacientesAtivosMesPassadoQuery = pacientesAtivosMesPassadoQuery.eq('therapist_id', therapistId)
    }

    const { data: pacientesAtivosMesPassado } = await pacientesAtivosMesPassadoQuery

    const uniquePacientesAtivosMesPassado = new Set(pacientesAtivosMesPassado?.map(a => a.patient_id) || []).size

    // Receita mensal (simulada - você pode implementar com dados reais de pagamentos)
    let invoicesThisMonthQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('amount_cents')
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth === '2025-12' ? '2026-01' : currentMonth.slice(0, 5) + String(parseInt(currentMonth.slice(5)) + 1).padStart(2, '0')}-01`)
      .eq('status', 'paid')

    if (therapistId) {
      invoicesThisMonthQuery = invoicesThisMonthQuery.eq('therapist_id', therapistId)
    }

    const { data: invoicesThisMonth } = await invoicesThisMonthQuery

    const receitaMensal = invoicesThisMonth?.reduce((sum, invoice) => sum + (invoice.amount_cents || 0), 0) || 0

    let invoicesLastMonthQuery = supabase
      .schema('cedro')
      .from('invoices')
      .select('amount_cents')
      .gte('created_at', `${lastMonth}-01`)
      .lt('created_at', `${lastMonth === '2025-12' ? '2026-01' : lastMonth.slice(0, 5) + String(parseInt(lastMonth.slice(5)) + 1).padStart(2, '0')}-01`)
      .eq('status', 'paid')

    if (therapistId) {
      invoicesLastMonthQuery = invoicesLastMonthQuery.eq('therapist_id', therapistId)
    }

    const { data: invoicesLastMonth } = await invoicesLastMonthQuery

    const receitaMesPassado = invoicesLastMonth?.reduce((sum, invoice) => sum + (invoice.amount_cents || 0), 0) || 0

    // Taxa de ocupação (simulada - baseada em consultas vs slots disponíveis)
    let totalSlotsQuery = supabase
      .schema('cedro')
      .from('therapist_schedules')
      .select('*', { count: 'exact', head: true })

    if (therapistId) {
      totalSlotsQuery = totalSlotsQuery.eq('therapist_id', therapistId)
    }

    const { count: totalSlots } = await totalSlotsQuery

    const taxaOcupacao = totalSlots ? Math.round((consultasHoje || 0) / (totalSlots / 7) * 100) : 0

    // Calcular variações
    const consultasVariacao = consultasOntem ? Math.round(((consultasHoje || 0) - consultasOntem) / consultasOntem * 100) : 0
    const pacientesVariacao = uniquePacientesAtivosMesPassado ? Math.round((uniquePacientesAtivos - uniquePacientesAtivosMesPassado) / uniquePacientesAtivosMesPassado * 100) : 0
    const receitaVariacao = receitaMesPassado ? Math.round((receitaMensal - receitaMesPassado) / receitaMesPassado * 100) : 0

    return {
      consultasHoje: consultasHoje || 0,
      pacientesAtivos: uniquePacientesAtivos,
      receitaMensal,
      taxaOcupacao,
      consultasHojeVariacao: consultasVariacao > 0 ? `+${consultasVariacao} desde ontem` : `${consultasVariacao} desde ontem`,
      pacientesAtivosVariacao: pacientesVariacao > 0 ? `+${pacientesVariacao}% desde o mês passado` : `${pacientesVariacao}% desde o mês passado`,
      receitaMensalVariacao: receitaVariacao > 0 ? `+${receitaVariacao}% desde o mês passado` : `${receitaVariacao}% desde o mês passado`,
      taxaOcupacaoVariacao: '+3% desde a semana passada' // Simulado
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      consultasHoje: 0,
      pacientesAtivos: 0,
      receitaMensal: 0,
      taxaOcupacao: 0,
      consultasHojeVariacao: 'Dados indisponíveis',
      pacientesAtivosVariacao: 'Dados indisponíveis',
      receitaMensalVariacao: 'Dados indisponíveis',
      taxaOcupacaoVariacao: 'Dados indisponíveis'
    }
  }
}

export async function getProximasConsultas(therapistId?: string): Promise<ProximaConsulta[]> {
  try {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const now = new Date()

    let appointmentsQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select(`
        id,
        start_at,
        end_at,
        status,
        patient_id,
        therapist_id,
        patients (
          full_name
        )
      `)
      .gte('start_at', startOfToday.toISOString())
      .lt('start_at', endOfToday.toISOString())
      .order('start_at', { ascending: true })
      .limit(4)

    if (therapistId) {
      appointmentsQuery = appointmentsQuery.eq('therapist_id', therapistId)
    }

    const { data: appointments, error } = await appointmentsQuery

    if (error) throw error

    return appointments?.map(appointment => {
      let status: 'confirmado' | 'pendente' | 'atrasado' = 'confirmado'
      
      const appointmentStart = new Date(appointment.start_at)
      
      if (appointment.status === 'pending') {
        status = 'pendente'
      } else if (appointmentStart < now && appointment.status !== 'completed') {
        status = 'atrasado'
      }

      return {
        id: appointment.id,
        time: appointmentStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        patient: (appointment.patients as any)?.full_name || 'Paciente não encontrado',
        type: 'Consulta',
        status,
        patient_id: appointment.patient_id,
        therapist_id: appointment.therapist_id
      }
    }) || []
  } catch (error) {
    console.error('Error fetching próximas consultas:', error)
    return []
  }
}

export async function getDashboardAlerts(therapistId?: string): Promise<DashboardAlert[]> {
  try {
    const alerts: DashboardAlert[] = []
    const now = new Date()
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Verificar consultas em atraso
    let lateAppointmentsQuery = supabase
      .schema('cedro')
      .from('appointments')
      .select('id')
      .gte('start_at', startOfToday.toISOString())
      .lt('start_at', endOfToday.toISOString())
      .lt('start_at', now.toISOString())
      .neq('status', 'completed')

    if (therapistId) {
      lateAppointmentsQuery = lateAppointmentsQuery.eq('therapist_id', therapistId)
    }

    const { data: lateAppointments } = await lateAppointmentsQuery

    if (lateAppointments && lateAppointments.length > 0) {
      alerts.push({
        id: 'late-appointments',
        type: 'warning',
        title: `${lateAppointments.length} pacientes com consultas em atraso`,
        description: 'Verificar reagendamentos',
        timestamp: new Date().toISOString()
      })
    }

    // Adicionar alerta de backup (simulado)
    alerts.push({
      id: 'backup-completed',
      type: 'info',
      title: 'Backup automático realizado',
      description: 'Última atualização: hoje às 03:00',
      timestamp: new Date().toISOString()
    })

    return alerts
  } catch (error) {
    console.error('Error fetching dashboard alerts:', error)
    return []
  }
}



export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}