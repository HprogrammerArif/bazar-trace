/* ==========================================================================
   js/api/users.api.js
   ========================================================================== */

import { api } from './client.js';

export async function getUsers() {
  return api.get('/users');
}

export async function updateUser(id, updateData) {
  return api.patch(`/users/${id}`, updateData);
}
