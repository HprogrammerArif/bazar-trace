/* ==========================================================================
   js/store/auth.store.js
   ========================================================================== */

let currentUser = null;
let token = null;

export function setAuth(user, jwt) {
  currentUser = user;
  token = jwt;
  localStorage.setItem('bazar_token', jwt);
  localStorage.setItem('bazar_user', JSON.stringify(user));
}

export function getUser() {
  return currentUser;
}

export function getToken() {
  return token;
}

export function isLoggedIn() {
  return !!token;
}

export function isAdmin() {
  return currentUser?.role === 'ADMIN';
}

export function clearAuth() {
  currentUser = null;
  token = null;
  localStorage.removeItem('bazar_token');
  localStorage.removeItem('bazar_user');
}

// RESTORE SESSION ON APP START
export function restoreSession() {
  token = localStorage.getItem('bazar_token');
  const storedUser = localStorage.getItem('bazar_user');
  currentUser = storedUser ? JSON.parse(storedUser) : null;
}
