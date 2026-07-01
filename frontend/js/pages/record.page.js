/* ==========================================================================
   js/pages/record.page.js
   ========================================================================== */

import { getProducts } from '../api/products.api.js';
import { recordTransaction } from '../api/transactions.api.js';
import { generateUUID } from '../utils/uuid.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { renderBottomNav } from '../components/bottom-nav.js';

let productsList = [];
let selectedProduct = null;
let currentTab = 'OUT'; // 'OUT' (Sale) or 'IN' (Stock In)

export async function render(container, params = {}, queryParams = {}) {
  // 1. Initial product list fetching for search matching
  try {
    showLoader();
    productsList = await getProducts();
  } catch (err) {
    console.error('Failed to load products list:', err);
    showToast('Failed to fetch products list', 'error');
  } finally {
    hideLoader();
  }

  // 2. Render initial SPA layout shell
  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4);">
          <h1 style="font-size: var(--text-2xl); font-weight: 700;">Record Transaction</h1>
        </header>

        <!-- Tabs Nav -->
        <div class="tabs-nav">
          <button id="tab-btn-out" class="tab-btn tab-btn--active">Sale (OUT)</button>
          <button id="tab-btn-in" class="tab-btn">Stock In (IN)</button>
        </div>

        <form id="record-form" style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8);">
          <!-- Search Autocomplete Input -->
          <div class="form-group">
            <label for="prod-search-input" class="form-label">Search Product *</label>
            <div style="display: flex;">
              <div class="autocomplete-container" style="flex: 1;">
                <input 
                  type="text" 
                  id="prod-search-input" 
                  class="form-input" 
                  placeholder="Type name, SKU, or barcode..." 
                  required 
                  autocomplete="off"
                  style="border-radius: var(--radius-md) 0 0 var(--radius-md);"
                />
                <div id="autocomplete-dropdown" class="autocomplete-results"></div>
              </div>
              <button type="button" id="btn-scan-product" class="btn-input-scan" title="Scan Barcode">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 4h10l-4-4zm9-11h-7v2h7v7h2V4c0-1.1-.9-2-2-2zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7zm16 0h-2v7h-7v2h7c1.1 0 2-.9 2-2v-7zm-4-3l-4-4-4 4h8z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Selected Product Display Badge Container -->
          <div id="selected-product-wrapper"></div>

          <!-- Quantity input -->
          <div class="form-group">
            <label for="txn-qty" class="form-label">Quantity *</label>
            <input type="number" id="txn-qty" class="form-input" min="0.001" step="any" required placeholder="0" />
          </div>

          <!-- Price input -->
          <div class="form-group">
            <label for="txn-price" class="form-label" id="price-label">Unit Selling Price ($) *</label>
            <input type="number" id="txn-price" class="form-input" min="0" step="0.01" required placeholder="0.00" />
          </div>

          <!-- Note memo input -->
          <div class="form-group">
            <label for="txn-note" class="form-label">Note / Memo</label>
            <input type="text" id="txn-note" class="form-input" placeholder="e.g. Regular customer, bulk deal..." />
          </div>

          <button type="submit" class="btn btn--primary" style="margin-top: var(--space-3);" id="btn-submit-txn">
            Submit Sale (OUT)
          </button>
        </form>
      </div>

      ${renderBottomNav('#/record')}
    </div>
  `;

  // Bind references
  const tabOut = document.getElementById('tab-btn-out');
  const tabIn = document.getElementById('tab-btn-in');
  const searchInput = document.getElementById('prod-search-input');
  const dropdown = document.getElementById('autocomplete-dropdown');
  const selectedWrapper = document.getElementById('selected-product-wrapper');
  const qtyInput = document.getElementById('txn-qty');
  const priceInput = document.getElementById('txn-price');
  const priceLabel = document.getElementById('price-label');
  const submitBtn = document.getElementById('btn-submit-txn');
  const form = document.getElementById('record-form');
  const scanBtn = document.getElementById('btn-scan-product');

  // Reset selected state on render
  selectedProduct = null;

  // Check if a barcode is passed in the query parameters
  if (queryParams.barcode) {
    const matched = productsList.find(p => p.barcode === queryParams.barcode);
    if (matched) {
      selectedProduct = matched;
      searchInput.value = matched.name;
      priceInput.value = currentTab === 'OUT' ? matched.sellPrice : matched.costPrice;
      selectedWrapper.innerHTML = `
        <div class="selected-product-card">
          <div>
            <strong>${escapeHTML(matched.name)}</strong>
            <div style="font-size:12px; color: var(--color-text-muted)">SKU: ${matched.sku}</div>
          </div>
          <div style="text-align: right">
            <span style="font-size: 11px; color: var(--color-text-muted)">Current Stock:</span>
            <div style="font-weight: 700; color: ${matched.stock <= matched.lowStockThreshold ? 'var(--color-warning)' : 'var(--color-success)'}">
              ${matched.stock ?? 0} ${matched.unit}
            </div>
          </div>
        </div>
      `;
      showToast(`Selected: ${matched.name}`, 'success');
    } else {
      showToast(`No product matching barcode: ${queryParams.barcode}`, 'warning');
    }
  }

  // Bind Scan Button Click Navigation
  scanBtn.addEventListener('click', () => {
    window.location.hash = '#/scanner?returnTo=record';
  });

  // 3. Tab toggle listeners
  tabOut.addEventListener('click', () => {
    switchTab('OUT');
  });
  tabIn.addEventListener('click', () => {
    switchTab('IN');
  });

  function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;

    if (tab === 'OUT') {
      tabOut.classList.add('tab-btn--active');
      tabIn.classList.remove('tab-btn--active');
      priceLabel.textContent = 'Unit Selling Price ($) *';
      submitBtn.textContent = 'Submit Sale (OUT)';
      if (selectedProduct) {
        priceInput.value = selectedProduct.sellPrice;
      }
    } else {
      tabIn.classList.add('tab-btn--active');
      tabOut.classList.remove('tab-btn--active');
      priceLabel.textContent = 'Unit Cost Price ($) *';
      submitBtn.textContent = 'Submit Stock In (IN)';
      if (selectedProduct) {
        priceInput.value = selectedProduct.costPrice;
      }
    }
  }

  // 4. Product autocomplete matching logic
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = productsList.filter(p => 
      p.name.toLowerCase().includes(val) || 
      p.sku.toLowerCase().includes(val) || 
      (p.barcode && p.barcode.includes(val))
    ).slice(0, 10); // Limit to top 10

    if (!matches.length) {
      dropdown.innerHTML = `<div class="autocomplete-item" style="color: var(--color-text-muted); cursor: default;">No products found</div>`;
    } else {
      dropdown.innerHTML = matches.map(p => `
        <div class="autocomplete-item" data-id="${p.id}">
          <div style="font-weight:600;">${escapeHTML(p.name)}</div>
          <div style="font-size:11px; color: var(--color-text-muted);">SKU: ${p.sku} | Stock: ${p.stock ?? 0} ${p.unit}</div>
        </div>
      `).join('');
    }
    dropdown.style.display = 'block';
  });

  // Handle autocomplete item selection
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;

    const id = item.getAttribute('data-id');
    if (!id) return;

    selectedProduct = productsList.find(p => p.id === Number(id));
    if (selectedProduct) {
      searchInput.value = selectedProduct.name;
      dropdown.style.display = 'none';
      
      // Auto fill price inputs based on tab type
      priceInput.value = currentTab === 'OUT' ? selectedProduct.sellPrice : selectedProduct.costPrice;

      // Render selected details card
      selectedWrapper.innerHTML = `
        <div class="selected-product-card">
          <div>
            <strong>${escapeHTML(selectedProduct.name)}</strong>
            <div style="font-size:12px; color: var(--color-text-muted)">SKU: ${selectedProduct.sku}</div>
          </div>
          <div style="text-align: right">
            <span style="font-size: 11px; color: var(--color-text-muted)">Current Stock:</span>
            <div style="font-weight: 700; color: ${selectedProduct.stock <= selectedProduct.lowStockThreshold ? 'var(--color-warning)' : 'var(--color-success)'}">
              ${selectedProduct.stock ?? 0} ${selectedProduct.unit}
            </div>
          </div>
        </div>
      `;
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) {
      dropdown.style.display = 'none';
    }
  });

  // 5. Submit Form event handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      showToast('Please search and select a valid product first', 'warning');
      return;
    }

    const quantity = parseFloat(qtyInput.value);
    const unitPrice = parseFloat(priceInput.value);
    const note = document.getElementById('txn-note').value.trim() || null;

    if (quantity <= 0 || unitPrice < 0) {
      showToast('Verify quantity > 0 and price >= 0', 'warning');
      return;
    }

    // Safety check: OUT transaction exceeds current stock warning
    if (currentTab === 'OUT' && quantity > (selectedProduct.stock ?? 0)) {
      const confirmExceed = confirm(`Warning: You are selling ${quantity} units, but only ${selectedProduct.stock ?? 0} are in stock. Proceed?`);
      if (!confirmExceed) return;
    }

    const payload = {
      clientTxnId: generateUUID(),
      productId: selectedProduct.id,
      type: currentTab,
      quantity,
      unitPrice,
      note,
      occurredAt: new Date().toISOString(),
    };

    try {
      showLoader();
      await recordTransaction(payload);
      showToast('Transaction recorded successfully', 'success');
      window.location.hash = '#/products';
    } catch (err) {
      console.error('Failed to record transaction:', err);
      showToast(err.message || 'Failed to submit transaction', 'error');
    } finally {
      hideLoader();
    }
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
