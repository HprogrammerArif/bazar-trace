/* ==========================================================================
   js/api/products.api.js
   ========================================================================== */

import { api } from './client.js';

export async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.limit)  params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const queryStr = params.toString();
  return api.get(`/products${queryStr ? `?${queryStr}` : ''}`);
}

export async function getProductById(id) {
  return api.get(`/products/${id}`);
}

export async function getProductByBarcode(barcode) {
  return api.get(`/products/barcode/${barcode}`);
}

export async function createProduct(productData) {
  return api.post('/products', productData);
}

export async function updateProduct(id, patchData) {
  return api.patch(`/products/${id}`, patchData);
}

export async function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
