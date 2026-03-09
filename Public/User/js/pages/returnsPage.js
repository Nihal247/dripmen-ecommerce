// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
    showToast,
    openModal,
    closeAllModals
} from "../core.js";


// ==========================================
// HELPER: ORDER DETAILS MODAL
// (shared between returns and cancellations)
// ==========================================
export function openOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    if (!modal || !order) return;

    const idEl = document.getElementById('modal-order-id');
    const dateEl = document.getElementById('modal-order-date');
    const totalEl = document.getElementById('modal-order-total');
    const statusEl = document.getElementById('modal-order-status');

    if (idEl) idEl.textContent = order.id;
    if (dateEl) dateEl.textContent = order.date;
    if (totalEl) totalEl.textContent = `$${Number(order.total).toFixed(2)}`;

    if (statusEl) {
        statusEl.className = `order-status ${order.statusClass}`;
        statusEl.textContent = order.status;
    }

    const itemsContainer = document.getElementById('modal-order-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = order.items.map(item => `
      <div class="modal-product-inline" style="margin-bottom: 0.5rem;">
        <img src="${item.image}" class="modal-product-img-small">
        <div class="modal-product-details-small">
          <h4 class="modal-product-name">${item.name}</h4>
          <p class="modal-product-price">Qty: ${item.quantity} | Size: ${item.size}</p>
        </div>
      </div>
    `).join('');
    }

    // Remove old dynamic action buttons before adding new ones
    const oldActions = modal.querySelector('.modal-actions-dynamic');
    if (oldActions) oldActions.remove();

    openModal(modal);
}


// ==========================================
// PAGE: RETURNS
// ==========================================
export function initReturnsPage() {
    const container = document.getElementById('returns-list');
    if (!container) return;

    const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');

    if (returns.length === 0) {
        container.innerHTML = `
      <div class="empty-cart-state" style="padding: 2rem 0;">
        <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-arrow-u-up-left"></i></div>
        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No returns yet</h3>
        <p style="margin-bottom: 1.5rem;">You haven't returned any orders yet.</p>
      </div>`;
        return;
    }

    container.innerHTML = returns.map((ret, index) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">Return ${ret.id}</span>
          <span class="order-date">${ret.date}</span>
        </div>
        <span class="order-status ${ret.statusClass}">${ret.status}</span>
      </div>
      <div class="order-items-list">
        ${ret.items.map(item => `
          <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="order-item-img">
            <div class="order-item-info">
              <span class="order-item-name">${item.name}</span>
              <span class="order-item-meta">Qty: ${item.quantity}, Size: ${item.size}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="order-footer">
        <div>
          <span class="order-total-label">Refund Amount:</span>
          <span class="order-total-value">$${Number(ret.total).toFixed(2)}</span>
        </div>
        <button class="btn btn-outline view-details-btn" data-index="${index}">View Details</button>
      </div>
    </div>
  `).join('');

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-details-btn');
        if (btn) {
            openOrderDetailsModal(returns[btn.dataset.index]);
        }
    });
}