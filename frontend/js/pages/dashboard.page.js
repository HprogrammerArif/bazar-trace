/* ==========================================================================
   js/pages/dashboard.page.js
   ========================================================================== */

import { getDashboard, getProfitLoss } from '../api/analytics.api.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { showToast } from '../components/toast.js';

export async function render(container) {
  // 1. Initial shell mockup with loader spinners
  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4);">
          <h1 style="font-size: var(--text-2xl); font-weight: 700;">Dashboard</h1>
        </header>

        <!-- Metrics Loader Spinner Grid -->
        <div id="metrics-wrapper" class="metrics-grid">
          <div class="loader-spinner" style="grid-column: span 2; margin: var(--space-6) auto;"></div>
        </div>

        <!-- 7-Day Chart Box -->
        <div class="chart-container">
          <h3 class="chart-title">Sales Revenue (Past 7 Days)</h3>
          <div class="chart-canvas-wrapper">
            <canvas id="sales-canvas-chart"></canvas>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="dashboard-section">
          <h4 class="section-title">Low Stock Alerts</h4>
          <div id="low-stock-wrapper" class="dashboard-alert-list">
            <div class="loader-spinner" style="margin: var(--space-4) auto;"></div>
          </div>
        </div>

        <!-- Expiring Soon Alerts -->
        <div class="dashboard-section" style="margin-bottom: var(--space-8);">
          <h4 class="section-title">Expiring Soon</h4>
          <div id="expiring-wrapper" class="dashboard-alert-list">
            <div class="loader-spinner" style="margin: var(--space-4) auto;"></div>
          </div>
        </div>
      </div>

      ${renderBottomNav('#/dashboard')}
    </div>
  `;

  const metricsWrapper = document.getElementById('metrics-wrapper');
  const lowStockWrapper = document.getElementById('low-stock-wrapper');
  const expiringWrapper = document.getElementById('expiring-wrapper');
  const canvas = document.getElementById('sales-canvas-chart');

  // 2. Fetch all analytics in parallel
  try {
    const [dashboardData, profitLossData] = await Promise.all([
      getDashboard(),
      getProfitLoss()
    ]);

    // 3. Render Metric Cards
    renderMetrics(metricsWrapper, dashboardData.counts, profitLossData);

    // 4. Render Alert lists
    renderLowStock(lowStockWrapper, dashboardData.lowStock);
    renderExpiring(expiringWrapper, dashboardData.expiring);

    // 5. Draw Sales Chart
    drawSalesChart(canvas, dashboardData.sales);

  } catch (err) {
    console.error('Failed to load dashboard statistics:', err);
    showToast(err.message || 'Error fetching analytics dashboard', 'error');
    metricsWrapper.innerHTML = `<div style="grid-column: span 2; text-align: center; color: var(--color-text-muted);">Failed to load metrics.</div>`;
    lowStockWrapper.innerHTML = `<div>Failed to load details.</div>`;
    expiringWrapper.innerHTML = `<div>Failed to load details.</div>`;
  }
}

function renderMetrics(targetEl, counts, pl) {
  targetEl.innerHTML = `
    <div class="metric-card">
      <span class="metric-label">Active Products</span>
      <span class="metric-value">${counts.activeProducts}</span>
    </div>
    <div class="metric-card" onclick="window.location.hash='#/products'" style="cursor: pointer;">
      <span class="metric-label">Low Stock Items</span>
      <span class="metric-value" style="color: ${counts.lowStock > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)'}">
        ${counts.lowStock}
      </span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Expiring Soon</span>
      <span class="metric-value" style="color: ${counts.expiringSoon > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)'}">
        ${counts.expiringSoon}
      </span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Expired Items</span>
      <span class="metric-value" style="color: ${counts.expired > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)'}">
        ${counts.expired}
      </span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Net Sales Profit</span>
      <span class="metric-value metric-value--profit">$${pl.profit.toFixed(2)}</span>
      <span style="font-size: 10px; color: var(--color-text-muted); font-weight: 500; margin-top: 2px;">
        Margin: ${pl.marginPercent}% | Revenue: $${pl.revenue.toFixed(2)}
      </span>
    </div>
  `;
}

function renderLowStock(targetEl, list) {
  if (!list.length) {
    targetEl.innerHTML = `
      <div class="alert-row" style="color: var(--color-text-muted); justify-content: center; font-size: var(--text-sm);">
        All product stock levels are stable ✓
      </div>
    `;
    return;
  }

  targetEl.innerHTML = list.map(item => `
    <div class="alert-row" onclick="window.location.hash='#/products/${item.productId}/edit'" style="cursor: pointer;">
      <div class="alert-row__details">
        <div class="alert-row__name">${escapeHTML(item.name)}</div>
        <div class="alert-row__detail">SKU: ${escapeHTML(item.sku)} | threshold: ${item.threshold}</div>
      </div>
      <span class="alert-row__badge alert-row__badge--orange">${item.stock} in stock</span>
    </div>
  `).join('');
}

function renderExpiring(targetEl, list) {
  if (!list.length) {
    targetEl.innerHTML = `
      <div class="alert-row" style="color: var(--color-text-muted); justify-content: center; font-size: var(--text-sm);">
        No products expiring soon ✓
      </div>
    `;
    return;
  }

  targetEl.innerHTML = list.map(item => {
    const expDate = new Date(item.expiryDate);
    const dateStr = expDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const isExpired = expDate < new Date();
    
    return `
      <div class="alert-row" onclick="window.location.hash='#/products/${item.id}/edit'" style="cursor: pointer;">
        <div class="alert-row__details">
          <div class="alert-row__name">${escapeHTML(item.name)}</div>
          <div class="alert-row__detail">SKU: ${escapeHTML(item.sku)}</div>
        </div>
        <span class="alert-row__badge ${isExpired ? 'alert-row__badge--red' : 'alert-row__badge--orange'}">
          ${isExpired ? 'Expired' : `Exp: ${dateStr}`}
        </span>
      </div>
    `;
  }).join('');
}

/* Custom HTML5 Canvas Chart Painting */
function drawSalesChart(canvas, salesData) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Set canvas size matching css container size, taking DPR into account for sharpness
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Chart layout config margins
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Fill Background
  ctx.clearRect(0, 0, width, height);

  // If no sales data is available, draw empty state info
  const hasSales = salesData && salesData.length > 0 && salesData.some(d => d.revenue > 0);
  if (!hasSales) {
    ctx.fillStyle = '#94a3b8'; // --color-text-muted
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No sales records in past 7 days', width / 2, height / 2);
    return;
  }

  // Find max revenue for scaling heights
  const maxRevenue = Math.max(...salesData.map(d => d.revenue), 10);
  
  // Calculate a clean rounded upper limit for Y axis (e.g. if max is 82, round up to 100)
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxRevenue)));
  const roundedMax = Math.ceil(maxRevenue / (magnitude / 2)) * (magnitude / 2);

  // 1. Draw horizontal grid lines and Y-axis labels
  const gridLines = 4;
  ctx.strokeStyle = '#334155'; // --color-border
  ctx.lineWidth = 0.5;
  ctx.fillStyle = '#94a3b8'; // --color-text-muted
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= gridLines; i++) {
    const yVal = (roundedMax / gridLines) * i;
    const yPos = paddingTop + chartHeight - (chartHeight * (i / gridLines));
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yPos);
    ctx.lineTo(width - paddingRight, yPos);
    ctx.stroke();

    // Text Label
    ctx.fillText(`$${yVal.toFixed(0)}`, paddingLeft - 8, yPos);
  }

  // 2. Draw bars & X-axis labels
  const barCount = salesData.length;
  const gapRatio = 0.4; // space ratio between bars
  const totalBarWidth = chartWidth / barCount;
  const barWidth = totalBarWidth * (1 - gapRatio);
  const barGap = totalBarWidth * gapRatio;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  salesData.forEach((data, index) => {
    const barHeight = (data.revenue / roundedMax) * chartHeight;
    const xPos = paddingLeft + (index * totalBarWidth) + (barGap / 2);
    const yPos = paddingTop + chartHeight - barHeight;

    // Draw Bar
    const gradient = ctx.createLinearGradient(xPos, yPos, xPos, paddingTop + chartHeight);
    gradient.addColorStop(0, '#6366f1'); // --color-accent
    gradient.addColorStop(1, '#4f46e5'); // --color-accent-hover

    ctx.fillStyle = gradient;
    
    // Draw rounded rect bar path
    drawRoundedRect(ctx, xPos, yPos, barWidth, barHeight, 4);

    // Draw label count on top of bar if revenue > 0
    if (data.revenue > 0) {
      ctx.fillStyle = '#f1f5f9'; // --color-text-primary
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`$${data.revenue.toFixed(0)}`, xPos + (barWidth / 2), yPos - 12);
    }

    // Draw X-axis label (date formatting)
    const dateObj = new Date(data.day);
    const dateLabel = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    ctx.fillStyle = '#94a3b8'; // --color-text-muted
    ctx.font = '9px sans-serif';
    ctx.fillText(dateLabel, xPos + (barWidth / 2), paddingTop + chartHeight + 8);
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (height <= 0) return;
  
  // Make sure radius isn't larger than half of dimensions
  const realRadius = Math.min(radius, width / 2, height / 2);
  
  ctx.beginPath();
  ctx.moveTo(x + realRadius, y);
  ctx.lineTo(x + width - realRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + realRadius);
  ctx.lineTo(x + width, y + height); // bottom flat line
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + realRadius);
  ctx.quadraticCurveTo(x, y, x + realRadius, y);
  ctx.closePath();
  ctx.fill();
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
