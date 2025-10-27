import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARTECO - Интернет-магазин',
  description: 'Современный интернет-магазин',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-white">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </body>
    </html>
  )
}

