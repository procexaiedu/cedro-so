'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRevenueChartData } from '@/hooks/use-dashboard-expanded'
import { useMemo } from 'react'

export function RevenueChart({ therapistId }: { therapistId?: string }) {
  const { data, isLoading } = useRevenueChartData(therapistId)

  const totalRevenue = useMemo(() => {
    return data?.reduce((sum, item) => sum + item.revenue, 0) || 0
  }, [data])

  const avgRevenue = useMemo(() => {
    return data && data.length > 0 ? Math.round(totalRevenue / data.length) : 0
  }, [data, totalRevenue])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Simular visualização de gráfico com dados em tabela até implementar Recharts
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita</CardTitle>
        <CardDescription>Últimos 6 meses • Total: R$ {totalRevenue.toLocaleString('pt-BR')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className="text-sm font-semibold">R$ {item.revenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Média mensal</span>
              <span className="font-semibold">R$ {avgRevenue.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
