'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Patient, deletePatient } from '@/data/pacientes'

interface PatientDeleteDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PatientDeleteDialog({ 
  patient, 
  open, 
  onOpenChange, 
  onSuccess 
}: PatientDeleteDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!patient) return

    setLoading(true)
    try {
      const success = await deletePatient(patient.id)
      
      if (success) {
        toast.success('Paciente excluído com sucesso!')
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error('Erro ao excluir paciente')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Erro ao excluir paciente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o paciente <strong>{patient?.full_name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. Todos os dados relacionados ao paciente, 
            incluindo consultas, prontuários e histórico financeiro, serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Paciente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}