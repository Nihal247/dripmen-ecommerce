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
// POPULATE PAGE WITH ORDER DATA
// ==========================================
function populateOrderDetails(order) {
  const orderId = order._id  || order.id  || "";
  const shortId = "#" + String(orderId).slice(-6).toUpperCase();
  const date    = formatDate(order.createdAt || order.date);
  const status  = order.orderStatus || order.status || "processing";
  const addr    = order.address || {};
  const items   = order.items  || [];
  const total   = Number(order.total || 0);

  const idEl   = document.getElementById("od-id");
  const dateEl = document.getElementById("od-date");
  if (idEl)   idEl.textContent   = shortId;
  if (dateEl) dateEl.textContent = date;

  const statusEl = document.getElementById("od-status");
  if (statusEl) {
    statusEl.className   = `order-status ${getStatusClass(status)}`;
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  const addrEl = document.getElementById("od-address");
  if (addrEl) {
    addrEl.innerHTML = `
      <p><strong>${addr.fullName || addr.name || "N/A"}</strong></p>
      <p>${addr.street || ""}</p>
      <p>${addr.city   || ""}${addr.zip ? ", " + addr.zip : ""}</p>
      <p>${addr.phone  || addr.mobile || ""}</p>
      <p>${addr.email  || ""}</p>
    `;
  }

  const paymentEl = document.getElementById("od-payment");
  if (paymentEl) {
    paymentEl.textContent = order.paymentMethod || "Cash on Delivery";
  }

  const tbody  = document.getElementById("od-items-body");
  let subtotal = 0;

  if (tbody) {
    tbody.innerHTML = items.map(item => {
      const name  = item.name  || item.product?.name  || "Unknown";
      const image = item.image || item.product?.images?.[0] || "";
      const price = Number(item.price || item.product?.price || 0);
      const qty   = Number(item.quantity || 1);
      const size  = item.size  || "N/A";
      const rowTotal = price * qty;
      subtotal += rowTotal;

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              ${image
                ? `<img src="${image}"
                        style="width:48px;height:48px;
                               object-fit:cover;border-radius:8px;">`
                : ""}
              <div>
                <div style="font-weight:600;">${name}</div>
                <div style="font-size:0.85rem;color:#666;">Size: ${size}</div>
              </div>
            </div>
          </td>
          <td>$${price.toFixed(2)}</td>
          <td>${qty}</td>
          <td class="text-right">$${rowTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");
  }

  const summary  = document.getElementById("od-summary");
  const delivery = Number(order.deliveryCharge || 0);
  const discount = Number(order.discount || 0);

  if (summary) {
    summary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      ${discount > 0 ? `
      <div class="summary-row" style="color:green;">
        <span>Discount</span>
        <span>-$${discount.toFixed(2)}</span>
      </div>` : ""}
      <div class="summary-row">
        <span>Shipping</span>
        <span>${delivery === 0 ? "Free" : "$" + delivery.toFixed(2)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row total-row">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    `;
  }

  // cancel button
  const cancelBtn = document.getElementById("od-cancel-btn");
  if (cancelBtn) {
    if (status.toLowerCase() === "processing") {
      cancelBtn.style.display = "block";
      cancelBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const res  = await fetch(`${API}/api/orders/${orderId}/cancel`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            showToast("Order cancelled successfully");
            setTimeout(() => window.location.href = "orders.html", 1200);
          } else {
            showToast(data.message || "Failed to cancel", "error");
          }
        } catch (err) {
          showToast("Network error", "error");
        }
      });
    } else {
      cancelBtn.style.display = "none";
    }
  }
}

// ==========================================
// LOAD ORDER FROM API
// ==========================================
async function loadOrder(orderId, token) {
  const container = document.querySelector(".invoice-container");

  if (token) {
    try {
      const res  = await fetch(`${API}/api/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.order) {
        populateOrderDetails(data.order);
      } else {
        if (container) {
          container.innerHTML = `
            <p style="text-align:center;padding:4rem;">
              Order not found.
              <a href="orders.html">Back to orders</a>
            </p>`;
        }
      }
    } catch (err) {
      console.error("Failed to load order:", err);
      if (container) {
        container.innerHTML = `
          <p style="text-align:center;padding:4rem;color:red;">
            Failed to load order. Please try again.
          </p>`;
      }
    }

  } else {
    // fallback localStorage
    const orders = JSON.parse(
      localStorage.getItem("dripmen_orders") || "[]"
    );
    const order = orders.find(
      o => o.id === orderId || o.id === "#" + orderId
    );

    if (!order) {
      if (container) {
        container.innerHTML = `
          <p style="text-align:center;padding:4rem;">
            Order not found.
          </p>`;
      }
      return;
    }

    populateOrderDetails(order);
  }
}

// ==========================================
// PAGE: ORDER DETAILS
// ==========================================
export function initOrderDetailsPage() {
  const params  = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    window.location.href = "orders.html";
    return;
  }

  // ── smart auth wait then load ─────────────
  const token = localStorage.getItem("token");
  if (token) {
    loadOrder(orderId, token);
  } else {
    let attempts = 0;
    const waitForAuth = setInterval(() => {
      const t = localStorage.getItem("token");
      attempts++;
      if (t) {
        clearInterval(waitForAuth);
        loadOrder(orderId, t);
      } else if (attempts > 10) {
        clearInterval(waitForAuth);
        loadOrder(orderId, null); // load with localStorage fallback
      }
    }, 200);
  }
}