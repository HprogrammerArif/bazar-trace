/* ==========================================================================
   js/api/transactions.api.js
   ========================================================================== */

import { api } from './client.js';

export async function recordTransaction(payload) {
  return api.post('/transactions', payload);
}

export async function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.productId) params.append('productId', filters.productId);
  if (filters.type)      params.append('type', filters.type);
  if (filters.from)      params.append('from', filters.from);
  if (filters.to)        params.append('to', filters.to);
  if (filters.limit)     params.append('limit', filters.limit);
  if (filters.offset)    params.append('offset', filters.offset);

  const queryStr = params.toString();
  return api.get(`/transactions${queryStr ? `?${queryStr}` : ''}`);
}
