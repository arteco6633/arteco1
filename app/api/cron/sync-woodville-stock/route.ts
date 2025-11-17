export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseWoodvilleStock, convertWoodvilleStockToQuantity } from '@/lib/woodville-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Cron job для автоматической синхронизации остатков с Woodville
 * 
 * Настройка в Vercel:
 * - Перейдите в Settings → Cron Jobs
 * - Добавьте: "sync-woodville-stock" → Schedule: "0 2 * * *" (каждый день в 2:00 UTC)
 * - Endpoint: /api/cron/sync-woodville-stock
 * 
 * Или используйте внешний сервис (cron-job.org, EasyCron и т.д.):
 * - URL: https://your-domain.com/api/cron/sync-woodville-stock
 * - Schedule: каждый день в нужное время
 */
export async function GET(req: Request) {
  try {
    // Проверка авторизации для cron job
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('=== Woodville Stock Sync Cron Job - Start ===')
    console.log('Time:', new Date().toISOString())

    // Получаем все товары, которые нужно синхронизировать
    // TODO: После создания таблицы product_supplier_links использовать её
    const { data: products, error } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('status', 'active')
      .limit(1000) // Ограничение на количество товаров за раз

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    console.log(`Found ${products?.length || 0} products to sync`)

    // Синхронизируем остатки для каждого товара с SKU
    let synced = 0
    let errors = 0
    const errorsList: Array<{ sku: string; error: string }> = []

    for (const product of products || []) {
      if (!product.sku) {
        console.log(`Skipping product ${product.id} (${product.name}): no SKU`)
        continue
      }

      try {
        console.log(`Syncing stock for SKU: ${product.sku} (Product ID: ${product.id})`)
        
        // Парсим остатки с Woodville
        const stockInfo = await parseWoodvilleStock(product.sku)
        
        if (!stockInfo) {
          console.warn(`No stock info found for SKU ${product.sku}`)
          errors++
          errorsList.push({ sku: product.sku, error: 'Stock info not found' })
          continue
        }

        // Конвертируем остатки в число для stock_quantity
        // Используем остатки со склада Москва (основной склад)
        const stockQuantity = convertWoodvilleStockToQuantity(stockInfo.moscow)
        
        console.log(`SKU ${product.sku}: Moscow=${stockInfo.moscow}, Ufa=${stockInfo.ufa}, Quantity=${stockQuantity}`)

        // Обновляем stock_quantity в базе данных
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: stockQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)

        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError)
          errors++
          errorsList.push({ sku: product.sku, error: updateError.message })
        } else {
          synced++
          console.log(`✓ Updated product ${product.id} (SKU: ${product.sku}) stock to ${stockQuantity}`)
        }

        // Небольшая задержка между запросами, чтобы не перегружать сервер Woodville
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`Error syncing product ${product.id} (SKU: ${product.sku}):`, error.message)
        errors++
        errorsList.push({ sku: product.sku, error: error.message })
      }
    }
    
    const results = {
      total: products?.length || 0,
      synced,
      errors,
      errorsList: errorsList.slice(0, 10), // Первые 10 ошибок для логов
      message: `Synced ${synced} products, ${errors} errors`,
    }

    console.log('=== Woodville Stock Sync Cron Job - Complete ===')
    console.log('Results:', results)

    return NextResponse.json({
      ok: true,
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('Stock sync cron error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

