import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Инициализация Redis для rate limiting
// Если переменные окружения не установлены, используем in-memory fallback
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

try {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 запросов за 10 секунд по умолчанию
      analytics: true,
    })
  }
} catch (error) {
  console.warn('Rate limiting не настроен. Установите UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN')
}

// In-memory fallback для разработки
const memoryStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  identifier: string,
  options: { limit?: number; window?: string } = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limit = options.limit || 10
  const windowMs = parseWindow(options.window || '10 s')

  // Если Redis настроен, используем его
  if (ratelimit && redis) {
    try {
      const result = await ratelimit.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fallback на in-memory
    }
  }

  // In-memory fallback
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  const record = memoryStore.get(key)

  if (!record || record.resetTime < now) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs })
    // Очистка старых записей
    if (memoryStore.size > 1000) {
      for (const [k, v] of Array.from(memoryStore.entries())) {
        if (v.resetTime < now) {
          memoryStore.delete(k)
        }
      }
    }
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime }
  }

  record.count++
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime }
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h)$/)
  if (!match) return 10000 // 10 секунд по умолчанию

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    default:
      return 10000
  }
}

// Специальные лимиты для разных типов запросов
export const rateLimiters = {
  // Логин - более строгий лимит
  login: (identifier: string) => rateLimit(identifier, { limit: 5, window: '15 m' }),
  // API запросы - стандартный лимит
  api: (identifier: string) => rateLimit(identifier, { limit: 100, window: '1 m' }),
  // OTP отправка - очень строгий лимит
  otp: (identifier: string) => rateLimit(identifier, { limit: 3, window: '10 m' }),
  // Общие запросы
  default: (identifier: string) => rateLimit(identifier),
}

