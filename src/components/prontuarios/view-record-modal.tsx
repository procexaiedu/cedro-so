'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Stethoscope,
  Download,
  Edit,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react'
import { type MedicalRecordWithLegacyFields, getMedicalRecordTypeLabel } from '@/data/pacientes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ViewRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MedicalRecordWithLegacyFields | null
  onEdit?: (record: MedicalRecordWithLegacyFields) => void
}

export function ViewRecordModal({ open, onOpenChange, record, onEdit }: ViewRecordModalProps) {
  if (!record) return null

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'default'
      case 'private': return 'secondary'
      case 'restricted': return 'destructive'
      default: return 'secondary'
    }
  }

  // Extract content from different sources
  const getRecordContent = () => {
    // First try to get markdown content from content_json
    if (record.content_json?.markdown_content) {
      return record.content_json.markdown_content
    }
    // Fallback to legacy content field
    if (record.content) {
      return record.content
    }
    return null
  }

  const getTranscriptionContent = () => {
    // Try to get raw transcript from content_json
    if (record.content_json?.raw_transcript) {
      return record.content_json.raw_transcript
    }
    // Fallback to legacy transcription field
    if (record.transcription) {
      return record.transcription
    }
    return null
  }

  const handleDownload = () => {
    const content = getRecordContent()
    const transcription = getTranscriptionContent()
    
    // Criar um blob com o conteúdo do prontuário
    const downloadContent = `
PRONTUÁRIO MÉDICO
================

Paciente: ${record.patient_name || 'Não informado'}
Terapeuta: ${record.therapist_name || 'Não informado'}
Tipo: ${getMedicalRecordTypeLabel(record.note_type)}
Data: ${formatDateTime(record.created_at)}
Visibilidade: ${getVisibilityLabel(record.visibility)}

CONTEÚDO:
${content || 'Sem conteúdo disponível'}

${record.audio_url ? `\nÁudio disponível: ${record.audio_url}` : ''}
${transcription ? `\nTranscrição: ${transcription}` : ''}
    `.trim()

    const blob = new Blob([downloadContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prontuario_${record.patient_name?.replace(/\s+/g, '_') || 'paciente'}_${new Date(record.created_at).toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Visualizar Prontuário</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Informações do Paciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Nome:</span>
                    <p className="text-sm text-gray-600">{record.patient_name || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Informações do Atendimento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Terapeuta:</span>
                    <p className="text-sm text-gray-600">{record.therapist_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <div className="mt-1">
                      <Badge variant="outline">{getMedicalRecordTypeLabel(record.note_type)}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Metadados do Registro</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium">Data de Criação:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDateTime(record.created_at)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Última Atualização:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDateTime(record.updated_at)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Visibilidade:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getVisibilityIcon(record.visibility)}
                    <Badge variant={getVisibilityColor(record.visibility)}>
                      {getVisibilityLabel(record.visibility)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conteúdo do Prontuário</CardTitle>
              <CardDescription>
                Registro médico detalhado do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {getRecordContent() ? (
                  <div className="markdown-content text-sm leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-gray-900">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold mb-3 text-gray-800">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-medium mb-2 text-gray-700">{children}</h3>,
                        p: ({children}) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="mb-3 ml-4 list-disc text-gray-600">{children}</ul>,
                        ol: ({children}) => <ol className="mb-3 ml-4 list-decimal text-gray-600">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 my-3">{children}</blockquote>,
                        code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm font-mono mb-3">{children}</pre>
                      }}
                    >
                      {getRecordContent()}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">Nenhum conteúdo disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audio and Transcription */}
          {(record.audio_url || getTranscriptionContent()) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mídia e Transcrição</CardTitle>
                <CardDescription>
                  Arquivos de áudio e transcrições relacionados ao atendimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.audio_url && (
                  <div>
                    <span className="text-sm font-medium">Áudio do Atendimento:</span>
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={record.audio_url} type="audio/mpeg" />
                <source src={record.audio_url} type="audio/wav" />
                <source src={record.audio_url} type="audio/ogg" />
                <source src={record.audio_url} type="audio/webm" />
                <source src={record.audio_url} type="audio/m4a" />
                <source src={record.audio_url} type="audio/mp4" />
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                    </div>
                  </div>
                )}

                {getTranscriptionContent() && (
                  <div>
                    <span className="text-sm font-medium">Transcrição:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{getTranscriptionContent()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              ID: {record.id}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {onEdit && (
                <Button onClick={() => onEdit(record)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}