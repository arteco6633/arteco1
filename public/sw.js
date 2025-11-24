// Service Worker для кэширования статических ресурсов
const CACHE_NAME = 'arteco-v1'
const STATIC_CACHE_NAME = 'arteco-static-v1'

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
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_NAME && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Стратегия кэширования: Cache First для статических ресурсов, Network First для API
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Статические ресурсы (изображения, CSS, JS)
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Для API и других запросов используем Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кэшируем только успешные GET запросы
        if (response.status === 200 && request.method === 'GET') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся взять из кэша
        return caches.match(request)
      })
  )
})

