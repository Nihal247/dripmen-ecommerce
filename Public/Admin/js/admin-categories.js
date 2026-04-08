const API_BASE = "http://127.0.0.1:4000";

// ==============================
// GET ADMIN TOKEN
// ==============================
const token = localStorage.getItem("adminToken");

// ==============================
// LOAD ALL CATEGORIES ON PAGE LOAD
// ==============================
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
              <button class="action-btn" onclick="openEditModal('${cat._id}', '${cat.name}', '${cat.description || ""}', '${cat.image || ""}')">
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
// MODAL CONTROLS
// ==============================
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Category";
  document.getElementById("catName").value = "";
  document.getElementById("catDescription").value = "";
  document.getElementById("catImage").value = "";
  document.getElementById("categoryId").value = "";
  const previewDiv = document.getElementById("catImagePreview");
  if (previewDiv) previewDiv.innerHTML = "";
  document.getElementById("categoryModal").style.display = "flex";
}

function openEditModal(id, name, description, imageUrl = "") {
  document.getElementById("modalTitle").textContent = "Edit Category";
  document.getElementById("categoryId").value = id;
  document.getElementById("catName").value = name;
  document.getElementById("catDescription").value = description || "";

  const previewDiv = document.getElementById("catImagePreview");
  if (previewDiv) {
    if (imageUrl && imageUrl !== "undefined" && imageUrl !== "null") {
      previewDiv.innerHTML = `<img src="${imageUrl}" style="max-width:100%; max-height:120px; border-radius:8px; border:1px solid #ddd; object-fit:cover;">`;
    } else {
      previewDiv.innerHTML = "";
    }
  }

  document.getElementById("categoryModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}

// ==============================
// SAVE CATEGORY (Add or Edit)
// ==============================
async function saveCategory() {
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("catName").value.trim();
  const description = document.getElementById("catDescription").value.trim();
  const imageInput = document.getElementById("catImage");
  const image = imageInput.files[0];

  // Robust Name Validation
  if (!name || name.length < 2 || name.length > 50) {
    alert("Category name must be between 2 and 50 characters");
    return;
  }

  // No numbers or special chars except space and hyphen
  const nameRegex = /^[A-Za-z\s-]+$/;
  if (!nameRegex.test(name)) {
    alert("Category name can only contain letters, spaces, and hyphens");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  if (image) formData.append("image", image);

  const url = id
    ? `${API_BASE}/api/categories/${id}`
    : `${API_BASE}/api/categories`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
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
// LIVE IMAGE PREVIEW
// ==============================
const catImageInput = document.getElementById("catImage");
if (catImageInput) {
  catImageInput.addEventListener("change", function () {
    const file = this.files[0];
    const previewDiv = document.getElementById("catImagePreview");
    if (file && previewDiv) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:120px; border-radius:8px; border:1px solid #ddd; object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

// ==============================
// BIND ADD CATEGORY BUTTON
// ==============================
document.querySelector(".btn-primary")?.addEventListener("click", openAddModal);

// Expose functions to window
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.toggleStatus = toggleStatus;
window.saveCategory = saveCategory;
window.closeModal = closeModal;

// Load categories when page opens
loadCategories();