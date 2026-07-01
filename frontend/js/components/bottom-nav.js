/* ==========================================================================
   js/components/bottom-nav.js
   ========================================================================== */

export function renderBottomNav(activeHash) {
  const items = [
    {
      hash: '#/dashboard',
      label: 'Dashboard',
      icon: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>'
    },
    {
      hash: '#/products',
      label: 'Products',
      icon: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>'
    },
    {
      hash: '#/record',
      label: 'Record',
      icon: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>'
    },
    {
      hash: '#/transactions',
      label: 'Logs',
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>'
    },
    {
      hash: '#/settings',
      label: 'Settings',
      icon: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>'
    }
  ];

  return `
    <nav class="bottom-nav">
      <div class="bottom-nav__container">
        ${items.map(item => `
          <a href="${item.hash}" class="bottom-nav__item ${activeHash === item.hash ? 'bottom-nav__item--active' : ''}">
            <svg class="bottom-nav__icon" viewBox="0 0 24 24">${item.icon}</svg>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </div>
    </nav>
  `;
}
