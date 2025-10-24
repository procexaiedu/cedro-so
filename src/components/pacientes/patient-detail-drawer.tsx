'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart, 
  FileText, 
  DollarSign,
  Clock,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { PatientOverview, getPatientOverview, calculateAge, formatDate, formatCurrency, getStatusBadgeVariant, getStatusText } from '@/data/pacientes'

interface PatientDetailDrawerProps {
  patientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (patientId: string) => void
  onDelete?: (patientId: string) => void
}

export function PatientDetailDrawer({ 
  patientId, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}: PatientDetailDrawerProps) {
  const [overview, setOverview] = useState<PatientOverview | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patientId && open) {
      loadPatientOverview()
    }
  }, [patientId, open])

  const loadPatientOverview = async () => {
    if (!patientId) return

    setLoading(true)
    try {
      const data = await getPatientOverview(patientId)
      setOverview(data)
    } catch (error) {
      console.error('Error loading patient overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAppointmentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
          <SheetHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </SheetHeader>
          <div className="space-y-6 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!overview) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>Paciente não encontrado</SheetTitle>
            <SheetDescription>
              Não foi possível carregar os dados do paciente.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const { patient, appointments, therapists, invoices, medical_records } = overview
  const age = calculateAge(patient.birth_date)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(patient.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{patient.full_name}</SheetTitle>
                <SheetDescription>
                  {patient.email}
                </SheetDescription>
                <div className="mt-2">
                  <Badge variant={patient.is_on_hold ? 'secondary' : 'default'}>
                    {patient.is_on_hold ? 'Em pausa' : 'Ativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(patient.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(patient.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="appointments">Consultas</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="medical">Prontuário</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{patient.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Data de Nascimento</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(patient.birth_date)} {age && `(${age} anos)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Gênero</p>
                      <p className="text-sm text-muted-foreground">{patient.gender || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Therapist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Terapeuta Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {therapists.find(t => t.is_current) ? (
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(therapists.find(t => t.is_current)!.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{therapists.find(t => t.is_current)!.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {therapists.find(t => t.is_current)!.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde {formatDate(therapists.find(t => t.is_current)!.start_date)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum terapeuta atribuído</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {appointments.completed} realizadas, {appointments.scheduled} agendadas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Situação Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(invoices.paid_amount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {invoices.pending} faturas pendentes
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Histórico de Consultas
                </CardTitle>
                <CardDescription>
                  Total: {appointments.total} consultas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{appointments.completed}</div>
                    <p className="text-sm text-muted-foreground">Realizadas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{appointments.scheduled}</div>
                    <p className="text-sm text-muted-foreground">Agendadas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{appointments.cancelled}</div>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                  </div>
                </div>
                <Separator />
                <div className="mt-4 space-y-2">
                  {appointments.last_appointment && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Última consulta:</span>
                      <span className="text-sm font-medium">{formatDate(appointments.last_appointment)}</span>
                    </div>
                  )}
                  {appointments.next_appointment && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Próxima consulta:</span>
                      <span className="text-sm font-medium">{formatDate(appointments.next_appointment)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Therapist History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Terapeutas</CardTitle>
              </CardHeader>
              <CardContent>
                {therapists.length > 0 ? (
                  <div className="space-y-4">
                    {therapists.map((therapist) => (
                      <div key={therapist.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(therapist.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{therapist.name}</p>
                            <p className="text-sm text-muted-foreground">{therapist.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={therapist.is_current ? 'default' : 'secondary'}>
                            {therapist.is_current ? 'Atual' : 'Anterior'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(therapist.start_date)} - {therapist.end_date ? formatDate(therapist.end_date) : 'Atual'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum terapeuta atribuído</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Faturado</p>
                    <p className="text-2xl font-bold">{formatCurrency(invoices.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(invoices.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturas Pendentes</p>
                    <p className="text-xl font-semibold text-orange-600">{invoices.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturas em Atraso</p>
                    <p className="text-xl font-semibold text-red-600">{invoices.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Histórico Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.notes ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{patient.notes}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma observação registrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registros Médicos</CardTitle>
              </CardHeader>
              <CardContent>
                {medical_records.length > 0 ? (
                  <div className="space-y-4">
                    {medical_records.map((record) => (
                      <div key={record.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
                        </div>
                        <p className="text-sm mb-2">{record.summary}</p>
                        <p className="text-xs text-muted-foreground">Por: {record.therapist_name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum registro médico encontrado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}