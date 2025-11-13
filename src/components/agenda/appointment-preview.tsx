'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  User,
  Stethoscope,
  Calendar,
  FileText,
  ExternalLink,
  Edit,
  X
} from 'lucide-react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/hooks/use-appointments-adapter'

interface AppointmentPreviewProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onEdit: (appointment: Appointment) => void
}

const getStatusColor = (status: string) => {
  const colors: Record<string, { badge: string; text: string }> = {
    scheduled: { badge: 'bg-blue-100 text-blue-800', text: 'Agendado' },
    confirmed: { badge: 'bg-cyan-100 text-cyan-800', text: 'Confirmado' },
    completed: { badge: 'bg-green-100 text-green-800', text: 'Concluído' },
    cancelled: { badge: 'bg-red-100 text-red-800', text: 'Cancelado' },
    no_show: { badge: 'bg-gray-100 text-gray-800', text: 'Não Compareceu' },
    rescheduled: { badge: 'bg-yellow-100 text-yellow-800', text: 'Remarcado' }
  }
  return colors[status] || colors.scheduled
}

export function AppointmentPreview({
  appointment,
  isOpen,
  onClose,
  onEdit
}: AppointmentPreviewProps) {
  if (!appointment) return null

  const startDate = parseISO(appointment.start_at)
  const endDate = parseISO(appointment.end_at)
  const durationMinutes = differenceInMinutes(endDate, startDate)
  const durationHours = Math.floor(durationMinutes / 60)
  const durationMins = durationMinutes % 60

  const statusInfo = getStatusColor(appointment.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {appointment.patient_name}
              </DialogTitle>
              <Badge className={`mt-2 ${statusInfo.badge}`}>
                {statusInfo.text}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data e Hora */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">Data e Hora</p>
              <p className="text-sm font-semibold text-gray-900">
                {format(startDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-gray-600">
                {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Duração */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">Duração</p>
              <p className="text-sm font-semibold text-gray-900">
                {durationHours > 0 && `${durationHours}h `}
                {durationMins}min
              </p>
            </div>
          </div>

          {/* Terapeuta */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">Terapeuta</p>
              <p className="text-sm font-semibold text-gray-900">
                {appointment.therapist_name}
              </p>
            </div>
          </div>

          {/* Serviço */}
          {appointment.service_name && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Stethoscope className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Serviço</p>
                <p className="text-sm font-semibold text-gray-900">
                  {appointment.service_name}
                </p>
              </div>
            </div>
          )}

          {/* Summary do Google Calendar */}
          {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Título</p>
                <p className="text-sm font-semibold text-gray-900 italic">
                  &quot;{appointment.summary}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Origem */}
          {appointment.origin === 'google' && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Origem</p>
                <p className="text-sm font-semibold text-blue-900">
                  Google Calendar
                </p>
              </div>
            </div>
          )}

          {/* Notas */}
          {appointment.notes && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <FileText className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">Notas</p>
                <p className="text-sm text-gray-900 break-words">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}

          {/* Link Google Calendar */}
          {appointment.html_link && (
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => window.open(appointment.html_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir no Google Calendar
            </Button>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                onEdit(appointment)
                onClose()
              }}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
