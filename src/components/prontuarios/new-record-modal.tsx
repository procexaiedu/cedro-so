'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Download,
  Plus
} from 'lucide-react'
import { createMedicalRecord, type CreateMedicalRecordData, type MedicalRecordType, type MedicalRecordVisibility, type MedicalRecordWithLegacyFields, getMedicalRecordTypeLabel } from '@/data/pacientes'
import { useSupabase } from '@/providers/supabase-provider'
import { getPatients, type Patient } from '@/data/pacientes'
import { AudioProcessingStatus } from './audio-processing-status'
import { fetchWithTimeout, NETWORK_CONFIG } from '@/lib/network-config'

interface NewRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordCreated?: (record?: MedicalRecordWithLegacyFields) => void
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
  const { cedroUser } = useSupabase()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '')
  const [appointmentId, setAppointmentId] = useState(preselectedAppointmentId || '')
  const [recordType, setRecordType] = useState<MedicalRecordType>('soap')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<MedicalRecordVisibility>('private')
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  
  // Audio import states
  const [importedAudio, setImportedAudio] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [recordingJobId, setRecordingJobId] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    setImportedAudio(null)
    setIsImporting(false)
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setIsPlaying(false)
    setPlaybackTime(0)
    stopRecording()
    stopPlayback()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startRecording = async () => {
    try {
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Seu navegador não suporta captura de tela. Use Chrome, Firefox ou Edge.')
      }

      // Capture screen/tab audio for teleconsultation
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        },
        video: true
      })

      // Capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      // Extract audio tracks
      const displayAudioTracks = displayStream.getAudioTracks()
      const micAudioTracks = micStream.getAudioTracks()

      if (displayAudioTracks.length === 0) {
        throw new Error('Nenhum áudio detectado na tela/aba selecionada')
      }

      if (micAudioTracks.length === 0) {
        throw new Error('Nenhum microfone detectado')
      }

      // Create AudioContext to mix both audio sources
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()

      // Create sources for both streams
      const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks))
      const micSource = audioContext.createMediaStreamSource(new MediaStream(micAudioTracks))

      // Connect both sources to destination (this mixes them)
      displaySource.connect(destination)
      micSource.connect(destination)

      // Stop video tracks to save resources
      displayStream.getVideoTracks().forEach(track => track.stop())
      
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Clean up audio context and streams
        audioContext.close()
        displayStream.getTracks().forEach(track => track.stop())
        micStream.getTracks().forEach(track => track.stop())
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioRecording({
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime
        })
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
          description: 'Gravação da teleconsulta iniciada'
        })
    } catch (error) {
      console.error('Error starting recording:', error)
      
      let errorMessage = 'Erro ao iniciar gravação.'
      
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          errorMessage = 'Seu navegador não suporta esta funcionalidade. Use Chrome, Firefox ou Edge.'
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada. Clique em "Compartilhar" e selecione a aba da videochamada.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma tela ou aba disponível para compartilhar.'
        } else if (error.message.includes('áudio detectado')) {
          errorMessage = error.message
        } else {
          errorMessage = `${errorMessage} ${error.message}`
        }
      }
      
      toast({
          title: 'Erro',
          description: errorMessage,
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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type - support specific audio formats
    const supportedTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/m4a',
      'audio/mp4',
      'audio/webm',
      'audio/ogg'
    ]
    
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = ['mp3', 'wav', 'm4a', 'webm', 'ogg']
    
    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
      toast({
        title: 'Erro',
        description: 'Formato de áudio não suportado. Use: MP3, WAV, M4A, WebM ou OGG',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 150MB)
    const maxSize = 150 * 1024 * 1024 // 150MB
    if (file.size > maxSize) {
      toast({
        title: 'Erro',
        description: 'O arquivo é muito grande. Tamanho máximo: 150MB',
        variant: 'destructive'
      })
      return
    }

    setImportedAudio(file)
    
    // Create audio recording object for preview
    const audioUrl = URL.createObjectURL(file)
    const audio = new Audio(audioUrl)
    
    audio.onloadedmetadata = () => {
      setAudioRecording({
        blob: file,
        url: audioUrl,
        duration: audio.duration
      })
      
      toast({
        title: 'Sucesso',
        description: 'Arquivo de áudio importado com sucesso'
      })
    }

    audio.onerror = () => {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar o arquivo de áudio',
        variant: 'destructive'
      })
      setImportedAudio(null)
    }
  }

  const processImportedAudio = async () => {
    if (!importedAudio || !selectedPatientId || !cedroUser) {
      return
    }

    setIsImporting(true)
    
    try {
      // Upload the imported audio file
      const formData = new FormData()
      formData.append('audio', importedAudio)
      formData.append('patient_id', selectedPatientId)
      formData.append('therapist_id', cedroUser.id)
      if (appointmentId) {
        formData.append('appointment_id', appointmentId)
      }

      const uploadResponse = await fetchWithTimeout('/api/audio/upload', {
        method: 'POST',
        body: formData,
        timeout: NETWORK_CONFIG.UPLOAD_TIMEOUT
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro no upload do áudio')
      }

      const uploadData = await uploadResponse.json()
      const recordingJobId = uploadData.recording_job_id

      // Process the uploaded audio
      const processResponse = await fetchWithTimeout('/api/audio/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recording_job_id: recordingJobId
        }),
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })

      if (!processResponse.ok) {
        throw new Error('Erro no processamento do áudio')
      }

      setRecordingJobId(recordingJobId)
      
      toast({
        title: 'Sucesso',
        description: 'Áudio enviado para processamento. Aguarde a geração do prontuário.'
      })

    } catch (error) {
      console.error('Error processing imported audio:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar áudio importado',
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const removeImportedAudio = () => {
    if (audioRecording?.url) {
      URL.revokeObjectURL(audioRecording.url)
    }
    setImportedAudio(null)
    setAudioRecording(null)
    setPlaybackTime(0)
    stopPlayback()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    toast({
      title: 'Sucesso',
      description: 'Arquivo removido'
    })
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
    setRecordingJobId(null)
    
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
    console.log('🔍 DEBUG handleSave - Dados enviados:')
    console.log('- selectedPatientId:', selectedPatientId)
    console.log('- title:', title)
    console.log('- cedroUser.id:', cedroUser?.id)
    console.log('- appointmentId:', appointmentId)
    console.log('- audioRecording:', audioRecording ? 'presente' : 'ausente')
    
    if (!selectedPatientId || !title.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    if (!cedroUser?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)

      // If there's audio recording or imported audio, upload and process it
      if (audioRecording) {
        console.log('🎵 DEBUG Upload de áudio:')
        console.log('- selectedPatientId:', selectedPatientId)
        console.log('- cedroUser.id:', cedroUser.id)
        console.log('- appointmentId:', appointmentId)
        
        // Determine if it's imported audio or recorded audio
        const isImported = importedAudio !== null
        
        // Upload audio for processing
        const formData = new FormData()
        if (isImported && importedAudio) {
          formData.append('audio', importedAudio, importedAudio.name)
          console.log('- Tipo: áudio importado, nome:', importedAudio.name)
        } else {
          formData.append('audio', audioRecording.blob, 'teleconsulta.webm')
          console.log('- Tipo: áudio gravado, tamanho:', audioRecording.blob.size)
        }
        formData.append('patient_id', selectedPatientId)
        formData.append('therapist_id', cedroUser.id)
        if (appointmentId) {
          formData.append('appointment_id', appointmentId)
        }
        // Map recordType to tipo_consulta
        const tipoConsulta = recordType === 'anamnesis' ? 'anamnese' : 'evolucao'
        formData.append('tipo_consulta', tipoConsulta)
        
        console.log('📤 Enviando FormData para /api/audio/upload')

        const uploadResponse = await fetchWithTimeout('/api/audio/upload', {
          method: 'POST',
          body: formData,
          timeout: NETWORK_CONFIG.UPLOAD_TIMEOUT
        })

        console.log('📋 Resposta do upload:')
        console.log('- Status:', uploadResponse.status, uploadResponse.statusText)
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.log('❌ Erro na resposta:', errorText)
          
          let errorMessage = 'Erro ao enviar áudio para processamento'
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            // Se não conseguir fazer parse, usa o texto bruto
            errorMessage = errorText || errorMessage
          }
          
          throw new Error(errorMessage)
        }

        const uploadResult = await uploadResponse.json()
        
        // Set recording job ID to show processing status
        setRecordingJobId(uploadResult.recording_job_id)

        toast({
          title: 'Sucesso',
          description: 'Áudio enviado para processamento. Acompanhe o progresso abaixo.',
          duration: 5000
        })
        
        // For audio processing, we don't have the record immediately
        // The callback will be called without parameters to trigger a refresh
        onRecordCreated?.()
        return
      }

      // If no audio, create regular medical record
      const recordData: CreateMedicalRecordData = {
        patient_id: selectedPatientId,
        appointment_id: appointmentId || null,
        note_type: recordType,
        content_json: {
          title: title.trim(),
          content: content.trim(),
          has_audio: false,
          audio_duration: 0,
          created_with_audio: false
        },
        visibility
      }

      const newRecord = await createMedicalRecord(recordData)
      
      toast({
          title: 'Sucesso',
          description: 'Registro médico criado com sucesso!'
        })
        onRecordCreated?.(newRecord)
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
              <Select 
                value={selectedPatientId || ""} 
                onValueChange={(value) => setSelectedPatientId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(patients) && patients.length > 0 ? (
                    patients.map((patient) => (
                      <SelectItem key={`patient-${patient.id}`} value={patient.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {patient.full_name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div key="no-patients" className="p-4 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Nenhum paciente encontrado
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          onOpenChange(false)
                          router.push('/pacientes')
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Cadastrar Paciente
                      </Button>
                    </div>
                  )}
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
                  <Badge variant={selectedPatient.is_on_hold ? 'secondary' : 'default'}>
                    {selectedPatient.is_on_hold ? 'Em pausa' : 'Ativo'}
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
                      <SelectItem key="record-type-anamnesis" value="anamnesis">Anamnese</SelectItem>
                      <SelectItem key="record-type-soap" value="soap">SOAP</SelectItem>
                      <SelectItem key="record-type-evolution" value="evolution">Evolução</SelectItem>
                      <SelectItem key="record-type-prescription" value="prescription_draft">Prescrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibilidade</Label>
                  <Select value={visibility} onValueChange={(value: MedicalRecordVisibility) => setVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="visibility-private" value="private">Privado</SelectItem>
                      <SelectItem key="visibility-shared" value="shared">Compartilhado</SelectItem>
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
                    Capture o áudio da teleconsulta (terapeuta + paciente) compartilhando a aba/tela da videochamada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!audioRecording ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        {!isRecording ? (
                          <>
                            <Button onClick={startRecording} size="lg" className="gap-2">
                              <Mic className="h-5 w-5" />
                              Capturar Áudio da Teleconsulta
                            </Button>
                            <div className="text-muted-foreground">ou</div>
                            <Button 
                              onClick={() => fileInputRef.current?.click()} 
                              variant="outline" 
                              size="lg" 
                              className="gap-2"
                              disabled={isImporting}
                            >
                              <Upload className="h-5 w-5" />
                              {isImporting ? 'Importando...' : 'Importar Áudio'}
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/webm,audio/ogg,.mp3,.wav,.m4a,.webm,.ogg"
                              onChange={handleFileImport}
                              className="hidden"
                            />
                          </>
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
                            <p className="font-medium">
                              {importedAudio ? 'Áudio Importado' : 'Gravação de Áudio'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {importedAudio ? (
                                <>
                                  Arquivo: {importedAudio.name} • Duração: {formatTime(audioRecording.duration)}
                                </>
                              ) : (
                                `Duração: ${formatTime(audioRecording.duration)}`
                              )}
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
                            onClick={importedAudio ? removeImportedAudio : deleteRecording}
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
                        Capturar Nova Teleconsulta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Audio Processing Status */}
        {recordingJobId && (
          <div className="px-6 pb-4">
            <AudioProcessingStatus 
              recordingJobId={recordingJobId}
              onViewRecord={(recordId) => {
                // TODO: Implement view record functionality
                console.log('View record:', recordId)
                toast({
                  title: 'Prontuário Gerado',
                  description: 'O prontuário foi gerado com sucesso!',
                })
              }}
            />
          </div>
        )}

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