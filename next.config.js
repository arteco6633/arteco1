const path = require('path')

/** @type {import('next').NextConfig} */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseHost = ''
try {
  supabaseHost = new URL(SUPABASE_URL).host
} catch {}

const nextConfig = {
  reactStrictMode: true,
  // Явно указываем корень для output file tracing, чтобы убрать предупреждение
  outputFileTracingRoot: path.resolve(__dirname),
  
  // Оптимизация производительности
  // swcMinify по умолчанию включен в Next.js 15
  compress: true,
  
  // Оптимизация сборки
  experimental: {
    optimizePackageImports: ['framer-motion', '@supabase/supabase-js'],
  },
  
  // Настройки компилятора для меньшего размера bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  images: {
    remotePatterns: [
      // Основной хост Supabase из переменной окружения
      supabaseHost
        ? { protocol: 'https', hostname: supabaseHost, pathname: '/storage/**' }
        : null,
      // Резервные хосты Supabase
      { protocol: 'https', hostname: 'zijajicude.beget.app', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'zijajicude.beget.app', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ].filter(Boolean),
    formats: ['image/avif', 'image/webp'],
    // Отключаем оптимизацию для всех изображений, чтобы избежать превышения лимита Vercel
    // На бесплатном тарифе лимит 5K преобразований/месяц - уже превышен
    // Это предотвратит блокировку сайта на медленном интернете
    unoptimized: true,
    // Настройка качеств изображений для Next.js 16
    qualities: [75, 85, 90, 95, 100],
    // Минимальное качество по умолчанию для лучшей производительности
    minimumCacheTTL: 60,
    // Разрешаем загрузку изображений с любых HTTPS источников в режиме разработки
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers для безопасности и кэширования
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Content Security Policy для защиты от XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://integrationjs.tbank.ru https://pay.yandex.ru https://securepay.tinkoff.ru",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "media-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://zijajicude.beget.app https://api-statist.tinkoff.ru https://integrationjs.tbank.ru",
              "frame-src https://integrationjs.tbank.ru https://securepay.tinkoff.ru",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Strict Transport Security для принудительного HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Referrer Policy для контроля передачи referrer
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy для ограничения доступа к API браузера
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()'
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

