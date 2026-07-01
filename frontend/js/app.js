/* ==========================================================================
   js/app.js
   ========================================================================== */

import { restoreSession } from './store/auth.store.js';
import { navigate } from './router/router.js';
import { initSyncManager } from './sync/sync-manager.js';

// Initialize global features when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  // 1. Attempt to restore any persistent user sessions
  restoreSession();

  // 2. Register Service Worker for PWA offline capabilities
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  }

  // 3. Initialize sync manager for offline sales replay
  initSyncManager().catch(console.error);

  // 4. Add dynamic routing listeners
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });

  // 5. Trigger initial navigation
  navigate(window.location.hash || '#/dashboard');
});
