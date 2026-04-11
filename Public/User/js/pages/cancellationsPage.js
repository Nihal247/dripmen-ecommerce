// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { showToast } from "../core.js";

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
// RENDER CANCELLATIONS
// ==========================================
function renderCancellations(orders) {
  const container = document.getElementById("cancellations-list");
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-state" style="padding:2rem 0;">
        <div class="empty-cart-icon" style="font-size:3rem;">
          <i class="ph ph-x-circle"></i>
        </div>
        <h3 style="font-size:1.2rem;margin-bottom:0.5rem;">
          No cancellations yet
        </h3>
        <p style="margin-bottom:1.5rem;">You have no cancelled orders.</p>
      </div>`;
    return;
  }

  container.innerHTML = orders.map((order, index) => {

    const orderId = order._id  || order.id  || "";
    const shortId = "#" + String(orderId).slice(-6).toUpperCase();
    const date    = formatDate(order.createdAt || order.updatedAt || order.date);
    const items   = order.items || [];
    const total   = Number(order.total || 0);

    // Sum of refunds across all items
    const totalRefunded = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
    const isRefunded = totalRefunded > 0;

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">Order ${shortId}</span>
            <span class="order-date">Cancelled on ${date}</span>
          </div>
          <span class="order-status ${isRefunded ? 'status-refunded' : 'status-cancelled'}">
            ${isRefunded ? 'Refunded' : 'Cancelled'}
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
            <span class="order-total-label">${isRefunded ? 'Total Refunded:' : 'Total Amount:'}</span>
            <span class="order-total-value ${isRefunded ? 'text-success' : ''}">
                ₹${isRefunded ? totalRefunded.toFixed(2) : total.toFixed(2)}
            </span>
          </div>
          <button class="btn btn-outline view-details-btn"
                  data-id="${orderId}">
            View Details
          </button>
        </div>
      </div>
    `;
  }).join("");

  // click handler
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-details-btn");
    if (btn) {
      window.location.href = `order-details.html?id=${btn.dataset.id}`;
    }
  });
}

// ==========================================
// LOAD CANCELLED ORDERS FROM API
// ==========================================
async function loadCancellations() {
  const container = document.getElementById("cancellations-list");
  if (!container) return;

  const token = localStorage.getItem("token");

  if (token) {
    try {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#888;">
          <p>Loading...</p>
        </div>`;

      const res  = await fetch(`${API}/api/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        // filter only cancelled orders
        const cancelled = data.orders.filter(
          o => o.orderStatus === "cancelled"
        );
        renderCancellations(cancelled);
      } else {
        renderCancellations([]);
      }

    } catch (err) {
      console.error("Load cancellations failed:", err);
      renderCancellations([]);
    }

  } else {
    // fallback localStorage
    const cancellations = JSON.parse(
      localStorage.getItem("dripmen_cancellations") || "[]"
    );
    renderCancellations(cancellations);
  }
}

// ==========================================
// PAGE: CANCELLATIONS
// ==========================================
export function initCancellationsPage() {
  const container = document.getElementById("cancellations-list");
  if (!container) return;

  // smart auth wait then load
  const token = localStorage.getItem("token");
  if (token) {
    loadCancellations();
  } else {
    let attempts = 0;
    const waitForAuth = setInterval(() => {
      const t = localStorage.getItem("token");
      attempts++;
      if (t) {
        clearInterval(waitForAuth);
        loadCancellations();
      } else if (attempts > 10) {
        clearInterval(waitForAuth);
        loadCancellations();
      }
    }, 200);
  }
}