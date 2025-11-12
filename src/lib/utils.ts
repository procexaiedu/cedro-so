import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte o código de gênero do banco de dados para texto legível
 * @param gender - Código do gênero: 'M' | 'F' | 'O' | null
 * @returns Texto formatado do gênero
 */
export function getGenderDisplay(gender: 'M' | 'F' | 'O' | null | undefined): string {
  switch (gender) {
    case 'M':
      return 'Masculino'
    case 'F':
      return 'Feminino'
    case 'O':
      return 'Outro'
    default:
      return 'Não informado'
  }
}