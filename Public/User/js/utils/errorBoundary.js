/**
 * Vanilla JS Global Error Boundary
 * Catches unhandled exceptions and promise rejections to prevent silent UI failures.
 */

function createErrorFallbackUI(message) {
    // Prevent multiple error UIs
    if (document.getElementById('global-error-boundary')) return;

    const overlay = document.createElement('div');
    overlay.id = 'global-error-boundary';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
        font-family: 'Inter', sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    `;

    modal.innerHTML = `
        <div style="color: #FF4D4D; font-size: 48px; margin-bottom: 20px;">
            <i class="ph-fill ph-warning-circle"></i>
        </div>
        <h2 style="margin: 0 0 10px; font-size: 24px; color: #111;">Something went wrong</h2>
        <p style="margin: 0 0 24px; color: #666; font-size: 15px; line-height: 1.5;">
            An unexpected error occurred while processing your request. Our team has been notified.
        </p>
        <div style="font-size: 12px; color: #999; margin-bottom: 24px; background: #f5f5f5; padding: 10px; border-radius: 6px; text-align: left; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">
            ${message || 'Unknown error'}
        </div>
        <button id="error-boundary-reload" style="
            background: #111; color: white; border: none; padding: 12px 24px; 
            border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        ">
            Reload Page
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('error-boundary-reload').addEventListener('click', () => {
        window.location.reload();
    });
}

// 1. Catch unhandled synchronous errors
window.addEventListener('error', function(event) {
    console.error("Caught via Error Boundary:", event.error);
    createErrorFallbackUI(event.message);
});

// 2. Catch unhandled promise rejections (e.g., failed API calls without try/catch)
window.addEventListener('unhandledrejection', function(event) {
    console.error("Caught via Unhandled Rejection Boundary:", event.reason);
    const message = event.reason?.message || event.reason || "Promise rejection";
    createErrorFallbackUI(message);
});
