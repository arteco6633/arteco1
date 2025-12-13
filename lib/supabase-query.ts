/**
 * Утилиты для безопасных Supabase запросов с таймаутом
 * Предотвращает зависание запросов на медленном интернете
 */

const DEFAULT_TIMEOUT = 15000 // 15 секунд по умолчанию
const SLOW_CONNECTION_TIMEOUT = 10000 // 10 секунд для медленного интернета

/**
 * Определяет медленное соединение
 */
export function isSlowConnection(): boolean {
  if (typeof window === 'undefined') return false
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection
  
  if (!connection) return false
  
  return (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    (connection.downlink && connection.downlink < 1.5)
  )
}

/**
 * Создает Promise с таймаутом
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

/**
 * Обертка для Supabase запроса с автоматическим таймаутом
 * @param query - Supabase query builder или Promise
 * @param timeoutMs - Таймаут в миллисекундах (по умолчанию зависит от скорости соединения)
 */
export async function withQueryTimeout<T>(
  query: Promise<{ data: T | null; error: any }> | { then: (onfulfilled?: any) => any },
  timeoutMs?: number
): Promise<{ data: T | null; error: any }> {
  const timeout = timeoutMs ?? (isSlowConnection() ? SLOW_CONNECTION_TIMEOUT : DEFAULT_TIMEOUT)
  
  // Если это не Promise, преобразуем его в Promise
  const queryPromise = Promise.resolve(query) as Promise<{ data: T | null; error: any }>
  
  try {
    const result = await withTimeout(
      queryPromise,
      timeout,
      `Запрос превысил таймаут ${timeout}мс`
    )
    return result
  } catch (error: any) {
    // Если это таймаут, возвращаем ошибку с понятным сообщением
    if (error?.message?.includes('timeout')) {
      console.warn('Запрос отменен из-за таймаута:', error.message)
      return {
        data: null,
        error: {
          message: 'Запрос занял слишком много времени. Проверьте подключение к интернету.',
          code: 'TIMEOUT'
        }
      }
    }
    // Для других ошибок возвращаем как есть
    return {
      data: null,
      error: error || { message: 'Неизвестная ошибка' }
    }
  }
}

/**
 * Обертка для Promise.all с таймаутом
 */
export async function withQueryTimeoutAll<T>(
  queries: Array<Promise<{ data: T | null; error: any }>>,
  timeoutMs?: number
): Promise<Array<{ data: T | null; error: any }>> {
  const timeout = timeoutMs ?? (isSlowConnection() ? SLOW_CONNECTION_TIMEOUT : DEFAULT_TIMEOUT)
  
  try {
    const results = await withTimeout(
      Promise.all(queries),
      timeout,
      `Запросы превысили таймаут ${timeout}мс`
    )
    return results
  } catch (error: any) {
    // Возвращаем пустые результаты при таймауте
    console.warn('Запросы отменены из-за таймаута:', error.message)
    return queries.map(() => ({
      data: null,
      error: {
        message: 'Запросы заняли слишком много времени. Проверьте подключение к интернету.',
        code: 'TIMEOUT'
      }
    }))
  }
}

