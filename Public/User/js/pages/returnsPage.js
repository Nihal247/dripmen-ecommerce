 // ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { showToast, openModal, closeAllModals } from "../core.js";

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
// HELPER: STATUS CLASS (Returns Specific)
// ==========================================
function getReturnStatusClass(status) {
    const map = {
        requested: "status-pending",
        approved:  "status-delivered", // Using delivered color for approved
        rejected:  "status-cancelled",
        none:      "status-processing"
    };
    return map[status?.toLowerCase()] || "status-pending";
}

// ==========================================
// RENDER RETURNS
// ==========================================
function renderReturns(orders) {
  const container = document.getElementById("returns-list");
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-state" style="padding:2rem 0;">
        <div class="empty-cart-icon" style="font-size:3rem;">
          <i class="ph ph-arrow-u-up-left"></i>
        </div>
        <h3 style="font-size:1.2rem;margin-bottom:0.5rem;">No returns yet</h3>
        <p style="margin-bottom:1.5rem;">
          You haven't requested any returns yet.
        </p>
        <a href="orders.html" class="btn btn-primary">View My Orders</a>
      </div>`;
    return;
  }

  container.innerHTML = orders.map((order, index) => {

    const orderId = order._id  || order.id  || "";
    const shortId = "#" + String(orderId).slice(-6).toUpperCase();
    const date    = formatDate(order.updatedAt || order.createdAt || order.date);
    const status  = order.returnStatus || "requested";
    const items   = order.items || [];
    const total   = Number(order.total || 0);

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">Return ${shortId}</span>
            <span class="order-date">${date}</span>
          </div>
          <span class="order-status ${getReturnStatusClass(status)}">
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
            <span class="order-total-label">Return Amount:</span>
            <span class="order-total-value">₹${total.toFixed(2)}</span>
          </div>
          <button class="btn btn-outline view-details-btn"
                  data-id="${orderId}" data-index="${index}">
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
// LOAD RETURNS FROM API
// ==========================================
async function loadReturns() {
  const container = document.getElementById("returns-list");
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
        // ✅ FILTER BY RETURN STATUS
        const returned = data.orders.filter(
          o => o.returnStatus && o.returnStatus !== "none"
        );
        renderReturns(returned);
      } else {
        renderReturns([]);
      }

    } catch (err) {
      console.error("Load returns failed:", err);
      renderReturns([]);
    }

  } else {
    // fallback localStorage
    renderReturns([]);
  }
}

// ==========================================
// PAGE: RETURNS
// ==========================================
export function initReturnsPage() {
  const container = document.getElementById("returns-list");
  if (!container) return;

  const token = localStorage.getItem("token");
  if (token) {
    loadReturns();
  } else {
    let attempts = 0;
    const waitForAuth = setInterval(() => {
      const t = localStorage.getItem("token");
      attempts++;
      if (t) {
        clearInterval(waitForAuth);
        loadReturns();
      } else if (attempts > 10) {
        clearInterval(waitForAuth);
        loadReturns();
      }
    }, 200);
  }
}