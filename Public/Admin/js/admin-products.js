import { validateProductForm } from "./product-validation.js";

const API_BASE = "http://localhost:4000";
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
      tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:2rem;color:#888;">
          No products yet. Add one!
        </td>
      </tr>
      `;
      return;
    }

    data.products.forEach((p) => {

      const categoryName = p.categoryId?.name || "Uncategorized";
      const image = p.images?.[0] || "";

      const salePrice = p.salePrice
        ? `<span style="text-decoration:line-through;color:#888;">$${p.price}</span> $${p.salePrice}`
        : `$${p.price}`;

      tbody.innerHTML += `
      <tr id="product-row-${p._id}">
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            ${image ? `<img src="${image}" style="width:45px;height:45px;border-radius:8px;object-fit:cover;">` : ""}
            <span style="font-weight:500;">${p.name}</span>
          </div>
        </td>

        <td>${categoryName}</td>
        <td>${salePrice}</td>
        <td>${p.stock}</td>

        <td>
        <select onchange="changeStatus('${p._id}', this.value)" class="status-select">
          <option value="active" ${p.status === "active" ? "selected" : ""}>Active</option>
          <option value="inactive" ${p.status === "inactive" ? "selected" : ""}>Inactive</option>
          <option value="draft" ${p.status === "draft" ? "selected" : ""}>Draft</option>
          <option value="out_of_stock" ${p.status === "out_of_stock" ? "selected" : ""}>Out of Stock</option>
        </select>
        </td>

        <td>0</td>

        <td>
          <button class="action-btn" onclick="openEditModal('${p._id}')">
            <i class="ph ph-pencil-simple"></i>
          </button>

          <button class="action-btn delete-btn" onclick="deleteProduct('${p._id}')">
            <i class="ph ph-trash"></i>
          </button>
        </td>
      </tr>
      `;
    });

  } catch (err) {
    console.error("Failed to load products", err);
  }
}

// ==============================
// CHANGE PRODUCT STATUS
// ==============================
async function changeStatus(id, status) {

  try {

    const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (data.success) {
      loadProducts();
    } else {
      alert("Status update failed");
    }

  } catch (err) {
    console.error("Status update error", err);
  }

}

// ==============================
// LOAD CATEGORY OPTIONS
// ==============================
async function loadCategoryOptions(selectId) {

  try {

    const res = await fetch(`${API_BASE}/api/categories/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">Select Category</option>`;

    data.categories.forEach(cat => {
      select.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });

  } catch (err) {
    console.error("Category load failed", err);
  }

}

// ==============================
// OPEN ADD PRODUCT MODAL
// ==============================
function openAddModal() {

  document.getElementById("modalTitle").textContent = "Add Product";

  document.getElementById("productId").value = "";

  document.getElementById("prodName").value = "";
  document.getElementById("prodDescription").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodSalePrice").value = "";
  document.getElementById("prodStock").value = "";
  document.getElementById("prodSizes").value = "";
  document.getElementById("prodColors").value = "";

  // Reset section checkboxes
  document.getElementById("section-new-arrivals").checked = false;
  document.getElementById("section-top-selling").checked  = false;
  document.getElementById("section-explore").checked      = false;

  loadCategoryOptions("prodCategory");

  document.getElementById("productModal").style.display = "flex";

}

// ==============================
// OPEN EDIT MODAL
// ==============================
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
    document.getElementById("prodStock").value = p.stock;
    document.getElementById("prodSizes").value = p.sizes.join(",");
    document.getElementById("prodColors").value = p.colors.join(",");

    // Load categories first (await it)
    await loadCategoryOptions("prodCategory");
    document.getElementById("prodCategory").value = p.categoryId?._id || "";

    // Set checkboxes AFTER everything else is loaded
    const productSection = Array.isArray(p.section) ? p.section : [];
    document.getElementById("section-new-arrivals").checked = productSection.includes("new_arrivals");
    document.getElementById("section-top-selling").checked  = productSection.includes("top_selling");
    document.getElementById("section-explore").checked      = productSection.includes("explore");

    // Open modal last
    document.getElementById("productModal").style.display = "flex";

  } catch (err) {
    console.error("Failed to load product", err);
  }

}

// ==============================
// CLOSE MODAL
// ==============================
function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// ==============================
// SAVE PRODUCT
// ==============================
async function saveProduct() {

  if (!validateProductForm()) return;

  const id = document.getElementById("productId").value;

  const name = document.getElementById("prodName").value;
  const description = document.getElementById("prodDescription").value;
  const price = document.getElementById("prodPrice").value;
  const salePrice = document.getElementById("prodSalePrice").value;
  const categoryId = document.getElementById("prodCategory").value;
  const stock = document.getElementById("prodStock").value;

  const sizesRaw = document.getElementById("prodSizes").value;
  const colorsRaw = document.getElementById("prodColors").value;

  const images = document.getElementById("prodImages").files;

  const formData = new FormData();

  formData.append("name", name);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("salePrice", salePrice);
  formData.append("categoryId", categoryId);
  formData.append("stock", stock);

  formData.append(
    "sizes",
    JSON.stringify(sizesRaw.split(",").map(s => s.trim()).filter(Boolean))
  );

  formData.append(
    "colors",
    JSON.stringify(colorsRaw.split(",").map(c => c.trim()).filter(Boolean))
  );

  // Collect which homepage sections are checked
  const selectedSections = [];
  if (document.getElementById("section-new-arrivals").checked) selectedSections.push("new_arrivals");
  if (document.getElementById("section-top-selling").checked)  selectedSections.push("top_selling");
  if (document.getElementById("section-explore").checked)      selectedSections.push("explore");
  formData.append("section", JSON.stringify(selectedSections));

  for (const file of images) {
    formData.append("images", file);
  }

  const url = id
    ? `${API_BASE}/api/products/${id}`
    : `${API_BASE}/api/products`;

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
    console.error("Save failed", err);
  }

}

// ==============================
// DELETE PRODUCT
// ==============================
async function deleteProduct(id) {

  const confirmDelete = confirm("Delete this product?");
  if (!confirmDelete) return;

  try {

    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.success) {
      loadProducts();
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error("Delete failed", err);
  }

}

// ==============================
// SEARCH + FILTER
// ==============================
const searchInput = document.getElementById("productSearch");
const filterSelects = document.querySelectorAll(".filter-select");

if (searchInput) {

  let timer;

  searchInput.addEventListener("input", () => {

    clearTimeout(timer);

    timer = setTimeout(() => {

      loadProducts(
        searchInput.value,
        filterSelects[0].value,
        filterSelects[1].value
      );

    }, 400);

  });

}

filterSelects.forEach(select => {

  select.addEventListener("change", () => {

    loadProducts(
      searchInput?.value || "",
      filterSelects[0].value,
      filterSelects[1].value
    );

  });

});

// ==============================
// CATEGORY FILTER
// ==============================
async function loadCategoryFilter() {

  try {

    const res = await fetch(`${API_BASE}/api/categories/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    const categoryFilter = document.querySelector(".filter-select");

    categoryFilter.innerHTML = `<option value="">Category</option>`;

    data.categories.forEach(cat => {
      categoryFilter.innerHTML += `
        <option value="${cat._id}">
          ${cat.name}
        </option>
      `;
    });

  } catch (err) {
    console.error("Failed to load category filter", err);
  }

}
const imageInput = document.getElementById("prodImages");
const previewContainer = document.getElementById("imagePreview");

if (imageInput) {

  imageInput.addEventListener("change", () => {

    const files = imageInput.files;

    previewContainer.innerHTML = "";

    if (files.length > 5) {
      alert("Maximum 5 images allowed");
      imageInput.value = "";
      return;
    }

    Array.from(files).forEach(file => {

      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();

      reader.onload = function (e) {

        const img = document.createElement("img");

        img.src = e.target.result;
        img.style.width = "70px";
        img.style.height = "70px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "6px";
        img.style.border = "1px solid #ddd";

        previewContainer.appendChild(img);

      };

      reader.readAsDataURL(file);

    });

  });

}

// ==============================
// BUTTON EVENTS
// ==============================
document.querySelector(".add-product-btn")
  .addEventListener("click", openAddModal);

// ==============================
// INITIAL LOAD
// ==============================
loadCategoryFilter();
loadProducts();
// expose functions to HTML
window.saveProduct = saveProduct;
window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;
window.changeStatus = changeStatus;
window.closeModal = closeModal;