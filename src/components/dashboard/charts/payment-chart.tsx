'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePaymentStatusData } from '@/hooks/use-dashboard-expanded'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  open: { label: 'Aberta', color: 'text-blue-600 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-800' },
  paid: { label: 'Paga', color: 'text-green-600 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-800' },
  partial: { label: 'Parcial', color: 'text-amber-600 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-800' },
  overdue: { label: 'Vencida', color: 'text-red-600 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-800' },
  cancelled: { label: 'Cancelada', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' },
}

export function PaymentChart({ therapistId }: { therapistId?: string }) {
  const { data, isLoading } = usePaymentStatusData(therapistId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status de Pagamentos</CardTitle>
          <CardDescription>Distribuição de faturas</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status de Pagamentos</CardTitle>
          <CardDescription>Distribuição de faturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statuses = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)

  const total = Object.values(data).reduce((sum, count) => sum + count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status de Pagamentos</CardTitle>
        <CardDescription>Total: {total} faturas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map(([status, count]) => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, color: '', bgColor: '' }
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{count}</span>
                    <span className="text-muted-foreground text-xs ml-2">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.bgColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
