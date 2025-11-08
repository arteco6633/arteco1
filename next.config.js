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
      supabaseHost
        ? { protocol: 'https', hostname: supabaseHost, pathname: '/storage/**' }
        : null,
      { protocol: 'https', hostname: 'zjiajicude.beget.app', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ].filter(Boolean),
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

