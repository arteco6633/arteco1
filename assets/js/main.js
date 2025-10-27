// ============================================
// ARTECO - JavaScript для главной страницы
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Подключение к Supabase
const supabaseUrl = 'https://zijajicude.beget.app'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNTIzMjAwLCJleHAiOjE5MTkyODk2MDB9.l9rF02tJ4OKoCSqVsKeHnBR47mYkFG5BxF_Imkz9tcs'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Главная страница: Supabase подключен')

// ============================================
// ЗАГРУЗКА ДАННЫХ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadPromoBanners(),
        loadFeaturedProducts(),
        loadNewProducts(),
        loadCategories()
    ])
})

// ============================================
// ПРОМО-БАННЕРЫ
// ============================================

async function loadPromoBanners() {
    try {
        const { data, error } = await supabase
            .from('promo_blocks')
            .select('*')
            .eq('is_active', true)
            .eq('position', 'homepage')
            .order('sort_order')
            .limit(3)
        
        if (error) throw error
        
        displayBanners(data || [])
    } catch (error) {
        console.error('Ошибка загрузки баннеров:', error)
        document.getElementById('promoBanners').innerHTML = '<div class="loading">Баннеры временно недоступны</div>'
    }
}

function displayBanners(banners) {
    const container = document.getElementById('bannersContainer')
    
    if (banners.length === 0) {
        container.innerHTML = '<div class="loading">Баннеры отсутствуют</div>'
        return
    }
    
    container.innerHTML = banners.map(banner => `
        <div class="banner-card" onclick="window.location='${banner.link_url || '#'}'">
            <div class="banner-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            <div class="banner-content">
                <h3 class="banner-title">${banner.title}</h3>
                ${banner.description ? `<p>${banner.description}</p>` : ''}
            </div>
        </div>
    `).join('')
}

// ============================================
// ХИТЫ ПРОДАЖ
// ============================================

async function loadFeaturedProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('status', 'active')
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(8)
        
        if (error) throw error
        
        displayProducts(data || [], 'featuredProducts')
    } catch (error) {
        console.error('Ошибка загрузки хитов:', error)
        document.getElementById('featuredProducts').innerHTML = '<div class="loading">Товары временно недоступны</div>'
    }
}

// ============================================
// НОВИНКИ
// ============================================

async function loadNewProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(8)
        
        if (error) throw error
        
        displayProducts(data || [], 'newProducts')
    } catch (error) {
        console.error('Ошибка загрузки новинок:', error)
        document.getElementById('newProducts').innerHTML = '<div class="loading">Товары временно недоступны</div>'
    }
}

// ============================================
// ОТОБРАЖЕНИЕ ТОВАРОВ
// ============================================

function displayProducts(products, containerId) {
    const container = document.getElementById(containerId)
    
    if (products.length === 0) {
        container.innerHTML = '<div class="loading">Товары отсутствуют</div>'
        return
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image" 
                 style="background: linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)} 0%, #${Math.floor(Math.random()*16777215).toString(16)} 100%);">
                ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                    🛒 В корзину
                </button>
            </div>
        </div>
    `).join('')
}

// ============================================
// КАТЕГОРИИ
// ============================================

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order')
        
        if (error) throw error
        
        displayCategories(data || [])
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error)
        document.getElementById('categoriesContainer').innerHTML = '<div class="loading">Категории временно недоступны</div>'
    }
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer')
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="loading">Категории отсутствуют</div>'
        return
    }
    
    const icons = ['📱', '👕', '📚', '🏠', '🎮', '💻']
    
    container.innerHTML = categories.map((category, index) => `
        <div class="category-card" onclick="window.location='#catalog?category=${category.id}'">
            <div class="category-icon">${icons[index % icons.length]}</div>
            <h3 class="category-name">${category.name}</h3>
        </div>
    `).join('')
}

// ============================================
// КОРЗИНА
// ============================================

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price)
}

function addToCart(productId, productName, price) {
    // Получаем корзину из localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Проверяем, есть ли уже такой товар
    const existingItem = cart.find(item => item.id === productId)
    
    if (existingItem) {
        existingItem.quantity += 1
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1
        })
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Обновляем счетчик корзины
    updateCartCount()
    
    // Показываем уведомление
    showNotification(`${productName} добавлен в корзину!`)
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    document.getElementById('cartCount').textContent = totalItems
}

function showNotification(message) {
    const notification = document.createElement('div')
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: #22c55e;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => notification.remove(), 300)
    }, 3000)
}

// Обновляем счетчик при загрузке страницы
document.addEventListener('DOMContentLoaded', updateCartCount)

