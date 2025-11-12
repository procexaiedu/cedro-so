'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppointmentsByTherapist } from '@/hooks/use-dashboard-expanded'
import type { PeriodType } from '@/components/dashboard/period-selector'

export function TherapistChart({ period = '30d' }: { period?: PeriodType }) {
  const { data, isLoading } = useAppointmentsByTherapist(period)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas por Terapeuta</CardTitle>
          <CardDescription>Distribuição de agendamentos</CardDescription>
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
          <CardTitle>Consultas por Terapeuta</CardTitle>
          <CardDescription>Distribuição de agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAppointments = data.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...data.map(item => item.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultas por Terapeuta</CardTitle>
        <CardDescription>Total: {totalAppointments} consultas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <span className="text-sm font-semibold ml-2 flex-shrink-0">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all"
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
