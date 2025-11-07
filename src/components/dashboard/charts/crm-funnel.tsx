'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCRMFunnel } from '@/hooks/use-dashboard-expanded'
import { ArrowRight } from 'lucide-react'

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-slate-100 dark:bg-slate-800' },
  mql: { label: 'MQL', color: 'bg-blue-100 dark:bg-blue-900' },
  sql: { label: 'SQL', color: 'bg-amber-100 dark:bg-amber-900' },
  won: { label: 'Won', color: 'bg-green-100 dark:bg-green-900' },
  lost: { label: 'Lost', color: 'bg-red-100 dark:bg-red-900' },
}

export function CRMFunnel() {
  const { data, isLoading } = useCRMFunnel()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas (CRM)</CardTitle>
          <CardDescription>Progressão de leads</CardDescription>
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
          <CardTitle>Funil de Vendas (CRM)</CardTitle>
          <CardDescription>Progressão de leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stages = ['lead', 'mql', 'sql', 'won', 'lost'] as const
  const maxValue = Math.max(...stages.map(stage => data[stage] || 0))
  const totalLeads = stages.reduce((sum, stage) => sum + (data[stage] || 0), 0)

  // Calcular taxa de conversão
  const leadToWon = totalLeads > 0 ? Math.round(((data.won || 0) / (data.lead || 1)) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas (CRM)</CardTitle>
        <CardDescription>Progressão • Taxa conversão: {leadToWon}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const count = data[stage] || 0
            const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0
            const stageInfo = STAGE_LABELS[stage]

            return (
              <div key={stage}>
                <div className={`flex items-center gap-2 p-3 rounded-lg ${stageInfo.color} transition-colors`}>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{stageInfo.label}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-background/50 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-foreground/80 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                {index < stages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" strokeWidth={2} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
