console.log("ADMIN ORDERS JS LOADED");

const API = "http://localhost:4000";

// ==============================
// HELPER
// ==============================
function getToken() {
  return localStorage.getItem("adminToken") || localStorage.getItem("token");
}

// ==============================
// LOAD ADMIN ORDERS
// ==============================
async function loadAdminOrders(filterStatus = "all", searchQuery = "") {
  const container = document.getElementById("admin-orders-list");
  const token     = getToken();

  if (!container) return;

  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  container.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:2rem;">
        Loading orders...
      </td>
    </tr>`;

  try {
    const res  = await fetch(`${API}/api/orders/admin/all`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:red;">
            ${data.message || "Failed to load orders"}
          </td>
        </tr>`;
      return;
    }

    let orders = data.orders;

    // filter by status
    if (filterStatus !== "all") {
      orders = orders.filter(
        o => o.orderStatus?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // filter by search
    if (searchQuery) {
      orders = orders.filter(o =>
        String(o._id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    renderAdminOrders(orders);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:red;">
          Network error. Make sure backend is running.
        </td>
      </tr>`;
  }
}

// ==============================
// RENDER ADMIN ORDERS
// ==============================
function renderAdminOrders(orders) {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:2rem;color:#888;">
          No orders found.
        </td>
      </tr>`;
    return;
  }

  container.innerHTML = orders.map(order => {

    const shortId  = "#" + String(order._id).slice(-6).toUpperCase();
    const customer = order.user?.name || order.user?.email || "Unknown";
    const date     = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
    const total    = Number(order.total || 0).toFixed(2);
    const payment  = order.paymentMethod || "COD";
    const status   = order.orderStatus   || "processing";

    const statusColors = {
      processing: "#f59e0b",
      confirmed:  "#3b82f6",
      shipped:    "#8b5cf6",
      delivered:  "#10b981",
      cancelled:  "#ef4444"
    };
    const color = statusColors[status] || "#888";

    return `
      <tr>
        <td><strong>${shortId}</strong></td>
        <td>${customer}</td>
        <td>${date}</td>
        <td>$${total}</td>
        <td>${payment}</td>
        <td>
          <span style="background:${color}20;color:${color};
                       padding:4px 10px;border-radius:20px;
                       font-size:0.8rem;font-weight:600;">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td>
          <select onchange="updateOrderStatus('${order._id}', this.value)"
                  style="padding:6px 10px;border-radius:6px;
                         border:1px solid #ddd;font-size:0.85rem;
                         cursor:pointer;">
            <option value="processing" ${status === "processing" ? "selected" : ""}>Processing</option>
            <option value="confirmed"  ${status === "confirmed"  ? "selected" : ""}>Confirmed</option>
            <option value="shipped"    ${status === "shipped"    ? "selected" : ""}>Shipped</option>
            <option value="delivered"  ${status === "delivered"  ? "selected" : ""}>Delivered</option>
            <option value="cancelled"  ${status === "cancelled"  ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

// ==============================
// UPDATE ORDER STATUS
// ==============================
async function updateOrderStatus(orderId, status) {
  const token = getToken();

  try {
    const res  = await fetch(`${API}/api/orders/admin/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ orderStatus: status })
    });
    const data = await res.json();

    if (data.success) {
      showToast("Order status updated ✅");
      loadAdminOrders(currentFilter, currentSearch);
    } else {
      showToast(data.message || "Failed to update", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Network error", "error");
  }
}

// ==============================
// TOAST
// ==============================
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
  setTimeout(() => toast.remove(), 2500);
}

// ==============================
// FILTER + SEARCH
// ==============================
let currentFilter = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {

  // filter buttons
  document.querySelectorAll(".filters .btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filters .btn").forEach(b =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      currentFilter = btn.textContent.trim().toLowerCase();
      if (currentFilter === "all") currentFilter = "all";
      loadAdminOrders(currentFilter, currentSearch);
    });
  });

  // search
  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value.trim();
      loadAdminOrders(currentFilter, currentSearch);
    });
  }

  // load orders
  loadAdminOrders();
});