/* ==========================================================================
   js/pages/transactions.page.js
   ========================================================================== */

import { getTransactions } from '../api/transactions.api.js';
import { getProducts } from '../api/products.api.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { renderBottomNav } from '../components/bottom-nav.js';

let productsMap = {}; // Map of productId -> productDetails for fast name resolution

export async function render(container) {
  // 1. Initial lookup lists rendering
  try {
    showLoader();
    const products = await getProducts();
    productsMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  } catch (err) {
    console.error('Failed to load products map:', err);
  } finally {
    hideLoader();
  }

  // 2. Render view template
  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4);">
          <h1 style="font-size: var(--text-2xl); font-weight: 700;">Transaction Logs</h1>
        </header>

        <!-- Filters Section -->
        <div class="filters-panel">
          <div class="filters-row">
            <div class="form-group" style="margin-bottom: 0;">
              <label for="filter-type" class="form-label" style="font-size: 11px; margin-bottom: 4px;">Type</label>
              <select id="filter-type" class="form-input" style="padding: 0.5rem; font-size: var(--text-sm);">
                <option value="">All Types</option>
                <option value="OUT">Sales (OUT)</option>
                <option value="IN">Stock In (IN)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label for="filter-product" class="form-label" style="font-size: 11px; margin-bottom: 4px;">Product</label>
              <select id="filter-product" class="form-input" style="padding: 0.5rem; font-size: var(--text-sm);">
                <option value="">All Products</option>
                ${Object.values(productsMap).map(p => `
                  <option value="${p.id}">${escapeHTML(p.name)}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="filters-row" style="margin-top: 4px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label for="filter-from" class="form-label" style="font-size: 11px; margin-bottom: 4px;">From Date</label>
              <input type="date" id="filter-from" class="form-input" style="padding: 0.5rem; font-size: var(--text-sm);" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label for="filter-to" class="form-label" style="font-size: 11px; margin-bottom: 4px;">To Date</label>
              <input type="date" id="filter-to" class="form-input" style="padding: 0.5rem; font-size: var(--text-sm);" />
            </div>
          </div>
        </div>

        <!-- Logs Container -->
        <div id="txn-logs-wrapper" class="txn-logs-list">
          <div class="loader-spinner" style="margin: var(--space-8) auto;"></div>
        </div>
      </div>

      ${renderBottomNav('#/transactions')}
    </div>
  `;

  // Bind filter controls
  const fType = document.getElementById('filter-type');
  const fProd = document.getElementById('filter-product');
  const fFrom = document.getElementById('filter-from');
  const fTo = document.getElementById('filter-to');
  const logsWrapper = document.getElementById('txn-logs-wrapper');

  // Trigger initial fetch
  fetchLogs();

  // Attach change listeners to triggers
  [fType, fProd, fFrom, fTo].forEach(el => {
    el.addEventListener('change', () => fetchLogs());
  });

  async function fetchLogs() {
    const filters = {
      type: fType.value || undefined,
      productId: fProd.value || undefined,
      from: fFrom.value ? new Date(fFrom.value).toISOString() : undefined,
      to: fTo.value ? new Date(fTo.value).toISOString() : undefined,
    };

    try {
      logsWrapper.innerHTML = `<div class="loader-spinner" style="margin: var(--space-8) auto;"></div>`;
      const logs = await getTransactions(filters);
      renderLogs(logsWrapper, logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      showToast(err.message || 'Error loading transaction history logs', 'error');
      logsWrapper.innerHTML = `
        <div style="text-align:center; color:var(--color-text-muted); padding: var(--space-6) 0;">
          Error loading history logs.
        </div>
      `;
    }
  }
}

function renderLogs(targetEl, logs) {
  if (!logs.length) {
    targetEl.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-8) 0; font-size: var(--text-sm);">
        No transactions logged matching filters.
      </div>
    `;
    return;
  }

  targetEl.innerHTML = logs.map(log => {
    const isOut = log.type === 'OUT';
    const total = log.quantity * log.unitPrice;
    
    // Resolve product details dynamically
    const prodDetails = productsMap[log.productId] || { name: 'Unknown Product', sku: 'N/A', unit: 'pcs' };
    const dateObj = new Date(log.occurredAt);
    
    return `
      <div class="txn-card">
        <div class="txn-left">
          <div class="txn-icon ${isOut ? 'txn-icon--out' : 'txn-icon--in'}">
            ${isOut ? `
              <svg viewBox="0 0 24 24"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>
            ` : `
              <svg viewBox="0 0 24 24"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
            `}
          </div>
          <div class="txn-details">
            <div class="txn-prod-name">${escapeHTML(prodDetails.name)}</div>
            <div class="txn-meta">
              <span>Qty: ${log.quantity} ${escapeHTML(prodDetails.unit)}</span>
              <span>•</span>
              <span>${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${log.note ? `<div style="font-size:10px; color: var(--color-accent); font-style:italic;">"${escapeHTML(log.note)}"</div>` : ''}
          </div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${isOut ? 'txn-amount--out' : 'txn-amount--in'}">
            ${isOut ? '-' : '+'}$${total.toFixed(2)}
          </div>
          <div style="font-size: 11px; color: var(--color-text-muted);">
            @ $${log.unitPrice.toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }).join('');
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
