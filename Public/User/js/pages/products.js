const API_BASE = "http://localhost:4000";

// ==============================
// STATE
// ==============================
let currentFilters = {
  category: "",
  minPrice: 50,
  maxPrice: 300,
  color: "",
  size: "",
  sort: "newest",
  page: 1,
};

// ==============================
// RENDER STARS
// ==============================
function renderStars(rating = 4.5) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  let stars = "";
  for (let i = 0; i < full; i++)  stars += `<i class="ph-fill ph-star"></i>`;
  if (half)                         stars += `<i class="ph-fill ph-star-half"></i>`;
  for (let i = 0; i < empty; i++) stars += `<i class="ph ph-star"></i>`;
  return stars;
}

// ==============================
// RENDER ONE PRODUCT CARD
// Uses EXACT same .product-card structure as index.html
// so all your existing CSS applies automatically
// ==============================
function renderCard(p) {
  const categoryName = p.categoryId?.name || "";
  const image        = p.images?.[0] || "images/placeholder.png";
  const isOutOfStock = p.status === "out_of_stock" || p.stock === 0;
  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;

  let discountBadge = "";
  if (p.salePrice && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    discountBadge = `<span class="discount-badge">-${pct}%</span>`;
  }

  const priceHTML = p.salePrice && p.salePrice < p.price
    ? `<span class="current-price">$${p.salePrice}</span>
       <span class="original-price">$${p.price}</span>
       ${discountBadge}`
    : `<span class="current-price">$${p.price}</span>`;

  const oosLabel = isOutOfStock
    ? `<span class="oos-badge">Out of Stock</span>` : "";

  const cartBtn = isOutOfStock
    ? `<button class="btn btn-primary add-to-cart-btn" disabled style="opacity:0.6;cursor:not-allowed;">Out of Stock</button>`
    : `<button class="btn btn-primary add-to-cart-btn">
         <i class="ph ph-shopping-cart"></i> Add to Cart
       </button>`;

  return `
    <div class="product-card"
      data-id="${p._id}"
      data-name="${p.name}"
      data-price="${displayPrice}"
      data-image="${image}"
      data-rating="4.5/5">
      <div class="product-image-container">
        <img src="${image}" alt="${p.name}" class="product-image" />
        ${oosLabel}
        <button class="wishlist-btn" aria-label="Add to wishlist">
          <i class="ph ph-heart"></i>
        </button>
        <div class="card-hover-actions">
          ${cartBtn}
        </div>
      </div>
      <div class="product-info">
        <p class="product-category-label">${categoryName}</p>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          ${renderStars(4.5)}
          <span class="rating-text">4.5/5</span>
        </div>
        <div class="product-price">${priceHTML}</div>
      </div>
    </div>`;
}

// ==============================
// LOAD PRODUCTS FROM API
// ==============================
async function loadProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#888;">
      <p>Loading products...</p>
    </div>`;

  try {
    const params = new URLSearchParams();
    if (currentFilters.category) params.set("category", currentFilters.category);
    if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
    if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
    if (currentFilters.color)    params.set("color", currentFilters.color);
    if (currentFilters.size)     params.set("size", currentFilters.size);
    if (currentFilters.sort)     params.set("sort", currentFilters.sort);
    params.set("page",  currentFilters.page);
    params.set("limit", 9);

    const res  = await fetch(`${API_BASE}/api/products?${params}`);
    const data = await res.json();

    if (!data.success || data.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#888;">
          <i class="ph ph-package" style="font-size:3rem;"></i>
          <p style="margin-top:1rem;">No products found.</p>
        </div>`;
      renderPagination(0, 1);
      return;
    }

    grid.innerHTML = data.products.map(renderCard).join("");
    initCardButtons();
    renderPagination(data.totalPages, data.currentPage);

  } catch (err) {
    console.error("Failed to load products:", err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#dc2626;">
        <p>Could not connect to server. Make sure the backend is running on port 4000.</p>
      </div>`;
  }
}

// ==============================
// LOAD CATEGORIES INTO SIDEBAR
// ==============================
async function loadCategories() {
  try {
    const res  = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();
    const list = document.getElementById("category-filter-list");
    if (!list || !data.categories) return;

    data.categories.forEach(cat => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="#" class="filter-category-btn" data-category="${cat.slug}">
          ${cat.name} <i class="ph ph-caret-right"></i>
        </a>`;
      list.appendChild(li);
    });

    bindCategoryButtons();
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function bindCategoryButtons() {
  document.querySelectorAll(".filter-category-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".filter-category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilters.category = btn.dataset.category || "";
      currentFilters.page = 1;
      loadProducts();
    });
  });
}

// ==============================
// INIT WISHLIST + CART BUTTONS
// ==============================
function initCardButtons() {
  // Wishlist
  document.querySelectorAll("#products-grid .wishlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".product-card");
      const icon = btn.querySelector("i");
      const isFilled = icon.classList.contains("ph-fill");

      icon.classList.toggle("ph-fill", !isFilled);
      icon.classList.toggle("ph-heart", true);

      const product = {
        id:    card.dataset.id,
        name:  card.dataset.name,
        price: parseFloat(card.dataset.price),
        image: card.dataset.image,
      };

      let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const idx = wishlist.findIndex(w => w.id === product.id);
      if (idx === -1) wishlist.push(product);
      else wishlist.splice(idx, 1);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));

      const badge = document.querySelector(".header-wishlist-badge");
      if (badge) {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? "flex" : "none";
      }
    });
  });

  // Add to Cart
  document.querySelectorAll("#products-grid .add-to-cart-btn:not([disabled])").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card        = btn.closest(".product-card");
      const sizeModal   = document.getElementById("size-selection-modal");
      const overlay     = document.getElementById("modal-overlay");

      if (sizeModal) {
        document.getElementById("size-modal-img").src           = card.dataset.image;
        document.getElementById("size-modal-name").textContent  = card.dataset.name;
        document.getElementById("size-modal-price").textContent = "$" + card.dataset.price;

        const confirmBtn = document.getElementById("confirm-size-btn");
        confirmBtn.dataset.pendingId    = card.dataset.id;
        confirmBtn.dataset.pendingName  = card.dataset.name;
        confirmBtn.dataset.pendingPrice = card.dataset.price;
        confirmBtn.dataset.pendingImage = card.dataset.image;

        sizeModal.classList.add("active");
        if (overlay) overlay.classList.add("active");
      }
    });
  });

  // Restore filled hearts from localStorage
  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  document.querySelectorAll("#products-grid .product-card").forEach(card => {
    if (wishlist.find(w => w.id === card.dataset.id)) {
      const icon = card.querySelector(".wishlist-btn i");
      if (icon) icon.classList.add("ph-fill");
    }
  });
}

// ==============================
// PAGINATION
// ==============================
function renderPagination(totalPages, currentPage) {
  const container = document.querySelector(".pagination");
  const pageNums  = document.querySelector(".page-numbers");
  if (!container) return;

  container.style.display = totalPages > 1 ? "flex" : "none";
  if (!pageNums) return;

  pageNums.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn       = document.createElement("button");
    btn.className   = `page-num${i === currentPage ? " active" : ""}`;
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentFilters.page = i;
      loadProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pageNums.appendChild(btn);
  }

  const prevBtn = container.querySelector(".prev-btn");
  const nextBtn = container.querySelector(".next-btn");

  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick  = () => {
      if (currentFilters.page > 1) { currentFilters.page--; loadProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    };
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick  = () => {
      if (currentFilters.page < totalPages) { currentFilters.page++; loadProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    };
  }
}

// ==============================
// PRICE SLIDER
// ==============================
const minRange = document.getElementById("min-range");
const maxRange = document.getElementById("max-range");

function updateSlider() {
  if (!minRange || !maxRange) return;
  let min = parseInt(minRange.value);
  let max = parseInt(maxRange.value);
  if (min > max) minRange.value = max;
  document.getElementById("min-val").textContent = `$${minRange.value}`;
  document.getElementById("max-val").textContent = `$${maxRange.value}`;
  const track = document.getElementById("slider-track");
  if (track) {
    const pMin = ((parseInt(minRange.value) - 50) / 250) * 100;
    const pMax = ((parseInt(maxRange.value) - 50) / 250) * 100;
    track.style.background =
      `linear-gradient(to right,#e9ecef ${pMin}%,#111 ${pMin}%,#111 ${pMax}%,#e9ecef ${pMax}%)`;
  }
}
minRange?.addEventListener("input", updateSlider);
maxRange?.addEventListener("input", updateSlider);
updateSlider();

// ==============================
// COLOR FILTER
// ==============================
document.querySelectorAll(".filter-color-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const isActive = btn.classList.contains("active");
    document.querySelectorAll(".filter-color-btn").forEach(b => {
      b.classList.remove("active");
      const ic = b.querySelector("i");
      if (ic) ic.style.display = "none";
    });
    if (!isActive) {
      btn.classList.add("active");
      const ic = btn.querySelector("i");
      if (ic) ic.style.display = "inline";
      currentFilters.color = btn.dataset.color;
    } else {
      currentFilters.color = "";
    }
  });
});

// ==============================
// SIZE FILTER
// ==============================
document.querySelectorAll(".filter-size-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const isActive = btn.classList.contains("active");
    document.querySelectorAll(".filter-size-btn").forEach(b => b.classList.remove("active"));
    if (!isActive) { btn.classList.add("active"); currentFilters.size = btn.dataset.size; }
    else currentFilters.size = "";
  });
});

// ==============================
// APPLY FILTER BUTTON
// ==============================
document.querySelector(".apply-filter-btn")?.addEventListener("click", () => {
  currentFilters.minPrice = parseInt(minRange?.value || 50);
  currentFilters.maxPrice = parseInt(maxRange?.value || 300);
  currentFilters.page     = 1;
  loadProducts();
  document.getElementById("filters-sidebar")?.classList.remove("active");
});

// ==============================
// SORT DROPDOWN
// ==============================
const sortTrigger      = document.getElementById("sort-trigger");
const sortOptionsEl    = document.getElementById("sort-options");
const currentSortLabel = document.getElementById("current-sort");

sortTrigger?.addEventListener("click", () => sortOptionsEl?.classList.toggle("open"));

document.querySelectorAll(".sort-option").forEach(opt => {
  opt.addEventListener("click", () => {
    currentFilters.sort = opt.dataset.value;
    currentFilters.page = 1;
    if (currentSortLabel) currentSortLabel.textContent = opt.textContent.trim();
    sortOptionsEl?.classList.remove("open");
    loadProducts();
  });
});

document.addEventListener("click", (e) => {
  if (!sortTrigger?.contains(e.target)) sortOptionsEl?.classList.remove("open");
});

// ==============================
// MOBILE SIDEBAR
// ==============================
document.getElementById("filter-toggle-btn")?.addEventListener("click", () =>
  document.getElementById("filters-sidebar")?.classList.add("active"));
document.getElementById("close-filter-btn")?.addEventListener("click", () =>
  document.getElementById("filters-sidebar")?.classList.remove("active"));

// ==============================
// BADGE STYLES
// ==============================
const style = document.createElement("style");
style.textContent = `
  .oos-badge {
    position: absolute; top: 12px; left: 12px;
    background: #dc2626; color: #fff;
    font-size: 0.72rem; font-weight: 700;
    padding: 4px 10px; border-radius: 20px; z-index: 2;
  }
  .product-category-label {
    font-size: 0.78rem; color: #888;
    text-transform: lowercase; margin-bottom: 2px;
  }
`;
document.head.appendChild(style);

// ==============================
// BOOT
// ==============================
loadCategories();
loadProducts();