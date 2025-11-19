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
    // Разрешаем загрузку изображений с любых HTTPS источников в режиме разработки
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig

