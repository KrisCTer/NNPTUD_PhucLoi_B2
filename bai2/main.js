let allPosts = [];
let sortState = {
    field: 'none',
    directions: {
        id: 'asc',
        title: 'asc',
        views: 'asc'
    }
};
let searchQuery = '';

// Load dữ liệu từ json-server
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <div class="spinner-border" role="status"></div>
                <div class="mt-2 text-muted">Loading posts...</div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('http://localhost:3000/posts');
        if (!response.ok) {
            throw new Error('Could not connect to JSON Server');
        }

        allPosts = await response.json();
        processProducts();
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="alert alert-danger d-inline-block">❌ Error: ${error.message}</div>
                    <div class="mt-2 text-muted">Make sure json-server is running on port 3000</div>
                </td>
            </tr>
        `;
    }
}

// Hiển thị posts dưới dạng bảng
function renderProducts(posts) {
    const container = document.getElementById('products-container');

    if (posts.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5 text-muted fst-italic">
                    No matching posts found
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <tr>
            <td><code class="text-primary-emphasis fw-semibold">#${post.id}</code></td>
            <td class="fw-bold text-white">${post.title}</td>
            <td><span class="price-text">${post.views} views</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger border-0" onclick="softDelete('${post.id}')" title="Soft Delete">
                    🗑️ Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Centralized filtering and sorting logic
function processProducts() {
    // 1. Filter out soft-deleted items and apply search
    let result = allPosts.filter(p => !p.isDeleted);

    if (searchQuery) {
        const term = searchQuery.toLowerCase().trim();
        result = result.filter(p => p.title.toLowerCase().includes(term));
    }

    // 2. Sort
    if (sortState.field !== 'none') {
        const field = sortState.field;
        const direction = sortState.directions[field];

        result.sort((a, b) => {
            let valA = a[field];
            let valB = b[field];

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

// Soft delete function using PATCH
async function softDelete(id) {
    if (!confirm('Are you sure you want to delete this post? (Soft Delete)')) return;

    try {
        const response = await fetch(`http://localhost:3000/posts/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isDeleted: true })
        });

        if (!response.ok) {
            throw new Error('Failed to update the post on server');
        }

        // Cập nhật local state và render lại
        const postIndex = allPosts.findIndex(p => p.id === id);
        if (postIndex !== -1) {
            allPosts[postIndex].isDeleted = true;
        }
        processProducts();
        
        console.log(`Post #${id} soft deleted successfully.`);
    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        alert('Could not delete post: ' + error.message);
    }
}

function updateSortIcons() {
    const headers = {
        id: document.getElementById('header-id'),
        title: document.getElementById('header-title'),
        views: document.getElementById('header-views')
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

function sortBy(field) {
    if (sortState.field === field) {
        sortState.directions[field] = sortState.directions[field] === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = field;
    }
    processProducts();
}

function searchProducts(query) {
    searchQuery = query;
    processProducts();
}

// Auto load on open
document.addEventListener('DOMContentLoaded', loadProducts);
