// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  showToast,
  openModal,
  closeAllModals
} from "../core.js";

const API = "http://localhost:4000";

// ==========================================
// HELPER: FORMAT DATE
// ==========================================
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

// ==========================================
// HELPER: STATUS CLASS
// ==========================================
function getStatusClass(status) {
  const map = {
    processing: "status-processing",
    confirmed:  "status-confirmed",
    shipped:    "status-shipped",
    delivered:  "status-delivered",
    cancelled:  "status-cancelled"
  };
  return map[status?.toLowerCase()] || "status-processing";
}

// ==========================================
// HELPER: ORDER DETAILS MODAL
// ==========================================
function openOrderDetailsModal(order) {
  const modal = document.getElementById("order-details-modal");
  if (!modal || !order) return;

  const idEl     = document.getElementById("modal-order-id");
  const dateEl   = document.getElementById("modal-order-date");
  const totalEl  = document.getElementById("modal-order-total");
  const statusEl = document.getElementById("modal-order-status");

  const orderId = order._id || order.id || "";
  const status  = order.orderStatus || order.status || "processing";

  if (idEl)    idEl.textContent    = "#" + String(orderId).slice(-6).toUpperCase();
  if (dateEl)  dateEl.textContent  = formatDate(order.createdAt || order.date);
  if (totalEl) totalEl.textContent = `$${Number(order.total).toFixed(2)}`;

  if (statusEl) {
    statusEl.className   = `order-status ${getStatusClass(status)}`;
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  const itemsContainer = document.getElementById("modal-order-items");
  if (itemsContainer) {
    itemsContainer.innerHTML = (order.items || []).map(item => `
      <div class="modal-product-inline" style="margin-bottom:0.5rem;">
        <img src="${item.image || item.product?.images?.[0] || ""}"
             class="modal-product-img-small">
        <div class="modal-product-details-small">
          <h4 class="modal-product-name">
            ${item.name || item.product?.name || ""}
          </h4>
          <p class="modal-product-price">
            Qty: ${item.quantity} | Size: ${item.size || "N/A"}
          </p>
        </div>
      </div>
    `).join("");
  }

  // remove old dynamic actions
  modal.querySelector(".modal-actions-dynamic")?.remove();

  let actionBtnHtml = "";
  if (status.toLowerCase() === "processing") {
    actionBtnHtml = `
      <button class="btn btn-outline-danger full-width"
              id="modal-cancel-btn" style="margin-top:1rem;">
        Cancel Order
      </button>`;
  } else if (status.toLowerCase() === "delivered") {
    actionBtnHtml = `
      <button class="btn btn-outline full-width"
              id="modal-return-btn" style="margin-top:1rem;">
        Return Order
      </button>`;
  }

  if (actionBtnHtml) {
    const actionsDiv     = document.createElement("div");
    actionsDiv.className = "modal-actions-dynamic";
    actionsDiv.innerHTML = actionBtnHtml;
    modal.querySelector(".modal-body")?.appendChild(actionsDiv);

    actionsDiv.querySelector("#modal-cancel-btn")
      ?.addEventListener("click", () => {
        if (confirm("Are you sure you want to cancel this order?")) {
          cancelOrder(orderId);
        }
      });

    actionsDiv.querySelector("#modal-return-btn")
      ?.addEventListener("click", () => {
        showToast("Return request submitted");
        closeAllModals();
      });
  }

  openModal(modal);
}

// ==========================================
// CANCEL ORDER
// ==========================================
async function cancelOrder(orderId) {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const res  = await fetch(`${API}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        showToast("Order cancelled successfully");
        closeAllModals();
        loadOrders();
      } else {
        showToast(data.message || "Failed to cancel", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  } else {
    // fallback localStorage
    const orders = JSON.parse(localStorage.getItem("dripmen_orders") || "[]");
    const index  = orders.findIndex(o => o.id === orderId);
    if (index === -1) return;

    const [cancelled]   = orders.splice(index, 1);
    cancelled.status      = "Cancelled";
    cancelled.statusClass = "status-cancelled";

    const cancellations = JSON.parse(
      localStorage.getItem("dripmen_cancellations") || "[]"
    );
    cancellations.unshift(cancelled);
    localStorage.setItem("dripmen_orders",        JSON.stringify(orders));
    localStorage.setItem("dripmen_cancellations", JSON.stringify(cancellations));
    showToast("Order cancelled successfully");
    closeAllModals();
    loadOrders();
  }
}

// ==========================================
// RENDER ORDERS
// ==========================================
function renderOrders(orders) {
  const container = document.getElementById("orders-list");
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-state" style="padding:2rem 0;">
        <div class="empty-cart-icon" style="font-size:3rem;">
          <i class="ph ph-package"></i>
        </div>
        <h3 style="font-size:1.2rem;margin-bottom:0.5rem;">No orders yet</h3>
        <p style="margin-bottom:1.5rem;">You have no active orders.</p>
        <a href="products.html" class="btn btn-primary">Start Shopping</a>
      </div>`;
    return;
  }

  container.innerHTML = orders.map((order, index) => {

    const orderId  = order._id  || order.id  || "";
    const shortId  = "#" + String(orderId).slice(-6).toUpperCase();
    const date     = formatDate(order.createdAt || order.date);
    const status   = order.orderStatus || order.status || "processing";
    const total    = order.total || 0;
    const items    = order.items || [];

    let actionButtons = "";
    if (status.toLowerCase() === "processing") {
      actionButtons = `
        <button class="btn btn-outline-danger cancel-order-btn"
                data-id="${orderId}">
          Cancel Order
        </button>`;
    } else if (status.toLowerCase() === "delivered") {
      actionButtons = `
        <button class="btn btn-outline return-order-btn"
                data-id="${orderId}">
          Return Order
        </button>`;
    }

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">Order ${shortId}</span>
            <span class="order-date">${date}</span>
          </div>
          <span class="order-status ${getStatusClass(status)}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div class="order-items-list">
          ${items.map(item => `
            <div class="order-item">
              <img src="${item.image || item.product?.images?.[0] || ""}"
                   alt="${item.name || ""}"
                   class="order-item-img">
              <div class="order-item-info">
                <span class="order-item-name">
                  ${item.name || item.product?.name || ""}
                </span>
                <span class="order-item-meta">
                  Qty: ${item.quantity} | Size: ${item.size || "N/A"}
                </span>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="order-footer">
          <div>
            <span class="order-total-label">Total Order:</span>
            <span class="order-total-value">
              $${Number(total).toFixed(2)}
            </span>
          </div>
          <div class="order-actions-group" style="display:flex;gap:1rem;">
            ${actionButtons}
            <button class="btn btn-outline view-details-btn"
                    data-id="${orderId}" data-index="${index}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================
// LOAD ORDERS FROM API
// ==========================================
async function loadOrders() {
  const container = document.getElementById("orders-list");
  if (!container) return;

  const token = localStorage.getItem("token");

  if (token) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#888;">
        <p>Loading orders...</p>
      </div>`;

    try {
      const res  = await fetch(`${API}/api/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        renderOrders(data.orders);
      } else {
        renderOrders([]);
      }
    } catch (err) {
      console.error("Load orders failed:", err);
      renderOrders([]);
    }

  } else {
    // fallback localStorage
    const orders = JSON.parse(
      localStorage.getItem("dripmen_orders") || "[]"
    );
    renderOrders(orders);
  }
}

// ==========================================
// PAGE: ORDERS
// ==========================================
export function initOrdersPage() {
  const container = document.getElementById("orders-list");
  if (!container) return;

  // click handler
  container.addEventListener("click", async (e) => {
    const target = e.target;

    // cancel
    if (target.classList.contains("cancel-order-btn")) {
      if (confirm("Are you sure you want to cancel this order?")) {
        await cancelOrder(target.dataset.id);
      }
      return;
    }

    // return
    if (target.classList.contains("return-order-btn")) {
      showToast("Return request submitted");
      return;
    }

    // view details
    if (target.classList.contains("view-details-btn")) {
      const orderId = target.dataset.id;
      const token   = localStorage.getItem("token");

      if (token && orderId) {
        window.location.href = `order-details.html?id=${orderId}`;
      } else {
        const orders = JSON.parse(
          localStorage.getItem("dripmen_orders") || "[]"
        );
        openOrderDetailsModal(orders[target.dataset.index]);
      }
      return;
    }
  });

  // listen for updates
  window.addEventListener("orders-updated", loadOrders);

  // ── smart auth wait then load ─────────────
  const token = localStorage.getItem("token");
  if (token) {
    loadOrders();
  } else {
    let attempts = 0;
    const waitForAuth = setInterval(() => {
      const t = localStorage.getItem("token");
      attempts++;
      if (t) {
        clearInterval(waitForAuth);
        loadOrders();
      } else if (attempts > 10) {
        clearInterval(waitForAuth);
        loadOrders();
      }
    }, 200);
  }
}