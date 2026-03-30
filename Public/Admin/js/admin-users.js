const API = "http://localhost:4000";

function getToken() {
  return localStorage.getItem("adminToken") || localStorage.getItem("token");
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

// ==============================
// LOAD USERS
// ==============================
async function loadUsers(searchQuery = "") {
  const container = document.getElementById("admin-users-list");
  const token     = getToken();
  if (!container) return;

  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  container.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center;padding:2rem;">
        Loading users...
      </td>
    </tr>`;

  try {
    const res  = await fetch(`${API}/api/admin/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;color:red;">
            ${data.message || "Failed to load users"}
          </td>
        </tr>`;
      return;
    }

    let users = data.users;

    // search filter
    if (searchQuery) {
      users = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    renderUsers(users);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:red;">
          Network error.
        </td>
      </tr>`;
  }
}

// ==============================
// RENDER USERS
// ==============================
function renderUsers(users) {
  const container = document.getElementById("admin-users-list");
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:2rem;color:#888;">
          No users found.
        </td>
      </tr>`;
    return;
  }

  container.innerHTML = users.map(user => {

    const name    = user.name  || "Unknown";
    const email   = user.email || "";
    const role    = user.is_Admin ? "Admin" : "User";
    const blocked = user.isBlocked;
    const joined  = new Date(user.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });

    const roleColor   = user.is_Admin ? "#8b5cf6" : "#3b82f6";
    const statusColor = blocked ? "#ef4444" : "#10b981";
    const statusText  = blocked ? "Blocked" : "Active";

    const blockBtn = user.is_Admin ? "" : `
      <button class="action-btn block-btn"
              data-id="${user._id}"
              data-blocked="${blocked}"
              title="${blocked ? "Unblock" : "Block"}">
        <i class="ph ph-${blocked ? "check-circle" : "prohibit"}"></i>
      </button>`;

    const deleteBtn = user.is_Admin ? "" : `
      <button class="action-btn delete-btn"
              data-id="${user._id}"
              title="Delete"
              style="color:#ef4444;">
        <i class="ph ph-trash"></i>
      </button>`;

    return `
      <tr>
        <td>
          <div class="admin-profile">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=fff"
                 alt="${name}">
            <span>${name}</span>
          </div>
        </td>
        <td>${email}</td>
        <td>
          <span style="background:${roleColor}20;color:${roleColor};
                       padding:4px 10px;border-radius:20px;
                       font-size:0.8rem;font-weight:600;">
            ${role}
          </span>
        </td>
        <td>
          <span style="background:${statusColor}20;color:${statusColor};
                       padding:4px 10px;border-radius:20px;
                       font-size:0.8rem;font-weight:600;">
            ${statusText}
          </span>
        </td>
        <td>${joined}</td>
        <td>
          ${blockBtn}
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join("");

  // bind buttons
  container.querySelectorAll(".block-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleBlock(btn.dataset.id));
  });

  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.id));
  });
}

// ==============================
// BLOCK / UNBLOCK
// ==============================
async function toggleBlock(userId) {
  const token = getToken();
  try {
    const res  = await fetch(`${API}/api/admin/users/${userId}/block`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message);
      loadUsers(currentSearch);
    } else {
      showToast(data.message || "Failed", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}

// ==============================
// DELETE USER
// ==============================
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  const token = getToken();
  try {
    const res  = await fetch(`${API}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast("User deleted");
      loadUsers(currentSearch);
    } else {
      showToast(data.message || "Failed", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}

// ==============================
// INIT
// ==============================
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value.trim();
      loadUsers(currentSearch);
    });
  }

  loadUsers();
});