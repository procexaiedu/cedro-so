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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Lead, deleteLead } from '@/data/crm'

interface LeadDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess: () => void
}

export function LeadDeleteDialog({ 
  open, 
  onOpenChange, 
  lead, 
  onSuccess 
}: LeadDeleteDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!lead) return

    setLoading(true)
    try {
      await deleteLead(lead.id)
      toast.success('Lead excluído com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Erro ao excluir lead')
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
            Tem certeza que deseja excluir o lead <strong>{lead?.name}</strong>?
            <br />
            Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Lead
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}