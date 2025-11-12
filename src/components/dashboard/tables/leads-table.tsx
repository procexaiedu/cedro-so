'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUnconvertedLeads } from '@/hooks/use-dashboard-expanded'
import { Phone, Mail, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' },
  mql: { label: 'MQL', color: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100' },
}

export function LeadsTable() {
  const router = useRouter()
  const { data, isLoading } = useUnconvertedLeads(10)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Não Convertidos</CardTitle>
          <CardDescription>Prospectos em aberto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Não Convertidos</CardTitle>
          <CardDescription>Prospectos em aberto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Todos os leads foram convertidos! 🎉</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSourceBadgeColor = (source: string) => {
    const sources: Record<string, string> = {
      website: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
      referral: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
      social: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100',
      ads: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
    }
    return sources[source] || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Não Convertidos</CardTitle>
        <CardDescription>{data.length} prospectos em aberto</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((lead: any) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{lead.name || 'Sem nome'}</p>
                  {lead.source && (
                    <Badge variant="outline" className={`text-xs ${getSourceBadgeColor(lead.source)}`}>
                      {lead.source}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {lead.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" strokeWidth={2} />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" strokeWidth={2} />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className={`${STAGE_LABELS[lead.stage]?.color}`}>
                  {STAGE_LABELS[lead.stage]?.label || lead.stage}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/crm?lead=${lead.id}`)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
