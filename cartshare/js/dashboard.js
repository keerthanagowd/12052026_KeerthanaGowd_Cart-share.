/* =========================================================
   CartShare - dashboard.js - FIREBASE VERSION
   Real-time room sync with Firebase Realtime Database
   ========================================================= */

const FREE_DELIVERY_THRESHOLD = 75;

let currentUser = null;
let activeRoomCode = null;
let roomListener = null; // Firebase listener reference

document.addEventListener('DOMContentLoaded', () => {
  // --- Auth guard: bounce back to login if no session exists ---
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('userGreeting').textContent = `Hi, ${currentUser.name}`;
  document.getElementById('userGreeting').classList.remove('d-none');

  // --- Populate category dropdown dynamically from PRODUCTS ---
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const categorySelect = document.getElementById('categoryFilter');
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  categorySelect.addEventListener('change', renderGallery);

  // --- If we already have an active room saved, resume it ---
  const savedCode = getActiveRoomCode();
  if (savedCode) {
    enterRoom(savedCode);
  }

  // --- Room gate buttons ---
  document.getElementById('createRoomBtn').addEventListener('click', async () => {
    const room = await createRoom(currentUser);
    enterRoom(room.code);
  });

  document.getElementById('joinRoomBtn').addEventListener('click', async () => {
    const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
    const errorBox = document.getElementById('joinError');
    errorBox.textContent = '';

    if (!code) {
      errorBox.textContent = 'Please enter a room code.';
      return;
    }
    const room = await joinRoom(code, currentUser);
    if (!room) {
      errorBox.textContent = 'No room found with that code.';
      return;
    }
    enterRoom(code);
  });
});

/* ---------- FIREBASE ROOM FUNCTIONS ---------- */

async function createRoom(user) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomData = {
    code: code,
    createdBy: user.name,
    createdAt: Date.now(),
    members: [user.name],
    cart: [],
    activity: [{
      time: new Date().toLocaleTimeString(),
      message: `${user.name} created the room`
    }]
  };
  
  await window.dbSet(window.dbRef(window.database, `rooms/${code}`), roomData);
  return roomData;
}

async function joinRoom(code, user) {
  const roomRef = window.dbRef(window.database, `rooms/${code}`);
  const snapshot = await new Promise(resolve => {
    window.dbOnValue(roomRef, resolve, { onlyOnce: true });
  });
  
  if (!snapshot.exists()) return null;
  
  const room = snapshot.val();
  if (!room.members.includes(user.name)) {
    room.members.push(user.name);
    room.activity.unshift({
      time: new Date().toLocaleTimeString(),
      message: `${user.name} joined the room`
    });
    await window.dbSet(roomRef, room);
  }
  return room;
}

function getActiveRoomCode() {
  return localStorage.getItem('activeRoomCode');
}

function setActiveRoomCode(code) {
  localStorage.set
