/* ==========================================================================
   js/router/router.js
   ========================================================================== */

import { isLoggedIn, clearAuth } from '../store/auth.store.js';
import { renderBottomNav } from '../components/bottom-nav.js';

// Route configurations using regex pattern matching
const routes = [
  {
    pattern: /^#\/login$/,
    loader: () => import('../pages/login.page.js')
  },
  {
    pattern: /^#\/products$/,
    loader: () => import('../pages/products.page.js')
  },
  {
    pattern: /^#\/products\/new$/,
    loader: () => import('../pages/product-form.page.js')
  },
  {
    pattern: /^#\/products\/(\d+)\/edit$/,
    loader: () => import('../pages/product-form.page.js'),
    parseParams: (match) => ({ id: Number(match[1]) })
  },
  {
    pattern: /^#\/record$/,
    loader: () => import('../pages/record.page.js')
  },
  {
    pattern: /^#\/transactions$/,
    loader: () => import('../pages/transactions.page.js')
  },
  {
    pattern: /^#\/scanner$/,
    loader: () => import('../pages/scanner.page.js')
  },
  {
    pattern: /^#\/dashboard$/,
    loader: () => import('../pages/dashboard.page.js')
  },
  {
    pattern: /^#\/settings$/,
    loader: () => import('../pages/settings.page.js')
  }
];

export async function navigate(hash) {
  const activeHash = hash || '#/dashboard';

  // Parse path and query parameters (e.g., #/record?barcode=123)
  const [routePath, queryString] = activeHash.split('?');
  const queryParams = Object.fromEntries(new URLSearchParams(queryString || ''));

  // Find matching route
  let matchedRoute = null;
  let parsedParams = {};

  for (const route of routes) {
    const match = routePath.match(route.pattern);
    if (match) {
      matchedRoute = route;
      if (route.parseParams) {
        parsedParams = route.parseParams(match);
      }
      break;
    }
  }

  // Redirect to dashboard if route is not recognized
  if (!matchedRoute) {
    window.location.hash = '#/dashboard';
    return;
  }

  // Auth guard redirecting to login
  if (!isLoggedIn() && matchedRoute.pattern.source !== '^#\\/login$') {
    window.location.hash = '#/login';
    return;
  }

  // Prevent visiting login page if already authenticated
  if (isLoggedIn() && matchedRoute.pattern.source === '^#\\/login$') {
    window.location.hash = '#/dashboard';
    return;
  }

  const container = document.getElementById('app');
  container.innerHTML = ''; // Clear previous view

  try {
    const page = await matchedRoute.loader();
    await page.render(container, parsedParams, queryParams);
  } catch (err) {
    console.error('Failed to load page route:', err);
    container.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <h2 style="color: var(--color-danger)">Page Load Failed</h2>
        <p style="color: var(--color-text-muted); margin: 8px 0 16px;">${err.message}</p>
        <a href="#/dashboard" class="btn btn--primary" style="display:inline-flex; width:auto;">Return to Home</a>
      </div>
    `;
  }
}
