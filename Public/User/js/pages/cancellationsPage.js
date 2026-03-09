// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { openModal, closeAllModals } from "../core.js";
import { openOrderDetailsModal } from "./returnsPage.js";


// ==========================================
// PAGE: CANCELLATIONS
// ==========================================
export function initCancellationsPage() {
    const container = document.getElementById('cancellations-list');
    if (!container) return;

    const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');

    if (cancellations.length === 0) {
        container.innerHTML = `
      <div class="empty-cart-state" style="padding: 2rem 0;">
        <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-x-circle"></i></div>
        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No cancellations yet</h3>
        <p style="margin-bottom: 1.5rem;">You have no cancelled orders.</p>
      </div>`;
        return;
    }

    container.innerHTML = cancellations.map((order, index) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">Order ${order.id}</span>
          <span class="order-date">Cancelled on ${order.date}</span>
        </div>
        <span class="order-status ${order.statusClass}">${order.status}</span>
      </div>
      <div class="order-items-list">
        ${order.items.map(item => `
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
          <span class="order-total-label">Total Amount:</span>
          <span class="order-total-value">$${Number(order.total).toFixed(2)}</span>
        </div>
        <button class="btn btn-outline view-details-btn" data-index="${index}">View Details</button>
      </div>
    </div>
  `).join('');

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-details-btn');
        if (btn) {
            openOrderDetailsModal(cancellations[btn.dataset.index]);
        }
    });
}