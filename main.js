let allProducts = [];

// Load dữ liệu từ db.json
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading">Đang chuẩn bị không gian...</div>';

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

let sortState = {
    field: 'none',
    price: 'asc',
    name: 'asc'
};
let searchQuery = '';

// Hiển thị sản phẩm
function renderProducts(products) {
    const container = document.getElementById('products-container');

    if (products.length === 0) {
        container.innerHTML = '<div class="error">Không tìm thấy sản phẩm phù hợp</div>';
        return;
    }

    container.innerHTML = products.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.05}s">
            <div class="image-wrapper">
                <img src="${product.images[0] || 'https://placehold.co/600x400'}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.src='https://placehold.co/600x400'">
                <span class="category-badge">${product.category?.name || 'Mới'}</span>
            </div>
            <div class="product-info">
                <h2 class="product-title">${product.title}</h2>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">$${product.price}</span>
                    <span class="product-id">#${product.id}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Xử lý logic lọc và sắp xếp tập trung
function processProducts() {
    let result = [...allProducts];

    // 1. Filter
    if (searchQuery) {
        const term = searchQuery.toLowerCase().trim();
        result = result.filter(p => p.title.toLowerCase().includes(term));
    }

    // 2. Sort
    if (sortState.field === 'price') {
        result.sort((a, b) => sortState.price === 'asc' ? a.price - b.price : b.price - a.price);
    } else if (sortState.field === 'name') {
        result.sort((a, b) => sortState.name === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    }

    renderProducts(result);
    updateSortIcons();
}

function updateSortIcons() {
    const priceBtn = document.getElementById('btn-sort-price');
    const nameBtn = document.getElementById('btn-sort-name');

    if (priceBtn) {
        priceBtn.innerHTML = `<span>💰</span> Giá ${sortState.price === 'asc' ? '↑' : '↓'}`;
        priceBtn.classList.toggle('active', sortState.field === 'price');
    }
    if (nameBtn) {
        nameBtn.innerHTML = `<span>📝</span> Tên ${sortState.name === 'asc' ? '↑' : '↓'}`;
        nameBtn.classList.toggle('active', sortState.field === 'name');
    }
}

// Sắp xếp theo giá
function sortByPrice() {
    if (sortState.field === 'price') {
        sortState.price = sortState.price === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = 'price';
    }
    processProducts();
}

// Sắp xếp theo tên
function sortByName() {
    if (sortState.field === 'name') {
        sortState.name = sortState.name === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = 'name';
    }
    processProducts();
}

// Tìm kiếm sản phẩm
function searchProducts(query) {
    searchQuery = query;
    processProducts();
}

// Tự động load khi trang vừa mở
document.addEventListener('DOMContentLoaded', loadProducts);
