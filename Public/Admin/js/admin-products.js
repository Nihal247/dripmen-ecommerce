import { validateProductForm } from "./product-validation.js";

const API_BASE = window.API_BASE_URL;
const token = localStorage.getItem("adminToken");

let selectedFiles = []; // Track newly selected images
let existingImagesToKeep = []; // Track existing images in edit mode

// ==============================
// LOAD PRODUCTS
// ==============================
async function loadProducts(search = "", category = "", status = "") {
  try {
    let url = `${API_BASE}/api/products/admin/all?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${category}&`;
    if (status) url += `status=${status}&`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.getElementById("products-table-body");
    tbody.innerHTML = "";

    if (!data.products || data.products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888;">No products found.</td></tr>`;
      return;
    }

    data.products.forEach((p) => {
      const categoryName = p.categoryId?.name || "Uncategorized";
      const image = p.images?.[0] || "";
      const saleDisplay = p.salePrice
        ? `<span style="text-decoration:line-through;color:#888;font-size:0.85rem;">₹${p.price}</span> <span style="color:#ef4444;font-weight:600;">₹${p.salePrice}</span>`
        : `<span style="font-weight:600;">₹${p.price}</span>`;

      tbody.innerHTML += `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            ${image ? `<img src="${image}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid #eee;">` : ""}
            <span style="font-weight:500;color:#111;">${p.name}</span>
          </div>
        </td>
        <td>${categoryName}</td>
        <td>${saleDisplay}</td>
        <td><span class="badge ${p.stock < 10 ? 'badge-warning' : 'badge-success'}">${p.stock}</span></td>
        <td>
          <select onchange="changeStatus('${p._id}', this.value)" class="status-select" style="padding:4px 8px; border-radius:6px; border:1px solid #eee; font-size:0.85rem;">
            <option value="active" ${p.status === "active" ? "selected" : ""}>Active</option>
            <option value="inactive" ${p.status === "inactive" ? "selected" : ""}>Inactive</option>
            <option value="draft" ${p.status === "draft" ? "selected" : ""}>Draft</option>
            <option value="out_of_stock" ${p.status === "out_of_stock" ? "selected" : ""}>Out of Stock</option>
          </select>
        </td>
        <td>${p.sales || 0}</td>
        <td>
          <div style="display:flex;gap:0.5rem;">
            <button class="action-btn" onclick="openEditModal('${p._id}')"><i class="ph ph-pencil-simple"></i></button>
            <button class="action-btn delete-btn" onclick="deleteProduct('${p._id}')"><i class="ph ph-trash"></i></button>
          </div>
        </td>
      </tr>`;
    });
  } catch (err) {
    console.error("Load products error:", err);
  }
}

// ==============================
// MODAL CONTROLS
// ==============================
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Product";
  document.getElementById("productId").value = "";
  document.getElementById("prodName").value = "";
  document.getElementById("prodDescription").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodSalePrice").value = "";
  document.getElementById("prodColors").value = "";
  document.getElementById("prodImages").value = "";
  
  selectedFiles = [];
  existingImagesToKeep = [];
  renderImagePreviews();
  
  const container = document.getElementById("size-stock-container");
  container.innerHTML = "";
  ["S", "M", "L", "XL"].forEach(sz => addSizeRow(sz, 0));
  updateTotalStock();

  document.getElementById("section-new-arrivals").checked = false;
  document.getElementById("section-top-selling").checked = false;
  document.getElementById("section-explore").checked = false;

  loadCategoryOptions("prodCategory");
  document.getElementById("productModal").style.display = "block";
}

async function openEditModal(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const p = data.product;

    document.getElementById("modalTitle").textContent = "Edit Product";
    document.getElementById("productId").value = p._id;
    document.getElementById("prodName").value = p.name;
    document.getElementById("prodDescription").value = p.description || "";
    document.getElementById("prodPrice").value = p.price;
    document.getElementById("prodSalePrice").value = p.salePrice || "";
    document.getElementById("prodColors").value = (p.colors || []).join(",");
    document.getElementById("prodImages").value = "";

    selectedFiles = [];
    existingImagesToKeep = p.images || [];
    renderImagePreviews();

    // Sizes
    const container = document.getElementById("size-stock-container");
    container.innerHTML = "";
    if (p.sizes && p.sizes.length > 0) {
      p.sizes.forEach(s => addSizeRow(s.size, s.stock));
    } else {
      ["S", "M", "L", "XL"].forEach(sz => addSizeRow(sz, 0));
    }
    updateTotalStock();

    // Sections
    const sections = p.section || [];
    document.getElementById("section-new-arrivals").checked = sections.includes("new_arrivals");
    document.getElementById("section-top-selling").checked = sections.includes("top_selling");
    document.getElementById("section-explore").checked = sections.includes("explore");

    await loadCategoryOptions("prodCategory");
    document.getElementById("prodCategory").value = p.categoryId?._id || "";

    document.getElementById("productModal").style.display = "block";
  } catch (err) {
    console.error("Edit modal error:", err);
  }
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// ==============================
// IMAGE HANDLING
// ==============================
function renderImagePreviews() {
  const previewDiv = document.getElementById("imagePreview");
  previewDiv.innerHTML = "";

  // Render Existing Images (for edit mode)
  existingImagesToKeep.forEach((img, index) => {
    const wrap = document.createElement("div");
    wrap.className = "current-image-item";
    wrap.style = "position:relative; width:80px; height:80px;";
    wrap.innerHTML = `
      <img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid #eee;">
      <button type="button" onclick="removeExistingImage(${index})" style="position:absolute; top:-8px; right:-8px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
        <i class="ph ph-x"></i>
      </button>
    `;
    previewDiv.appendChild(wrap);
  });

  // Render Newly Selected Files
  selectedFiles.forEach((file, index) => {
    const wrap = document.createElement("div");
    wrap.style = "position:relative; width:80px; height:80px;";
    const reader = new FileReader();
    reader.onload = e => {
      wrap.innerHTML = `
        <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid #22c55e; opacity:0.8;">
        <button type="button" onclick="removeSelectedFile(${index})" style="position:absolute; top:-8px; right:-8px; background:#111; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
          <i class="ph ph-x"></i>
        </button>
        <span style="position:absolute; bottom:2px; left:2px; font-size:8px; background:rgba(34,197,94,0.8); color:white; padding:1px 4px; border-radius:4px;">NEW</span>
      `;
    };
    reader.readAsDataURL(file);
    previewDiv.appendChild(wrap);
  });
}

window.removeExistingImage = function(index) {
  existingImagesToKeep.splice(index, 1);
  renderImagePreviews();
};

window.removeSelectedFile = function(index) {
  selectedFiles.splice(index, 1);
  renderImagePreviews();
};

document.getElementById("prodImages").addEventListener("change", function(e) {
  const files = Array.from(e.target.files);
  const totalImages = existingImagesToKeep.length + selectedFiles.length + files.length;
  
  if (totalImages > 5) {
    alert("You can only have a maximum of 5 images.");
    this.value = "";
    return;
  }

  selectedFiles = [...selectedFiles, ...files];
  this.value = ""; // Reset input so same file can be selected again
  renderImagePreviews();
});

// ==============================
// SAVE PRODUCT
// ==============================
async function saveProduct() {
  if (!validateProductForm()) return;

  const saveBtn = document.querySelector('button[onclick="saveProduct()"]');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const id = document.getElementById("productId").value;
  const formData = new FormData();

  formData.append("name", document.getElementById("prodName").value.trim());
  formData.append("description", document.getElementById("prodDescription").value.trim());
  formData.append("price", document.getElementById("prodPrice").value);
  formData.append("salePrice", document.getElementById("prodSalePrice").value);
  formData.append("categoryId", document.getElementById("prodCategory").value);
  
  const colorsRaw = document.getElementById("prodColors").value;
  formData.append("colors", JSON.stringify(colorsRaw.split(",").map(c => c.trim()).filter(Boolean)));

  const sizes = [];
  let total = 0;
  document.querySelectorAll(".size-row").forEach(row => {
    const s = row.querySelector(".size-id").value.trim();
    const q = parseInt(row.querySelector(".size-qty").value) || 0;
    if (s) {
      sizes.push({ size: s, stock: q });
      total += q;
    }
  });
  formData.append("sizes", JSON.stringify(sizes));
  formData.append("stock", total);

  const sections = [];
  if (document.getElementById("section-new-arrivals").checked) sections.push("new_arrivals");
  if (document.getElementById("section-top-selling").checked) sections.push("top_selling");
  if (document.getElementById("section-explore").checked) sections.push("explore");
  formData.append("section", JSON.stringify(sections));

  // Images logic
  formData.append("keepImages", JSON.stringify(existingImagesToKeep));
  selectedFiles.forEach(file => {
    formData.append("images", file);
  });

  const url = id ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      loadProducts();
    } else {
      alert(data.message || "Failed to save product");
    }
  } catch (err) {
    console.error("Save product error:", err);
    alert("Network error. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// ==============================
// UTILS
// ==============================
function addSizeRow(size = "", stock = 0) {
  const container = document.getElementById("size-stock-container");
  const div = document.createElement("div");
  div.className = "size-row";
  div.style = "display:flex; gap:0.5rem; margin-bottom:0.8rem; align-items:center;";
  div.innerHTML = `
    <input type="text" class="size-id" value="${size}" placeholder="Size (e.g. M)" style="flex:1; padding:10px; border-radius:8px; border:1px solid #e9ecef; background:#fff;">
    <input type="number" class="size-qty" value="${stock}" placeholder="0" min="0" style="width:80px; padding:10px; border-radius:8px; border:1px solid #e9ecef; background:#fff;" 
      oninput="this.value = this.value.replace(/[^0-9]/g, ''); updateTotalStock()">
    <button type="button" onclick="this.parentElement.remove(); updateTotalStock();" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem; display:flex; align-items:center;">
      <i class="ph ph-minus-circle"></i>
    </button>
  `;
  container.appendChild(div);
}

window.updateTotalStock = function() {
  let total = 0;
  document.querySelectorAll(".size-qty").forEach(input => {
    let val = parseInt(input.value) || 0;
    if (val < 0) {
       val = 0;
       input.value = 0;
    }
    total += val;
  });
  document.getElementById("prodStock").value = total;
};

async function loadCategoryOptions(selectId) {
  try {
    const res = await fetch(`${API_BASE}/api/categories/admin`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Select Category</option>`;
    if (data.categories) {
      data.categories.forEach(c => select.innerHTML += `<option value="${c._id}">${c.name}</option>`);
    }
  } catch (err) {
    console.error("Load category options error:", err);
  }
}

async function changeStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) loadProducts();
    else alert(data.message);
  } catch (err) {
    console.error("Change status error:", err);
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) loadProducts();
    else alert(data.message);
  } catch (err) {
    console.error("Delete product error:", err);
  }
}

// Initialization
document.querySelector(".add-product-btn").addEventListener("click", openAddModal);
window.saveProduct = saveProduct;
window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;
window.changeStatus = changeStatus;
window.closeModal = closeModal;
window.addSizeRow = addSizeRow;

loadProducts();
