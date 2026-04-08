import { validateProductForm } from "./product-validation.js";

const API_BASE = "http://127.0.0.1:4000";
const token = localStorage.getItem("adminToken");

// ==============================
// LOAD PRODUCTS
// ==============================
async function loadProducts(search = "", category = "", status = "") {
  try {
    let url = `${API_BASE}/api/products/admin/all?`;
    if (search) url += `search=${search}&`;
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
        ? `<span style="text-decoration:line-through;color:#888;font-size:0.85rem;">$${p.price}</span> <span style="color:#ef4444;font-weight:600;">$${p.salePrice}</span>`
        : `<span style="font-weight:600;">$${p.price}</span>`;

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
  document.getElementById("imagePreview").innerHTML = "";
  
  const container = document.getElementById("size-stock-container");
  container.innerHTML = "";
  ["S", "M", "L", "XL"].forEach(sz => addSizeRow(sz, 0));
  updateTotalStock();

  document.getElementById("section-new-arrivals").checked = false;
  document.getElementById("section-top-selling").checked = false;
  document.getElementById("section-explore").checked = false;

  loadCategoryOptions("prodCategory");
  document.getElementById("productModal").style.display = "flex";
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

    // Image Previews
    const previewDiv = document.getElementById("imagePreview");
    previewDiv.innerHTML = "";
    if (p.images && p.images.length > 0) {
      const header = document.createElement("div");
      header.style.width = "100%";
      header.style.fontSize = "0.8rem";
      header.style.color = "#666";
      header.style.marginBottom = "8px";
      header.textContent = "Current Images:";
      previewDiv.appendChild(header);

      p.images.forEach(img => {
        const wrap = document.createElement("div");
        wrap.style.position = "relative";
        wrap.innerHTML = `<img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #eee;">`;
        previewDiv.appendChild(wrap);
      });
    }

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

    document.getElementById("productModal").style.display = "flex";
  } catch (err) {
    console.error("Edit modal error:", err);
  }
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// ==============================
// SAVE PRODUCT
// ==============================
async function saveProduct() {
  if (!validateProductForm()) return;

  const id = document.getElementById("productId").value;
  const formData = new FormData();

  formData.append("name", document.getElementById("prodName").value);
  formData.append("description", document.getElementById("prodDescription").value);
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

  const imageFiles = document.getElementById("prodImages").files;
  for (const file of imageFiles) {
    formData.append("images", file);
  }

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
      alert(data.message);
    }
  } catch (err) {
    console.error("Save product error:", err);
  }
}

// ==============================
// UTILS
// ==============================
function addSizeRow(size = "", stock = 0) {
  const container = document.getElementById("size-stock-container");
  const div = document.createElement("div");
  div.className = "size-row";
  div.style = "display:flex; gap:0.5rem; margin-bottom:0.5rem; align-items:center;";
  div.innerHTML = `
    <input type="text" class="size-id" value="${size}" placeholder="Size" style="flex:1; padding:8px; border-radius:6px; border:1px solid #eee;">
    <input type="number" class="size-qty" value="${stock}" placeholder="Qty" style="width:70px; padding:8px; border-radius:6px; border:1px solid #eee;" oninput="updateTotalStock()">
    <button type="button" onclick="this.parentElement.remove(); updateTotalStock();" style="background:none; border:none; color:#ff4d4d; cursor:pointer;"><i class="ph ph-minus-circle"></i></button>
  `;
  container.appendChild(div);
}

window.updateTotalStock = function() {
  let total = 0;
  document.querySelectorAll(".size-qty").forEach(input => {
    total += parseInt(input.value) || 0;
  });
  document.getElementById("prodStock").value = total;
};

async function loadCategoryOptions(selectId) {
  const res = await fetch(`${API_BASE}/api/categories/admin`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">Select Category</option>`;
  data.categories.forEach(c => select.innerHTML += `<option value="${c._id}">${c.name}</option>`);
}

async function changeStatus(id, status) {
  const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  if ((await res.json()).success) loadProducts();
}

async function deleteProduct(id) {
  if (!confirm("Are you sure?")) return;
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if ((await res.json()).success) loadProducts();
}

// New Image Selection Preview
document.getElementById("prodImages").addEventListener("change", function() {
  const previewDiv = document.getElementById("imagePreview");
  // Don't clear, just append new ones or show separately
  const newWrap = document.createElement("div");
  newWrap.style = "width:100%; display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; border-top:1px solid #eee; padding-top:8px;";
  newWrap.innerHTML = `<div style="width:100%; font-size:0.8rem; color:#22c55e;">New Selections:</div>`;
  
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style = "width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #eee;";
      newWrap.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
  previewDiv.appendChild(newWrap);
});

// Initialization
document.querySelector(".add-product-btn").addEventListener("click", openAddModal);
window.saveProduct = saveProduct;
window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;
window.changeStatus = changeStatus;
window.closeModal = closeModal;
window.addSizeRow = addSizeRow;

loadProducts();