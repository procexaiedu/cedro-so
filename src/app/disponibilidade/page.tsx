'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  Calendar,
  User,
  Save,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupabase } from '@/providers/supabase-provider'
import { 
  getTherapistSchedules, 
  getScheduleExceptions,
  createScheduleException,
  updateTherapistSchedule,
  deleteScheduleException,
  getTherapists,
  type TherapistSchedule,
  type ScheduleException 
} from '@/data/agenda'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
]

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
]

export default function DisponibilidadePage() {
  const { cedroUser } = useSupabase()
  const { toast } = useToast()
  
  const [schedules, setSchedules] = useState<TherapistSchedule[]>([])
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<TherapistSchedule | null>(null)
  const [newException, setNewException] = useState({
    date: '',
    start_time: '',
    end_time: '',
    note: '',
    kind: 'block' as 'block' | 'extra'
  })

  const loadTherapists = useCallback(async () => {
    try {
      const therapistsData = await getTherapists()
      setTherapists(therapistsData)
      
      // If current user is a therapist, select them by default
      if (cedroUser?.role === 'therapist') {
        const currentTherapist = therapistsData.find(t => t.id === cedroUser.id)
        if (currentTherapist) {
          setSelectedTherapist(currentTherapist.id)
        }
      }
    } catch (error) {
      console.error('Error loading therapists:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar terapeutas",
        variant: "destructive"
      })
    }
  }, [cedroUser])

  useEffect(() => {
    if (cedroUser) {
      loadTherapists()
    }
  }, [cedroUser, loadTherapists])

  const loadScheduleData = useCallback(async () => {
    if (!selectedTherapist) return
    
    setIsLoading(true)
    try {
      const [schedulesData, exceptionsData] = await Promise.all([
        getTherapistSchedules(selectedTherapist),
        getScheduleExceptions(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of current month
          selectedTherapist
        )
      ])
      
      setSchedules(schedulesData)
      setExceptions(exceptionsData)
    } catch (error) {
      console.error('Error loading schedule data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de disponibilidade",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedTherapist])

  useEffect(() => {
    if (selectedTherapist) {
      loadScheduleData()
    }
  }, [selectedTherapist, loadScheduleData])

  const handleSaveSchedule = async (schedule: TherapistSchedule) => {
    try {
      const result = await updateTherapistSchedule({
        therapist_id: selectedTherapist,
        weekday: schedule.weekday,
        start_time: schedule.start_time,
        end_time: schedule.end_time
      })

      if (result) {
        toast({
          title: "Sucesso",
          description: "Horário atualizado com sucesso",
        })
        setEditingSchedule(null)
        loadScheduleData()
      } else {
        throw new Error('Failed to update schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar horário",
        variant: "destructive"
      })
    }
  }

  const handleCreateException = async () => {
    if (!selectedTherapist || !newException.date || !newException.start_time || !newException.end_time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      await createScheduleException({
        therapist_id: selectedTherapist,
        date: newException.date,
        kind: newException.kind,
        start_time: newException.start_time,
        end_time: newException.end_time,
        note: newException.note
      })

      toast({
        title: "Sucesso",
        description: "Exceção criada com sucesso",
      })

      setNewException({ date: '', start_time: '', end_time: '', note: '', kind: 'block' })
      loadScheduleData()
    } catch (error) {
      console.error('Error creating exception:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar exceção",
        variant: "destructive"
      })
    }
  }

  const handleDeleteException = async (exceptionId: string) => {
    try {
      const success = await deleteScheduleException(exceptionId)
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Exceção removida com sucesso",
        })
        loadScheduleData()
      } else {
        throw new Error('Failed to delete exception')
      }
    } catch (error) {
      console.error('Error deleting exception:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover exceção",
        variant: "destructive"
      })
    }
  }

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find(s => s.weekday === dayOfWeek)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disponibilidade</h1>
            <p className="text-gray-600">Gerencie horários e exceções de agenda</p>
          </div>
        </div>

        {/* Therapist Selection */}
        {cedroUser?.role !== 'therapist' && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Terapeuta</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um terapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {selectedTherapist && (
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Horários Regulares</TabsTrigger>
              <TabsTrigger value="exceptions">Exceções</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Horários da Semana</CardTitle>
                  <CardDescription>
                    Configure os horários de atendimento para cada dia da semana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Carregando...</div>
                  ) : (
                    <div className="space-y-4">
                      {DAYS_OF_WEEK.map((day) => {
                        const schedule = getScheduleForDay(day.value)
                        const isEditing = editingSchedule?.weekday === day.value

                        return (
                          <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-32">
                                <span className="font-medium">{day.label}</span>
                              </div>
                              
                              {isEditing ? (
                                <div className="flex items-center space-x-2">
                                  <Select defaultValue={schedule?.start_time || ''}>
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Início" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span>até</span>
                                  <Select defaultValue={schedule?.end_time || ''}>
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Fim" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  {schedule ? (
                                    <>
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span>{schedule.start_time} - {schedule.end_time}</span>
                                      <Badge variant="secondary">Ativo</Badge>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">Não configurado</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <>
                                  <Button size="sm" onClick={() => handleSaveSchedule(editingSchedule)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingSchedule(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => setEditingSchedule(schedule || { 
                                    id: '',
                                    therapist_id: selectedTherapist, 
                                    weekday: day.value, 
                                    start_time: '09:00', 
                                    end_time: '17:00',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exceptions" className="space-y-4">
              {/* Create New Exception */}
              <Card>
                <CardHeader>
                  <CardTitle>Nova Exceção</CardTitle>
                  <CardDescription>
                    Adicione bloqueios ou horários especiais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="exception-date">Data</Label>
                      <Input
                        id="exception-date"
                        type="date"
                        value={newException.date}
                        onChange={(e) => setNewException(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exception-type">Tipo</Label>
                      <Select value={newException.kind} onValueChange={(value: 'block' | 'extra') => setNewException(prev => ({ ...prev, kind: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="block">Bloqueio</SelectItem>
                          <SelectItem value="extra">Horário Extra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="exception-start">Início</Label>
                      <Select value={newException.start_time} onValueChange={(value) => setNewException(prev => ({ ...prev, start_time: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Início" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="exception-end">Fim</Label>
                      <Select value={newException.end_time} onValueChange={(value) => setNewException(prev => ({ ...prev, end_time: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fim" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="exception-reason">Motivo</Label>
                      <Input
                        id="exception-reason"
                        placeholder="Ex: Férias, Reunião..."
                        value={newException.note}
                        onChange={(e) => setNewException(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateException}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Exceção
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Exceptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Exceções Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {exceptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma exceção cadastrada
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exceptions.map((exception) => (
                        <div key={exception.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(exception.date), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {exception.start_time} - {exception.end_time}
                              </div>
                            </div>
                            <Badge variant={exception.kind === 'block' ? 'destructive' : 'default'}>
                              {exception.kind === 'block' ? 'Bloqueio' : 'Horário Extra'}
                            </Badge>
                            {exception.note && (
                              <Badge variant="outline">{exception.note}</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteException(exception.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  )
}