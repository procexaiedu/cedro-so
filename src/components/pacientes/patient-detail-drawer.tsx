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
  UserCheck,
  UserX,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { PatientOverview, getPatientOverview, calculateAge, formatDate, formatCurrency, getStatusBadgeVariant, getStatusText } from '@/data/pacientes'
import { getGenderDisplay } from '@/lib/utils'

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

  const { patient, appointments } = overview
  const age = calculateAge(patient.birth_date)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[900px] max-w-[95vw] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(patient.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl sm:text-2xl truncate">{patient.full_name}</SheetTitle>
                <SheetDescription className="truncate">
                  {patient.email || 'Email não informado'}
                </SheetDescription>
                <div className="mt-2">
                  <Badge variant={patient.is_on_hold ? 'secondary' : 'default'}>
                    {patient.is_on_hold ? 'Em pausa' : 'Ativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(patient.id)}
                  className="w-full sm:w-auto"
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
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs sm:text-sm">Consultas</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
            <TabsTrigger value="medical" className="text-xs sm:text-sm">Prontuário</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground break-all">{patient.email || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{patient.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Data de Nascimento</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.birth_date ? `${formatDate(patient.birth_date)}${age ? ` (${age} anos)` : ''}` : 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Gênero</p>
                      <p className="text-sm text-muted-foreground">{getGenderDisplay(patient.gender)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Therapist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Terapeuta Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overview.therapists.find(t => t.is_current) ? (
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="text-lg font-semibold">
                        {getInitials(overview.therapists.find(t => t.is_current)!.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="font-semibold text-lg">{overview.therapists.find(t => t.is_current)!.name}</p>
                        <p className="text-sm text-muted-foreground break-all">
                          {overview.therapists.find(t => t.is_current)!.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Desde: {formatDate(overview.therapists.find(t => t.is_current)!.started_at)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 text-center">
                    <div className="space-y-2">
                      <UserX className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">Nenhum terapeuta atribuído</p>
                      <p className="text-sm text-muted-foreground">Este paciente ainda não possui um terapeuta responsável</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{appointments.total}</p>
                      <p className="text-sm text-blue-600 font-medium">Total de Consultas</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700">{appointments.completed}</p>
                      <p className="text-sm text-green-600 font-medium">Concluídas</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-700">{appointments.scheduled}</p>
                      <p className="text-sm text-yellow-600 font-medium">Agendadas</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(overview.invoices.paid_amount)}
                      </p>
                      <p className="text-sm text-green-600 font-medium">Valor Pago</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
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
                {overview.therapists.length > 0 ? (
                  <div className="space-y-4">
                    {overview.therapists.map((therapist) => (
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
                            {formatDate(therapist.started_at)} - {therapist.ended_at ? formatDate(therapist.ended_at) : 'Atual'}
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
                    <p className="text-2xl font-bold">{formatCurrency(overview.invoices.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(overview.invoices.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturas Pendentes</p>
                    <p className="text-xl font-semibold text-orange-600">{overview.invoices.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturas em Atraso</p>
                    <p className="text-xl font-semibold text-red-600">{overview.invoices.overdue}</p>
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
                {overview.patient.notes ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{overview.patient.notes}</p>
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
                {overview.medical_records.length > 0 ? (
                  <div className="space-y-4">
                    {overview.medical_records.map((record) => (
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