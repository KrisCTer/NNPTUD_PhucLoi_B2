let allProducts = [];

// Load dữ liệu từ db.json
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
    
    try {
        const response = await fetch('db.json');
        if (!response.ok) {
            throw new Error('Không thể tải file db.json');
        }
        
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = `<div class="error">❌ Lỗi: ${error.message}</div>`;
    }
}

// Hiển thị sản phẩm
function renderProducts(products) {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="error">Không có sản phẩm nào</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.images[0] || 'https://placehold.co/600x400'}" 
                 alt="${product.title}" 
                 class="product-image"
                 onerror="this.src='https://placehold.co/600x400'">
            <div class="product-info">
                <h2 class="product-title">${product.title}</h2>
                <p class="product-description">${product.description}</p>
                <p class="product-category">📦 ${product.category?.name || 'N/A'}</p>
                <div class="product-footer">
                    <span class="product-price">$${product.price}</span>
                    <span class="product-id">#${product.id}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Sắp xếp theo giá
function sortByPrice() {
    const sorted = [...allProducts].sort((a, b) => a.price - b.price);
    renderProducts(sorted);
}

// Sắp xếp theo tên
function sortByName() {
    const sorted = [...allProducts].sort((a, b) => a.title.localeCompare(b.title));
    renderProducts(sorted);
}

// Tự động load khi trang vừa mở
document.addEventListener('DOMContentLoaded', loadProducts);
