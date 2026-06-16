/* =========================================================
   CartShare - dashboard.js
   ========================================================= */

const FREE_DELIVERY_THRESHOLD = 75;

let currentUser = null;
let activeRoomCode = null;

document.addEventListener('DOMContentLoaded', () => {

  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('userGreeting').textContent = `Hi, ${currentUser.name}`;
  document.getElementById('userGreeting').classList.remove('d-none');

  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const categorySelect = document.getElementById('categoryFilter');
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  categorySelect.addEventListener('change', renderGallery);

  const savedCode = getActiveRoomCode();
  if (savedCode && getRoom(savedCode)) {
    enterRoom(savedCode);
  }

  document.getElementById('createRoomBtn').addEventListener('click', () => {
    const room = createRoom(currentUser);
    enterRoom(room.code);
  });

  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
    const errorBox = document.getElementById('joinError');
    errorBox.textContent = '';

    if (!code) {
      errorBox.textContent = 'Please enter a room code.';
      return;
    }
    const room = joinRoom(code, currentUser);
    if (!room) {
      errorBox.textContent = 'No room found with that code.';
      return;
    }
    enterRoom(code);
  });

  onRoomUpdated(() => {
    renderCart();
    renderActivity();
    showToast('Room updated by a teammate.');
  });

});

function enterRoom(code) {
  activeRoomCode = code;
  setActiveRoomCode(code);

  document.getElementById('roomGate').classList.add('d-none');
  document.getElementById('appArea').classList.remove('d-none');

  const badge = document.getElementById('roomBadge');
  badge.textContent = `Room: ${code}`;
  badge.classList.remove('d-none');
  badge.style.cursor = 'pointer';
  badge.title = 'Click to copy room code';
  badge.onclick = () => {
    navigator.clipboard.writeText(code);
    showToast('Room code copied to clipboard!');
  };

  renderGallery();
  renderCart();
  renderActivity();
}

function renderGallery() {
  const gallery = document.getElementById('productGallery');
  const filter = document.getElementById('categoryFilter').value;
  gallery.innerHTML = '';

  const visibleProducts = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  visibleProducts.forEach(product => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="product-card h-100 shadow-sm">
        <div class="product-emoji">${product.img}</div>
        <div class="fw-semibold">${product.name}</div>
        <div class="text-muted small mb-2">${product.category}</div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold">$${product.price.toFixed(2)}</span>
          <button class="btn btn-sm btn-primary" data-id="${product.id}">+ Add</button>
        </div>
      </div>
    `;
    col.querySelector('button').addEventListener('click', () => {
      addToCart(activeRoomCode, product, currentUser);
      renderCart();
      renderActivity();
    });
    gallery.appendChild(col);
  });
}

function renderCart() {
  const room = getRoom(activeRoomCode);
  if (!room) return;

  const cartItemsBox = document.getElementById('cartItems');
  cartItemsBox.innerHTML = '';

  if (room.cart.length === 0) {
    cartItemsBox.innerHTML = '<p class="text-muted small">No items yet. Add something from the catalog!</p>';
  }

  room.cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item d-flex justify-content-between align-items-center mb-2';
    row.innerHTML = `
