'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { ReactNode } from 'react'

export interface KPICardProps {
  title: string
  description?: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  loading?: boolean
  className?: string
}

export function KPICard({
  title,
  description,
  value,
  icon,
  trend,
  loading = false,
  className
}: KPICardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium text-foreground/90">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
          )}
          {trend && (
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`flex items-center gap-1 ${
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUp className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <ArrowDown className="h-3 w-3" strokeWidth={2} />
                )}
                <span className="font-medium">{trend.value}%</span>
              </div>
              <span className="text-foreground/60">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
