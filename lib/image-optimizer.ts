/**
 * Утилита для оптимизации изображений из Supabase Storage
 * Использует Supabase Image Transform API для автоматического сжатия
 */

/**
 * Получает оптимизированный URL изображения из Supabase Storage
 * @param originalUrl - Оригинальный URL изображения
 * @param width - Максимальная ширина в пикселях
 * @param quality - Качество изображения (1-100), по умолчанию 85
 * @param format - Формат изображения (webp, avif, jpeg, png)
 * @returns Оптимизированный URL с параметрами преобразования
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  width?: number,
  quality = 85,
  format: 'webp' | 'avif' | 'jpeg' | 'png' = 'webp'
): string {
  if (!originalUrl) return ''
  
  // Если это не Supabase Storage URL, возвращаем как есть
  if (!originalUrl.includes('beget.app') && !originalUrl.includes('supabase')) {
    return originalUrl
  }
  
  // Проверяем, есть ли уже параметры запроса
  const url = new URL(originalUrl)
  const params = new URLSearchParams(url.search)
  
  // Добавляем параметры трансформации только если их еще нет
  if (width && !params.has('width')) {
    params.set('width', width.toString())
  }
  if (!params.has('quality')) {
    params.set('quality', quality.toString())
  }
  if (!params.has('format')) {
    params.set('format', format)
  }
  
  url.search = params.toString()
  return url.toString()
}

/**
 * Получает preview (thumbnail) URL для изображения
 * Используется для списков где не нужны полные изображения
 * @param originalUrl - Оригинальный URL изображения
 * @param size - Размер превью в пикселях, по умолчанию 500
 * @returns URL превью изображения
 */
export function getPreviewImageUrl(
  originalUrl: string | null | undefined,
  size = 500
): string {
  return getOptimizedImageUrl(originalUrl, size, 75, 'webp')
}

/**
 * Получает URL изображения для мобильных устройств
 * Меньший размер для экономии трафика
 */
export function getMobileImageUrl(
  originalUrl: string | null | undefined,
  maxWidth = 800
): string {
  return getOptimizedImageUrl(originalUrl, maxWidth, 80, 'webp')
}

/**
 * Получает URL изображения для десктопа
 * Больший размер для лучшего качества
 */
export function getDesktopImageUrl(
  originalUrl: string | null | undefined,
  maxWidth = 1920
): string {
  return getOptimizedImageUrl(originalUrl, maxWidth, 85, 'webp')
}


