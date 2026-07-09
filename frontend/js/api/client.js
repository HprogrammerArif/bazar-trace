/* ==========================================================================
   js/api/client.js
   ========================================================================== */

import { getToken, clearAuth } from '../store/auth.store.js';
import { put, putAll, getAll } from '../db/idb.js';
import { showToast } from '../components/toast.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'INTERNAL_ERROR';
    this.status = status;
  }
}

async function request(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    // If the server returns a gateway error (e.g., backend is offline under dev server proxy)
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return handleOffline(url, options);
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new ApiError('INVALID_JSON', 'Server returned invalid JSON response', response.status);
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearAuth();
        window.location.hash = '#/login';
      }
      const errObj = data?.error || {};
      throw new ApiError(errObj.code, errObj.message || 'API request failed', response.status);
    }

    // Success online: Cache data for offline lookup in background
    const method = options.method || 'GET';
    if (method === 'GET') {
      if (url.startsWith('/products')) {
        // Overwrite local products list cache
        if (Array.isArray(data.data)) {
          putAll('products', data.data).catch(console.error);
        } else if (data.data && data.data.id) {
          put('products', data.data).catch(console.error);
        }
      } else if (url.startsWith('/transactions')) {
        if (Array.isArray(data.data)) {
          putAll('transactions', data.data).catch(console.error);
        }
      }
    }

    return data.data;

  } catch (err) {
    // If it's a browser fetch network connection error, enter offline mode
    if (err instanceof TypeError || err.message === 'Failed to fetch' || err.code === 'OFFLINE') {
      return handleOffline(url, options);
    }
    throw err;
  }
}

async function handleOffline(url, options) {
  const method = options.method || 'GET';

  // 1. OFFLINE GET requests: read from IndexedDB cache
  if (method === 'GET') {
    if (url.startsWith('/products')) {
      const cachedProducts = await getAll('products');
      if (cachedProducts && cachedProducts.length) {
        // Resolve barcode lookups or ID filters if present in url
        const barcodeMatch = url.match(/\/products\/barcode\/([^\/]+)/);
        if (barcodeMatch) {
          const matched = cachedProducts.find(p => p.barcode === barcodeMatch[1]);
          if (matched) return matched;
        }
        
        const idMatch = url.match(/\/products\/(\d+)/);
        if (idMatch) {
          const matched = cachedProducts.find(p => p.id === Number(idMatch[1]));
          if (matched) return matched;
        }

        return cachedProducts;
      }
    } else if (url.startsWith('/transactions')) {
      const cachedTxns = await getAll('transactions');
      if (cachedTxns && cachedTxns.length) {
        return cachedTxns;
      }
    }
    throw new ApiError('OFFLINE_NO_CACHE', 'You are offline and no local data is cached yet.', 0);
  }

  // 2. OFFLINE POST requests: queue in IndexedDB
  if (method === 'POST') {
    if (url === '/transactions') {
      const body = JSON.parse(options.body);
      const offlineTxn = {
        ...body,
        id: body.clientTxnId, // Mock ID
        _pending: true,
      };

      // Put to local transaction logs
      await put('transactions', offlineTxn);

      // Enqueue in sync queue
      const syncItem = {
        clientTxnId: body.clientTxnId,
        url,
        method: 'POST',
        body,
        createdAt: new Date().toISOString(),
      };
      await put('sync_queue', syncItem);

      // Display warning toast notice
      showToast('Saved offline — will sync when online', 'warning');

      return offlineTxn;
    }
  }

  throw new ApiError('OFFLINE_ERROR', 'Network is offline. Request could not be sent.', 0);
}

export const api = {
  get:    (url) =>        request(url, { method: 'GET' }),
  post:   (url, body) =>  request(url, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  (url, body) =>  request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) =>        request(url, { method: 'DELETE' }),
};
