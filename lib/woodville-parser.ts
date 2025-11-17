/**
 * Парсер для получения остатков товаров с сайта Woodville.ru
 */

interface WoodvilleStock {
  moscow: string | number | null // "Много" или число
  ufa: string | number | null // "Много", число или "Нет в наличии"
  sku: string | null
  price: number | null // Цена товара (себестоимость)
}

/**
 * Парсит страницу товара на Woodville и извлекает остатки
 * @param sku - Артикул товара
 * @param productUrl - Опциональный прямой URL страницы товара на Woodville
 * @returns Информация об остатках или null, если товар не найден
 */
export async function parseWoodvilleStock(sku: string, productUrl?: string): Promise<WoodvilleStock | null> {
  try {
    // Если есть прямой URL, используем его
    if (productUrl) {
      return await parseWoodvilleProductPage(productUrl, sku)
    }

    // Иначе пытаемся найти товар через поиск
    const searchUrl = `https://woodville.ru/search/?q=${encodeURIComponent(sku)}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error(`Woodville: HTTP ${response.status} for SKU ${sku}`)
      return null
    }

    const html = await response.text()
    
    // Ищем ссылку на страницу товара в результатах поиска
    // Паттерн: ссылка, содержащая артикул или ведущая на страницу товара
    const productLinkPatterns = [
      new RegExp(`href=["']([^"']*catalog[^"']*${sku}[^"']*)["']`, 'i'),
      new RegExp(`href=["']([^"']*catalog/[^"']*)["'].*Артикул[:\s]+${sku}`, 'i'),
      new RegExp(`Артикул[:\s]+${sku}.*href=["']([^"']*catalog/[^"']*)["']`, 'i'),
    ]
    
    let productUrlFound: string | null = null
    
    for (const pattern of productLinkPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        productUrlFound = match[1].startsWith('http') 
          ? match[1] 
          : `https://woodville.ru${match[1]}`
        break
      }
    }
    
    // Если нашли ссылку на товар, парсим его страницу
    if (productUrlFound) {
      return await parseWoodvilleProductPage(productUrlFound, sku)
    }
    
    // Если не нашли ссылку, пытаемся парсить остатки прямо со страницы поиска
    // (на случай, если остатки отображаются в результатах поиска)
    const moscowMatch = html.match(/Склад\s+Мск[:\s]+(?:<[^>]+>)*([^<]+)/i)
    const ufaMatch = html.match(/Склад\s+Уфа[:\s]+(?:<[^>]+>)*([^<]+)/i)
    
    if (moscowMatch || ufaMatch) {
      return parseStockFromHtml(html, sku)
    }
    
    console.warn(`Could not find product page for SKU ${sku}`)
    return null
  } catch (error: any) {
    console.error(`Error parsing Woodville stock for SKU ${sku}:`, error.message)
    return null
  }
}

/**
 * Парсит остатки из HTML строки
 */
function parseStockFromHtml(html: string, sku: string): WoodvilleStock {
  const moscowMatch = html.match(/Склад\s+Мск[:\s]+(?:<[^>]+>)*([^<]+)/i)
  const ufaMatch = html.match(/Склад\s+Уфа[:\s]+(?:<[^>]+>)*([^<]+)/i)
  
  let moscowStock: string | number | null = null
  let ufaStock: string | number | null = null
  
  if (moscowMatch) {
    moscowStock = parseStockValue(moscowMatch[1].trim())
  }
  
  if (ufaMatch) {
    ufaStock = parseStockValue(ufaMatch[1].trim())
  }
  
  // Пытаемся найти цену на странице поиска (если есть)
  const price = parsePriceFromHtml(html)
  
  return {
    moscow: moscowStock,
    ufa: ufaStock,
    sku,
    price,
  }
}

/**
 * Парсит значение остатков из текста
 */
function parseStockValue(stockText: string): string | number | null {
  const text = stockText.toLowerCase().trim()
  
  if (text === 'много' || text === 'many') {
    return 'Много'
  }
  
  if (text.includes('нет в наличии') || text.includes('not in stock') || text === 'нет') {
    return null
  }
  
  // Пытаемся извлечь число
  const numberMatch = stockText.match(/(\d+)/)
  if (numberMatch) {
    return parseInt(numberMatch[1], 10)
  }
  
  return stockText
}

/**
 * Парсит конкретную страницу товара на Woodville
 * @param productUrl - URL страницы товара
 * @param sku - Артикул для проверки
 */
async function parseWoodvilleProductPage(productUrl: string, sku: string): Promise<WoodvilleStock | null> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // Проверяем, что артикул на странице совпадает
    const skuMatch = html.match(/Артикул[:\s]+(?:<[^>]+>)*(\d+)/i)
    if (skuMatch && skuMatch[1] !== sku) {
      console.warn(`SKU mismatch: expected ${sku}, found ${skuMatch[1]}`)
    }
    
    // Ищем остатки на странице товара
    // Паттерн: "Склад Мск: Много" или "Склад Мск: 88"
    // Также ищем в разных форматах: "Склад Мск: **Много**" или "Склад Мск: **88**"
    const moscowPatterns = [
      /Склад\s+Мск[:\s]+(?:<[^>]+>)*\*?\*?([^<*]+)\*?\*?/i,
      /Мск[:\s]+(?:<[^>]+>)*\*?\*?([^<*]+)\*?\*?/i,
      /Москва[:\s]+(?:<[^>]+>)*\*?\*?([^<*]+)\*?\*?/i,
    ]
    
    const ufaPatterns = [
      /Склад\s+Уфа[:\s]+(?:<[^>]+>)*\*?\*?([^<*]+)\*?\*?/i,
      /Уфа[:\s]+(?:<[^>]+>)*\*?\*?([^<*]+)\*?\*?/i,
    ]
    
    let moscowStock: string | number | null = null
    let ufaStock: string | number | null = null
    
    for (const pattern of moscowPatterns) {
      const match = html.match(pattern)
      if (match) {
        moscowStock = parseStockValue(match[1].trim())
        break
      }
    }
    
    for (const pattern of ufaPatterns) {
      const match = html.match(pattern)
      if (match) {
        ufaStock = parseStockValue(match[1].trim())
        break
      }
    }
    
    // Парсим цену товара
    const price = parsePriceFromHtml(html)
    
    return {
      moscow: moscowStock,
      ufa: ufaStock,
      sku,
      price,
    }
  } catch (error: any) {
    console.error(`Error parsing Woodville product page ${productUrl}:`, error.message)
    return null
  }
}

/**
 * Парсит цену из HTML страницы Woodville
 * Ищет различные форматы цен: "12 500 ₽", "12500 руб", "12,500", и т.д.
 * 
 * ВАЖНО: Если цена требует авторизации, она может быть не найдена.
 * В этом случае можно ввести себестоимость вручную в админ-панели.
 */
function parsePriceFromHtml(html: string): number | null {
  // Проверяем, есть ли признаки того, что страница требует авторизации
  const requiresAuth = html.includes('войти') || html.includes('авторизация') || html.includes('login') || 
                       html.includes('вход') || html.includes('sign in') ||
                       html.match(/цена.*только.*авторизованным/i) ||
                       html.match(/цена.*после.*входа/i)
  
  if (requiresAuth) {
    console.warn('Woodville: Страница может требовать авторизацию для просмотра цены')
  }
  
  // Различные паттерны для поиска цены (более агрессивные)
  const pricePatterns = [
    // Цена в специальных блоках с классами price, cost, стоимость
    /<[^>]*class="[^"]*(?:price|cost|стоимость)[^"]*"[^>]*>[\s\S]*?([\d\s]{3,})[\s\S]*?<\/[^>]*>/i,
    // "12 500 ₽" или "12 500 руб" в любом месте
    /([\d\s]{3,})\s*(?:₽|руб|рублей|р\.|RUB)/i,
    // Цена в data-атрибутах
    /data-(?:price|cost|value)="([\d\s,]+)"/i,
    // Цена в JSON-LD структурированных данных
    /"price":\s*"?([\d\s,]+)"?/i,
    /"offers":\s*\{[^}]*"price":\s*"?([\d\s,]+)"?/i,
    // Цена в мета-тегах
    /<meta[^>]*(?:property|name)="(?:price|cost)"[^>]*content="([\d\s,]+)"/i,
    // "Цена: 12 500" или "Стоимость: 12 500"
    /(?:цена|price|стоимость|cost)[:\s]*([\d\s]{3,})/i,
    // Цена в таблицах или списках
    /<td[^>]*>[\s\S]*?(?:цена|price)[\s\S]*?([\d\s]{3,})[\s\S]*?<\/td>/i,
    // Цена в формате "от 12 500" или "от 12500"
    /от\s+([\d\s]{3,})/i,
  ]
  
  // Сначала пробуем найти цену через паттерны
  for (const pattern of pricePatterns) {
    const matches = html.matchAll(new RegExp(pattern, 'gi'))
    for (const match of matches) {
      if (match && match[1]) {
        // Извлекаем число из строки (убираем пробелы и запятые)
        const priceStr = match[1].replace(/[\s,]/g, '').trim()
        const price = parseFloat(priceStr)
        if (!isNaN(price) && price > 100 && price < 10000000) {
          console.log(`Woodville: Найдена цена через паттерн: ${price}`)
          return Math.round(price * 100) / 100 // Округляем до 2 знаков
        }
      }
    }
  }
  
  // Если не нашли через паттерны, ищем все большие числа и выбираем наиболее вероятное
  const numberMatches = Array.from(html.matchAll(/(\d{3,})/g))
  const possiblePrices: number[] = []
  
  for (const match of numberMatches) {
    const num = parseInt(match[0], 10)
    // Фильтруем числа, которые могут быть ценами (от 100 до 10 млн)
    if (num > 100 && num < 10000000) {
      possiblePrices.push(num)
    }
  }
  
  // Если нашли несколько чисел, берем наиболее часто встречающееся или первое разумное
  if (possiblePrices.length > 0) {
    // Группируем по частоте
    const frequency: Record<number, number> = {}
    possiblePrices.forEach(p => {
      frequency[p] = (frequency[p] || 0) + 1
    })
    
    // Берем наиболее часто встречающееся число
    const mostFrequent = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
    if (mostFrequent) {
      const price = parseInt(mostFrequent[0], 10)
      console.log(`Woodville: Найдена возможная цена (частота ${mostFrequent[1]}): ${price}`)
      return price
    }
  }
  
  console.warn('Woodville: Цена не найдена. Возможно, требуется авторизация или цена находится в другом формате.')
  return null
}

/**
 * Конвертирует остатки Woodville в число для stock_quantity
 * Использует остатки со склада Москва (основной склад)
 * @param stock - Остатки со склада Москва
 * @returns Число для stock_quantity (9999 для "Много", 0 для null)
 */
export function convertWoodvilleStockToQuantity(stock: string | number | null): number {
  if (stock === null) {
    return 0
  }
  
  if (stock === 'Много' || stock === 'many' || stock === 'Many') {
    // Используем большое число для "Много"
    return 9999
  }
  
  if (typeof stock === 'number') {
    return stock
  }
  
  // Пытаемся извлечь число из строки
  const numberMatch = String(stock).match(/(\d+)/)
  if (numberMatch) {
    return parseInt(numberMatch[1], 10)
  }
  
  return 0
}

