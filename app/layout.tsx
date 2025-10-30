import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { CartProvider } from '@/components/CartContext'
import CartDrawer from '@/components/CartDrawer'
import MobileBottomNav from '@/components/MobileBottomNav'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'
import BrandLoader from '@/components/BrandLoader'

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
        <Providers>
          <CartProvider>
            <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto w-full overflow-x-hidden px-1 md:px-2 xl:px-4 2xl:px-6">
              <Navbar />
              <Suspense fallback={<div className="min-h-[50vh] w-full grid place-items-center"><BrandLoader width={200} /></div>}>
                {children}
              </Suspense>
              <footer className="bg-gray-800 text-white py-8 mt-12 overflow-x-hidden w-full max-w-full clip-x">
                <div className="w-full max-w-[1400px] 2xl:max-w-none mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 overflow-x-hidden">
                  <div className="text-center">
                    <p className="break-words">&copy; 2025 ARTECO. Все права защищены.</p>
                  </div>
                </div>
              </footer>
            </div>
            <MobileBottomNav />
            <CartDrawer />
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}

