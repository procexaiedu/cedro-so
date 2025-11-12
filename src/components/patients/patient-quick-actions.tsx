'use client'

import React from 'react'
import { Calendar, FileText, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Patient } from '@/data/pacientes'

interface PatientQuickActionsProps {
  patient: Patient
  onSchedule?: () => void
  onViewRecords?: () => void
  onViewDetails?: () => void
  isCompact?: boolean
}

export function PatientQuickActions({
  patient,
  onSchedule,
  onViewRecords,
  onViewDetails,
  isCompact = false
}: PatientQuickActionsProps) {
  if (isCompact) {
    return (
      <div className="flex gap-1">
        {onSchedule && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSchedule}
            title="Agendar Consulta"
            className="h-8 w-8 p-0"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        {onViewRecords && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewRecords}
            title="Ver Prontuário"
            className="h-8 w-8 p-0"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            title="Ver Detalhes"
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {onSchedule && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSchedule}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Agendar
        </Button>
      )}
      {onViewRecords && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewRecords}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Prontuário
        </Button>
      )}
      {onViewDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
