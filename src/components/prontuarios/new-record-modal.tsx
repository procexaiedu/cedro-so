'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload,
  FileText,
  User,
  Calendar,
  Clock,
  Save,
  X,
  Volume2,
  Download
} from 'lucide-react'
import { createMedicalRecord, type CreateMedicalRecordData, type MedicalRecordType, getMedicalRecordTypeLabel } from '@/data/pacientes'
import { getPatients, type Patient } from '@/data/pacientes'

interface NewRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordCreated?: () => void
  preselectedPatientId?: string
  preselectedAppointmentId?: string
}

interface AudioRecording {
  blob: Blob
  url: string
  duration: number
}

export function NewRecordModal({ 
  open, 
  onOpenChange, 
  onRecordCreated,
  preselectedPatientId,
  preselectedAppointmentId 
}: NewRecordModalProps) {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '')
  const [appointmentId, setAppointmentId] = useState(preselectedAppointmentId || '')
  const [recordType, setRecordType] = useState<MedicalRecordType>('soap')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'team'>('private')
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true)
        const patientsData = await getPatients()
        setPatients(patientsData.data)
      } catch (error) {
        console.error('Error loading patients:', error)
        toast({
        title: 'Erro',
        description: 'Erro ao carregar pacientes',
        variant: 'destructive'
      })
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadPatients()
    }
  }, [open])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      resetForm()
    } else {
      setSelectedPatientId(preselectedPatientId || '')
      setAppointmentId(preselectedAppointmentId || '')
    }
  }, [open, preselectedPatientId, preselectedAppointmentId])

  const resetForm = () => {
    setSelectedPatientId('')
    setAppointmentId('')
    setRecordType('soap')
    setTitle('')
    setContent('')
    setVisibility('private')
    setAudioRecording(null)
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setIsPlaying(false)
    setPlaybackTime(0)
    stopRecording()
    stopPlayback()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioRecording({
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime
        })
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast({
          title: 'Sucesso',
          description: 'Gravação iniciada'
        })
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
          title: 'Erro',
          description: 'Erro ao iniciar gravação. Verifique as permissões do microfone.',
          variant: 'destructive'
        })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        setIsPaused(false)
        toast({
        title: 'Sucesso',
        description: 'Gravação retomada'
      })
      } else {
        mediaRecorderRef.current.pause()
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
        setIsPaused(true)
        toast({
            title: 'Sucesso',
            description: 'Gravação pausada'
          })
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      toast({
          title: 'Sucesso',
          description: 'Gravação finalizada'
        })
    }
  }

  const playAudio = () => {
    if (audioRecording && !isPlaying) {
      const audio = new Audio(audioRecording.url)
      audioElementRef.current = audio
      
      audio.onloadedmetadata = () => {
        audio.play()
        setIsPlaying(true)
        setPlaybackTime(0)
        
        playbackIntervalRef.current = setInterval(() => {
          setPlaybackTime(audio.currentTime)
        }, 100)
      }

      audio.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
        }
      }
    }
  }

  const pauseAudio = () => {
    if (audioElementRef.current && isPlaying) {
      audioElementRef.current.pause()
      setIsPlaying(false)
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      setIsPlaying(false)
      setPlaybackTime(0)
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }

  const deleteRecording = () => {
    if (audioRecording) {
      URL.revokeObjectURL(audioRecording.url)
      setAudioRecording(null)
      setPlaybackTime(0)
      stopPlayback()
      toast({
      title: 'Sucesso',
      description: 'Gravação removida'
    })
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    // Reset all form fields
    setSelectedPatientId(preselectedPatientId || '')
    setAppointmentId(preselectedAppointmentId || '')
    setRecordType('soap')
    setTitle('')
    setContent('')
    setVisibility('private')
    
    // Reset audio recording states
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setAudioRecording(null)
    setIsPlaying(false)
    setPlaybackTime(0)
    
    // Clean up media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    // Clear intervals
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
    }
    
    // Close modal
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!selectedPatientId || !title.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)

      const recordData: CreateMedicalRecordData = {
        patient_id: selectedPatientId,
        appointment_id: appointmentId || null,
        note_type: recordType,
        content_json: {
          title: title.trim(),
          content: content.trim(),
          has_audio: !!audioRecording,
          audio_duration: audioRecording?.duration || 0,
          created_with_audio: !!audioRecording
        },
        visibility
      }

      await createMedicalRecord(recordData)
      
      toast({
          title: 'Sucesso',
          description: 'Registro médico criado com sucesso!'
        })
        onRecordCreated?.()
        handleClose()
      } catch (error) {
        console.error('Error saving medical record:', error)
        toast({
          title: 'Erro',
          description: 'Erro ao salvar registro médico',
          variant: 'destructive'
        })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPatient = Array.isArray(patients) ? patients.find(p => p.id === selectedPatientId) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Registro Médico
          </DialogTitle>
          <DialogDescription>
            Crie um novo registro médico com opção de gravação de áudio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(patients) && patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {patient.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment">ID da Consulta (Opcional)</Label>
              <Input
                id="appointment"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="ID da consulta relacionada"
              />
            </div>
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPatient.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedPatient.birth_date ? 
                        new Date().getFullYear() - new Date(selectedPatient.birth_date).getFullYear() + ' anos' : 
                        'Idade não informada'
                      }
                    </span>
                  </div>
                  <Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'}>
                    {selectedPatient.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="audio">Gravação de Áudio</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Record Type and Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Registro *</Label>
                  <Select value={recordType} onValueChange={(value: MedicalRecordType) => setRecordType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anamnesis">Anamnese</SelectItem>
                      <SelectItem value="soap">SOAP</SelectItem>
                      <SelectItem value="evolution">Evolução</SelectItem>
                      <SelectItem value="prescription_draft">Prescrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibilidade</Label>
                  <Select value={visibility} onValueChange={(value: 'private' | 'team') => setVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="team">Equipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título do Registro *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Consulta de retorno, Primeira consulta, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva os detalhes do atendimento, observações, diagnósticos, etc."
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Gravação de Áudio
                  </CardTitle>
                  <CardDescription>
                    Grave áudio durante a consulta para complementar o registro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!audioRecording ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        {!isRecording ? (
                          <Button onClick={startRecording} size="lg" className="gap-2">
                            <Mic className="h-5 w-5" />
                            Iniciar Gravação
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={pauseRecording} 
                              variant="outline" 
                              size="lg"
                              className="gap-2"
                            >
                              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                              {isPaused ? 'Retomar' : 'Pausar'}
                            </Button>
                            <Button 
                              onClick={stopRecording} 
                              variant="destructive" 
                              size="lg"
                              className="gap-2"
                            >
                              <Square className="h-5 w-5" />
                              Parar
                            </Button>
                          </div>
                        )}
                      </div>

                      {isRecording && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">
                              {isPaused ? 'PAUSADO' : 'GRAVANDO'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Gravação de Áudio</p>
                            <p className="text-sm text-muted-foreground">
                              Duração: {formatTime(audioRecording.duration)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={isPlaying ? pauseAudio : playAudio}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isPlaying ? 'Pausar' : 'Reproduzir'}
                          </Button>
                          <Button
                            onClick={deleteRecording}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </div>

                      {isPlaying && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Reproduzindo:</span>
                          <span className="font-mono">{formatTime(playbackTime)}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-mono">{formatTime(audioRecording.duration)}</span>
                        </div>
                      )}

                      <Button
                        onClick={startRecording}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Mic className="h-4 w-4" />
                        Gravar Novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedPatientId || !title.trim() || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Registro
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}