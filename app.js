// CartShare App.js - Fixed Version
const STORAGE_KEYS = {
    USERS: 'cartshare_users',
    CURRENT_USER: 'cartshare_current_user',
    CARTS: 'cartshare_carts',
    CART_ITEMS: 'cartshare_cart_items',
    INVITES: 'cartshare_invites'
};

function getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'index.html';
}
// Room Functions - Add these to app.js

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRooms() {
    const raw = localStorage.getItem(STORAGE_KEYS.CARTS);
    return raw ? JSON.parse(raw) : [];
}

function saveRooms(rooms) {
    localStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(rooms));
}

function createRoom(roomName) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login first');
        return;
    }
    
    const rooms = getRooms();
    const newRoom = {
        id: generateRoomCode(),
        name: roomName || 'My Cart',
        owner: user.email,
        members: [user.email],
        items: [],
        createdAt: new Date().toISOString()
    };
    
    rooms.push(newRoom);
    saveRooms(rooms);
    
    // Redirect to room page
    window.location.href = `room.html?id=${newRoom.id}`;
}

function joinRoom(roomCode) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login first');
        return;
    }
    
    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomCode.toUpperCase());
    
    if (!room) {
        alert('Room not found!');
        return;
    }
    
    if (!room.members.includes(user.email)) {
        room.members.push(user.email);
        saveRooms(rooms);
    }
    
    window.location.href = `room.html?id=${room.id}`;
}
