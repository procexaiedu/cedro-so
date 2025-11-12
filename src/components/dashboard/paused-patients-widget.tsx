'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { usePausedPatients } from '@/hooks/use-dashboard-expanded'
import { PauseCircle } from 'lucide-react'

export function PausedPatientsWidget({ therapistId }: { therapistId?: string }) {
  const { data, isLoading } = usePausedPatients(therapistId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PauseCircle className="h-5 w-5 text-amber-500" strokeWidth={2} />
            Em Pausa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PauseCircle className="h-5 w-5 text-green-500" strokeWidth={2} />
            Em Pausa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum paciente em pausa</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PauseCircle className="h-5 w-5 text-amber-500" strokeWidth={2} />
          Em Pausa
        </CardTitle>
        <CardDescription>{data.length} paciente(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((patient: any) => (
            <div key={patient.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm font-medium truncate">{patient.full_name}</span>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                Pausa
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
