let allProducts = [];

// Load dữ liệu từ db.json
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">
                <div class="spinner-border" role="status"></div>
                <div class="mt-2 text-muted">Loading data...</div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('db.json');
        if (!response.ok) {
            throw new Error('Could not load db.json file');
        }

        allProducts = await response.json();
        processProducts();
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="alert alert-danger d-inline-block">❌ Error: ${error.message}</div>
                </td>
            </tr>
        `;
    }
}

let sortState = {
    field: 'none',
    directions: {
        id: 'asc',
        title: 'asc',
        category: 'asc',
        price: 'asc'
    }
};
let searchQuery = '';

// Hiển thị sản phẩm dưới dạng bảng
function renderProducts(products) {
    const container = document.getElementById('products-container');

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-muted fst-italic">
                    No matching products found
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.images[0] || 'https://placehold.co/600x400'}" 
                     alt="${product.title}" 
                     class="product-thumb"
                     onerror="this.src='https://placehold.co/600x400'">
            </td>
            <td><code class="text-primary-emphasis fw-semibold">#${product.id}</code></td>
            <td class="fw-bold text-white">${product.title}</td>
            <td><span class="badge badge-category">${product.category?.name || 'New'}</span></td>
            <td><span class="price-text">$${product.price}</span></td>
            <td>
                <div class="text-truncate" style="max-width: 300px;" title="${product.description}">
                    ${product.description}
                </div>
            </td>
        </tr>
    `).join('');
}

// Centralized filtering and sorting logic
function processProducts() {
    let result = [...allProducts];

    // 1. Filter
    if (searchQuery) {
        const term = searchQuery.toLowerCase().trim();
        result = result.filter(p => p.title.toLowerCase().includes(term));
    }

    // 2. Sort
    if (sortState.field !== 'none') {
        const field = sortState.field;
        const direction = sortState.directions[field];

        result.sort((a, b) => {
            let valA = field === 'category' ? (a.category?.name || '') : a[field];
            let valB = field === 'category' ? (b.category?.name || '') : b[field];

            if (typeof valA === 'string') {
                return direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            } else {
                return direction === 'asc' ? valA - valB : valB - valA;
            }
        });
    }

    renderProducts(result);
    updateSortIcons();
}

function updateSortIcons() {
    const headers = {
        id: document.getElementById('header-id'),
        title: document.getElementById('header-title'),
        category: document.getElementById('header-category'),
        price: document.getElementById('header-price')
    };

    Object.keys(headers).forEach(key => {
        const el = headers[key];
        if (!el) return;

        if (sortState.field === key) {
            el.classList.add('active');
            const icon = sortState.directions[key] === 'asc' ? '↑' : '↓';
            el.querySelector('.sort-icon').textContent = icon;
        } else {
            el.classList.remove('active');
            el.querySelector('.sort-icon').textContent = '⇅';
        }
    });
}

// Generalized sort function
function sortBy(field) {
    if (sortState.field === field) {
        sortState.directions[field] = sortState.directions[field] === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = field;
    }
    processProducts();
}

// Search products
function searchProducts(query) {
    searchQuery = query;
    processProducts();
}

// Auto load on open
document.addEventListener('DOMContentLoaded', loadProducts);
