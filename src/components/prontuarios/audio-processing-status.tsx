'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Mic,
  RefreshCw,
  Eye
} from 'lucide-react'
import { useAudioProcessing } from '@/hooks/use-audio-processing'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AudioProcessingStatusProps {
  recordingJobId: string
  onViewRecord?: (recordId: string) => void
}

export function AudioProcessingStatus({ recordingJobId, onViewRecord }: AudioProcessingStatusProps) {
  const { status, loading, error, isCompleted, isError, isProcessing, refetch } = useAudioProcessing(recordingJobId)

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!status) {
    return null
  }

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (isError) return <XCircle className="h-5 w-5 text-red-500" />
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
  }

  const getStatusText = () => {
    switch (status.status) {
      case 'uploaded':
        return 'Áudio enviado'
      case 'processing':
        return 'Iniciando processamento'
      case 'transcribing':
        return `Transcrevendo áudio (${status.processed_chunks || 0}/${status.total_chunks || 0} chunks)`
      case 'generating_record':
        return 'Gerando prontuário médico'
      case 'completed':
        return 'Processamento concluído'
      case 'error':
        return 'Erro no processamento'
      default:
        return 'Processando'
    }
  }

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (isCompleted) return "default"
    if (isError) return "destructive"
    return "secondary"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Processamento de Áudio
        </CardTitle>
        <CardDescription>
          Status do processamento da teleconsulta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(status.updated_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="w-full" />
          </div>
        )}

        {/* Error Message */}
        {isError && status.error_message && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {status.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Audio Information */}
        {status.audio_duration_seconds && (
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="text-sm font-medium">Informações do Áudio</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Duração:</span>
                <span className="ml-1">{Math.round(status.audio_duration_seconds / 60)}min {status.audio_duration_seconds % 60}s</span>
              </div>
              {(status.total_chunks || 0) > 0 && (
                <div>
                  <span className="text-muted-foreground">Chunks:</span>
                  <span className="ml-1">{status.total_chunks}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mic className="h-4 w-4" />
            <span className={status.has_transcript ? 'text-green-600' : 'text-muted-foreground'}>
              Transcrição de áudio
            </span>
            {status.has_transcript && <CheckCircle className="h-4 w-4 text-green-500" />}
            {(status.total_chunks || 0) > 0 && (status.processed_chunks || 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                ({status.processed_chunks || 0}/{status.total_chunks || 0})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className={status.has_structured_record ? 'text-green-600' : 'text-muted-foreground'}>
              Prontuário estruturado
            </span>
            {status.has_structured_record && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        </div>

        {/* Timing Information */}
        {(status.processing_started_at || status.processing_completed_at) && (
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="text-sm font-medium">Timing do Processamento</div>
            <div className="space-y-1 text-xs">
              {status.processing_started_at && (
                <div>
                  <span className="text-muted-foreground">Iniciado:</span>
                  <span className="ml-1">
                    {formatDistanceToNow(new Date(status.processing_started_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
              {status.processing_completed_at && (
                <div>
                  <span className="text-muted-foreground">Concluído:</span>
                  <span className="ml-1">
                    {formatDistanceToNow(new Date(status.processing_completed_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
              {status.progress_details?.estimated_completion && !status.processing_completed_at && (
                <div>
                  <span className="text-muted-foreground">Estimativa:</span>
                  <span className="ml-1">
                    {formatDistanceToNow(new Date(status.progress_details.estimated_completion), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Record Button */}
        {isCompleted && status.medical_record_id && onViewRecord && (
          <Button 
            onClick={() => onViewRecord(status.medical_record_id!)}
            className="w-full gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Prontuário Gerado
          </Button>
        )}

        {/* Refresh Button for Processing */}
        {isProcessing && (
          <Button 
            variant="outline" 
            onClick={refetch}
            className="w-full gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </Button>
        )}

        {/* Processing Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>ID do Job: {status.id}</div>
          <div>Criado: {formatDistanceToNow(new Date(status.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}</div>
          {status.sources.length > 0 && (
            <div>Fonte: {status.sources[0]?.type || 'teleconsultation'}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}