// ============================================
// Админ-панель ARTECO - JavaScript
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Создаём клиент Supabase
const supabaseUrl = 'https://omfffkpochfembpeikjz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZmZma3BvY2hmZW1icGVpa2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjM3OTUsImV4cCI6MjA3Njc5OTc5NX0.H-bkBj0cHvlIYkqeLIhH6ESmkmw8t2Rn5wF8R_9u898'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Admin panel: Supabase подключен')

// Переменные состояния
let products = [];
let categories = [];
let currentPage = 1;
let itemsPerPage = 20;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadProducts();
    setupEventListeners();
});

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) throw error;
        
        categories = data || [];
        populateCategoryFilter();
        populateCategorySelect();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showNotification('Не удалось загрузить категории', 'error');
    }
}

async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        products = data || [];
        filterProducts();
        updateStats();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showNotification('Не удалось загрузить товары', 'error');
    }
}

// ============================================
// ОТОБРАЖЕНИЕ ТАБЛИЦЫ
// ============================================

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryId = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let filtered = products.filter(product => {
        const matchSearch = product.name.toLowerCase().includes(searchTerm);
        const matchCategory = !categoryId || product.category_id == categoryId;
        const matchStatus = !status || product.status === status;
        
        return matchSearch && matchCategory && matchStatus;
    });
    
    displayProducts(filtered);
}

function displayProducts(filteredProducts) {
    const tbody = document.getElementById('productsTableBody');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Товары не найдены</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>#${product.id}</td>
            <td>
                ${product.image_url 
                    ? `<img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">`
                    : '<span style="color: #999;">Нет фото</span>'
                }
            </td>
            <td><strong>${product.name}</strong></td>
            <td>${formatPrice(product.price)} ₽</td>
            <td>${product.stock_quantity}</td>
            <td>${product.categories?.name || '-'}</td>
            <td>
                <span class="status-badge status-${product.status}">
                    ${product.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
            </td>
            <td class="product-actions">
                <button class="btn-primary btn-sm" onclick="editProduct(${product.id})">
                    Редактировать
                </button>
                <button class="btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                    Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// СТАТИСТИКА
// ============================================

function updateStats() {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => p.stock_quantity < 10).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('activeProducts').textContent = activeProducts;
    document.getElementById('lowStock').textContent = lowStock;
}

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================

function openAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Добавить товар';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

// Заполняем селект категорий
function populateCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Выберите категорию</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    select.innerHTML = '<option value="">Все категории</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

// ============================================
// СОБЫТИЯ ФОРМЫ
// ============================================

function setupEventListeners() {
    // Фильтры
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('statusFilter').addEventListener('change', filterProducts);
    
    // Форма
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
    
    // Закрытие модального окна при клике вне его
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target.id === 'productModal') {
            closeProductModal();
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock_quantity: parseInt(formData.get('stock_quantity')),
        sku: formData.get('sku'),
        image_url: formData.get('image_url') || null,
        status: formData.get('status'),
        is_featured: formData.get('is_featured') === 'on',
        category_id: parseInt(formData.get('category_id'))
    };
    
    const productId = formData.get('id');
    
    try {
        if (productId) {
            // Обновление
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);
            
            if (error) throw error;
            
            showNotification('Товар успешно обновлен!', 'success');
        } else {
            // Создание
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            
            showNotification('Товар успешно добавлен!', 'success');
        }
        
        closeProductModal();
        await loadProducts();
    } catch (error) {
        console.error('Ошибка сохранения товара:', error);
        showNotification('Не удалось сохранить товар: ' + error.message, 'error');
    }
}

// ============================================
// РЕДАКТИРОВАНИЕ
// ============================================

async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('modalTitle').textContent = 'Редактировать товар';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productCategory').value = product.category_id || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productSKU').value = product.sku || '';
    document.getElementById('productStock').value = product.stock_quantity || 0;
    document.getElementById('productStatus').value = product.status || 'active';
    document.getElementById('productFeatured').checked = product.is_featured || false;
    document.getElementById('productImage').value = product.image_url || '';
    
    document.getElementById('productModal').classList.add('show');
}

// ============================================
// УДАЛЕНИЕ
// ============================================

async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (!confirm(`Вы уверены, что хотите удалить "${product.name}"?`)) {
        return;
    }
    
    try {
        // Мягкое удаление (меняем статус на deleted)
        const { error } = await supabase
            .from('products')
            .update({ status: 'deleted' })
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('Товар удален!', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showNotification('Не удалось удалить товар', 'error');
    }
}

// ============================================
// УТИЛИТЫ
// ============================================

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

function showNotification(message, type = 'success') {
    // Создаем уведомление (простая версия)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Делаем функции глобальными для использования в onclick
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openAddProductModal = openAddProductModal;
window.closeProductModal = closeProductModal;

