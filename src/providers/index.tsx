'use client'

import { QueryProvider } from './query-provider'
import { SupabaseProvider } from './supabase-provider'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </SupabaseProvider>
  )
}