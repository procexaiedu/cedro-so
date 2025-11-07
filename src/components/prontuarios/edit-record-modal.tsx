'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  X, 
  FileText, 
  User, 
  Stethoscope,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  type MedicalRecordWithLegacyFields, 
  type MedicalRecordType, 
  type MedicalRecordVisibility,
  type UpdateMedicalRecordData,
  updateMedicalRecord,
  getMedicalRecordTypeLabel 
} from '@/data/pacientes'

interface EditRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MedicalRecordWithLegacyFields | null
  onRecordUpdated?: (record: MedicalRecordWithLegacyFields) => void
}

export function EditRecordModal({ open, onOpenChange, record, onRecordUpdated }: EditRecordModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateMedicalRecordData>({
    note_type: 'evolution',
    content_json: { content: '' },
    visibility: 'private'
  })

  useEffect(() => {
    if (record) {
      setFormData({
        note_type: record.note_type,
        content_json: { 
          content: record.content || '',
          transcription: record.transcription || undefined
        },
        visibility: record.visibility
      })
    }
  }, [record])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    try {
      setLoading(true)
      const updatedRecord = await updateMedicalRecord(record.id, formData)
      onRecordUpdated?.(updatedRecord)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating medical record:', error)
      // TODO: Add proper error handling/toast notification
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (record) {
      setFormData({
        note_type: record.note_type,
        content_json: { 
          content: record.content || '',
          transcription: record.transcription || undefined
        },
        visibility: record.visibility
      })
    }
    onOpenChange(false)
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="h-4 w-4" />
      case 'private': return <EyeOff className="h-4 w-4" />
      case 'restricted': return <Lock className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Público'
      case 'private': return 'Privado'
      case 'restricted': return 'Restrito'
      default: return 'Desconhecido'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Editar Prontuário</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Record Information (Read-only) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Informações do Registro</CardTitle>
              <CardDescription>
                Dados não editáveis do prontuário médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Paciente</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{record.patient_name || 'Não informado'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Terapeuta</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Stethoscope className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{record.therapist_name || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Data de Criação</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatDateTime(record.created_at)}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">ID do Registro</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">{record.id}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Registro *</Label>
                <Select
                  value={formData.note_type}
                  onValueChange={(value: MedicalRecordType) => 
                    setFormData(prev => ({ ...prev, note_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="therapy">Terapia</SelectItem>
                    <SelectItem value="assessment">Avaliação</SelectItem>
                    <SelectItem value="follow_up">Acompanhamento</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibilidade *</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: MedicalRecordVisibility) => 
                    setFormData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <EyeOff className="h-4 w-4" />
                        <span>Privado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="shared">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Compartilhado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Prontuário *</Label>
              <Textarea
                id="content"
                placeholder="Digite o conteúdo detalhado do prontuário médico..."
                value={formData.content_json?.content || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  content_json: { 
                    ...prev.content_json, 
                    content: e.target.value 
                  } 
                }))}
                rows={12}
                className="resize-none"
                required
              />
              <p className="text-xs text-gray-500">
                Descreva detalhadamente o atendimento, observações, diagnósticos e recomendações.
              </p>
            </div>

            {/* Transcription (if exists) */}
            {record.transcription && (
              <div className="space-y-2">
                <Label htmlFor="transcription">Transcrição</Label>
                <Textarea
                  id="transcription"
                  placeholder="Transcrição do áudio do atendimento..."
                  value={formData.content_json?.transcription || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content_json: { 
                      ...prev.content_json, 
                      transcription: e.target.value 
                    } 
                  }))}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Transcrição automática ou manual do áudio do atendimento.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Audio Information (if exists) */}
          {record.audio_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Áudio do Atendimento</CardTitle>
                <CardDescription>
                  Arquivo de áudio associado a este prontuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <audio controls className="w-full">
                  <source src={record.audio_url} type="audio/mpeg" />
                <source src={record.audio_url} type="audio/wav" />
                <source src={record.audio_url} type="audio/ogg" />
                <source src={record.audio_url} type="audio/webm" />
                <source src={record.audio_url} type="audio/m4a" />
                <source src={record.audio_url} type="audio/mp4" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}