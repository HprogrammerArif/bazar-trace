/* ==========================================================================
   js/components/loader.js
   ========================================================================== */

let activeLoader = null;

export function showLoader() {
  if (activeLoader) return;

  activeLoader = document.createElement('div');
  activeLoader.className = 'loader-overlay';
  activeLoader.innerHTML = `<div class="loader-spinner"></div>`;
  
  document.body.appendChild(activeLoader);
}

export function hideLoader() {
  if (!activeLoader) return;
  
  activeLoader.remove();
  activeLoader = null;
}
