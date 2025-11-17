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
 * API роут для синхронизации остатков товаров с сайта Woodville
 * 
 * Использование:
 * POST /api/admin/sync-stock
 * Body: { productIds?: number[] } // опционально, если не указано - синхронизирует все товары
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const productIds = body?.productIds || null

    console.log('=== Woodville Stock Sync - Start ===')
    console.log('Product IDs:', productIds || 'all products')

    // Получаем товары для синхронизации
    let query = supabase
      .from('products')
      .select('id, sku, name')
      .eq('status', 'active')
      .not('sku', 'is', null)

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      query = query.in('id', productIds)
    }

    const { data: products, error } = await query.limit(1000)

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    console.log(`Found ${products?.length || 0} products to sync`)

    // Синхронизируем остатки
    let synced = 0
    let errors = 0
    const errorsList: Array<{ sku: string; error: string }> = []

    for (const product of products || []) {
      if (!product.sku) {
        continue
      }

      try {
        console.log(`Syncing stock for SKU: ${product.sku} (Product ID: ${product.id})`)
        
        const stockInfo = await parseWoodvilleStock(product.sku)
        
        if (!stockInfo) {
          console.warn(`No stock info found for SKU ${product.sku}`)
          errors++
          errorsList.push({ sku: product.sku, error: 'Stock info not found' })
          continue
        }

        const stockQuantity = convertWoodvilleStockToQuantity(stockInfo.moscow)
        
        console.log(`SKU ${product.sku}: Moscow=${stockInfo.moscow}, Ufa=${stockInfo.ufa}, Quantity=${stockQuantity}`)

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

        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`Error syncing product ${product.id} (SKU: ${product.sku}):`, error.message)
        errors++
        errorsList.push({ sku: product.sku, error: error.message })
      }
    }
    
    return NextResponse.json({
      ok: true,
      total: products?.length || 0,
      synced,
      errors,
      errorsList: errorsList.slice(0, 10),
      message: `Synced ${synced} products, ${errors} errors`,
    })
  } catch (e: any) {
    console.error('Stock sync error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

