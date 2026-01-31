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
        <tr class="${post.isDeleted ? 'is-deleted' : ''}">
            <td><code class="text-primary-emphasis fw-semibold">#${post.id}</code></td>
            <td class="post-title">${post.title}</td>
            <td>
                <span class="badge-views">
                    ${post.views.toLocaleString()} views
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-action btn-comments" onclick="openComments('${post.id}', '${post.title.replace(/'/g, "\\\'")}')" title="Comments">
                    💬
                </button>
                <button class="btn btn-action btn-edit" onclick="editPost('${post.id}')" title="Edit Post">
                    ✏️
                </button>
                ${post.isDeleted
            ? `<button class="btn btn-action btn-restore" onclick="toggleSoftDelete('${post.id}', false)" title="Restore Post">
                        🔄
                       </button>`
            : `<button class="btn btn-action btn-delete" onclick="toggleSoftDelete('${post.id}', true)" title="Soft Delete">
                        🗑️
                       </button>`
        }
            </td>
        </tr>
    `).join('');
}

// Centralized filtering and sorting logic
function processProducts() {
    // Show all items (don't filter by isDeleted anymore)
    let result = [...allPosts];

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

            // Nếu field là 'id' hoặc 'views', ta parse thành số để so sánh chính xác
            if (field === 'id' || field === 'views') {
                valA = parseInt(valA) || 0;
                valB = parseInt(valB) || 0;
                return direction === 'asc' ? valA - valB : valB - valA;
            }

            // Mặc định là string (title)
            if (typeof valA === 'string') {
                return direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }

    renderProducts(result);
    updateSortIcons();
}

// Custom confirmation handler
function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmModalBtn');
    // Remove old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = () => {
        const modalEl = document.getElementById('confirmModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        onConfirm();
    };

    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

// Toggle Soft delete function using PATCH
async function toggleSoftDelete(id, deleteStatus) {
    const actionText = deleteStatus ? 'delete' : 'restore';
    const message = `Are you sure you want to ${actionText} this post?`;

    showConfirm('Confirm Action', message, async () => {
        try {
            const response = await fetch(`http://localhost:3000/posts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isDeleted: deleteStatus })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${actionText} the post on server`);
            }

            // Cập nhật local state và render lại
            const postIndex = allPosts.findIndex(p => p.id === id);
            if (postIndex !== -1) {
                allPosts[postIndex].isDeleted = deleteStatus;
            }
            processProducts();

            console.log(`Post #${id} ${actionText}d successfully.`);
        } catch (error) {
            console.error(`Lỗi khi ${actionText}:`, error);
            alert(`Could not ${actionText} post: ` + error.message);
        }
    });
}

async function createPost() {
    const titleInput = document.getElementById('postTitle');
    const viewsInput = document.getElementById('postViews');

    const title = titleInput.value.trim();
    const views = parseInt(viewsInput.value) || 0;

    if (!title) {
        alert('Please enter a title');
        return;
    }

    // Tính toán ID mới: Max ID + 1
    const ids = allPosts.map(p => parseInt(p.id) || 0);
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newId = (maxId + 1).toString();

    const newPost = {
        id: newId,
        title: title,
        views: views,
        isDeleted: false
    };

    try {
        const response = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPost)
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        // Đóng modal
        const modalEl = document.getElementById('addPostModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Reset form
        titleInput.value = '';
        viewsInput.value = '';

        // Tải lại dữ liệu
        await loadProducts();
        console.log(`Created post #${newId} successfully.`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating post: ' + error.message);
    }
}

function editPost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostTitle').value = post.title;
    document.getElementById('editPostViews').value = post.views;

    const modal = new bootstrap.Modal(document.getElementById('editPostModal'));
    modal.show();
}

async function savePostEdit() {
    const id = document.getElementById('editPostId').value;
    const title = document.getElementById('editPostTitle').value.trim();
    const views = parseInt(document.getElementById('editPostViews').value) || 0;

    if (!title) {
        alert('Please enter a title');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/posts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, views })
        });

        if (!response.ok) throw new Error('Failed to update post');

        // Close modal
        const modalEl = document.getElementById('editPostModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await loadProducts();
        console.log(`Updated post #${id} successfully.`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating post: ' + error.message);
    }
}

// --- Comments Management Logic ---
let currentPostId = null;
let allComments = [];
let editingCommentId = null;

async function openComments(postId, postTitle) {
    currentPostId = postId;
    document.getElementById('commentsPostTitle').textContent = `Post: ${postTitle}`;
    document.getElementById('commentsList').innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    // Show Modal
    const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
    modal.show();

    await loadComments();
}

async function loadComments() {
    try {
        const response = await fetch(`http://localhost:3000/comments?postId=${currentPostId}`);
        allComments = await response.json();
        renderComments();
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('commentsList').innerHTML = '<div class="alert alert-danger">Error loading comments.</div>';
    }
}

function renderComments() {
    const list = document.getElementById('commentsList');
    if (allComments.length === 0) {
        list.innerHTML = '<div class="text-center py-4 text-muted">No comments yet. Be the first to comment!</div>';
        return;
    }

    list.innerHTML = allComments.map(comment => `
        <div class="comment-item">
            <div class="flex-grow-1">
                <div class="comment-text">${comment.text}</div>
                <span class="comment-id-badge">ID: #${comment.id}</span>
            </div>
            <div class="comment-actions">
                <button class="btn btn-action btn-edit" onclick="editComment('${comment.id}', '${comment.text.replace(/'/g, "\\\'")}')" title="Edit Comment">✏️</button>
                <button class="btn btn-action btn-delete" onclick="deleteComment('${comment.id}')" title="Delete Comment">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function addComment() {
    const input = document.getElementById('newCommentText');
    const text = input.value.trim();
    if (!text) return;

    // Fetch all comments to calculate max ID (for auto-increment)
    try {
        const res = await fetch('http://localhost:3000/comments');
        const allComs = await res.json();
        const ids = allComs.map(c => parseInt(c.id) || 0);
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        const newId = (maxId + 1).toString();

        const newComment = {
            id: newId,
            text: text,
            postId: currentPostId
        };

        const response = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComment)
        });

        if (response.ok) {
            input.value = '';
            await loadComments();
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment');
    }
}

function editComment(id, text) {
    editingCommentId = id;
    document.getElementById('editCommentText').value = text;
    const modal = new bootstrap.Modal(document.getElementById('editCommentModal'));
    modal.show();
}

async function saveCommentEdit() {
    const text = document.getElementById('editCommentText').value.trim();
    if (!text) return;

    try {
        const response = await fetch(`http://localhost:3000/comments/${editingCommentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editCommentModal')).hide();
            await loadComments();
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        alert('Error updating comment');
    }
}

async function deleteComment(id) {
    showConfirm('Delete Comment', 'Are you sure you want to permanently delete this comment?', async () => {
        try {
            const response = await fetch(`http://localhost:3000/comments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadComments();
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Error deleting comment');
        }
    });
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
