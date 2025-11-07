'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Copy, Clock } from 'lucide-react'
import type { TherapistSchedule } from '@/data/agenda'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
]

interface CopyScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: TherapistSchedule
  onCopy: (targetWeekdays: number[]) => void
  existingWeekdays: number[]
}

export function CopyScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onCopy,
  existingWeekdays
}: CopyScheduleDialogProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleCopy = () => {
    onCopy(selectedDays)
    setSelectedDays([])
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedDays([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copiar Horário
          </DialogTitle>
          <DialogDescription>
            Selecione os dias da semana para onde deseja copiar este horário
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
          <div className="text-sm font-medium">Horário a ser copiado:</div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {schedule.start_time} - {schedule.end_time}
            </span>
          </div>
          {schedule.note && (
            <div className="text-sm text-muted-foreground">{schedule.note}</div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Selecione os dias de destino:</Label>
          {DAYS_OF_WEEK.map((day) => {
            const isSourceDay = day.value === schedule.weekday
            const hasExisting = existingWeekdays.includes(day.value)

            return (
              <div
                key={day.value}
                className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50"
              >
                <Checkbox
                  id={`day-${day.value}`}
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                  disabled={isSourceDay}
                />
                <Label
                  htmlFor={`day-${day.value}`}
                  className="flex-1 cursor-pointer"
                >
                  {day.label}
                  {isSourceDay && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (origem)
                    </span>
                  )}
                  {!isSourceDay && hasExisting && (
                    <span className="ml-2 text-xs text-amber-600">
                      (já possui horários)
                    </span>
                  )}
                </Label>
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCopy} disabled={selectedDays.length === 0}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar para {selectedDays.length} dia(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
