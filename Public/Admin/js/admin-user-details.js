const API = window.API_BASE_URL;

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
  setTimeout(() => toast.remove(), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (!userId) {
        alert("No user ID provided");
        window.location.href = "admin-users.html";
        return;
    }

    // Setup Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    loadUserDetails(userId);
});

async function loadUserDetails(userId) {
    const token = getToken();
    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        const res = await fetch(`${API}/api/admin/users/${userId}/details`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            showToast(data.message || "Failed to load user", "error");
            return;
        }

        renderProfileHeader(data.user);
        renderStats(data.stats, data.wallet);
        renderOrders(data.orders);
        renderWallet(data.wallet.transactions);
        renderAddresses(data.addresses);

        document.getElementById('user-details-loading').style.display = 'none';
        document.getElementById('user-details-container').style.display = 'block';

    } catch (error) {
        console.error(error);
        showToast("Network Error", "error");
    }
}

function renderProfileHeader(user) {
    const name = user.name || "Unknown";
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=fff&size=128`;
    
    if (user.createdAt) {
        document.getElementById('profile-joined').textContent = "Joined: " + new Date(user.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Badges
    const roleColor   = user.isAdmin ? "#8b5cf6" : "#3b82f6";
    const statusColor = user.isBlocked ? "#ef4444" : "#10b981";
    
    let badgesHTML = `
        <span class="badge" style="background:${roleColor}20;color:${roleColor};">${user.isAdmin ? "Admin" : "User"}</span>
        <span class="badge" style="background:${statusColor}20;color:${statusColor};">${user.isBlocked ? "Suspended" : "Active"}</span>
    `;

    if (user.isGoogleUser) {
        badgesHTML += `<span class="badge" style="background:#ea433520;color:#ea4335;">Google Auth</span>`;
    }

    document.getElementById('profile-badges').innerHTML = badgesHTML;

    // Actions
    if (!user.isAdmin) {
        document.getElementById('profile-actions').innerHTML = `
            <button class="btn ${user.isBlocked ? 'btn-primary' : ''}" 
                    style="${user.isBlocked ? '' : 'background: #fee2e2; color: #dc2626; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;'}"
                    onclick="toggleBlockUser('${user.id}')">
                <i class="ph ph-${user.isBlocked ? 'check-circle' : 'prohibit'}"></i>
                ${user.isBlocked ? 'Unblock User' : 'Suspend User'}
            </button>
        `;
    }
}

function renderStats(stats, wallet) {
    document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('stat-total-spent').textContent = `₹${(stats.totalSpent || 0).toFixed(2)}`;
    document.getElementById('stat-wallet-balance').textContent = `₹${(wallet.balance || 0).toFixed(2)}`;
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    if (!orders || orders.length === 0) {
        list.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">No orders found.</td></tr>`;
        return;
    }

    list.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const itemsCount = order.items ? order.items.length : 0;
        
        let statusStyle = "";
        switch (order.orderStatus) {
            case "delivered": statusStyle = "background:#d1fae5;color:#065f46;"; break;
            case "cancelled": statusStyle = "background:#fee2e2;color:#991b1b;"; break;
            case "returned":  statusStyle = "background:#fef3c7;color:#92400e;"; break;
            default:          statusStyle = "background:#e0e7ff;color:#3730a3;"; break;
        }

        return `
            <tr>
                <td style="font-family: monospace;">#${order._id.substring(order._id.length - 8).toUpperCase()}</td>
                <td>${date}</td>
                <td>${itemsCount} item(s)</td>
                <td>₹${(order.total || 0).toFixed(2)}</td>
                <td><span style="padding:4px 8px;border-radius:12px;font-size:12px;font-weight:600;${statusStyle}">${order.orderStatus.toUpperCase()}</span></td>
                <td>
                    <a href="admin-order-details.html?id=${order._id}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">View</a>
                </td>
            </tr>
        `;
    }).join("");
}

function renderWallet(transactions) {
    const list = document.getElementById('wallet-list');
    if (!transactions || transactions.length === 0) {
        list.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;">No transactions found.</td></tr>`;
        return;
    }

    // Sort by date desc
    const sorted = [...transactions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = sorted.map(t => {
        const date = new Date(t.createdAt).toLocaleString();
        const isCredit = t.type === "credit";
        
        return `
            <tr>
                <td>${date}</td>
                <td>
                    <span style="padding:4px 8px;border-radius:12px;font-size:12px;font-weight:600;background:${isCredit ? '#d1fae5' : '#fee2e2'};color:${isCredit ? '#065f46' : '#991b1b'}">
                        ${t.type.toUpperCase()}
                    </span>
                </td>
                <td style="font-weight:600;color:${isCredit ? '#10b981' : '#ef4444'}">
                    ${isCredit ? '+' : '-'}₹${(t.amount || 0).toFixed(2)}
                </td>
                <td>${t.description}</td>
            </tr>
        `;
    }).join("");
}

function renderAddresses(addresses) {
    const list = document.getElementById('addresses-list');
    if (!addresses || addresses.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;">No saved addresses.</div>`;
        return;
    }

    list.innerHTML = addresses.map(addr => `
        <div class="address-card">
            <h4>${addr.name} ${addr.isDefault ? '<span style="font-size:11px;background:#111;color:#fff;padding:2px 8px;border-radius:12px;">DEFAULT</span>' : ''}</h4>
            <p><strong>Phone:</strong> ${addr.mobile}</p>
            <p>${addr.street}</p>
            <p>${addr.city}, ${addr.zip}</p>
        </div>
    `).join("");
}

async function toggleBlockUser(userId) {
    const token = getToken();
    try {
        const res = await fetch(`${API}/api/admin/users/${userId}/block`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message);
            loadUserDetails(userId); // reload to update badges and button
        } else {
            showToast(data.message || "Failed", "error");
        }
    } catch (err) {
        showToast("Network error", "error");
    }
}
