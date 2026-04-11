// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  showToast,
  openModal,
  closeAllModals
} from "../core.js";

const API = "http://127.0.0.1:4000";

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
    cancelled:  "status-cancelled",
    returned:   "status-returned",
    requested:  "status-pending"
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
  if (totalEl) totalEl.textContent = `₹${Number(order.total).toFixed(2)}`;

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
    if (order.returnStatus && order.returnStatus !== "none") {
        actionBtnHtml = `<button class="btn btn-outline full-width" disabled style="margin-top:1rem; opacity:0.6;">Return ${order.returnStatus}</button>`;
    } else {
        actionBtnHtml = `
          <button class="btn btn-outline full-width"
                  id="modal-return-btn" style="margin-top:1rem;">
            Return Order
          </button>`;
    }
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
        closeAllModals();
        openReturnModal(orderId);
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
    const items    = order.items || [];
    const totalMRP = Number(order.totalMRP || 0);
    const subtotal = Number(order.subtotal || 0);
    const orderTotal = Number(order.total || 0);

    // Sum of refunds across all items
    const totalRefunded = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
    const isFullyRefunded = status.toLowerCase() === "cancelled" && totalRefunded > 0 && orderTotal === 0;

    let actionButtons = "";
    if (status.toLowerCase() === "processing") {
      actionButtons = `
        <button class="btn btn-outline-danger cancel-order-btn"
                data-id="${orderId}">
          Cancel Order
        </button>`;
    } else if (status.toLowerCase() === "delivered") {
      if (order.returnStatus && order.returnStatus !== "none") {
        const returnLabel = order.returnStatus.charAt(0).toUpperCase() + order.returnStatus.slice(1);
        actionButtons = `
          <button class="btn btn-outline" disabled style="background:#f8f9fa; color:#888; border-color:#eee;">
            Return ${returnLabel}
          </button>`;
      } else {
        actionButtons = `
          <button class="btn btn-outline return-order-btn"
                  data-id="${orderId}">
            Return Order
          </button>`;
      }
    }

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">Order ${shortId}</span>
            <span class="order-date">${date}</span>
          </div>
          <span class="order-status ${isFullyRefunded ? 'status-refunded' : getStatusClass(status)}">
            ${isFullyRefunded ? 'Refunded' : (status.charAt(0).toUpperCase() + status.slice(1))}
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
                ${item.refundAmount > 0 ? `
                  <span class="refund-tag-inline">Refunded: ₹${item.refundAmount.toFixed(2)}</span>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>


        <div class="order-footer">
          <div>
            <span class="order-total-label">
                ${isFullyRefunded ? 'Total Refunded:' : (status.toLowerCase() === 'cancelled' ? 'Original Value:' : 'Total Order:')}
            </span>
            <span class="order-total-value ${isFullyRefunded ? 'text-success' : (status.toLowerCase() === 'cancelled' ? 'text-muted' : '')}">
              ₹${isFullyRefunded ? totalRefunded.toFixed(2) : (status.toLowerCase() === 'cancelled' ? Number(order.totalMRP - order.productDiscount + (order.deliveryCharge || 0) - (order.discount || 0)).toFixed(2) : orderTotal.toFixed(2))}
            </span>
            ${status.toLowerCase() === 'cancelled' && !isFullyRefunded ? '<div style="font-size:0.7rem; color:#ef4444; font-weight:600; margin-top:2px;">CANCELLATION (COD)</div>' : ''}
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
    // 🛡 Robust Target Detection
    const cancelBtn = e.target.closest(".cancel-order-btn");
    const returnBtn = e.target.closest(".return-order-btn");
    const viewBtn   = e.target.closest(".view-details-btn");

    console.log("Orders List Clicked:", { 
      target: e.target.tagName, 
      isReturn: !!returnBtn,
      id: returnBtn?.dataset?.id 
    });

    // cancel
    if (cancelBtn) {
      if (confirm("Are you sure you want to cancel this order?")) {
        await cancelOrder(cancelBtn.dataset.id);
      }
      return;
    }

    // return
    if (returnBtn) {
      openReturnModal(returnBtn.dataset.id);
      return;
    }

    // view details
    if (viewBtn) {
      const orderId = viewBtn.dataset.id;
      const token   = localStorage.getItem("token");

      if (token && orderId) {
        window.location.href = `order-details.html?id=${orderId}`;
      } else if (viewBtn.dataset.index !== undefined) {
        const orders = JSON.parse(
          localStorage.getItem("dripmen_orders") || "[]"
        );
        openOrderDetailsModal(orders[viewBtn.dataset.index]);
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

// ==========================================
// RETURN MODAL LOGIC
// ==========================================
function openReturnModal(orderId) {
  const modal     = document.getElementById("return-request-modal");
  const idInput   = document.getElementById("return-order-id");
  const submitBtn = document.getElementById("confirm-return-btn");

  if (!modal || !idInput || !submitBtn) {
    console.error("Return modal elements missing");
    return;
  }
  
  idInput.value = orderId;
  
  // 🛡 Strong Layout Override
  modal.style.setProperty("display", "flex", "important");
  modal.style.setProperty("position", "fixed", "important");
  modal.style.setProperty("top", "0", "important");
  modal.style.setProperty("left", "0", "important");
  modal.style.setProperty("width", "100vw", "important");
  modal.style.setProperty("height", "100vh", "important");
  modal.style.setProperty("z-index", "999999", "important");
  modal.style.setProperty("align-items", "center", "important");
  modal.style.setProperty("justify-content", "center", "important");
  modal.style.setProperty("opacity", "1", "important");
  modal.style.setProperty("visibility", "visible", "important");

  console.log("Opening Return Modal for Order:", orderId);

  // Reset button state
  submitBtn.disabled  = false;
  submitBtn.innerText = "Submit Request";

  // Setup submit handler (remove old one first)
  submitBtn.onclick = async () => {
    const reasonEl       = document.getElementById("return-reason");
    if (!reasonEl) return;

    const reason       = reasonEl.value;
    const refundMethod = "wallet"; // ALWAYS use Wallet for returns as requested


    submitBtn.disabled  = true;
    submitBtn.innerText = "Submitting...";

    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/api/orders/${orderId}/return`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason, refundMethod })
      });

      const data = await res.json();
      if (data.success) {
        showToast("Return request submitted successfully");
        modal.style.display = "none";
        loadOrders(); // Refresh table
      } else {
        showToast(data.message || "Failed to submit return", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      submitBtn.disabled  = false;
      submitBtn.innerText = "Submit Request";
    }
  };
}