'use client'

import { useEffect } from 'react'

/**
 * Компонент для загрузки сниппета Долями
 * Документация: https://dolyame.ru/develop/api/integrationscript/
 */
export default function DolyameSnippet() {
  useEffect(() => {
    // Site ID получаем из переменной окружения
    const siteId = process.env.NEXT_PUBLIC_DOLYAME_SITE_ID
    
    if (!siteId) {
      // Не показываем предупреждение, если Dolyame не настроен (это опционально)
      console.debug('Dolyame Site ID not configured. Skipping snippet load.')
      return
    }

    // Проверяем, не загружен ли уже скрипт
    if (document.getElementById('dolyame-script')) {
      return
    }

    // Создаем и добавляем скрипт согласно документации Долями
    const digiScript = document.createElement('script')
    digiScript.id = 'dolyame-script'
    digiScript.src = `//aq.dolyame.ru/${siteId}/client.js?ts=${Date.now()}`
    digiScript.defer = true
    digiScript.async = true
    
    // Обработка ошибок загрузки
    digiScript.onerror = () => {
      console.error('Failed to load Dolyame snippet')
    }
    
    digiScript.onload = () => {
      console.log('Dolyame snippet loaded successfully')
    }
    
    document.body.appendChild(digiScript)

    // Cleanup при размонтировании компонента
    return () => {
      const script = document.getElementById('dolyame-script')
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

