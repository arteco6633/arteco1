import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { CartProvider } from '@/components/CartContext'
import { WishlistProvider } from '@/components/WishlistContext'
import { Suspense } from 'react'
import BootLoader from '@/components/BootLoader'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'ARTECO - Интернет-магазин',
  description: 'Современный интернет-магазин',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://arteco.example'),
  openGraph: {
    title: 'ARTECO — современная мебель',
    description: 'Каталог, кухни, новинки, акции. Дизайн и качество.',
    url: '/',
    siteName: 'ARTECO',
    type: 'website',
    images: [{ url: '/favicon-1024x1024.png', width: 1024, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARTECO — современная мебель',
    description: 'Каталог, кухни, новинки, акции. Дизайн и качество.',
    images: ['/favicon-1024x1024.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon-1024x1024.png', sizes: '1024x1024', type: 'image/png' },
      { url: '/favicon-2048x2048.png', sizes: '2048x2048', type: 'image/png' },
      { url: '/favicon-original.png', sizes: '1920x1920', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-2048x2048.png',
  },
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
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
        <link rel="icon" type="image/png" sizes="1024x1024" href="/favicon-1024x1024.png" />
        <link rel="icon" type="image/png" sizes="2048x2048" href="/favicon-2048x2048.png" />
        <link rel="icon" type="image/png" sizes="1920x1920" href="/favicon-original.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon-2048x2048.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="1024x1024" href="/favicon-1024x1024.png" />
      </head>
      <body className="bg-white overflow-x-hidden">
        {/* Прелоадер до гидрации (виден и на жёстком обновлении, и на мобилках) */}
        <div id="arteco-boot-loader" className="fixed inset-0 z-[1000] bg-white grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl font-bold tracking-wide">ART × CO</div>
            <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          </div>
        </div>
        <BootLoader />
        {/* Более широкая контентная ширина и адаптивные боковые отступы */}
        <Providers>
          <CartProvider>
            <WishlistProvider>
              <AppShell>
                {children}
              </AppShell>
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}

