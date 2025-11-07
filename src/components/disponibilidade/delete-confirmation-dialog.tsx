'use client'

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
import { Clock, Calendar, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: 'schedule' | 'exception'
  itemDetails: {
    day?: string
    date?: string
    time: string
    note?: string
  }
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  itemDetails
}: DeleteConfirmationDialogProps) {
  const title = type === 'schedule' ? 'Excluir Horário Regular?' : 'Excluir Exceção?'
  const description = type === 'schedule'
    ? 'Este horário será removido permanentemente da sua agenda semanal. Esta ação não pode ser desfeita.'
    : 'Esta exceção será removida permanentemente. Esta ação não pode ser desfeita.'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
          <div className="font-medium text-sm">Item a ser excluído:</div>

          {itemDetails.day && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{itemDetails.day}</span>
            </div>
          )}

          {itemDetails.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{itemDetails.date}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{itemDetails.time}</span>
          </div>

          {itemDetails.note && (
            <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
              <span className="font-medium">Nota:</span> {itemDetails.note}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
