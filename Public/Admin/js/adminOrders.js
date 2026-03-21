console.log("ADMIN ORDERS JS LOADED");

const API = "http://localhost:4000";

// ==============================
// LOAD ADMIN ORDERS
// ==============================
async function loadAdminOrders() {
  const container = document.getElementById("admin-orders-list");
  const token = localStorage.getItem("token");

  if (!container) return;

  // loading UI (must be <tr> because it's a table)
  container.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:2rem;">
        Loading orders...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API}/api/orders/admin/all`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">Failed to load orders</td>
        </tr>
      `;
      return;
    }

    renderAdminOrders(data.orders);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">Error loading orders</td>
      </tr>
    `;
  }
}

// ==============================
// RENDER ADMIN ORDERS
// ==============================
function renderAdminOrders(orders) {
  const container = document.getElementById("admin-orders-list");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">No orders found</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = orders.map(order => `
    <tr>
      <td>#${order._id.slice(-6).toUpperCase()}</td>
      <td>${order.user?.name || "N/A"}</td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>₹${order.total}</td>
      <td>${order.paymentMethod}</td>
      <td>
        <span class="status-badge">
          ${order.orderStatus}
        </span>
      </td>
      <td>
        <select onchange="updateOrderStatus('${order._id}', this.value)">
          <option value="processing" ${order.orderStatus === "processing" ? "selected" : ""}>processing</option>
          <option value="shipped" ${order.orderStatus === "shipped" ? "selected" : ""}>shipped</option>
          <option value="delivered" ${order.orderStatus === "delivered" ? "selected" : ""}>delivered</option>
          <option value="cancelled" ${order.orderStatus === "cancelled" ? "selected" : ""}>cancelled</option>
        </select>
      </td>
    </tr>
  `).join("");
}

// ==============================
// UPDATE ORDER STATUS
// ==============================
async function updateOrderStatus(orderId, status) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/orders/admin/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ orderStatus: status })
    });

    const data = await res.json();

    if (data.success) {
      alert("Order updated");
      loadAdminOrders();
    } else {
      alert(data.message || "Failed to update");
    }

  } catch (err) {
    console.error(err);
    alert("Error updating order");
  }
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  loadAdminOrders();
});

