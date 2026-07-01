/* ==========================================================================
   js/api/auth.api.js
   ========================================================================== */

import { api } from './client.js';

export async function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export async function register(userData) {
  return api.post('/auth/register', userData);
}

export async function getMe() {
  return api.get('/auth/me');
}

export async function changePassword(payload) {
  return api.patch('/auth/password', payload);
}
