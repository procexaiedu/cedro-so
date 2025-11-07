'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ScheduleException } from '@/data/agenda'

interface ScheduleCalendarViewProps {
  exceptions: ScheduleException[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
}

export function ScheduleCalendarView({
  exceptions,
  onDateSelect,
  selectedDate
}: ScheduleCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay()

  // Create array of days including padding for first week
  const calendarDays: (Date | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ]

  const getExceptionsForDate = (date: Date) => {
    return exceptions.filter((ex) => {
      const exDate = new Date(ex.date)
      return isSameDay(exDate, date)
    })
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="p-2" />
            }

            const dayExceptions = getExceptionsForDate(day)
            const hasBlocks = dayExceptions.some((ex) => ex.kind === 'block')
            const hasExtras = dayExceptions.some((ex) => ex.kind === 'extra')
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrent = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect?.(day)}
                className={`
                  relative p-2 text-sm rounded-lg border transition-colors
                  ${isCurrent ? 'border-primary' : 'border-transparent'}
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                  ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground' : ''}
                `}
              >
                <div className="font-medium">{format(day, 'd')}</div>
                {dayExceptions.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {hasBlocks && (
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    )}
                    {hasExtras && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>Bloqueio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Horário Extra</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
