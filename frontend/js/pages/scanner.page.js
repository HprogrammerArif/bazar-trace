/* ==========================================================================
   js/pages/scanner.page.js
   ========================================================================== */

import { showToast } from '../components/toast.js';

let streamRef = null;
let animationFrameId = null;

export async function render(container, params = {}, queryParams = {}) {
  const returnTo = queryParams.returnTo || 'record'; // where to send the barcode (record or product-form)
  
  // Verify support for native BarcodeDetector API
  const isSupported = 'BarcodeDetector' in window;

  if (!isSupported) {
    renderFallback(container, returnTo);
    return;
  }

  // Render camera viewport layout
  container.innerHTML = `
    <div class="scanner-container">
      <!-- Floating back overlay button -->
      <button id="scanner-close" class="scanner-close-btn" title="Cancel">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <video id="scanner-video" class="scanner-video" autoplay playsinline></video>

      <!-- Viewfinder Overlay -->
      <div class="scanner-overlay">
        <div class="scanner-viewfinder">
          <div class="scanner-laser"></div>
        </div>
        <div class="scanner-instructions">Align barcode inside the target viewfinder box</div>
      </div>
    </div>
  `;

  // Bind close action
  document.getElementById('scanner-close').addEventListener('click', () => {
    stopScanner();
    window.location.hash = `#/${returnTo}`;
  });

  const video = document.getElementById('scanner-video');
  
  // Start scanning loop
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    
    streamRef = stream;
    video.srcObject = stream;
    
    // Play video stream
    await video.play();

    // Start frame processing loop
    startDetection(video, returnTo);

  } catch (err) {
    console.error('Camera stream access failed:', err);
    showToast('Could not access device camera feed', 'error');
    renderFallback(container, returnTo);
  }
}

function startDetection(video, returnTo) {
  // Initialize native detector
  const detector = new window.BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a']
  });

  async function checkFrame() {
    if (!streamRef || video.paused || video.ended) return;

    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const barcodeValue = barcodes[0].rawValue;
        console.log('Barcode detected successfully:', barcodeValue);

        // Play alert audio beep dynamically using Web Audio API
        playBeepSound();

        // Redirect back with parameters
        stopScanner();
        window.location.hash = `#/${returnTo}?barcode=${encodeURIComponent(barcodeValue)}`;
        return;
      }
    } catch (err) {
      // Ignore intermediate frame parse failures
    }

    // Process next frame
    animationFrameId = requestAnimationFrame(checkFrame);
  }

  // Start loop
  animationFrameId = requestAnimationFrame(checkFrame);
}

function stopScanner() {
  if (streamRef) {
    streamRef.getTracks().forEach(track => track.stop());
    streamRef = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function renderFallback(container, returnTo) {
  // Gracefully handles unsupported environments (e.g. desktop browsers, HTTP dev builds)
  container.innerHTML = `
    <div class="scanner-container" style="background-color: var(--color-bg-primary);">
      <div class="scanner-fallback-panel">
        <h2 style="font-size: var(--text-lg); margin-bottom: var(--space-2); color: var(--color-warning);">
          Scanner Camera Offline
        </h2>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm); max-width: 280px; margin-bottom: var(--space-6);">
          Native Barcode Scanning is not supported on this browser (requires HTTPS/Android Chrome). Please type the barcode value manually:
        </p>

        <form id="fallback-scanner-form" style="width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: var(--space-3);">
          <div class="form-group" style="text-align: left;">
            <label for="fallback-barcode" class="form-label">Barcode Value</label>
            <input type="text" id="fallback-barcode" class="form-input" placeholder="Type barcode code..." required autofocus />
          </div>
          
          <button type="submit" class="btn btn--primary">Use Manual Value</button>
          <a href="#/${returnTo}" class="btn btn--secondary" style="margin-top: var(--space-1);">Cancel</a>
        </form>
      </div>
    </div>
  `;

  document.getElementById('fallback-scanner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('fallback-barcode').value.trim();
    window.location.hash = `#/${returnTo}?barcode=${encodeURIComponent(val)}`;
  });
}

function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = 1000; // 1000 Hz beep
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); // Beep volume
    
    // Play for 150 ms
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    // Fail silently if AudioContext is blocked by browser policies
  }
}
