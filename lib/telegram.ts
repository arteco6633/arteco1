/**
 * Telegram Web App API утилиты
 * Документация: https://core.telegram.org/bots/webapps
 */

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
      photo_url?: string
    }
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
    removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void
    getKeys: (callback: (error: Error | null, keys: string[]) => void) => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  sendData: (data: string) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  openInvoice: (url: string, callback?: (status: string) => void) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text: string
    }>
  }, callback?: (id: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  showScanQrPopup: (params: {
    text?: string
  }, callback?: (data: string) => void) => void
  closeScanQrPopup: () => void
  readTextFromClipboard: (callback: (text: string) => void) => void
  requestWriteAccess: (callback?: (granted: boolean) => void) => void
  requestContact: (callback?: (granted: boolean) => void) => void
  onEvent: (eventType: string, eventHandler: () => void) => void
  offEvent: (eventType: string, eventHandler: () => void) => void
  setHeaderColor: (color: 'bg_color' | 'secondary_bg_color' | string) => void
  setBackgroundColor: (color: string) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  onViewportChanged: (callback: () => void) => void
  offViewportChanged: (callback: () => void) => void
  isVersionAtLeast: (version: string) => boolean
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Проверяет, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false
  return typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined'
}

/**
 * Получает объект Telegram Web App
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

/**
 * Инициализирует Telegram Web App
 */
export function initTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  
  const tg = getTelegramWebApp()
  if (!tg) return null

  // Разворачиваем приложение на весь экран
  tg.expand()
  
  // Готовим приложение
  tg.ready()
  
  // Включаем подтверждение закрытия
  tg.enableClosingConfirmation()
  
  // Настраиваем цвета согласно теме Telegram
  if (tg.themeParams.bg_color) {
    tg.setHeaderColor(tg.themeParams.bg_color)
    tg.setBackgroundColor(tg.themeParams.bg_color)
  }
  
  return tg
}

/**
 * Получает информацию о пользователе Telegram
 */
export function getTelegramUser() {
  const tg = getTelegramWebApp()
  if (!tg) return null
  return tg.initDataUnsafe.user || null
}

/**
 * Применяет тему Telegram к странице
 */
export function applyTelegramTheme() {
  const tg = getTelegramWebApp()
  if (!tg) return

  const theme = tg.themeParams
  const root = document.documentElement

  if (theme.bg_color) {
    root.style.setProperty('--tg-theme-bg-color', theme.bg_color)
  }
  if (theme.text_color) {
    root.style.setProperty('--tg-theme-text-color', theme.text_color)
  }
  if (theme.hint_color) {
    root.style.setProperty('--tg-theme-hint-color', theme.hint_color)
  }
  if (theme.link_color) {
    root.style.setProperty('--tg-theme-link-color', theme.link_color)
  }
  if (theme.button_color) {
    root.style.setProperty('--tg-theme-button-color', theme.button_color)
  }
  if (theme.button_text_color) {
    root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color)
  }
  if (theme.secondary_bg_color) {
    root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color)
  }
}
