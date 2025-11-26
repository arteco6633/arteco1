/**
 * Утилиты для кэширования данных на клиенте
 * Используется для уменьшения количества запросов к Supabase
 */

// Простой in-memory кэш
const cache = new Map<string, { data: any; expires: number }>()

// Время жизни кэша (5 минут)
const CACHE_TTL = 5 * 60 * 1000

/**
 * Получить данные из кэша
 */
export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.expires) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

/**
 * Сохранить данные в кэш
 */
export function setCached<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  })
}

/**
 * Очистить кэш
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Создать ключ кэша для Supabase запроса
 */
export function createCacheKey(table: string, filters: Record<string, any> = {}): string {
  const filterStr = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&')
  return `supabase:${table}:${filterStr}`
}


