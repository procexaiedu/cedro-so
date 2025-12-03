'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock, User, Stethoscope, Trash2, Save, X } from 'lucide-react'
import { format, parseISO, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useLinkedPatients,
  useLinkedTherapists,
  type Appointment
} from '@/hooks/use-appointments-adapter'
import { useRefreshOnModalOpen } from '@/hooks/use-realtime-appointments'
import { isPatientLinkedToTherapist } from '@/data/agenda'

type AppointmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  appointment?: Appointment | null
  mode: 'create' | 'edit' | 'view'
  therapists: Array<{ id: string; name: string; email: string }>
  patients: Array<{ id: string; name: string; email: string }>
  services: Array<{ id: string; name: string; duration_minutes: number }>
  defaultDate?: Date
  defaultTime?: string
  cedroUser?: { id: string; role: string; name: string } | null
}

const statusOptions = [
  { value: 'scheduled', label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'no_show', label: 'Faltou', color: 'bg-gray-100 text-gray-800' },
  { value: 'rescheduled', label: 'Remarcado', color: 'bg-yellow-100 text-yellow-800' }
] as const

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  mode,
  therapists,
  patients,
  services,
  defaultDate,
  defaultTime,
  cedroUser
}: AppointmentModalProps) {
  const { toast } = useToast()
  const [filteredPatients, setFilteredPatients] = useState(patients)
  const [filteredTherapists, setFilteredTherapists] = useState(therapists)
  const [formData, setFormData] = useState({
    patient_id: '',
    therapist_id: '',
    service_id: '',
    status: 'scheduled' as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled',
    date: new Date(),
    start_time: '09:00',
    duration: 60,
    notes: ''
  })

  // Definir variáveis de modo primeiro
  const isReadOnly = mode === 'view'
  const isEditing = mode === 'edit'
  const isCreating = mode === 'create'

  // React Query hooks para mutations
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()
  const deleteMutation = useDeleteAppointment()

  // Hook para refresh automático de dados
  const { refreshAppointmentData } = useRefreshOnModalOpen()

  // React Query hooks para dados linkados
  const { data: linkedPatients, isLoading: loadingLinkedPatients } = useLinkedPatients(
    formData.therapist_id && isCreating ? formData.therapist_id : null
  )
  
  const { data: linkedTherapists, isLoading: loadingLinkedTherapists } = useLinkedTherapists(
    formData.patient_id && isCreating ? formData.patient_id : null
  )

  // Refresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshAppointmentData()
    }
  }, [isOpen, refreshAppointmentData])

  // Initialize filtered states when props change
  useEffect(() => {
    setFilteredPatients(patients)
  }, [patients])

  useEffect(() => {
    // If user is a therapist, only show themselves
    if (cedroUser?.role === 'therapist') {
      const currentTherapist = therapists.find(t => t.id === cedroUser.id)
      setFilteredTherapists(currentTherapist ? [currentTherapist] : [])
    } else {
      // Admin can see all therapists
      setFilteredTherapists(therapists)
    }
  }, [therapists, cedroUser])

  useEffect(() => {
    if (appointment && (isEditing || mode === 'view')) {
      const startDate = parseISO(appointment.start_at)
      const endDate = parseISO(appointment.end_at)
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      
      setFormData({
        patient_id: appointment.patient_id || '',
        therapist_id: appointment.therapist_id,
        service_id: appointment.service_id || '',
        status: appointment.status,
        date: startDate,
        start_time: format(startDate, 'HH:mm'),
        duration,
        notes: appointment.notes || ''
      })
    } else if (isCreating) {
      setFormData({
        patient_id: '',
        therapist_id: cedroUser?.role === 'therapist' ? cedroUser.id : '',
        service_id: '',
        status: 'scheduled',
        date: defaultDate || new Date(),
        start_time: defaultTime || '09:00',
        duration: 60,
        notes: ''
      })
    }
  }, [appointment, mode, defaultDate, defaultTime, isEditing, isCreating, cedroUser])

  // Filter patients based on selected therapist using React Query data
  useEffect(() => {
    if (formData.therapist_id && isCreating && linkedPatients) {
      // Transform linkedPatients to match expected component type
      const transformedPatients = linkedPatients.map(p => ({
        id: p.id,
        name: p.full_name,
        email: p.email || ''
      }))
      setFilteredPatients(transformedPatients)

      // Clear patient selection if current patient is not linked to the new therapist
      if (formData.patient_id) {
        const isLinked = linkedPatients.some(p => p.id === formData.patient_id)
        if (!isLinked) {
          setFormData(prev => ({ ...prev, patient_id: '' }))
        }
      }
    } else if (!formData.therapist_id || !isCreating) {
      // If no therapist selected or not creating, show all patients
      setFilteredPatients(patients)
    }
  }, [formData.therapist_id, isCreating, linkedPatients, patients, formData.patient_id])

  // Filter therapists based on selected patient using React Query data
  useEffect(() => {
    if (formData.patient_id && isCreating && linkedTherapists) {
      // Transform linkedTherapists to match expected component type
      const transformedTherapists = linkedTherapists.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email || ''
      }))
      setFilteredTherapists(transformedTherapists)

      // Clear therapist selection if current therapist is not linked to the new patient
      if (formData.therapist_id) {
        const isLinked = linkedTherapists.some(t => t.id === formData.therapist_id)
        if (!isLinked) {
          setFormData(prev => ({ ...prev, therapist_id: '' }))
        }
      }
    } else if (!formData.patient_id || !isCreating) {
      // If no patient selected or not creating, show all therapists based on user role
      if (cedroUser?.role === 'therapist') {
        const currentTherapist = therapists.find(t => t.id === cedroUser.id)
        setFilteredTherapists(currentTherapist ? [currentTherapist] : [])
      } else {
        setFilteredTherapists(therapists)
      }
    }
  }, [formData.patient_id, isCreating, linkedTherapists, therapists, formData.therapist_id, cedroUser])

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      duration: service?.duration_minutes || 60
    }))
  }

  const handleSave = async () => {
    // Validation
    if (!formData.patient_id || !formData.therapist_id) {
      toast({
        title: "Erro",
        description: "Paciente e terapeuta são obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Check if patient is linked to therapist (only for new appointments)
    if (isCreating) {
      const isLinked = await isPatientLinkedToTherapist(formData.patient_id, formData.therapist_id)
      if (!isLinked) {
        toast({
          title: "Erro",
          description: "Este paciente não está vinculado ao terapeuta selecionado",
          variant: "destructive"
        })
        return
      }
    }

    // Calculate start and end times
    const [hours, minutes] = formData.start_time.split(':').map(Number)
    const startDateTime = new Date(formData.date)
    startDateTime.setHours(hours, minutes, 0, 0)
    
    const endDateTime = addMinutes(startDateTime, formData.duration)

    const appointmentData = {
      patient_id: formData.patient_id,
      therapist_id: formData.therapist_id,
      service_id: formData.service_id || null,
      care_plan_id: null,
      status: formData.status,
      start_at: startDateTime.toISOString(),
      end_at: endDateTime.toISOString(),
      channel: null,
      origin_message_id: null,
      notes: formData.notes || null,
      meet_link: null,
      summary: null,
      external_event_id: null,
      external_calendar_id: null,
      origin: 'system',
      recurring_event_id: null,
      ical_uid: null,
      source_updated_at: null,
      html_link: null,
      gcal_etag: null
    }

    if (isCreating) {
      createMutation.mutate(appointmentData, {
        onSuccess: () => {
          onSave()
          onClose()
        }
      })
    } else if (isEditing && appointment) {
      updateMutation.mutate({
        id: appointment.id,
        data: {
          ...appointmentData,
          status: formData.status
        }
      }, {
        onSuccess: () => {
          onSave()
          onClose()
        }
      })
    }
  }

  const handleDelete = async () => {
    if (!appointment) return

    deleteMutation.mutate(appointment.id, {
      onSuccess: () => {
        onSave()
        onClose()
      }
    })
  }

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Novo Agendamento'
      case 'edit': return 'Editar Agendamento'
      case 'view': return 'Detalhes do Agendamento'
      default: return 'Agendamento'
    }
  }

  const selectedPatient = patients.find(p => p.id === formData.patient_id)
  const selectedTherapist = therapists.find(t => t.id === formData.therapist_id)
  const selectedService = services.find(s => s.id === formData.service_id)
  const selectedStatus = statusOptions.find(s => s.value === formData.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            {isReadOnly ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                <User className="h-4 w-4 text-gray-500" />
                <span>{selectedPatient?.name || 'Não informado'}</span>
              </div>
            ) : (
              <Select value={formData.patient_id} onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                  {filteredPatients.length === 0 && formData.therapist_id && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum paciente vinculado a este terapeuta
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Therapist Selection */}
          <div className="space-y-2">
            <Label htmlFor="therapist">Terapeuta *</Label>
            {isReadOnly ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                <Stethoscope className="h-4 w-4 text-gray-500" />
                <span>{selectedTherapist?.name || 'Não informado'}</span>
              </div>
            ) : (
              <Select value={formData.therapist_id} onValueChange={(value) => setFormData(prev => ({ ...prev, therapist_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um terapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTherapists.map(therapist => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                  {filteredTherapists.length === 0 && formData.patient_id && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum terapeuta vinculado a este paciente
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            {isReadOnly ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                <span>{selectedService?.name || 'Não informado'}</span>
                {selectedService && (
                  <Badge variant="secondary">{selectedService.duration_minutes}min</Badge>
                )}
              </div>
            ) : (
              <Select value={formData.service_id} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <span>{service.name} ({service.duration_minutes}min)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              {isReadOnly ? (
                <div className="p-2 border rounded-md bg-gray-50">
                  {format(formData.date, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Horário</Label>
              {isReadOnly ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formData.start_time}</span>
                </div>
              ) : (
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              {isReadOnly ? (
                <div className="p-2 border rounded-md bg-gray-50">
                  {formData.duration} minutos
                </div>
              ) : (
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                />
              )}
            </div>
          </div>

          {/* Status (only for edit/view) */}
          {(isEditing || mode === 'view') && (
            <div className="space-y-2">
              <Label>Status</Label>
              {isReadOnly ? (
                <div className="flex items-center gap-2">
                  <Badge className={selectedStatus?.color}>
                    {selectedStatus?.label}
                  </Badge>
                </div>
              ) : (
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            {isReadOnly ? (
              <div className="p-2 border rounded-md bg-gray-50 min-h-[80px]">
                {formData.notes || 'Nenhuma observação'}
              </div>
            ) : (
              <Textarea
                id="notes"
                placeholder="Observações sobre o agendamento..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div>
            {(isEditing || mode === 'view') && appointment && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending || loadingLinkedPatients || loadingLinkedTherapists}
              >
                <Save className="h-4 w-4 mr-2" />
                {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}