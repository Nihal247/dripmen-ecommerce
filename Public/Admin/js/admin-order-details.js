const API = "http://127.0.0.1:4000";

function getToken() {
  return localStorage.getItem("adminToken");
}

function showToast(message, type = "success") {
  const existing = document.getElementById("admin-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id    = "admin-toast";
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:${type === "error" ? "#dc2626" : "#111"};
    color:#fff;padding:12px 20px;border-radius:8px;
    font-size:14px;z-index:99999;
    box-shadow:0 4px 12px rgba(0,0,0,0.2);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

let currentOrder = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("id");

    if (!orderId) {
        alert("No order ID provided");
        window.location.href = "admin-orders.html";
        return;
    }

    loadOrderDetails(orderId);
});

async function loadOrderDetails(orderId) {
    const token = getToken();
    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        const res = await fetch(`${API}/api/orders/admin/${orderId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            showToast(data.message || "Failed to load order", "error");
            return;
        }

        currentOrder = data.order;
        renderOrder();

        document.getElementById('order-loading').style.display = 'none';
        document.getElementById('order-container').style.display = 'block';

    } catch (error) {
        console.error(error);
        showToast("Network Error", "error");
    }
}

function renderOrder() {
    if (!currentOrder) return;
    const o = currentOrder;

    // Header
    document.getElementById('display-order-id').textContent = `#${o._id.slice(-8).toUpperCase()}`;
    document.getElementById('display-order-date').textContent = `Date: ${new Date(o.createdAt).toLocaleString()}`;
    
    // Status Badge
    const statusBadge = document.getElementById('display-order-status');
    const statusColors = {
      processing: { bg: "#fef3c7", color: "#d97706" },
      confirmed:  { bg: "#dbeafe", color: "#2563eb" },
      shipped:    { bg: "#ede9fe", color: "#7c3aed" },
      delivered:  { bg: "#d1fae5", color: "#059669" },
      cancelled:  { bg: "#fee2e2", color: "#dc2626" },
      returned:   { bg: "#f3f4f6", color: "#4b5563" }
    };
    const c = statusColors[o.orderStatus] || { bg: "#eee", color: "#333" };
    statusBadge.style.background = c.bg;
    statusBadge.style.color = c.color;
    statusBadge.textContent = o.orderStatus.toUpperCase();

    // Payment Status
    const payStatus = o.paymentStatus || "pending";
    const payColor = payStatus === "paid" ? "#059669" : (payStatus === "refunded" ? "#2563eb" : "#d97706");
    document.getElementById('display-payment-status').innerHTML = `
        Payment: <span style="color:${payColor}; text-transform:uppercase;">${payStatus}</span> via ${o.paymentMethod.toUpperCase()}
    `;

    // Customer
    document.getElementById('cust-name').textContent = o.user?.name || "N/A";
    document.getElementById('cust-email').textContent = o.user?.email || "N/A";
    document.getElementById('cust-phone').textContent = o.user?.phone || o.address?.phone || "N/A";

    // Shipping
    document.getElementById('ship-name').textContent = o.address?.fullName || o.address?.name || "N/A";
    document.getElementById('ship-street').textContent = o.address?.street || "N/A";
    document.getElementById('ship-city').textContent = o.address?.city || "N/A";
    document.getElementById('ship-zip').textContent = o.address?.zip || "N/A";
    document.getElementById('ship-phone').textContent = o.address?.mobile || o.address?.phone || "N/A";

    // Financials
    document.getElementById('fin-subtotal').textContent = `₹${(o.subtotal || 0).toFixed(2)}`;
    document.getElementById('fin-delivery').textContent = `₹${(o.deliveryCharge || 0).toFixed(2)}`;
    document.getElementById('fin-discount').textContent = `-₹${(o.discount || 0).toFixed(2)}`;
    document.getElementById('fin-coupon-code').textContent = o.couponCode ? `(${o.couponCode})` : "";
    document.getElementById('fin-total').textContent = `₹${(o.total || 0).toFixed(2)}`;

    if (o.discount === 0 && !o.couponCode) {
        document.getElementById('fin-discount-row').style.display = 'none';
    } else {
        document.getElementById('fin-discount-row').style.display = 'flex';
    }

    // Calculate Total Refunded
    const totalRefunded = (o.items || []).reduce((sum, item) => sum + (item.refundAmount || 0), 0);
    const refundRow = document.getElementById('fin-refunded-row');
    const refundEl = document.getElementById('fin-refunded');
    
    if (totalRefunded > 0) {
        refundRow.style.display = 'flex';
        refundEl.textContent = `₹${totalRefunded.toFixed(2)}`;
    } else {
        refundRow.style.display = 'none';
    }

    // Items
    renderItems(o.items);
}

function renderItems(items) {
    const list = document.getElementById('items-list');
    list.innerHTML = items.map(item => {
        
        let selectHTML = '';
        if (item.status === 'cancelled') {
            selectHTML = `<span style="color:#dc2626;font-weight:600;font-size:14px;background:#fee2e2;padding:6px 12px;border-radius:6px;">CANCELLED</span>`;
        } else if (item.status === 'returned') {
            selectHTML = `<span style="color:#4b5563;font-weight:600;font-size:14px;background:#f3f4f6;padding:6px 12px;border-radius:6px;">RETURNED</span>`;
        } else {
            selectHTML = `
                <select class="status-select" onchange="handleItemStatusChange('${item._id}', this)">
                    <option value="processing" ${item.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="shipped" ${item.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${item.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" style="color:red; font-weight:bold;">Cancel Item</option>
                </select>
            `;
        }

        let imgPath = item.image || (item.product && item.product.images ? item.product.images[0] : null);
        let imgUrl = 'https://placehold.co/80x80';
        if (imgPath) {
            if (imgPath.startsWith('http')) {
                imgUrl = imgPath;
            } else if (imgPath.startsWith('/')) {
                imgUrl = `${API}${imgPath}`;
            } else {
                imgUrl = `${API}/${imgPath}`;
            }
        }

        return `
            <div class="item-row">
                <img src="${imgUrl}" alt="${item.name}" class="item-image" onerror="this.src='https://placehold.co/80x80'">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-meta">Size: ${item.size} | Color: ${item.color}</div>
                    <div class="item-meta">Qty: ${item.quantity}</div>
                    ${item.refundAmount > 0 ? `<div style="font-size:13px; color:#dc2626; font-weight:600; margin-top:4px;">Refunded: ₹${item.refundAmount.toFixed(2)}</div>` : ''}
                </div>
                <div class="item-price">
                    ₹${(item.price * item.quantity).toFixed(2)}
                </div>
                <div class="item-actions">
                    ${selectHTML}
                </div>
            </div>
        `;
    }).join("");
}

// ---------------------------
// ITEM STATUS MANAGEMENT
// ---------------------------
let pendingCancelItemId = null;
let pendingCancelSelectElement = null;

function handleItemStatusChange(itemId, selectElement) {
    const newStatus = selectElement.value;
    const oldStatus = currentOrder.items.find(i => i._id === itemId).status;

    if (newStatus === 'cancelled') {
        // Intercept cancellation and show confirmation modal
        selectElement.value = oldStatus; // reset temporarily
        pendingCancelItemId = itemId;
        pendingCancelSelectElement = selectElement;
        document.getElementById('confirm-modal').style.display = 'flex';
        return;
    }

    // Normal update (shipped, delivered)
    updateItemStatusOnServer(itemId, newStatus);
}

document.getElementById('cancel-no').addEventListener('click', () => {
    document.getElementById('confirm-modal').style.display = 'none';
    pendingCancelItemId = null;
    pendingCancelSelectElement = null;
});

document.getElementById('cancel-yes').addEventListener('click', () => {
    document.getElementById('confirm-modal').style.display = 'none';
    if (pendingCancelItemId) {
        updateItemStatusOnServer(pendingCancelItemId, 'cancelled');
        pendingCancelItemId = null;
        pendingCancelSelectElement = null;
    }
});

async function updateItemStatusOnServer(itemId, newStatus) {
    const token = getToken();
    const orderId = currentOrder._id;

    try {
        const res = await fetch(`${API}/api/orders/admin/${orderId}/item/${itemId}/status`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, "success");
            currentOrder = data.order; // Update local state with fresh order (recalculated totals!)
            renderOrder(); // Re-render everything
        } else {
            showToast(data.message || "Update failed", "error");
            // Re-render to reset dropdown
            renderOrder(); 
        }
    } catch (err) {
        console.error(err);
        showToast("Network error", "error");
        renderOrder();
    }
}
