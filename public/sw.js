// Service Worker для кэширования статических ресурсов
const CACHE_NAME = 'arteco-v2'
const STATIC_CACHE_NAME = 'arteco-static-v2'
const IMAGE_CACHE_NAME = 'arteco-images-v2'

// Ресурсы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/apple-touch-icon.png',
]

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
      // Предзагружаем критические ресурсы
      self.skipWaiting()
    ])
  )
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE_NAME && name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      }),
      self.clients.claim()
    ])
  )
})

// Стратегия кэширования: Cache First для статических ресурсов, Network First для API
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Изображения: Cache First с длинным TTL
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((response) => {
            // Кэшируем только успешные ответы
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          }).catch(() => {
            // Fallback для изображений
            return new Response('', { status: 404 })
          })
        })
      })
    )
    return
  }

  // Статические ресурсы (CSS, JS, шрифты)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }

  // Для API и других запросов используем Network First с коротким TTL
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase') || url.hostname.includes('beget')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Кэшируем только успешные GET запросы на короткое время
          if (response.status === 200 && request.method === 'GET' && url.pathname.startsWith('/api/')) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              // Короткий TTL для API - 1 минута
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Если сеть недоступна, пытаемся взять из кэша (только для GET)
          if (request.method === 'GET') {
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Если нет в кэше, возвращаем ошибку
              return new Response(JSON.stringify({ error: 'Network error' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              })
            })
          }
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }

  // Для остальных запросов - обычный fetch без кэширования
  event.respondWith(fetch(request))
})

