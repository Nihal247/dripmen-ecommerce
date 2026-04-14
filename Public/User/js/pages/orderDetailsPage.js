// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { showToast } from "../core.js";

<<<<<<< HEAD
const API = "http://127.0.0.1:4000";
=======
const API = "http://localhost:4000";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

// ==========================================
// HELPER: FORMAT DATE
// ==========================================
function formatDate(dateStr) {
  const d = new Date(dateStr);
<<<<<<< HEAD
  return d.toLocaleDateString("en-IN", {
=======
  return d.toLocaleDateString("en-US", {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
    cancelled:  "status-cancelled",
    returned:   "status-returned"
=======
    cancelled:  "status-cancelled"
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
  const orderStatus = order.orderStatus || "processing";
=======
  const status  = order.orderStatus || order.status || "processing";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  const addr    = order.address || {};
  const items   = order.items  || [];
  const total   = Number(order.total || 0);

<<<<<<< HEAD
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
    const refund = Number(item.refundAmount || 0);
    
    // Action Logic
    let actionHTML = "";
    if (status === "processing" || status === "confirmed") {
        actionHTML = `<button class="btn btn-outline btn-sm" onclick="cancelItem('${orderId}', '${item.product}', '${size}', ${price}, ${qty}, '${status}', ${total}, '${order.couponCode || ""}')">Cancel</button>`;
    } else if (status === "delivered") {
        if (returnStatus === "none") {
            actionHTML = `<button class="btn btn-outline btn-sm" onclick="requestReturn('${orderId}', '${item.product}', '${size}')">Return</button>`;
        } else if (returnStatus === "requested") {
            actionHTML = `<span class="status-badge badge-warning">Return Requested</span>`;
        } else if (returnStatus === "approved") {
            actionHTML = `<span class="status-badge badge-success">Return Approved</span>`;
        } else if (returnStatus === "rejected") {
            actionHTML = `<span class="status-badge badge-error">Return Rejected</span>`;
        }
    } else if (status === "cancelled") {
        if (refund > 0) {
            const rStatus = item.refundStatus === "completed" ? "Completed" : (item.refundStatus === "pending" ? "Pending" : "");
            actionHTML = `
                <div class="refund-badge">Refund: ₹${refund.toFixed(2)}</div>
                ${rStatus ? `<div class="refund-status-text">${rStatus}</div>` : ""}
            `;
        } else {
            actionHTML = '<span class="text-muted">No Refund</span>';
        }
    }


    return `
      <tr class="${status === 'cancelled' || status === 'returned' ? 'item-muted' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${image}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:1px solid #eee;">
            <div>
              <div style="font-weight:700; color:var(--text-main);">${name}</div>
              <div style="font-size:0.8rem;color:var(--text-muted); margin-top:2px;">Size: ${size}</div>
            </div>
          </div>
        </td>
        <td style="font-weight:600;">₹${price.toFixed(2)}</td>
        <td>${qty}</td>
        <td><span class="status-tag ${getStatusClass(status)}">${status}</span></td>
        <td class="text-right">${actionHTML}</td>
      </tr>
    `;
  }).join("");

  // Summary
  const summary = document.getElementById("od-summary");
  const delivery = Number(order.deliveryCharge || 0);
  const couponDiscount = Number(order.discount || 0);
  const totalMRP = Number(order.totalMRP || 0);
  const productDiscount = Number(order.productDiscount || 0);
  const subtotal = Number(order.subtotal || 0);
  
  // Calculate potential refunds display
  const totalRefunded = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);

  summary.innerHTML = `
    <div class="summary-row">
      <span>Price (MRP)</span>
      <span>₹${totalMRP.toFixed(2)}</span>
    </div>
    <div class="summary-row" style="color:#10b981;">
      <span>Product Discount</span>
      <span>−₹${productDiscount.toFixed(2)}</span>
    </div>
    <div class="summary-row" style="font-weight:600; border-top: 1px dashed #eee; margin-top:12px; padding-top:12px;">
      <span>Subtotal</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    ${couponDiscount > 0 ? `
    <div class="summary-row" style="color:#10b981;">
      <span>Coupon Discount (${order.couponCode})</span>
      <span>−₹${couponDiscount.toFixed(2)}</span>
    </div>` : ""}
    <div class="summary-row">
      <span>Delivery Fee</span>
      <span>${delivery === 0 ? '<span style="color:#10b981; font-weight:700;">FREE</span>' : "₹" + delivery.toFixed(2)}</span>
    </div>
    
    ${totalRefunded > 0 ? `
    <div class="refund-summary-box">
        <div class="refund-summary-header">
            <i class="ph-fill ph-check-circle"></i>
            <span>Refund Summary</span>
        </div>
        <div class="refund-summary-body">
            <div class="summary-row">
                <span>Amount Refunded to Wallet</span>
                <span class="refund-amount-text">₹${totalRefunded.toFixed(2)}</span>
            </div>
            <p class="refund-note">The refund has been credited to your DripMen Wallet. You can use this for your next purchase.</p>
        </div>
    </div>` : (orderStatus === 'cancelled' && order.paymentMethod.toLowerCase().includes('cash') ? `
    <div class="refund-summary-box warning">
        <div class="refund-summary-header">
            <i class="ph-fill ph-info"></i>
            <span>No Refund Applicable</span>
        </div>
        <div class="refund-summary-body">
            <p class="refund-note">As this was a Cash on Delivery (COD) order, no payment was transacted. No refund is required.</p>
        </div>
    </div>` : "")}

    <div class="summary-divider"></div>
    <div class="summary-row total-row">
      <span>Order Total</span>
      <span>₹${total.toFixed(2)}</span>
    </div>
    
    ${order.notes && order.notes.includes("Refund") ? `
    <div class="order-notes-box">
        <i class="ph ph-info"></i>
        <span>${order.notes}</span>
    </div>` : ""}

  `;
}

// ==========================================
// ACTIONS
// ==========================================
let pendingCancellation = null;

window.cancelItem = (orderId, productId, size, price, qty, status, orderTotal, couponCode) => {
    pendingCancellation = { orderId, productId, size, price, qty };
    
    // Show Modal
    document.getElementById("refund-modal-overlay").classList.add("active");
    document.getElementById("refund-modal").classList.add("active");

    // Dynamic Coupon Warning
    if (couponCode) {
        document.getElementById("coupon-warning").style.display = "flex";
    } else {
        document.getElementById("coupon-warning").style.display = "none";
    }
};


// Modal Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("close-refund-modal");
    const dismissBtn = document.getElementById("cancel-modal-btn");
    const confirmBtn = document.getElementById("confirm-refund-btn");
    const overlay = document.getElementById("refund-modal-overlay");

    const closeModal = () => {
        overlay.classList.remove("active");
        document.getElementById("refund-modal").classList.remove("active");
        pendingCancellation = null;
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (dismissBtn) dismissBtn.onclick = closeModal;
    
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (!pendingCancellation) return;
            
            const method = document.querySelector('input[name="refundMethod"]:checked').value;
            const { orderId, productId, size } = pendingCancellation;

            const token = localStorage.getItem("token");
            try {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="ph ph-spinner-gap ph-bold spin"></i> Processing...';
                
                const res = await fetch(`${API}/api/orders/cancel-item`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify({ orderId, productId, size, refundMethod: method })
                });
                const data = await res.json();
                
                if (data.success) {
                    showToast(data.message);
                    closeModal();
                    initOrderDetailsPage(); // reload
                } else {
                    showToast(data.message, "error");
                }
            } catch (err) {
                showToast("Error cancelling item", "error");
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.textContent = "Confirm Cancellation";
            }
        };
    }
});

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
=======
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
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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