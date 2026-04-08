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
    cancelled:  "status-cancelled",
    returned:   "status-returned"
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
  const orderStatus = order.orderStatus || "processing";
  const addr    = order.address || {};
  const items   = order.items  || [];
  const total   = Number(order.total || 0);

  document.getElementById("od-id").textContent   = shortId;
  document.getElementById("od-date").textContent = date;

  // Address
  const addrEl = document.getElementById("od-address");
  addrEl.innerHTML = `
    <p><strong>${addr.fullName || addr.name || "N/A"}</strong></p>
    <p>${addr.street || ""}</p>
    <p>${addr.city || ""}${addr.zip ? ", " + addr.zip : ""}</p>
    <p>${addr.phone || addr.mobile || ""}</p>
    <p>${addr.email || ""}</p>
  `;

  // Payment
  document.getElementById("od-payment").textContent = order.paymentMethod || "Cash on Delivery";

  // Items Table
  const tbody = document.getElementById("od-items-body");
  tbody.innerHTML = items.map(item => {
    const name = item.name || "Unknown";
    const image = item.image || "";
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 1);
    const size = item.size || "L";
    const status = item.status || "processing";
    const returnStatus = item.returnStatus || "none";
    
    // Action Logic
    let actionHTML = "";
    if (status === "processing" || status === "confirmed") {
        actionHTML = `<button class="btn-cancel-item" onclick="cancelItem('${orderId}', '${item.product}', '${size}')">Cancel</button>`;
    } else if (status === "delivered") {
        if (returnStatus === "none") {
            actionHTML = `<button class="btn-return-item" onclick="requestReturn('${orderId}', '${item.product}', '${size}')">Return</button>`;
        } else if (returnStatus === "requested") {
            actionHTML = `<span class="status-badge badge-warning">Return Requested</span>`;
        } else if (returnStatus === "approved") {
            actionHTML = `<span class="status-badge badge-success">Return Approved</span>`;
        } else if (returnStatus === "rejected") {
            actionHTML = `<span class="status-badge badge-error">Return Rejected</span>`;
        }
    }

    return `
      <tr class="${status === 'cancelled' || status === 'returned' ? 'item-muted' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #eee;">
            <div>
              <div style="font-weight:600;">${name}</div>
              <div style="font-size:0.8rem;color:#666;">Size: ${size}</div>
            </div>
          </div>
        </td>
        <td>$${price.toFixed(2)}</td>
        <td>${qty}</td>
        <td><span class="status-tag ${getStatusClass(status)}">${status}</span></td>
        <td class="text-right">${actionHTML}</td>
      </tr>
    `;
  }).join("");

  // Summary
  const summary = document.getElementById("od-summary");
  const delivery = Number(order.deliveryCharge || 0);
  const discount = Number(order.discount || 0);
  const subtotal = Number(order.subtotal || 0);
  
  // Calculate potential refunds display
  const totalRefunded = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);

  summary.innerHTML = `
    <div class="summary-row">
      <span>Subtotal</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
    ${discount > 0 ? `
    <div class="summary-row" style="color:var(--accent-red);">
      <span>Coupon Discount</span>
      <span>-$${discount.toFixed(2)}</span>
    </div>` : ""}
    <div class="summary-row">
      <span>Shipping</span>
      <span>${delivery === 0 ? "Free" : "$" + delivery.toFixed(2)}</span>
    </div>
    ${totalRefunded > 0 ? `
    <div class="summary-row" style="color:#10b981; font-weight:600; background:#f0fdf4; padding:8px; border-radius:6px; margin:4px 0;">
      <span>Total Refunded to Wallet</span>
      <span>$${totalRefunded.toFixed(2)}</span>
    </div>` : ""}
    <div class="summary-divider"></div>
    <div class="summary-row total-row">
      <span>Current Total</span>
      <span>$${total.toFixed(2)}</span>
    </div>
  `;
}

// ==========================================
// ACTIONS
// ==========================================
window.cancelItem = async (orderId, productId, size) => {
    if (!confirm("Are you sure you want to cancel this item?")) return;
    
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/orders/cancel-item`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ orderId, productId, size })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Item cancelled successfully. Refund added to wallet.");
            initOrderDetailsPage(); // reload
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Error cancelling item", "error");
    }
};

window.requestReturn = async (orderId, productId, size) => {
    const reason = prompt("Reason for return:");
    if (!reason) return;
    
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/orders/return-item-request`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ orderId, productId, size, reason })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Return request submitted.");
            initOrderDetailsPage(); // reload
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Error submitting return", "error");
    }
};

// ==========================================
// LOAD DATA
// ==========================================
async function loadOrder(orderId, token) {
  try {
    const res = await fetch(`${API}/api/orders/${orderId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.order) {
      populateOrderDetails(data.order);
    }
  } catch (err) {
    console.error("Load order error:", err);
  }
}

export function initOrderDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");
  const token = localStorage.getItem("token");
  if (orderId && token) {
    loadOrder(orderId, token);
  }
}