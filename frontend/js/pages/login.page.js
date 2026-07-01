/* ==========================================================================
   js/pages/login.page.js
   ========================================================================== */

import { login } from '../api/auth.api.js';
import { setAuth } from '../store/auth.store.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';

export async function render(container) {
  // Render login markup
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Bazar-Trace</h1>
          <p class="auth-subtitle">Sign in to manage stock</p>
        </header>
        
        <form id="login-form" style="width: 100%;">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input 
              type="email" 
              id="email" 
              class="form-input" 
              placeholder="e.g. staff@bazar.com" 
              required 
              autocomplete="username"
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              class="form-input" 
              placeholder="••••••••" 
              required 
              autocomplete="current-password"
            />
          </div>
          
          <button type="submit" class="btn btn--primary" style="margin-top: var(--space-4)">
            Log In
          </button>
        </form>
      </div>
    </div>
  `;

  // Attach submit listeners
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Simple validation checks
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      showLoader();
      
      const { user, token } = await login({ email, password });
      
      // Store session
      setAuth(user, token);
      
      showToast(`Welcome back, ${user.fullName || 'User'}!`, 'success');
      
      // Navigate to dashboard SPA route
      window.location.hash = '#/dashboard';
    } catch (err) {
      console.error('Login request failed:', err);
      showToast(err.message || 'Incorrect email or password', 'error');
    } finally {
      hideLoader();
    }
  });
}
