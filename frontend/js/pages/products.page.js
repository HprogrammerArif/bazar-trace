/* ==========================================================================
   js/pages/products.page.js
   ========================================================================== */

import { getProducts } from '../api/products.api.js';
import { showToast } from '../components/toast.js';
import { renderBottomNav } from '../components/bottom-nav.js';

let allProducts = [];

export async function render(container) {
  // 1. Render main template with header, search bar, empty list container, bottom nav, and FAB
  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
          <h1 style="font-size: var(--text-2xl); font-weight: 700;">Products</h1>
        </header>

        <div class="search-container">
          <input 
            type="search" 
            id="product-search" 
            class="form-input" 
            placeholder="Search name, SKU, or barcode..."
          />
        </div>

        <div id="products-list-wrapper" class="products-list">
          <div class="loader-spinner" style="margin: var(--space-8) auto;"></div>
        </div>
      </div>

      ${renderBottomNav('#/products')}

      <!-- FAB button to add product -->
      <button id="fab-add-product" class="btn-fab" title="Add Product">
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  `;

  // Bind FAB click navigation
  document.getElementById('fab-add-product').addEventListener('click', () => {
    window.location.hash = '#/products/new';
  });

  const listWrapper = document.getElementById('products-list-wrapper');
  const searchInput = document.getElementById('product-search');

  // 2. Fetch products from API
  try {
    allProducts = await getProducts();
    renderList(listWrapper, allProducts);
  } catch (err) {
    console.error('Failed to load products:', err);
    showToast(err.message || 'Failed to load products list', 'error');
    listWrapper.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-6) 0;">
        Failed to load products. Check connection and retry.
      </div>
    `;
  }

  // 3. Search keypress filtering logic (client-side matching)
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderList(listWrapper, allProducts);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.includes(query))
    );
    renderList(listWrapper, filtered);
  });
}

function renderList(targetEl, list) {
  if (!list.length) {
    targetEl.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-8) 0; font-size: var(--text-sm);">
        No products found
      </div>
    `;
    return;
  }

  targetEl.innerHTML = list.map(product => {
    const stockVal = product.stock ?? 0;
    const threshold = product.lowStockThreshold ?? 5;
    
    let badgeClass = 'stock-badge--ok';
    let badgeText = 'Active';

    if (stockVal <= 0) {
      badgeClass = 'stock-badge--empty';
      badgeText = 'Out of Stock';
    } else if (stockVal <= threshold) {
      badgeClass = 'stock-badge--low';
      badgeText = `Low Stock (${stockVal})`;
    } else {
      badgeText = `In Stock (${stockVal})`;
    }

    // Expiry check highlight
    const isExpired = product.expiryDate && new Date(product.expiryDate) < new Date();
    if (isExpired) {
      badgeClass = 'stock-badge--expired';
      badgeText = 'Expired';
    }

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-details">
          <div class="product-title">${escapeHTML(product.name)}</div>
          <div class="product-meta">
            <span>SKU: ${escapeHTML(product.sku)}</span>
            <span>|</span>
            <span>Category: ${escapeHTML(product.category || 'None')}</span>
          </div>
          <div>
            <span class="stock-badge ${badgeClass}">${badgeText}</span>
          </div>
        </div>
        <div class="product-price">
          <div>$${product.sellPrice.toFixed(2)}</div>
          <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-weight: normal;">
            cost: $${product.costPrice.toFixed(2)}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Add click routing dynamically to product detail cards
  const cards = targetEl.querySelectorAll('.product-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.getAttribute('data-id');
      window.location.hash = `#/products/${productId}/edit`;
    });
  });
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
