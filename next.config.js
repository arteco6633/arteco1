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
  swcMinify: true,
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
    // Отключаем оптимизацию для внешних изображений, чтобы избежать ошибок 402
    // На Vercel Image Optimization API может требовать платную подписку
    unoptimized: false,
    // Настройка качеств изображений для Next.js 16
    qualities: [75, 85, 90, 95, 100],
    // Минимальное качество по умолчанию для лучшей производительности
    minimumCacheTTL: 60,
    // Разрешаем загрузку изображений с любых HTTPS источников в режиме разработки
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers для кэширования и оптимизации
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

