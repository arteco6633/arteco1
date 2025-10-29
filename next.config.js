const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Явно указываем корень для output file tracing, чтобы убрать предупреждение
  outputFileTracingRoot: path.resolve(__dirname),
}

module.exports = nextConfig

