'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { useSupabase } from '@/providers/supabase-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { 
  type DashboardStats, 
  type ProximaConsulta, 
  type DashboardAlert,
  getDashboardStats, 
  getProximasConsultas, 
  getDashboardAlerts,
  formatCurrency 
} from '@/data/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const { user, cedroUser } = useSupabase()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proximasConsultas, setProximasConsultas] = useState<ProximaConsulta[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && cedroUser) {
      loadDashboardData()
    }
  }, [user, cedroUser])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Extrair therapist_id se o usuário for terapeuta
      const therapistId = cedroUser?.role === 'therapist' ? cedroUser.id : undefined

      const [statsData, consultasData, alertsData] = await Promise.all([
        getDashboardStats(therapistId),
        getProximasConsultas(therapistId),
        getDashboardAlerts(therapistId)
      ])

      setStats(statsData)
      setProximasConsultas(consultasData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.consultasHoje || 0}</div>
              )}
              {loading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {stats?.consultasHojeVariacao || 'Dados indisponíveis'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pacientesAtivos || 0}</div>
              )}
              {loading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {stats?.pacientesAtivosVariacao || 'Dados indisponíveis'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats?.receitaMensal || 0)}</div>
              )}
              {loading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {stats?.receitaMensalVariacao || 'Dados indisponíveis'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.taxaOcupacao || 0}%</div>
              )}
              {loading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {stats?.taxaOcupacaoVariacao || 'Dados indisponíveis'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Próximas Consultas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
              <CardDescription>Agendamentos para hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))
                ) : proximasConsultas.length > 0 ? (
                  proximasConsultas.map((consulta) => (
                    <div key={consulta.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{consulta.patient}</p>
                          <p className="text-sm text-gray-500">{consulta.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{consulta.time}</span>
                        <Badge 
                          variant={
                            consulta.status === 'confirmado' ? 'default' :
                            consulta.status === 'pendente' ? 'secondary' : 'destructive'
                          }
                        >
                          {consulta.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhuma consulta agendada para hoje</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/agenda')}
                >
                  Ver todos os agendamentos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => router.push('/pacientes?new=true')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/agenda')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Consulta
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/financeiro')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Pagamento
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      3 pacientes com consultas em atraso
                    </p>
                    <p className="text-xs text-yellow-600">
                      Verificar reagendamentos
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Backup automático realizado
                    </p>
                    <p className="text-xs text-blue-600">
                      Última atualização: hoje às 03:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}