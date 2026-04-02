const API_BASE = "http://localhost:4000";

// ==============================
// GET ADMIN TOKEN
// ==============================
// Why: every admin API call needs this token to prove
// the request is coming from a logged-in admin
const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

// ==============================
// LOAD ALL CATEGORIES ON PAGE LOAD
// ==============================
// Why: when admin opens the page, fetch all categories
// from database and render them as cards
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const grid = document.querySelector(".admin-grid-cards");
    grid.innerHTML = ""; // clear static HTML cards

    if (data.categories.length === 0) {
      grid.innerHTML = `<p style="color: var(--text-gray)">No categories yet. Add one!</p>`;
      return;
    }

    data.categories.forEach((cat) => {
      grid.innerHTML += `
        <div class="admin-card-item" id="cat-${cat._id}">
          <img src="${cat.image || 'images/placeholder.png'}" class="admin-card-img">
          <div class="admin-card-body">
            <h3 class="admin-card-title">${cat.name}</h3>
            <p style="color: var(--text-gray); font-size: 0.9rem;">${cat.description || ""}</p>
            <div class="admin-card-actions">
              <button class="action-btn" onclick="openEditModal('${cat._id}', '${cat.name}', '${cat.description || ""}')">
                <i class="ph ph-pencil-simple"></i>
              </button>
              <button 
                class="status-btn ${cat.status === 'active' ? 'status-active' : 'status-blocked'}"
                onclick="toggleStatus('${cat._id}', this)">
                ${cat.status === "active" ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>`;
    });
  } catch (err) {
    console.error("Failed to load categories", err);
  }
}

// ==============================
// TOGGLE ENABLE / DISABLE
// ==============================
// Why: matches the Enable/Disable button in your HTML
// calls the backend toggleCategoryStatus function
async function toggleStatus(id, btn) {
  try {
    const res = await fetch(`${API_BASE}/api/categories/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      if (data.status === "active") {
        btn.classList.replace("status-blocked", "status-active");
        btn.textContent = "Enabled";
      } else {
        btn.classList.replace("status-active", "status-blocked");
        btn.textContent = "Disabled";
      }
    }
  } catch (err) {
    console.error("Toggle failed", err);
  }
}

// ==============================
// ADD CATEGORY MODAL
// ==============================
// Why: admin clicks "Add Category" button → modal opens
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Category";
document.getElementById("catName").value = "";
document.getElementById("catDescription").value = "";
document.getElementById("catImage").value = "";
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryModal").style.display = "flex";
}

function openEditModal(id, name, description) {
  document.getElementById("modalTitle").textContent = "Edit Category";
  document.getElementById("categoryId").value = id;
  document.getElementById("catName").value = name;
  document.getElementById("catDescription").value = description;
  document.getElementById("categoryModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}

// ==============================
// SAVE CATEGORY (Add or Edit)
// ==============================
// Why FormData: we're sending an image file + text together
// JSON can't send files, only FormData can
async function saveCategory() {
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("catName").value;
  const description = document.getElementById("catDescription").value;
  const image = document.getElementById("catImage").files[0];

  if (!name) {
    alert("Category name is required");
    return;
  }

  const formData = new FormData();
// Why toLowerCase + replace: ensures category name saved to DB
// matches exactly what products.html uses as data-category
formData.append("name", name.toLowerCase().replace(/\s+/g, "-"));
  formData.append("description", description);
  if (image) formData.append("image", image);

  // Why check id: if id exists → it's an edit, if not → it's a create
  const url = id
    ? `${API_BASE}/api/categories/${id}`
    : `${API_BASE}/api/categories`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      // Why no Content-Type header: browser sets it automatically
      // with the correct boundary for FormData
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      closeModal();
      loadCategories(); // refresh the grid
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Save failed", err);
  }
}

// ==============================
// BIND ADD CATEGORY BUTTON
// ==============================
document.querySelector(".btn-primary").addEventListener("click", openAddModal);

// Load categories when page opens
loadCategories();