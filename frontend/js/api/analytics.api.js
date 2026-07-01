/* ==========================================================================
   js/api/analytics.api.js
   ========================================================================== */

import { api } from './client.js';

export async function getDashboard() {
  return api.get('/analytics/dashboard');
}

export async function getProfitLoss(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to)   params.append('to', filters.to);

  const queryStr = params.toString();
  return api.get(`/analytics/profit-loss${queryStr ? `?${queryStr}` : ''}`);
}
