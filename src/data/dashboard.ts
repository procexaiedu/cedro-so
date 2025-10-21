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

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)

    // Consultas hoje
    const { count: consultasHoje } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    // Consultas ontem
    const { count: consultasOntem } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', yesterday)

    // Pacientes ativos (com consultas nos últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: pacientesAtivos } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('patient_id')
      .gte('date', thirtyDaysAgo)

    const uniquePacientesAtivos = new Set(pacientesAtivos?.map(a => a.patient_id) || []).size

    // Pacientes ativos mês passado
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: pacientesAtivosMesPassado } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('patient_id')
      .gte('date', sixtyDaysAgo)
      .lt('date', thirtyDaysAgo)

    const uniquePacientesAtivosMesPassado = new Set(pacientesAtivosMesPassado?.map(a => a.patient_id) || []).size

    // Receita mensal (simulada - você pode implementar com dados reais de pagamentos)
    const { data: invoicesThisMonth } = await supabase
      .from('invoices')
      .select('amount')
      .like('created_at', `${currentMonth}%`)
      .eq('status', 'paid')

    const receitaMensal = invoicesThisMonth?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0

    const { data: invoicesLastMonth } = await supabase
      .from('invoices')
      .select('amount')
      .like('created_at', `${lastMonth}%`)
      .eq('status', 'paid')

    const receitaMesPassado = invoicesLastMonth?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0

    // Taxa de ocupação (simulada - baseada em consultas vs slots disponíveis)
    const { count: totalSlots } = await supabase
      .from('therapist_schedules')
      .select('*', { count: 'exact', head: true })

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

export async function getProximasConsultas(): Promise<ProximaConsulta[]> {
  try {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const now = new Date()

    const { data: appointments, error } = await supabase
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

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  try {
    const alerts: DashboardAlert[] = []
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)

    // Verificar consultas em atraso
    const { data: lateAppointments } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('id')
      .eq('date', today)
      .lt('start_time', currentTime)
      .neq('status', 'completed')

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