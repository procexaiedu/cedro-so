'use client'

import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OverlapWarningBadgeProps {
  message: string
  className?: string
}

export function OverlapWarningBadge({ message, className }: OverlapWarningBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className={className}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            Conflito
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
