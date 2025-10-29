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
    <html lang="ru" className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white overflow-x-hidden">
        {/* Более широкая контентная ширина и адаптивные боковые отступы */}
        <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto w-full overflow-x-hidden px-1 md:px-2 xl:px-4 2xl:px-6">
          {children}
        </div>
      </body>
    </html>
  )
}

