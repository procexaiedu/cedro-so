/**
 * Date utilities for consistent formatting across the application
 */

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'

  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Agora mesmo'
  }

  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'} atrás`
  }

  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'} atrás`
  }

  // Days
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'} atrás`
  }

  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'} atrás`
  }

  // Months
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'} atrás`
  }

  // Years
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'} atrás`
}

export function formatDateWithRelative(dateString: string | null): string {
  if (!dateString) return '-'

  const date = new Date(dateString)
  const formatted = date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const relative = formatRelativeTime(dateString)

  // If it's "agora mesmo", just return the relative time
  if (relative === 'Agora mesmo') {
    return relative
  }

  // Otherwise show both absolute and relative
  return `${formatted} (${relative})`
}

export function getAppointmentStatus(dateString: string | null): 'past' | 'soon' | 'future' | 'none' {
  if (!dateString) return 'none'

  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays < 0) return 'past'
  if (diffInDays <= 7) return 'soon'
  return 'future'
}
