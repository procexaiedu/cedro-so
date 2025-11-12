'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, AlertCircle, LinkIcon } from 'lucide-react'
import type { Appointment } from '@/hooks/use-appointments-adapter'

type GoogleCalendarInfoProps = {
  appointment: Appointment
  onLinkPatient?: () => void
  isLoadingPatientLink?: boolean
}

/**
 * Componente que exibe informações de sincronização com Google Calendar
 * - Badge de origem (Google Calendar / Cedro)
 * - Link para abrir no Google Calendar
 * - Alerta se paciente não está vinculado (para eventos importados do Google)
 */
export function AppointmentGoogleCalendarInfo({
  appointment,
  onLinkPatient,
  isLoadingPatientLink = false,
}: GoogleCalendarInfoProps) {
  const isFromGoogle = appointment.origin === 'google'
  const hasLink = appointment.html_link
  const patientNotLinked = isFromGoogle && !appointment.patient_id

  return (
    <div className="space-y-3">
      {/* Origin Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Origem:</span>
        {isFromGoogle ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Google Calendar</span>
            </div>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Cedro</span>
            </div>
          </Badge>
        )}
      </div>

      {/* Google Calendar Link */}
      {hasLink && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Google Calendar:</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={() => window.open(appointment.html_link, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver no Google
          </Button>
        </div>
      )}

      {/* Patient Not Linked Alert */}
      {patientNotLinked && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Paciente não vinculado
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Este agendamento foi importado do Google Calendar. Vincule um paciente para ativar bloqueio de disponibilidade.
            </p>
            {onLinkPatient && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-1 h-7 text-amber-700 hover:text-amber-900"
                onClick={onLinkPatient}
                disabled={isLoadingPatientLink}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Vincular Paciente
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Summary Override Info */}
      {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
        <div>
          <span className="text-sm font-medium text-gray-600">Título (Google):</span>
          <p className="text-sm text-gray-700 mt-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
            {appointment.summary}
          </p>
        </div>
      )}
    </div>
  )
}
