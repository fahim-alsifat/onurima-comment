// DOM Elements
const postModal = document.getElementById('post-modal');
const confirmModal = document.getElementById('confirm-modal');
const postForm = document.getElementById('post-form');
const addPostBtn = document.getElementById('add-post-btn');
const clearPostsBtn = document.getElementById('clear-posts-btn');
const pinboard = document.getElementById('pinboard');
const postTitleInput = document.getElementById('post-title');
const postContentInput = document.getElementById('post-content');
const postColorInput = document.getElementById('post-color');
const modalTitle = document.getElementById('modal-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');
const closeModalBtn = document.querySelector('.close-modal');
const postSearchInput = document.getElementById('post-search');
const postSearchBtn = document.getElementById('post-search-btn');

const addCommentBtn = document.getElementById('add-comment-btn');
const clearInputBtn = document.getElementById('clear-input-btn');
const commentInput = document.getElementById('comment-input');
const commentsList = document.getElementById('comments-list');
const clearCommentsBtn = document.getElementById('clear-comments-btn');
const commentSearchInput = document.getElementById('comment-search');
const commentSearchBtn = document.getElementById('comment-search-btn');
const selectedPostInfo = document.querySelector('.selected-post-info p');

// State variables
let posts = [];
let comments = {};
let selectedPostId = null;
let currentEditPostId = null;
let lastDraggedItem = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderPosts();
    renderComments();

    // Initialize event listeners
    initEventListeners();
});

// Event Listeners
function initEventListeners() {
    // Post Modal
    addPostBtn.addEventListener('click', openAddPostModal);
    closeModalBtn.addEventListener('click', closePostModal);
    postForm.addEventListener('submit', handlePostSubmit);

    // Posts management
    clearPostsBtn.addEventListener('click', confirmClearPosts);
    pinboard.addEventListener('click', handlePinboardClick);
    
    // Comments management
    addCommentBtn.addEventListener('click', addComment);
    clearCommentsBtn.addEventListener('click', confirmClearComments);
    clearInputBtn.addEventListener('click', clearCommentInput);
    
    // Search functionality
    postSearchBtn.addEventListener('click', () => filterPosts(postSearchInput.value));
    postSearchInput.addEventListener('input', () => filterPosts(postSearchInput.value));
    commentSearchBtn.addEventListener('click', () => filterComments(commentSearchInput.value));
    commentSearchInput.addEventListener('input', () => filterComments(commentSearchInput.value));
    
    // Confirmation modal
    confirmNoBtn.addEventListener('click', closeConfirmModal);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === postModal) {
            closePostModal();
        }
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
    
    // Initialize drag and drop
    initDragAndDrop();
}

// Posts Functions
function openAddPostModal() {
    modalTitle.textContent = 'Add New Post';
    postTitleInput.value = '';
    postContentInput.value = '';
    postColorInput.value = getRandomPastelColor();
    currentEditPostId = null;
    postModal.style.display = 'flex';
    postTitleInput.focus();
}

function openEditPostModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    modalTitle.textContent = 'Edit Post';
    postTitleInput.value = post.title;
    postContentInput.value = post.content;
    postColorInput.value = post.color;
    currentEditPostId = postId;
    postModal.style.display = 'flex';
    postTitleInput.focus();
}

function closePostModal() {
    postModal.style.display = 'none';
}

function handlePostSubmit(e) {
    e.preventDefault();
    
    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();
    const color = postColorInput.value;
    
    if (!title) return;
    
    if (currentEditPostId) {
        // Edit existing post
        const postIndex = posts.findIndex(p => p.id === currentEditPostId);
        if (postIndex !== -1) {
            posts[postIndex] = {
                ...posts[postIndex],
                title,
                content,
                color,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new post
        const newPost = {
            id: generateId(),
            title,
            content,
            color,
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        posts.push(newPost);
    }
    
    saveToLocalStorage();
    renderPosts();
    closePostModal();
}

function deletePost(postId) {
    posts = posts.filter(post => post.id !== postId);
    
    // Delete associated comments
    if (comments[postId]) {
        delete comments[postId];
    }
    
    // Update selected post if needed
    if (selectedPostId === postId) {
        selectedPostId = null;
        renderComments();
    }
    
    saveToLocalStorage();
    renderPosts();
}

function confirmDeletePost(postId) {
    confirmMessage.textContent = 'Are you sure you want to delete this post? All associated comments will also be deleted.';
    confirmYesBtn.onclick = () => {
        deletePost(postId);
        closeConfirmModal();
    };
    confirmModal.style.display = 'flex';
}

function confirmClearPosts() {
    confirmMessage.textContent = 'Are you sure you want to delete all posts? This action cannot be undone.';
    confirmYesBtn.onclick = () => {
        posts = [];
        comments = {};
        selectedPostId = null;
        saveToLocalStorage();
        renderPosts();
        renderComments();
        closeConfirmModal();
    };
    confirmModal.style.display = 'flex';
}

function closeConfirmModal() {
    confirmModal.style.display = 'none';
}

function selectPost(postId) {
    selectedPostId = postId;
    
    // Highlight selected post
    document.querySelectorAll('.post').forEach(post => {
        post.classList.remove('selected');
    });
    
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.classList.add('selected');
    }
    
    // Update selected post info
    const post = posts.find(p => p.id === postId);
    if (post) {
        selectedPostInfo.textContent = `Selected: ${post.title}`;
    }
    
    renderComments();
}

function handlePinboardClick(e) {
    const postElement = e.target.closest('.post');
    if (!postElement) return;
    
    const postId = postElement.dataset.postId;
    
    // Handle click on post actions
    if (e.target.classList.contains('edit-post-btn')) {
        openEditPostModal(postId);
    } else if (e.target.classList.contains('delete-post-btn')) {
        confirmDeletePost(postId);
    } else {
        // Select post when clicking on the post itself
        selectPost(postId);
    }
}

function filterPosts(query) {
    const searchTerm = query.toLowerCase();
    
    document.querySelectorAll('.post').forEach(post => {
        const title = post.querySelector('.post-title').textContent.toLowerCase();
        const content = post.querySelector('.post-content').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
}

// Comments Functions
function addComment() {
    if (!selectedPostId) {
        alert('Please select a post first');
        return;
    }
    
    const commentText = commentInput.value.trim();
    if (!commentText) return;
    
    // Split by line breaks
    const commentLines = commentText.split('\n').filter(line => line.trim() !== '');
    
    if (!comments[selectedPostId]) {
        comments[selectedPostId] = [];
    }
    
    // Add each line as a separate comment
    commentLines.forEach(line => {
        comments[selectedPostId].push({
            id: generateId(),
            text: line.trim(),
            createdAt: new Date().toISOString()
        });
    });
    
    saveToLocalStorage();
    renderComments();
    commentInput.value = '';
}

function renderComments() {
    commentsList.innerHTML = '';
    
    if (!selectedPostId) {
        selectedPostInfo.textContent = 'No post selected';
        return;
    }
    
    const postComments = comments[selectedPostId] || [];
    
    if (postComments.length === 0) {
        const noComments = document.createElement('p');
        noComments.textContent = 'No comments yet';
        noComments.className = 'no-comments';
        commentsList.appendChild(noComments);
        return;
    }
    
    postComments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.dataset.commentId = comment.id;
        
        const commentText = document.createElement('div');
        commentText.className = 'comment-text';
        commentText.textContent = comment.text;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn btn-icon';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.addEventListener('click', () => copyToClipboard(comment.text));
        
        commentElement.appendChild(commentText);
        commentElement.appendChild(copyBtn);
        commentsList.appendChild(commentElement);
    });
}

function copyToClipboard(text) {
    // Create a temporary textarea element to handle the copy operation
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';  // Make it invisible
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
        // Execute the copy command
        success = document.execCommand('copy');
        
        // If execCommand fails, try the clipboard API
        if (!success) {
            navigator.clipboard.writeText(text)
                .then(() => showCopyFeedback(true))
                .catch(err => {
                    console.error('Clipboard API failed: ', err);
                    showCopyFeedback(false);
                });
            return;
        }
        
        showCopyFeedback(true);
    } catch (err) {
        console.error('Failed to copy: ', err);
        showCopyFeedback(false);
    } finally {
        document.body.removeChild(textArea);
    }
}

function showCopyFeedback(success) {
    // Create and show a toast message
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = success ? 'Copied to clipboard!' : 'Copy failed. Try again.';
    document.body.appendChild(toast);
    
    // Add vibration for tactile feedback on mobile
    if (navigator.vibrate && success) {
        navigator.vibrate(50);
    }
    
    // Show the toast with a slight delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide and remove the toast after a delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

function confirmClearComments() {
    if (!selectedPostId || !comments[selectedPostId] || comments[selectedPostId].length === 0) {
        alert('No comments to clear');
        return;
    }
    
    confirmMessage.textContent = 'Are you sure you want to delete all comments for this post?';
    confirmYesBtn.onclick = () => {
        comments[selectedPostId] = [];
        saveToLocalStorage();
        renderComments();
        closeConfirmModal();
    };
    confirmModal.style.display = 'flex';
}

function filterComments(query) {
    const searchTerm = query.toLowerCase();
    
    document.querySelectorAll('.comment').forEach(comment => {
        const text = comment.querySelector('.comment-text').textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            comment.style.display = 'flex';
        } else {
            comment.style.display = 'none';
        }
    });
}

// Drag and Drop Functionality
function initDragAndDrop() {
    // Make existing posts draggable
    makeDraggable();
    
    // Set up the pinboard as a droppable area
    pinboard.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    pinboard.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (!lastDraggedItem) return;
        
        // Calculate new position within the bounds of the pinboard
        const pinboardRect = pinboard.getBoundingClientRect();
        const x = Math.min(Math.max(0, e.clientX - pinboardRect.left - 100), pinboardRect.width - 200);
        const y = Math.min(Math.max(0, e.clientY - pinboardRect.top - 20), pinboardRect.height - 40);
        
        const postId = lastDraggedItem.dataset.postId;
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1) {
            // Update post position
            posts[postIndex].position = { x, y };
            saveToLocalStorage();
            
            // Apply the new position
            lastDraggedItem.style.transform = `translate(${x}px, ${y}px)`;
        }
        
        lastDraggedItem = null;
    });
}

function makeDraggable() {
    const postElements = document.querySelectorAll('.post');
    
    postElements.forEach(post => {
        post.setAttribute('draggable', true);
        
        // Apply saved position
        const postId = post.dataset.postId;
        const postData = posts.find(p => p.id === postId);
        
        if (postData && postData.position) {
            post.style.transform = `translate(${postData.position.x}px, ${postData.position.y}px)`;
        }
        
        post.addEventListener('dragstart', (e) => {
            lastDraggedItem = post;
            post.classList.add('dragging');
            
            // Set data transfer for the drag operation
            e.dataTransfer.setData('text/plain', post.dataset.postId);
            e.dataTransfer.effectAllowed = 'move';
            
            // Use a custom ghost image (optional)
            const ghostElement = post.cloneNode(true);
            ghostElement.style.opacity = '0.5';
            ghostElement.style.position = 'absolute';
            ghostElement.style.top = '-1000px';
            document.body.appendChild(ghostElement);
            e.dataTransfer.setDragImage(ghostElement, 100, 20);
            
            // Remove the ghost element after a short delay
            setTimeout(() => {
                document.body.removeChild(ghostElement);
            }, 0);
        });
        
        post.addEventListener('dragend', () => {
            post.classList.remove('dragging');
        });
    });
}

// Render Functions
function renderPosts() {
    pinboard.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.postId = post.id;
        postElement.style.backgroundColor = post.color;
        
        // Apply saved position
        if (post.position) {
            postElement.style.transform = `translate(${post.position.x}px, ${post.position.y}px)`;
        }
        
        // Highlight selected post
        if (post.id === selectedPostId) {
            postElement.classList.add('selected');
        }
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-title">${escapeHtml(post.title)}</div>
                <div class="post-actions">
                    <i class="fas fa-edit edit-post-btn btn-icon" title="Edit"></i>
                    <i class="fas fa-trash-alt delete-post-btn btn-icon" title="Delete"></i>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
        `;
        
        pinboard.appendChild(postElement);
    });
    
    // Make posts draggable
    makeDraggable();
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getRandomPastelColor() {
    const pastelColors = [
        '#FFD1DC', // Pink
        '#D0F0C0', // Mint Green
        '#FFEBCD', // Cream
        '#E6E6FA', // Lavender
        '#F0E6FF', // Light Purple
        '#FDFD96', // Pastel Yellow
        '#B5EAD7', // Aqua
        '#FFC8A2', // Peach
        '#D7BDE2', // Lilac
    ];
    
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}

function saveToLocalStorage() {
    localStorage.setItem('pinboard_posts', JSON.stringify(posts));
    localStorage.setItem('pinboard_comments', JSON.stringify(comments));
    localStorage.setItem('pinboard_selectedPostId', selectedPostId);
}

function loadFromLocalStorage() {
    try {
        const savedPosts = localStorage.getItem('pinboard_posts');
        const savedComments = localStorage.getItem('pinboard_comments');
        const savedSelectedPostId = localStorage.getItem('pinboard_selectedPostId');
        
        if (savedPosts) {
            posts = JSON.parse(savedPosts);
        }
        
        if (savedComments) {
            comments = JSON.parse(savedComments);
        }
        
        if (savedSelectedPostId && savedSelectedPostId !== 'null') {
            selectedPostId = savedSelectedPostId;
        }
    } catch (error) {
        console.error('Error loading data from local storage', error);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Add toast styling to the CSS
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 9999;
}

.toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

.post.selected {
    outline: 3px solid #9c27b0;
    box-shadow: 0 0 15px rgba(156, 39, 176, 0.3);
}
`;

document.head.appendChild(toastStyles);

function clearCommentInput() {
    commentInput.value = '';
    commentInput.focus();
    
    // Add a subtle vibration on mobile
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
} 