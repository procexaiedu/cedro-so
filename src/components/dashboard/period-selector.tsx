'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export type PeriodType = 'today' | '7d' | '30d' | '3m' | '6m' | 'custom'

export interface PeriodSelectorProps {
  value?: PeriodType
  onPeriodChange?: (period: PeriodType) => void
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
]

export function PeriodSelector({ value = '30d', onPeriodChange }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = (searchParams.get('period') as PeriodType) || value

  const handlePeriodChange = (period: PeriodType) => {
    const params = new URLSearchParams(searchParams)
    params.set('period', period)
    router.push(`?${params.toString()}`)
    onPeriodChange?.(period)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PERIOD_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={currentPeriod === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePeriodChange(option.value)}
          className="text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
