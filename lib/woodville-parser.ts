/**
 * Парсер для получения остатков товаров с сайта Woodville.ru
 */

interface WoodvilleStock {
  moscow: string | number | null // "Много" или число
  ufa: string | number | null // "Много", число или "Нет в наличии"
  sku: string | null
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
  
  return {
    moscow: moscowStock,
    ufa: ufaStock,
    sku,
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
    
    return {
      moscow: moscowStock,
      ufa: ufaStock,
      sku,
    }
  } catch (error: any) {
    console.error(`Error parsing Woodville product page ${productUrl}:`, error.message)
    return null
  }
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

