import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARTECO CRM',
  description: 'Внутренняя CRM система ARTECO',
}

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}

