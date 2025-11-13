import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema Cedro - Gestão de Clínica',
  description: 'Sistema de gestão para clínica de terapia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}