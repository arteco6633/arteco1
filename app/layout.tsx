import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { CartProvider } from '@/components/CartContext'
import { WishlistProvider } from '@/components/WishlistContext'
import { Suspense } from 'react'
import BootLoader from '@/components/BootLoader'
import AppShell from '@/components/AppShell'
import LazyPaymentWidgets from '@/components/LazyPaymentWidgets'

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
    <html lang="ru" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* DNS Prefetch для ускорения подключения на медленном интернете */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
          </>
        )}
        {/* Telegram Web App Script - загружаем асинхронно, не блокируя рендеринг */}
        <script src="https://telegram.org/js/telegram-web-app.js" async defer />
        {/* Preconnect к Supabase для ускорения загрузки */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        {/* Оптимизированные favicon - только необходимые */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="overflow-x-hidden">
        <BootLoader />
        {/* Регистрация Service Worker для кэширования */}
        {/* Безопасность: inline script безопасен, так как это статический код без пользовательского ввода */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Удаляем любой кастомный курсор при загрузке
              document.addEventListener('DOMContentLoaded', function() {
                // Удаляем элементы кастомного курсора
                const customCursors = document.querySelectorAll('[id*="cursor"], [class*="custom-cursor"], [class*="cursor-ring"]');
                customCursors.forEach(el => el.remove());
                
                // Восстанавливаем стандартный курсор
                document.body.style.cursor = '';
                document.documentElement.style.cursor = '';
                
                // Удаляем классы, которые скрывают курсор
                document.body.classList.remove('has-custom-cursor');
              });
              
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('SW registered'))
                    .catch((err) => console.log('SW registration failed'));
                });
              }
            `,
          }}
        />
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
        {/* Платежные виджеты (динамическая загрузка) */}
        <LazyPaymentWidgets />
      </body>
    </html>
  )
}

