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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Trash2,
  Stethoscope,
  CreditCard,
  BookOpen
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
      <SheetContent className="w-full sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[900px] max-w-[95vw] p-0 flex flex-col">
        {/* Header Fixo */}
        <div className="border-b border-motherduck-dark/10 bg-white p-spacing-m">
          <div className="flex items-start justify-between gap-spacing-m">
            <div className="flex items-start gap-spacing-m min-w-0 flex-1">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarFallback className="bg-motherduck-blue text-white text-lg font-semibold">
                  {getInitials(patient.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 pt-spacing-xs">
                <SheetTitle className="text-heading-2 font-bold text-motherduck-dark mb-spacing-xxs">
                  {patient.full_name}
                </SheetTitle>
                <SheetDescription className="text-body-sm mb-spacing-xs">
                  {patient.email || 'Email não informado'}
                </SheetDescription>
                <div className="flex flex-wrap gap-spacing-xs items-center">
                  <Badge variant={patient.is_on_hold ? 'secondary' : 'default'} className="text-caption">
                    {patient.is_on_hold ? 'Em pausa' : 'Ativo'}
                  </Badge>
                  {patient.phone && (
                    <div className="flex items-center gap-spacing-xxs text-body-sm text-motherduck-dark/70">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-spacing-xs flex-shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(patient.id)}
                  title="Editar paciente"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(patient.id)}
                  className="text-destructive"
                  title="Excluir paciente"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-motherduck-dark/10 px-spacing-m">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto gap-spacing-xs bg-transparent p-0 mb-0">
              <TabsTrigger 
                value="overview" 
                className="font-mono text-body-sm uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-motherduck-blue data-[state=active]:bg-transparent"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="font-mono text-body-sm uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-motherduck-blue data-[state=active]:bg-transparent"
              >
                Consultas
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="font-mono text-body-sm uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-motherduck-blue data-[state=active]:bg-transparent"
              >
                Financeiro
              </TabsTrigger>
              <TabsTrigger 
                value="medical" 
                className="font-mono text-body-sm uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-motherduck-blue data-[state=active]:bg-transparent"
              >
                Prontuário
              </TabsTrigger>
            </TabsList>
        </div>

        {/* Tab Contents */}
        <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col">
          <TabsContent value="overview" className="flex-1">
            <ScrollArea className="h-[calc(100vh-280px)] pr-spacing-m">
              <div className="space-y-spacing-m p-spacing-m">
                {/* Personal Information */}
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <User className="h-5 w-5 mr-spacing-xs" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-spacing-m">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-m">
                      <div className="flex items-start gap-spacing-m p-spacing-m rounded-lg bg-motherduck-light/30">
                        <Mail className="h-5 w-5 text-motherduck-blue mt-spacing-xxs flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption font-semibold text-motherduck-dark uppercase">Email</p>
                          <p className="text-body-sm text-motherduck-dark/70 break-all mt-spacing-xxs">{patient.email || 'Não informado'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-spacing-m p-spacing-m rounded-lg bg-motherduck-light/30">
                        <Phone className="h-5 w-5 text-motherduck-blue mt-spacing-xxs flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption font-semibold text-motherduck-dark uppercase">Telefone</p>
                          <p className="text-body-sm text-motherduck-dark/70 mt-spacing-xxs">{patient.phone || 'Não informado'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-spacing-m p-spacing-m rounded-lg bg-motherduck-light/30">
                        <Calendar className="h-5 w-5 text-motherduck-blue mt-spacing-xxs flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption font-semibold text-motherduck-dark uppercase">Data de Nascimento</p>
                          <p className="text-body-sm text-motherduck-dark/70 mt-spacing-xxs">
                            {patient.birth_date ? `${formatDate(patient.birth_date)}${age ? ` (${age} anos)` : ''}` : 'Não informado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-spacing-m p-spacing-m rounded-lg bg-motherduck-light/30">
                        <User className="h-5 w-5 text-motherduck-blue mt-spacing-xxs flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption font-semibold text-motherduck-dark uppercase">Gênero</p>
                          <p className="text-body-sm text-motherduck-dark/70 mt-spacing-xxs">{getGenderDisplay(patient.gender)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Therapist */}
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <Stethoscope className="h-5 w-5 mr-spacing-xs" />
                      Terapeuta Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overview.therapists.find(t => t.is_current) ? (
                      <div className="flex items-start gap-spacing-m p-spacing-m rounded-lg bg-motherduck-light/30">
                        <Avatar className="h-14 w-14 flex-shrink-0">
                          <AvatarFallback className="bg-motherduck-teal text-white font-semibold">
                            {getInitials(overview.therapists.find(t => t.is_current)!.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-spacing-xs">
                          <div>
                            <p className="font-semibold text-body-lg text-motherduck-dark">{overview.therapists.find(t => t.is_current)!.name}</p>
                            <p className="text-body-sm text-motherduck-dark/70 break-all">
                              {overview.therapists.find(t => t.is_current)!.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-spacing-xs text-body-sm text-motherduck-dark/70">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Desde: {formatDate(overview.therapists.find(t => t.is_current)!.started_at)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-spacing-lg text-center">
                        <UserX className="h-12 w-12 text-motherduck-dark/30 mb-spacing-m" />
                        <p className="text-motherduck-dark/70 font-medium">Nenhum terapeuta atribuído</p>
                        <p className="text-body-sm text-motherduck-dark/50 mt-spacing-xs">Este paciente ainda não possui um terapeuta responsável</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-spacing-m">
                  <Card className="border-motherduck-dark/10 bg-gradient-to-br from-motherduck-blue/10 to-motherduck-blue/5">
                    <CardContent className="pt-spacing-m">
                      <div className="flex flex-col items-start justify-between h-full">
                        <div>
                          <p className="text-heading-3 font-bold text-motherduck-blue">{appointments.total}</p>
                          <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xxs">Total Consultas</p>
                        </div>
                        <Calendar className="h-6 w-6 text-motherduck-blue/60 mt-spacing-m" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-motherduck-dark/10 bg-gradient-to-br from-motherduck-teal/10 to-motherduck-teal/5">
                    <CardContent className="pt-spacing-m">
                      <div className="flex flex-col items-start justify-between h-full">
                        <div>
                          <p className="text-heading-3 font-bold text-motherduck-teal">{appointments.completed}</p>
                          <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xxs">Concluídas</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-motherduck-teal/60 mt-spacing-m" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-motherduck-dark/10 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                    <CardContent className="pt-spacing-m">
                      <div className="flex flex-col items-start justify-between h-full">
                        <div>
                          <p className="text-heading-3 font-bold text-yellow-600">{appointments.scheduled}</p>
                          <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xxs">Agendadas</p>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-500/60 mt-spacing-m" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-motherduck-dark/10 bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="pt-spacing-m">
                      <div className="flex flex-col items-start justify-between h-full">
                        <div>
                          <p className="text-heading-3 font-bold text-green-700">
                            {formatCurrency(overview.invoices.paid_amount)}
                          </p>
                          <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xxs">Valor Pago</p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-600/60 mt-spacing-m" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="appointments" className="flex-1">
            <ScrollArea className="h-[calc(100vh-280px)] pr-spacing-m">
              <div className="space-y-spacing-m p-spacing-m pt-0">
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <Calendar className="h-5 w-5 mr-spacing-xs" />
                      Histórico de Consultas
                    </CardTitle>
                    <CardDescription>
                      Total: {appointments.total} consultas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-spacing-m">
                    <div className="grid grid-cols-3 gap-spacing-m">
                      <div className="text-center p-spacing-m rounded-lg bg-motherduck-blue/10">
                        <div className="text-heading-3 font-bold text-motherduck-teal">{appointments.completed}</div>
                        <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xs">Realizadas</p>
                      </div>
                      <div className="text-center p-spacing-m rounded-lg bg-motherduck-blue/10">
                        <div className="text-heading-3 font-bold text-motherduck-blue">{appointments.scheduled}</div>
                        <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xs">Agendadas</p>
                      </div>
                      <div className="text-center p-spacing-m rounded-lg bg-red-500/10">
                        <div className="text-heading-3 font-bold text-red-600">{appointments.cancelled}</div>
                        <p className="text-caption text-motherduck-dark/70 font-medium mt-spacing-xs">Canceladas</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-spacing-m">
                      {appointments.last_appointment && (
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-medium text-motherduck-dark">Última consulta:</span>
                          <span className="text-body-sm text-motherduck-dark/70">{formatDate(appointments.last_appointment)}</span>
                        </div>
                      )}
                      {appointments.next_appointment && (
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-medium text-motherduck-dark">Próxima consulta:</span>
                          <span className="text-body-sm text-motherduck-dark/70">{formatDate(appointments.next_appointment)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Therapist History */}
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <Users className="h-5 w-5 mr-spacing-xs" />
                      Histórico de Terapeutas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overview.therapists.length > 0 ? (
                      <div className="space-y-spacing-m">
                        {overview.therapists.map((therapist) => (
                          <div key={therapist.id} className="flex items-center justify-between p-spacing-m border border-motherduck-dark/10 rounded-lg hover:bg-motherduck-light/20 transition-colors">
                            <div className="flex items-center gap-spacing-m">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-xs font-semibold bg-motherduck-blue text-white">
                                  {getInitials(therapist.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-body-sm text-motherduck-dark">{therapist.name}</p>
                                <p className="text-caption text-motherduck-dark/70">{therapist.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={therapist.is_current ? 'default' : 'secondary'} className="text-caption">
                                {therapist.is_current ? 'Atual' : 'Anterior'}
                              </Badge>
                              <p className="text-caption text-motherduck-dark/70 mt-spacing-xs">
                                {formatDate(therapist.started_at)} - {therapist.ended_at ? formatDate(therapist.ended_at) : 'Atual'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-motherduck-dark/70">Nenhum terapeuta atribuído</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="financial" className="flex-1">
            <ScrollArea className="h-[calc(100vh-280px)] pr-spacing-m">
              <div className="space-y-spacing-m p-spacing-m">
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <CreditCard className="h-5 w-5 mr-spacing-xs" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-spacing-m">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-m">
                      <div className="p-spacing-m rounded-lg bg-motherduck-light/30">
                        <p className="text-caption font-semibold text-motherduck-dark uppercase">Total Faturado</p>
                        <p className="text-heading-3 font-bold text-motherduck-dark mt-spacing-xs">{formatCurrency(overview.invoices.total_amount)}</p>
                      </div>
                      <div className="p-spacing-m rounded-lg bg-green-500/10">
                        <p className="text-caption font-semibold text-motherduck-dark uppercase">Total Pago</p>
                        <p className="text-heading-3 font-bold text-green-600 mt-spacing-xs">{formatCurrency(overview.invoices.paid_amount)}</p>
                      </div>
                      <div className="p-spacing-m rounded-lg bg-yellow-500/10">
                        <p className="text-caption font-semibold text-motherduck-dark uppercase">Faturas Pendentes</p>
                        <p className="text-heading-3 font-bold text-yellow-600 mt-spacing-xs">{overview.invoices.pending}</p>
                      </div>
                      <div className="p-spacing-m rounded-lg bg-red-500/10">
                        <p className="text-caption font-semibold text-motherduck-dark uppercase">Faturas em Atraso</p>
                        <p className="text-heading-3 font-bold text-red-600 mt-spacing-xs">{overview.invoices.overdue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="medical" className="flex-1">
            <ScrollArea className="h-[calc(100vh-280px)] pr-spacing-m">
              <div className="space-y-spacing-m p-spacing-m">
                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <BookOpen className="h-5 w-5 mr-spacing-xs" />
                      Histórico Médico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overview.patient.notes ? (
                      <div className="p-spacing-m bg-motherduck-light/30 rounded-lg">
                        <p className="text-body-sm text-motherduck-dark/80 leading-relaxed">{overview.patient.notes}</p>
                      </div>
                    ) : (
                      <p className="text-motherduck-dark/70">Nenhuma observação registrada</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-motherduck-dark/10">
                  <CardHeader className="pb-spacing-m">
                    <CardTitle className="flex items-center text-body-lg font-bold text-motherduck-dark">
                      <FileText className="h-5 w-5 mr-spacing-xs" />
                      Registros Médicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overview.medical_records.length > 0 ? (
                      <div className="space-y-spacing-m">
                        {overview.medical_records.map((record) => (
                          <div key={record.id} className="p-spacing-m border border-motherduck-dark/10 rounded-lg hover:bg-motherduck-light/20 transition-colors">
                            <div className="flex items-center justify-between mb-spacing-m">
                              <Badge variant="outline" className="text-caption">{record.type}</Badge>
                              <span className="text-body-sm text-motherduck-dark/70">{formatDate(record.date)}</span>
                            </div>
                            <p className="text-body-sm text-motherduck-dark/80 mb-spacing-m">{record.summary}</p>
                            <p className="text-caption text-motherduck-dark/60">Por: {record.therapist_name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-motherduck-dark/70">Nenhum registro médico encontrado</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}