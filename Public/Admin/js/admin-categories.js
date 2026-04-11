const API_BASE = "http://127.0.0.1:4000";

// ==============================
// GET ADMIN TOKEN
// ==============================
const token = localStorage.getItem("adminToken");

// ==============================
// LOAD ALL CATEGORIES ON PAGE LOAD
// ==============================
let removeImageFlag = false; // Track image removal in edit mode

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

    if (!data.categories || data.categories.length === 0) {
      grid.innerHTML = `<p style="color: #64748b; padding: 2rem;">No categories yet. Add one!</p>`;
      return;
    }

    data.categories.forEach((cat) => {
      grid.innerHTML += `
        <div class="admin-card-item" id="cat-${cat._id}">
          <div style="position: relative;">
            <img src="${cat.image || 'images/placeholder-category.png'}" class="admin-card-img" style="border-bottom: 1px solid #f1f5f9;">
          </div>
          <div class="admin-card-body">
            <h3 class="admin-card-title">${cat.name}</h3>
            <p style="color: #64748b; font-size: 0.88rem; margin-bottom: 1.25rem; min-height: 2.6rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${cat.description || "No description provided."}
            </p>
            <div class="admin-card-actions" style="display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
              <button class="action-btn" onclick="openEditModal('${cat._id}', '${cat.name.replace(/'/g, "\\'")}', '${(cat.description || "").replace(/'/g, "\\'")}', '${cat.image || ""}')" title="Edit">
                <i class="ph ph-pencil-simple"></i>
              </button>
              <button class="action-btn" onclick="deleteCategory('${cat._id}')" style="color: #ef4444;" title="Delete">
                <i class="ph ph-trash"></i>
              </button>
              <button 
                class="status-btn ${cat.status === 'active' ? 'status-active' : 'status-blocked'}"
                onclick="toggleStatus('${cat._id}', this)"
                style="margin-left: auto;">
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
// DELETE CATEGORY
// ==============================
async function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this category? This cannot be undone.")) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      loadCategories();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Delete failed", err);
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
  removeImageFlag = false;
  
  const previewDiv = document.getElementById("catImagePreview");
  if (previewDiv) previewDiv.innerHTML = "";
  
  document.getElementById("categoryModal").style.display = "block";
}

function openEditModal(id, name, description, imageUrl = "") {
  document.getElementById("modalTitle").textContent = "Edit Category";
  document.getElementById("categoryId").value = id;
  document.getElementById("catName").value = name;
  document.getElementById("catDescription").value = description || "";
  document.getElementById("catImage").value = "";
  removeImageFlag = false;

  const previewDiv = document.getElementById("catImagePreview");
  if (previewDiv) {
    if (imageUrl && imageUrl !== "undefined" && imageUrl !== "null" && imageUrl !== "") {
      previewDiv.innerHTML = `
        <div style="position: relative;">
          <img src="${imageUrl}" style="max-width:100%; max-height:120px; border-radius:8px; border:1px solid #ddd; object-fit:cover;">
          <button type="button" onclick="removeCategoryImagePreview()" style="position:absolute; top:-8px; right:-8px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
            <i class="ph ph-x"></i>
          </button>
        </div>`;
    } else {
      previewDiv.innerHTML = "";
    }
  }

  document.getElementById("categoryModal").style.display = "block";
}

window.removeCategoryImagePreview = function() {
  removeImageFlag = true;
  document.getElementById("catImagePreview").innerHTML = "";
  document.getElementById("catImage").value = "";
};

function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}

// ==============================
// SAVE CATEGORY (Add or Edit)
// ==============================
async function saveCategory() {
  const id = document.getElementById("categoryId").value;
  // Professional trimming and multi-space removal
  const nameInput = document.getElementById("catName");
  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const description = document.getElementById("catDescription").value.trim();
  const imageInput = document.getElementById("catImage");
  const imageFile = imageInput.files[0];

  // Professional Validation
  if (!name || name.length < 2 || name.length > 50) {
    alert("Category name must be between 2 and 50 characters.");
    nameInput.focus();
    return;
  }

  // Stricter Validation: Only letters, no numbers, no spaces
  const nameRegex = /^[A-Za-z]+$/;
  if (!nameRegex.test(name)) {
    alert("Category name can only contain letters. Numbers, spaces, and special symbols are not allowed.");
    nameInput.focus();
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  
  if (imageFile) {
    formData.append("image", imageFile);
  } else if (id && removeImageFlag) {
    formData.append("removeImage", "true");
  }

  const url = id
    ? `${API_BASE}/api/categories/${id}`
    : `${API_BASE}/api/categories`;
  const method = id ? "PUT" : "POST";

  const saveBtn = document.querySelector('button[onclick="saveCategory()"]');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

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
    alert("Network error. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
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
        previewDiv.innerHTML = `
          <div style="position: relative;">
            <img src="${e.target.result}" style="max-width:100%; max-height:120px; border-radius:8px; border:1px solid #22c55e; object-fit:cover;">
            <button type="button" onclick="removeCategoryImagePreview()" style="position:absolute; top:-8px; right:-8px; background:#111; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
              <i class="ph ph-x"></i>
            </button>
          </div>`;
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
window.deleteCategory = deleteCategory;
window.closeModal = closeModal;

// Load categories when page opens
loadCategories();
