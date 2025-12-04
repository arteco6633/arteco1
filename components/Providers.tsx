'use client'

import { SessionProvider } from 'next-auth/react'
import { TelegramProvider } from '@/components/TelegramProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <TelegramProvider>
        {children}
      </TelegramProvider>
    </SessionProvider>
  )
}


