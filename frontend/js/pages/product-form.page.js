/* ==========================================================================
   js/pages/product-form.page.js
   ========================================================================== */

import { createProduct, getProductById, updateProduct, deleteProduct } from '../api/products.api.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { getUser } from '../store/auth.store.js';

export async function render(container, params = {}, queryParams = {}) {
  const isEdit = !!params.id;
  let product = null;

  if (isEdit) {
    try {
      showLoader();
      product = await getProductById(params.id);
    } catch (err) {
      console.error('Failed to load product for editing:', err);
      showToast('Product not found or database error', 'error');
      window.location.hash = '#/products';
      return;
    } finally {
      hideLoader();
    }
  }

  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Determine scanner returning parameter
  const scannedVal = queryParams.barcode || (isEdit ? (product.barcode || '') : '');

  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-3)">
          <a href="#/products" style="display: flex; align-items: center; color: var(--color-text-muted);">
            <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          </a>
          <h1 style="font-size: var(--text-xl); font-weight: 700;">${isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </header>

        <form id="product-form" style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8);">
          <div class="form-group">
            <label for="p-name" class="form-label">Product Name *</label>
            <input type="text" id="p-name" class="form-input" required value="${isEdit ? escapeHTML(product.name) : ''}" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <div class="form-group">
              <label for="p-sku" class="form-label">SKU (Unique ID) *</label>
              <input type="text" id="p-sku" class="form-input" required placeholder="e.g. MILK-1L" value="${isEdit ? escapeHTML(product.sku) : ''}" />
            </div>
            <div class="form-group">
              <label for="p-barcode" class="form-label">Barcode</label>
              <div style="display: flex;">
                <input 
                  type="text" 
                  id="p-barcode" 
                  class="form-input" 
                  placeholder="Scan or type..." 
                  value="${escapeHTML(scannedVal)}" 
                  style="border-radius: var(--radius-md) 0 0 var(--radius-md); flex: 1;"
                />
                <button type="button" id="btn-scan-barcode" class="btn-input-scan" title="Scan Barcode">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 4h10l-4-4zm9-11h-7v2h7v7h2V4c0-1.1-.9-2-2-2zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7zm16 0h-2v7h-7v2h7c1.1 0 2-.9 2-2v-7zm-4-3l-4-4-4 4h8z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <div class="form-group">
              <label for="p-category" class="form-label">Category</label>
              <input type="text" id="p-category" class="form-input" placeholder="e.g. Dairy" value="${isEdit ? escapeHTML(product.category || '') : ''}" />
            </div>
            <div class="form-group">
              <label for="p-unit" class="form-label">Unit</label>
              <input type="text" id="p-unit" class="form-input" placeholder="pcs, kg, packet..." value="${isEdit ? escapeHTML(product.unit || 'pcs') : 'pcs'}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <div class="form-group">
              <label for="p-cost" class="form-label">Cost Price *</label>
              <input type="number" id="p-cost" class="form-input" step="0.01" min="0" required value="${isEdit ? product.costPrice : ''}" />
            </div>
            <div class="form-group">
              <label for="p-sell" class="form-label">Sell Price *</label>
              <input type="number" id="p-sell" class="form-input" step="0.01" min="0" required value="${isEdit ? product.sellPrice : ''}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <div class="form-group">
              <label for="p-threshold" class="form-label">Low Stock Threshold</label>
              <input type="number" id="p-threshold" class="form-input" min="0" value="${isEdit ? (product.lowStockThreshold ?? 5) : '5'}" />
            </div>
            <div class="form-group">
              <label for="p-expiry" class="form-label">Expiry Date</label>
              <input type="date" id="p-expiry" class="form-input" value="${isEdit && product.expiryDate ? formatDate(product.expiryDate) : ''}" />
            </div>
          </div>

          <button type="submit" class="btn btn--primary" style="margin-top: var(--space-3);">
            ${isEdit ? 'Save Changes' : 'Create Product'}
          </button>

          ${isEdit && isAdmin ? `
            <button type="button" id="btn-delete-product" class="btn btn--secondary" style="color: var(--color-danger); border-color: var(--color-danger); margin-top: var(--space-2);">
              Delete Product
            </button>
          ` : ''}
        </form>
      </div>
    </div>
  `;

  // Bind Scan button click event
  document.getElementById('btn-scan-barcode').addEventListener('click', () => {
    const returnPath = isEdit ? `products/${params.id}/edit` : 'products/new';
    window.location.hash = `#/scanner?returnTo=${returnPath}`;
  });

  // Form Submit Handler
  const form = document.getElementById('product-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('p-name').value.trim();
    const sku = document.getElementById('p-sku').value.trim().toUpperCase();
    const barcode = document.getElementById('p-barcode').value.trim() || null;
    const category = document.getElementById('p-category').value.trim() || null;
    const unit = document.getElementById('p-unit').value.trim() || 'pcs';
    const costPrice = parseFloat(document.getElementById('p-cost').value);
    const sellPrice = parseFloat(document.getElementById('p-sell').value);
    const lowStockThreshold = parseInt(document.getElementById('p-threshold').value, 10) || 5;
    const expiryInput = document.getElementById('p-expiry').value;
    const expiryDate = expiryInput ? new Date(expiryInput).toISOString().split('T')[0] : null;

    // Front-end validations
    if (costPrice < 0 || sellPrice < 0) {
      showToast('Prices cannot be negative', 'warning');
      return;
    }
    if (lowStockThreshold < 0) {
      showToast('Threshold must be 0 or greater', 'warning');
      return;
    }

    const payload = {
      name,
      sku,
      barcode,
      category,
      unit,
      costPrice,
      sellPrice,
      lowStockThreshold,
      expiryDate,
    };

    try {
      showLoader();
      if (isEdit) {
        await updateProduct(params.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await createProduct(payload);
        showToast('Product created successfully', 'success');
      }
      window.location.hash = '#/products';
    } catch (err) {
      console.error('Failed to save product:', err);
      showToast(err.message || 'Error occurred while saving', 'error');
    } finally {
      hideLoader();
    }
  });

  // Delete Action handler
  if (isEdit && isAdmin) {
    document.getElementById('btn-delete-product').addEventListener('click', async () => {
      const confirmDelete = confirm(`Are you sure you want to delete "${product.name}"? This soft-deletes the product, preserving transaction history.`);
      if (!confirmDelete) return;

      try {
        showLoader();
        await deleteProduct(params.id);
        showToast('Product deleted successfully', 'success');
        window.location.hash = '#/products';
      } catch (err) {
        console.error('Failed to delete product:', err);
        showToast(err.message || 'Error occurred while deleting', 'error');
      } finally {
        hideLoader();
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
