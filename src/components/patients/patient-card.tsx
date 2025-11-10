'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Patient, getPatientStatus, getStatusBadgeVariant, getStatusText, calculateAge } from '@/data/pacientes'
import { formatRelativeTime } from '@/lib/date-utils'
import { PatientQuickActions } from './patient-quick-actions'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PatientCardProps {
  patient: Patient
  onViewDetails: (patientId: string) => void
  onEdit: (patientId: string) => void
  onDelete: (patient: Patient) => void
}

export function PatientCard({ patient, onViewDetails, onEdit, onDelete }: PatientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const status = getPatientStatus(patient)
  const age = calculateAge(patient.birth_date)

  return (
    <Card className="border-standard hover:shadow-md transition-shadow">
      <CardContent className="p-spacing-m">
        {/* Patient Header */}
        <div className="flex items-start justify-between mb-spacing-m">
          <div className="flex items-start gap-spacing-xs">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(patient.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-body-md text-motherduck-dark">
                {patient.full_name}
              </h3>
              <p className="text-caption text-motherduck-dark/60">
                {age ? `${age} anos` : 'Idade não informada'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(patient.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(patient)}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="mb-spacing-m">
          <Badge variant={getStatusBadgeVariant(status)}>
            {getStatusText(status)}
          </Badge>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-spacing-m">
          {patient.email && (
            <p className="text-caption text-motherduck-dark/70">
              📧 {patient.email}
            </p>
          )}
          {patient.phone && (
            <p className="text-caption text-motherduck-dark/70">
              📱 {patient.phone}
            </p>
          )}
        </div>

        {/* Therapist & Appointment Info */}
        <div className="grid grid-cols-2 gap-spacing-xs mb-spacing-m">
          <div>
            <p className="text-caption text-motherduck-dark/60">Terapeuta</p>
            <p className="text-caption font-medium text-motherduck-dark">
              {patient.current_therapist_name || '-'}
            </p>
          </div>
          <div>
            <p className="text-caption text-motherduck-dark/60">Consultas</p>
            <p className="text-caption font-medium text-motherduck-dark">
              {patient.total_appointments || 0}
            </p>
          </div>
        </div>

        {/* Last Appointment */}
        <div className="mb-spacing-m">
          <p className="text-caption text-motherduck-dark/60">Última Consulta</p>
          <p className="text-caption text-motherduck-dark">
            {formatRelativeTime(patient.last_appointment)}
          </p>
        </div>

        {/* Quick Actions */}
        <PatientQuickActions
          patient={patient}
          onSchedule={() => {
            // TODO: Open appointment modal
          }}
          onViewRecords={() => {
            // TODO: Open medical records
          }}
          onViewDetails={() => onViewDetails(patient.id)}
        />
      </CardContent>
    </Card>
  )
}
