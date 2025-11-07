'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Save } from 'lucide-react'
import type { ScheduleException } from '@/data/agenda'

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
]

interface ExceptionEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exception: ScheduleException
  onSave: (exceptionId: string, updates: Partial<ScheduleException>) => void
}

export function ExceptionEditorDialog({
  open,
  onOpenChange,
  exception,
  onSave
}: ExceptionEditorDialogProps) {
  const [formData, setFormData] = useState({
    date: exception.date,
    kind: exception.kind,
    start_time: exception.start_time,
    end_time: exception.end_time,
    note: exception.note || ''
  })

  useEffect(() => {
    if (open) {
      setFormData({
        date: exception.date,
        kind: exception.kind,
        start_time: exception.start_time,
        end_time: exception.end_time,
        note: exception.note || ''
      })
    }
  }, [open, exception])

  const handleSave = () => {
    onSave(exception.id, formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Exceção
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes desta exceção de horário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="kind">Tipo</Label>
            <Select
              value={formData.kind}
              onValueChange={(value: 'block' | 'extra') =>
                setFormData({ ...formData, kind: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Bloqueio</SelectItem>
                <SelectItem value="extra">Horário Extra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Horário de Início</Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) => setFormData({ ...formData, start_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="end-time">Horário de Fim</Label>
              <Select
                value={formData.end_time}
                onValueChange={(value) => setFormData({ ...formData, end_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="note">Observações</Label>
            <Input
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Motivo da exceção..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
