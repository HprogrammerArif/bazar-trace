/* ==========================================================================
   js/pages/settings.page.js
   ========================================================================== */

import { changePassword, register } from '../api/auth.api.js';
import { getUsers, updateUser } from '../api/users.api.js';
import { getUser, clearAuth } from '../store/auth.store.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';

let allUsers = [];

export async function render(container) {
  const currentUser = getUser();
  if (!currentUser) {
    window.location.hash = '#/login';
    return;
  }

  const isAdmin = currentUser.role === 'ADMIN';

  // 1. Initial page markup skeleton
  container.innerHTML = `
    <div class="layout-wrapper">
      <div class="content-area">
        <header style="margin-bottom: var(--space-4);">
          <h1 style="font-size: var(--text-2xl); font-weight: 700;">Settings</h1>
        </header>

        <!-- User Profile Card Details -->
        <div class="profile-card">
          <div class="profile-avatar">${currentUser.fullName.charAt(0).toUpperCase()}</div>
          <div class="profile-info">
            <span class="profile-name">${escapeHTML(currentUser.fullName)}</span>
            <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHTML(currentUser.email)}</span>
            <span class="profile-role-badge">${currentUser.role}</span>
          </div>
        </div>

        <!-- Change Password form -->
        <div class="dashboard-section">
          <h3 class="section-title">Security Settings</h3>
          <form id="pwd-change-form" style="background-color: var(--color-bg-surface); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-3);">
            <div class="form-group">
              <label for="old-pwd" class="form-label">Current Password</label>
              <input type="password" id="old-pwd" class="form-input" required placeholder="••••••••" autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label for="new-pwd" class="form-label">New Password</label>
              <input type="password" id="new-pwd" class="form-input" required placeholder="Min 6 characters" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label for="confirm-pwd" class="form-label">Confirm New Password</label>
              <input type="password" id="confirm-pwd" class="form-input" required placeholder="Re-type new password" autocomplete="new-password" />
            </div>
            <button type="submit" class="btn btn--primary" style="margin-top: var(--space-2);">Update Password</button>
          </form>
        </div>

        <!-- User Directory List (ADMIN only) -->
        ${isAdmin ? `
          <div class="dashboard-section" style="margin-bottom: var(--space-8);">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
              <h3 class="section-title" style="margin-bottom: 0;">Staff Directory</h3>
              <button id="btn-add-staff" class="btn btn--primary" style="width: auto; padding: 4px 12px; font-size: var(--text-xs); font-weight: bold;">
                + Add Staff
              </button>
            </header>
            
            <div id="users-list-wrapper">
              <div class="loader-spinner" style="margin: var(--space-6) auto;"></div>
            </div>
          </div>
        ` : ''}

        <!-- Logout Action Button -->
        <div style="margin-top: var(--space-6); margin-bottom: var(--space-4);">
          <button id="btn-logout" class="btn btn--secondary" style="color: var(--color-danger); border-color: var(--color-danger);">
            Log Out Account
          </button>
        </div>
      </div>

      ${renderBottomNav('#/settings')}
    </div>

    <!-- Register Staff Modal Backdrop Overlay (ADMIN only) -->
    ${isAdmin ? `
      <div id="register-modal" class="modal-overlay" style="display: none;">
        <div class="modal-card">
          <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-4);">Register New Staff</h2>
          <form id="register-form" style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div class="form-group">
              <label for="reg-name" class="form-label">Full Name</label>
              <input type="text" id="reg-name" class="form-input" required placeholder="e.g. Arif Hossain" />
            </div>
            <div class="form-group">
              <label for="reg-email" class="form-label">Email Address</label>
              <input type="email" id="reg-email" class="form-input" required placeholder="e.g. arif@bazar.com" />
            </div>
            <div class="form-group">
              <label for="reg-pwd" class="form-label">Initial Password</label>
              <input type="password" id="reg-pwd" class="form-input" required minlength="6" placeholder="Min 6 characters" />
            </div>
            <div class="form-group">
              <label for="reg-role" class="form-label">System Role</label>
              <select id="reg-role" class="form-input" required>
                <option value="STAFF">STAFF (Cashier / Inventory Keeper)</option>
                <option value="ADMIN">ADMIN (Full Access Manager)</option>
              </select>
            </div>
            
            <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
              <button type="submit" class="btn btn--primary">Register Account</button>
              <button type="button" id="btn-cancel-register" class="btn btn--secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    ` : ''}
  `;

  // 2. Bind change password actions
  document.getElementById('pwd-change-form').addEventListener('submit', handlePwdChange);

  // Bind logout action
  document.getElementById('btn-logout').addEventListener('click', () => {
    clearAuth();
    showToast('Logged out successfully', 'success');
    window.location.hash = '#/login';
  });

  // 3. Bind admin features (loading users directory, toggling status, modal popups)
  if (isAdmin) {
    const listWrapper = document.getElementById('users-list-wrapper');
    const modal = document.getElementById('register-modal');
    const addStaffBtn = document.getElementById('btn-add-staff');
    const cancelModalBtn = document.getElementById('btn-cancel-register');
    const regForm = document.getElementById('register-form');

    // Load users list
    loadUsersDirectory(listWrapper, currentUser);

    // Bind modal triggers
    addStaffBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      document.getElementById('reg-name').focus();
    });

    cancelModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      regForm.reset();
    });

    // Handle new staff registration submit
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-pwd').value;
      const role = document.getElementById('reg-role').value;

      try {
        showLoader();
        await register({ fullName, email, password, role });
        showToast('New staff registered successfully', 'success');
        modal.style.display = 'none';
        regForm.reset();
        
        // Refresh users list
        await loadUsersDirectory(listWrapper, currentUser);
      } catch (err) {
        console.error('Registration failed:', err);
        showToast(err.message || 'Registration failed', 'error');
      } finally {
        hideLoader();
      }
    });
  }
}

async function handlePwdChange(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('old-pwd').value;
  const newPassword = document.getElementById('new-pwd').value;
  const confirmPassword = document.getElementById('confirm-pwd').value;

  if (newPassword.length < 6) {
    showToast('New password must be at least 6 characters long', 'warning');
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'warning');
    return;
  }

  try {
    showLoader();
    await changePassword({ oldPassword, newPassword });
    showToast('Password updated. Please log in again.', 'success');
    
    // Clear session and force redirect to login
    clearAuth();
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 1500);

  } catch (err) {
    console.error('Failed to change password:', err);
    showToast(err.message || 'Current password incorrect', 'error');
  } finally {
    hideLoader();
  }
}

async function loadUsersDirectory(wrapperEl, currentUser) {
  try {
    allUsers = await getUsers();
    renderUsersList(wrapperEl, allUsers, currentUser);
  } catch (err) {
    console.error('Failed to load user directories:', err);
    wrapperEl.innerHTML = `<div style="color: var(--color-text-muted); font-size:var(--text-sm)">Error loading staff list</div>`;
  }
}

function renderUsersList(targetEl, list, currentUser) {
  if (!list.length) {
    targetEl.innerHTML = `<div style="color: var(--color-text-muted); font-size:var(--text-sm)">No users found</div>`;
    return;
  }

  targetEl.innerHTML = list.map(u => {
    const isSelf = u.id === currentUser.id;
    return `
      <div class="user-row">
        <div>
          <strong style="color: var(--color-text-primary); font-size:var(--text-base);">${escapeHTML(u.fullName)}</strong>
          <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHTML(u.email)} | role: <strong style="font-size:10px;">${u.role}</strong></div>
        </div>
        
        <!-- Toggle active status switch (disabled for self to prevent lockouts) -->
        <label class="switch">
          <input 
            type="checkbox" 
            class="toggle-user-status" 
            data-id="${u.id}" 
            ${u.isActive ? 'checked' : ''} 
            ${isSelf ? 'disabled' : ''}
          />
          <span class="slider"></span>
        </label>
      </div>
    `;
  }).join('');

  // Bind checkbox toggle triggers
  const checkboxes = targetEl.querySelectorAll('.toggle-user-status');
  checkboxes.forEach(box => {
    box.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isChecked = e.target.checked;
      
      try {
        showLoader();
        await updateUser(Number(id), { isActive: isChecked });
        showToast('User status updated', 'success');
      } catch (err) {
        console.error('Failed to toggle active state:', err);
        showToast(err.message || 'Failed to update user status', 'error');
        // Revert UI switch state on error
        e.target.checked = !isChecked;
      } finally {
        hideLoader();
      }
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
