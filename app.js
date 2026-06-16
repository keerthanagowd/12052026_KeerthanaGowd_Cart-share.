/* =========================================================
   CartShare - app.js
   Core shared logic: Auth + Room + Cart + Activity
   ========================================================= */

const STORAGE_KEYS = {
  USERS: 'cartshare_users',
  CURRENT_USER: 'cartshare_current_user'
};

/* ---------- USER ACCOUNT HELPERS ---------- */

function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/* ---------- SESSION HELPERS ---------- */

function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  const sessionUser = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.href = 'index.html';
}

/* =========================================================
   ROOM MANAGEMENT
   ========================================================= */

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function roomKey(code) {
  return 'cartshare_room_' + code.toUpperCase();
}

function createRoom(user) {
  const code = generateRoomCode();
  const room = {
    code,
    createdBy: user.id,
    members: [{ id: user.id, name: user.name }],
    cart: [],
    activity: []
  };
  saveRoom(room);
  logActivity(code, `${user.name} created the room.`);
  return room;
}

function joinRoom(code, user) {
  const room = getRoom(code);
  if (!room) return null;

  const alreadyMember = room.members.some(m => m.id === user.id);
  if (!alreadyMember) {
    room.members.push({ id: user.id, name: user.name });
    saveRoom(room);
    logActivity(code, `${user.name} joined the room.`);
  }
  return room;
}

function getRoom(code) {
  const raw = localStorage.getItem(roomKey(code));
  return raw ? JSON.parse(raw) : null;
}

function saveRoom(room) {
  localStorage.setItem(roomKey(room.code), JSON.stringify(room));
}

function setActiveRoomCode(code) {
  localStorage.setItem('cartshare_active_room', code);
}

function getActiveRoomCode() {
  return localStorage.getItem('cartshare_active_room');
}

/* =========================================================
   CART ACTIONS
   ========================================================= */

function addToCart(code, product, user) {
  const room = getRoom(code);
  if (!room) return null;

  const existing = room.cart.find(item => item.productId === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    room.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      addedBy: user.name
    });
  }

  saveRoom(room);
  logActivity(code, `${user.name} added "${product.name}" to the cart.`);
  return room;
}

function removeFromCart(code, productId, user) {
  const room = getRoom(code);
  if (!room) return null;

  const item = room.cart.find(i => i.productId === productId);
  if (!item) return room;

  item.qty -= 1;
  const removedCompletely = item.qty <= 0;
  if (removedCompletely) {
    room.cart = room.cart.filter(i => i.productId !== productId);
  }

  saveRoom(room);
  logActivity(
    code,
    removedCompletely
      ? `${user.name} removed "${item.name}" from the cart.`
      : `${user.name} reduced "${item.name}" quantity.`
  );
  return room;
}

function getCartTotal(room) {
  return room.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* =========================================================
   ACTIVITY LOG
   ========================================================= */

function logActivity(code, message) {
  const room = getRoom(code);
  if (!room) return;

  room.activity.unshift({
    message,
    time: new
