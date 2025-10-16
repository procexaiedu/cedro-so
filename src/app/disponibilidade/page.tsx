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
  getTherapistSchedulesByDay, 
  getScheduleExceptions,
  createScheduleException,
  createTherapistSchedule,
  updateTherapistScheduleSlot,
  deleteTherapistSchedule,
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
  
  const [schedulesByDay, setSchedulesByDay] = useState<Record<number, TherapistSchedule[]>>({})
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<TherapistSchedule | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    weekday: 1,
    start_time: '09:00',
    end_time: '17:00',
    note: ''
  })
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
        getTherapistSchedulesByDay(selectedTherapist),
        getScheduleExceptions(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of current month
          selectedTherapist
        )
      ])
      
      setSchedulesByDay(schedulesData)
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

  const handleCreateSchedule = async () => {
    if (!selectedTherapist) return

    try {
      const result = await createTherapistSchedule({
        therapist_id: selectedTherapist,
        weekday: newSchedule.weekday,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        note: newSchedule.note
      })

      if (result) {
        toast({
          title: "Sucesso",
          description: "Horário criado com sucesso",
        })
        setNewSchedule({ weekday: 1, start_time: '09:00', end_time: '17:00', note: '' })
        loadScheduleData()
      } else {
        throw new Error('Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar horário. Verifique se não há sobreposição com outros horários.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateSchedule = async (schedule: TherapistSchedule) => {
    try {
      const result = await updateTherapistScheduleSlot(schedule.id, {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        note: schedule.note
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
      console.error('Error updating schedule:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar horário. Verifique se não há sobreposição com outros horários.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const success = await deleteTherapistSchedule(scheduleId)

      if (success) {
        toast({
          title: "Sucesso",
          description: "Horário removido com sucesso",
        })
        loadScheduleData()
      } else {
        throw new Error('Failed to delete schedule')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover horário",
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

  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disponibilidade</h1>
            <p className="text-muted-foreground">
              Configure os horários de disponibilidade dos terapeutas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleção de Terapeuta
            </CardTitle>
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

        {selectedTherapist && (
          <Tabs defaultValue="schedules" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedules">Horários Regulares</TabsTrigger>
              <TabsTrigger value="exceptions">Exceções</TabsTrigger>
            </TabsList>

            <TabsContent value="schedules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Adicionar Novo Horário
                  </CardTitle>
                  <CardDescription>
                    Adicione um novo horário de disponibilidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="new-weekday">Dia da Semana</Label>
                      <Select 
                        value={newSchedule.weekday.toString()} 
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, weekday: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="new-start-time">Horário de Início</Label>
                      <Select 
                        value={newSchedule.start_time} 
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, start_time: value }))}
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
                      <Label htmlFor="new-end-time">Horário de Fim</Label>
                      <Select 
                        value={newSchedule.end_time} 
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, end_time: value }))}
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
                    <div className="flex items-end">
                      <Button onClick={handleCreateSchedule} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-note">Observações (opcional)</Label>
                    <Input
                      id="new-note"
                      value={newSchedule.note}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Observações sobre este horário..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <Card key={day.value}>
                    <CardHeader>
                      <CardTitle className="text-lg">{day.label}</CardTitle>
                      <CardDescription>
                        {schedulesByDay[day.value]?.length || 0} horário(s) configurado(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {schedulesByDay[day.value]?.length > 0 ? (
                        schedulesByDay[day.value].map((schedule) => (
                          <div key={schedule.id} className="border rounded-lg p-3 space-y-2">
                            {editingSchedule?.id === schedule.id ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Select 
                                    value={editingSchedule.start_time} 
                                    onValueChange={(value) => setEditingSchedule(prev => prev ? { ...prev, start_time: value } : null)}
                                  >
                                    <SelectTrigger className="flex-1">
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
                                  <Select 
                                    value={editingSchedule.end_time} 
                                    onValueChange={(value) => setEditingSchedule(prev => prev ? { ...prev, end_time: value } : null)}
                                  >
                                    <SelectTrigger className="flex-1">
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
                                <Input
                                  value={editingSchedule.note || ''}
                                  onChange={(e) => setEditingSchedule(prev => prev ? { ...prev, note: e.target.value } : null)}
                                  placeholder="Observações..."
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleUpdateSchedule(editingSchedule)}
                                    className="flex-1"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Salvar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingSchedule(null)}
                                    className="flex-1"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {schedule.start_time} - {schedule.end_time}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingSchedule(schedule)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {schedule.note && (
                                  <p className="text-sm text-muted-foreground">{schedule.note}</p>
                                )}
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum horário configurado
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exceptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Nova Exceção
                  </CardTitle>
                  <CardDescription>
                    Crie bloqueios ou horários extras para datas específicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      <Label htmlFor="exception-kind">Tipo</Label>
                      <Select 
                        value={newException.kind} 
                        onValueChange={(value: 'block' | 'extra') => setNewException(prev => ({ ...prev, kind: value }))}
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
                    <div>
                      <Label htmlFor="exception-start">Início</Label>
                      <Select 
                        value={newException.start_time} 
                        onValueChange={(value) => setNewException(prev => ({ ...prev, start_time: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Início" />
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
                      <Label htmlFor="exception-end">Fim</Label>
                      <Select 
                        value={newException.end_time} 
                        onValueChange={(value) => setNewException(prev => ({ ...prev, end_time: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Fim" />
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
                    <div className="flex items-end">
                      <Button onClick={handleCreateException} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="exception-note">Observações</Label>
                    <Input
                      id="exception-note"
                      value={newException.note}
                      onChange={(e) => setNewException(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Motivo da exceção..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exceções Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {exceptions.length > 0 ? (
                        exceptions.map((exception) => (
                          <div key={exception.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={exception.kind === 'block' ? 'destructive' : 'default'}>
                                    {exception.kind === 'block' ? 'Bloqueio' : 'Extra'}
                                  </Badge>
                                  <span className="font-medium">
                                    {format(new Date(exception.date), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {exception.start_time} - {exception.end_time}
                                </div>
                                {exception.note && (
                                  <p className="text-sm text-muted-foreground">{exception.note}</p>
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
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma exceção cadastrada
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  )
}