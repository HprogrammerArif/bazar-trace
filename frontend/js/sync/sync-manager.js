/* ==========================================================================
   js/sync/sync-manager.js
   ========================================================================== */

import { getAll, deleteRecord, put } from '../db/idb.js';
import { recordTransaction } from '../api/transactions.api.js';
import { showToast } from '../components/toast.js';

let isSyncing = false;

export async function initSyncManager() {
  // Listen for online reconnect event
  window.addEventListener('online', () => {
    showToast('Network restored. Syncing offline data...', 'success');
    drainQueue().catch(console.error);
  });

  window.addEventListener('offline', () => {
    showToast('Connection lost. Operating in offline mode.', 'warning');
  });

  // Attempt an initial drain on startup if already online
  if (navigator.onLine) {
    drainQueue().catch(console.error);
  }
}

export async function drainQueue() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const queue = await getAll('sync_queue');
    if (!queue.length) {
      isSyncing = false;
      return;
    }

    // Sort by createdAt ascending (FIFO)
    queue.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const item of queue) {
      // If we went offline again, abort the drain
      if (!navigator.onLine) break;

      try {
        const result = await recordTransaction(item.body);
        
        // 1. Delete from sync queue
        await deleteRecord('sync_queue', item.clientTxnId);

        // 2. Remove _pending flag from transactions store
        if (result) {
          await put('transactions', {
            ...result,
            _pending: undefined
          });
        }
        
      } catch (err) {
        // If it's a conflict ORA-00001 (already posted), remove from queue safely
        if (err.status === 409 || err.code === 'CONFLICT') {
          await deleteRecord('sync_queue', item.clientTxnId);
          continue;
        }

        // If it's a validation error (400), don't lock the queue forever, discard it and show error
        if (err.status === 400 || err.code === 'BAD_REQUEST') {
          showToast(`Offline txn failed validation: ${err.message}`, 'error');
          await deleteRecord('sync_queue', item.clientTxnId);
          continue;
        }

        // For temporary 500 or network timeouts, abort and keep order
        console.error('Temporary sync fail, aborting queue drain:', err);
        break;
      }
    }

    showToast('Offline synchronization complete!', 'success');
  } catch (err) {
    console.error('Sync queue drain failed:', err);
  } finally {
    isSyncing = false;
  }
}
