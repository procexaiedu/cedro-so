'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  DollarSignIcon,
  BarChart3,
  PhoneOff
} from 'lucide-react'
import { PeriodSelector, type PeriodType } from '@/components/dashboard/period-selector'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/charts/revenue-chart'
import { TherapistChart } from '@/components/dashboard/charts/therapist-chart'
import { CRMFunnel } from '@/components/dashboard/charts/crm-funnel'
import { PaymentChart } from '@/components/dashboard/charts/payment-chart'
import { OverdueInvoicesTable } from '@/components/dashboard/tables/overdue-invoices'
import { LeadsTable } from '@/components/dashboard/tables/leads-table'
import { PausedPatientsWidget } from '@/components/dashboard/paused-patients-widget'
import { useDashboardMetrics } from '@/hooks/use-dashboard-expanded'

const DashboardContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cedroUser } = useSupabase()
  const period = (searchParams.get('period') as PeriodType) || '30d'

  const therapistId = cedroUser?.role === 'therapist' ? cedroUser.id : undefined
  const isAdmin = cedroUser?.role === 'admin'

  const { data: metrics, isLoading } = useDashboardMetrics(period, therapistId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do seu consultório</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <PeriodSelector value={period} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/agenda')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" strokeWidth={2} />
            Ver Agenda
          </Button>
        </div>

        {/* KPI Cards Grid - 8 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Consultas"
            description={period === 'today' ? 'Hoje' : `Período`}
            value={metrics?.consultasHoje || 0}
            icon={<Calendar className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
            trend={
              metrics?.consultasHojeVariacao
                ? {
                    value: metrics.consultasHojeVariacao,
                    label: 'vs período anterior',
                    isPositive: (metrics.consultasHojeVariacao || 0) >= 0,
                  }
                : undefined
            }
          />

          <KPICard
            title="Pacientes Ativos"
            description="Com consultas"
            value={metrics?.pacientesAtivos || 0}
            icon={<Users className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
            trend={
              metrics?.pacientesAtivosVariacao
                ? {
                    value: metrics.pacientesAtivosVariacao,
                    label: 'vs período anterior',
                    isPositive: (metrics.pacientesAtivosVariacao || 0) >= 0,
                  }
                : undefined
            }
          />

          <KPICard
            title="Receita"
            description={period === 'today' ? 'Hoje' : 'Total período'}
            value={formatCurrency(metrics?.receitaMensal || 0)}
            icon={<DollarSign className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
            trend={
              metrics?.receitaMensalVariacao
                ? {
                    value: metrics.receitaMensalVariacao,
                    label: 'vs período anterior',
                    isPositive: (metrics.receitaMensalVariacao || 0) >= 0,
                  }
                : undefined
            }
          />

          <KPICard
            title="Taxa de Ocupação"
            description="Slots utilizados"
            value={`${metrics?.taxaOcupacao || 0}%`}
            icon={<TrendingUp className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
            trend={
              metrics?.taxaOcupacaoVariacao
                ? {
                    value: metrics.taxaOcupacaoVariacao,
                    label: 'vs período anterior',
                    isPositive: (metrics.taxaOcupacaoVariacao || 0) >= 0,
                  }
                : undefined
            }
          />

          <KPICard
            title="Ticket Médio"
            description="Por consulta"
            value={formatCurrency(metrics?.ticketMedio || 0)}
            icon={<DollarSignIcon className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
          />

          <KPICard
            title="Taxa de Inadimplência"
            description="Faturas vencidas"
            value={`${metrics?.taxaInadimplencia || 0}%`}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={2} />}
            loading={isLoading}
          />

          <KPICard
            title="No-Shows"
            description="Não comparecimento"
            value={metrics?.noShows || 0}
            icon={<PhoneOff className="h-4 w-4 text-orange-500" strokeWidth={2} />}
            loading={isLoading}
          />

          <KPICard
            title="Contas a Receber"
            description="Pendente de pagamento"
            value={formatCurrency(metrics?.contasReceber || 0)}
            icon={<BarChart3 className="h-4 w-4 text-foreground/60" strokeWidth={2} />}
            loading={isLoading}
            trend={
              metrics?.contasReceberVariacao
                ? {
                    value: metrics.contasReceberVariacao,
                    label: 'vs período anterior',
                    isPositive: (metrics.contasReceberVariacao || 0) <= 0, // Menor é melhor
                  }
                : undefined
            }
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart therapistId={therapistId} />
          {isAdmin && <TherapistChart period={period} />}
          <CRMFunnel />
          <PaymentChart therapistId={therapistId} />
        </div>

        {/* Tables & Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <OverdueInvoicesTable therapistId={therapistId} />
            <LeadsTable />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <PausedPatientsWidget therapistId={therapistId} />

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h3 className="font-semibold text-sm">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => router.push('/pacientes?new=true')}
                >
                  <Users className="mr-2 h-3 w-3" strokeWidth={2} />
                  Novo Paciente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => router.push('/agenda')}
                >
                  <Calendar className="mr-2 h-3 w-3" strokeWidth={2} />
                  Agendar Consulta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => router.push('/financeiro')}
                >
                  <DollarSign className="mr-2 h-3 w-3" strokeWidth={2} />
                  Registrar Pagamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
