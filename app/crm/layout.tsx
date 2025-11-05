import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARTECO CRM',
  description: 'Внутренняя CRM система ARTECO',
}

// Вложенный layout в App Router не должен заново рендерить <html>/<body>,
// иначе возникает расхождение разметки (hydration mismatch) с корневым layout.
export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

