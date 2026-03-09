// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { showToast } from "../core.js";


// ==========================================
// PAGE: ORDER DETAILS (INVOICE)
// ==========================================
export function initOrderDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    window.location.href = "account.html";
    return;
  }

  const orders = JSON.parse(localStorage.getItem("dripmen_orders") || "[]");

  // Handle both formats: 923742 and #923742
  const order = orders.find(
    (o) => o.id === orderId || o.id === "#" + orderId
  );

  const container = document.querySelector(".invoice-container");

  if (!order) {
    if (container) {
      container.innerHTML =
        '<p class="text-center" style="padding:4rem;">Order not found.</p>';
    }
    return;
  }

  // =============================
  // Populate basic info
  // =============================
  const idEl = document.getElementById("od-id");
  const dateEl = document.getElementById("od-date");
  if (idEl) idEl.textContent = order.id;
  if (dateEl) dateEl.textContent = order.date;

  // =============================
  // Address
  // =============================
  const addr = order.address || {};
  const addrEl = document.getElementById("od-address");
  if (addrEl) {
    addrEl.innerHTML = `
      <p><strong>${addr.name || "N/A"}</strong></p>
      <p>${addr.street || ""}</p>
      <p>${addr.city || ""}</p>
      <p>${addr.mobile || ""}</p>
      <p>${addr.email || ""}</p>
    `;
  }

  // =============================
  // Payment
  // =============================
  const paymentEl = document.getElementById("od-payment");
  if (paymentEl) {
    paymentEl.textContent = order.paymentMethod || "Cash on Delivery";
  }

  // =============================
  // Items Table
  // =============================
  const tbody = document.getElementById("od-items-body");
  let subtotal = 0;

  if (tbody) {
    tbody.innerHTML = order.items
      .map((item) => {
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemTotal = price * qty;
        subtotal += itemTotal;

        return `
          <tr>
            <td>
              <div style="font-weight:600;">${item.name}</div>
              <div style="font-size:0.85rem;color:#666;">Size: ${item.size}</div>
            </td>
            <td>$${price.toFixed(2)}</td>
            <td>${qty}</td>
            <td class="text-right">$${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");
  }

  // =============================
  // Order Summary
  // =============================
  const summary = document.getElementById("od-summary");
  const tax = 0;
  const total = Number(order.total || 0);
  const shipping = Math.max(0, total - subtotal - tax);

  if (summary) {
    summary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Tax (0%)</span>
        <span>$${tax.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>$${shipping.toFixed(2)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row total-row">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    `;
  }
}