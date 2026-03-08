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
// ==========================================
function openOrderDetailsModal(order) {
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

  // Remove old dynamic actions
  const oldActions = modal.querySelector('.modal-actions-dynamic');
  if (oldActions) oldActions.remove();

  let actionBtnHtml = '';
  if (order.status === 'Processing') {
    actionBtnHtml = `<button class="btn btn-outline-danger full-width" id="modal-cancel-btn" style="margin-top: 1rem;">Cancel Order</button>`;
  } else if (order.status === 'Delivered') {
    actionBtnHtml = `<button class="btn btn-outline full-width" id="modal-return-btn" style="margin-top: 1rem;">Return Order</button>`;
  }

  if (actionBtnHtml) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'modal-actions-dynamic';
    actionsDiv.innerHTML = actionBtnHtml;

    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) modalBody.appendChild(actionsDiv);

    const cancelBtn = actionsDiv.querySelector('#modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel this order?')) {
          processOrderAction(order.id, 'cancel');
        }
      });
    }

    const returnBtn = actionsDiv.querySelector('#modal-return-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        processOrderAction(order.id, 'return');
      });
    }
  }

  openModal(modal);
}


// ==========================================
// HELPER: PROCESS ORDER ACTION
// ==========================================
function processOrderAction(orderId, action) {
  const orders = JSON.parse(localStorage.getItem('dripmen_orders') || '[]');
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return;

  const [order] = orders.splice(index, 1);

  if (action === 'cancel') {
    const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');
    order.status = "Cancelled";
    order.statusClass = "status-cancelled";
    cancellations.unshift(order);
    localStorage.setItem('dripmen_cancellations', JSON.stringify(cancellations));
    showToast("Order cancelled successfully");
  } else if (action === 'return') {
    const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');
    order.status = "Refunded";
    order.statusClass = "status-refunded";
    returns.unshift(order);
    localStorage.setItem('dripmen_returns', JSON.stringify(returns));
    showToast("Return processed successfully");
  }

  localStorage.setItem('dripmen_orders', JSON.stringify(orders));
  window.dispatchEvent(new Event('orders-updated'));
  closeAllModals();
}


// ==========================================
// PAGE: ORDERS
// ==========================================
export function initOrdersPage() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  function getOrdersWithDefault() {
    let orders = JSON.parse(localStorage.getItem('dripmen_orders'));
    if (!orders) {
      orders = [{
        id: "#923742",
        date: "Nov 12, 2023",
        status: "Delivered",
        statusClass: "status-delivered",
        total: 145.00,
        items: [{ name: "Black Tshirt", image: "images/black-tshirt.png", quantity: 1, size: "L", price: 145.00 }]
      }, {
        id: "#923730",
        date: "Oct 24, 2023",
        status: "Processing",
        statusClass: "status-processing",
        total: 260.00,
        items: [
          { name: "White Hoodie", image: "images/white-hoodie.png", quantity: 1, size: "M", price: 130.00 },
          { name: "Varsity Jacket", image: "images/varsity-jacket.png", quantity: 1, size: "L", price: 130.00 }
        ]
      }];
      localStorage.setItem('dripmen_orders', JSON.stringify(orders));
    }
    return orders;
  }

  function renderOrders() {
    const orders = getOrdersWithDefault();

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-state" style="padding: 2rem 0;">
          <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-package"></i></div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No orders yet</h3>
          <p style="margin-bottom: 1.5rem;">You have no active orders.</p>
          <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order, index) => {
      let actionButtons = '';
      if (order.status === 'Processing') {
        actionButtons = `<button class="btn btn-outline-danger cancel-order-btn" data-index="${index}">Cancel Order</button>`;
      } else if (order.status === 'Delivered') {
        actionButtons = `<button class="btn btn-outline return-order-btn" data-index="${index}">Return Order</button>`;
      }

      return `
        <div class="order-card">
          <div class="order-header">
            <div>
              <span class="order-id">Order ${order.id}</span>
              <span class="order-date">${order.date}</span>
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
              <span class="order-total-label">Total Order:</span>
              <span class="order-total-value">$${Number(order.total).toFixed(2)}</span>
            </div>
            <div class="order-actions-group" style="display: flex; gap: 1rem;">
              ${actionButtons}
              <button class="btn btn-outline download-invoice-btn" data-id="${order.id}">View Details</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderOrders();
  window.addEventListener('orders-updated', renderOrders);

  container.addEventListener('click', e => {
    const orders = getOrdersWithDefault();
    const target = e.target;

    if (target.classList.contains('cancel-order-btn')) {
      const index = target.dataset.index;
      if (confirm('Are you sure you want to cancel this order?')) {
        const [cancelledOrder] = orders.splice(index, 1);
        const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');
        cancelledOrder.status = "Cancelled";
        cancelledOrder.statusClass = "status-cancelled";
        cancellations.unshift(cancelledOrder);
        localStorage.setItem('dripmen_orders', JSON.stringify(orders));
        localStorage.setItem('dripmen_cancellations', JSON.stringify(cancellations));
        showToast("Order has been cancelled.");
        renderOrders();
      }
      return;
    }

    if (target.classList.contains('return-order-btn')) {
      const index = target.dataset.index;
      const [returnedOrder] = orders.splice(index, 1);
      const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');
      returnedOrder.status = "Refunded";
      returnedOrder.statusClass = "status-refunded";
      returns.unshift(returnedOrder);
      localStorage.setItem('dripmen_orders', JSON.stringify(orders));
      localStorage.setItem('dripmen_returns', JSON.stringify(returns));
      showToast("Your return has been processed.");
      renderOrders();
      return;
    }

    if (target.classList.contains('view-details-btn')) {
      const index = target.dataset.index;
      openOrderDetailsModal(orders[index]);
      return;
    }

    if (target.classList.contains('download-invoice-btn')) {
      const orderId = target.dataset.id.replace('#', '');
      window.location.href = `order-details.html?id=${orderId}`;
    }
  });
}