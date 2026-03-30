import { showToast, checkAuth, addToCart, addToCartAPI, showCartConfirmModal } from "../core.js";

const API_BASE = "http://localhost:4000";

const COLOR_MAP = {
  black:"bg-black", white:"bg-white", blue:"bg-blue", green:"bg-green",
  red:"bg-red", yellow:"bg-yellow", orange:"bg-orange", cyan:"bg-cyan",
  purple:"bg-purple", pink:"bg-pink", gray:"bg-gray", grey:"bg-gray",
};

// ==========================================
// INIT
// ==========================================
export async function initProductPage() {
  if (!document.querySelector(".single-product-section")) return;

  const productId = new URLSearchParams(window.location.search).get("id");

  if (productId) {
    const product = await loadProductFromAPI(productId);
    if (product) {
      const categoryName = product.categoryId?.name || "";
      loadRecommended(productId, categoryName);
    }
  }

  initGallery();
  initTabs();
  initCartButtons();
}

// ==========================================
// FETCH PRODUCT
// ==========================================
async function loadProductFromAPI(id) {
  try {
    const res  = await fetch(`${API_BASE}/api/products/${id}`);
    const data = await res.json();
    if (!data.success || !data.product) return null;
    populatePage(data.product);
    return data.product;
  } catch (err) {
    console.error("Failed to load product:", err);
    return null;
  }
}

// ==========================================
// POPULATE PAGE
// ==========================================
function populatePage(p) {
  const container    = document.querySelector(".single-product-section");
  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;

  container.dataset.id    = p._id;
  container.dataset.name  = p.name;
  container.dataset.price = displayPrice;
  container.dataset.image = p.images?.[0] || "";

  document.title = `DripMen | ${p.name}`;
  const bc = document.querySelector(".breadcrumb .current");
  if (bc) bc.textContent = p.name;
  const titleEl = document.querySelector(".product-title-main");
  if (titleEl) titleEl.textContent = p.name;

  const curEl = document.querySelector(".current-price-main");
  const orgEl = document.querySelector(".original-price-main");
  const badEl = document.querySelector(".discount-badge-main");
  if (curEl) curEl.textContent = `$${displayPrice}`;
  if (p.salePrice && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    if (orgEl) { orgEl.textContent = `$${p.price}`; orgEl.style.display = ""; }
    if (badEl) { badEl.textContent = `-${pct}%`;    badEl.style.display = ""; }
  } else {
    if (orgEl) orgEl.style.display = "none";
    if (badEl) badEl.style.display = "none";
  }

  const stockEl = document.querySelector(".stock-status");
  if (stockEl) {
    if (p.status === "out_of_stock" || p.stock === 0) {
      stockEl.className = "stock-status out-of-stock";
      stockEl.innerHTML = `<span class="status-dot"></span> Out of Stock`;
    } else {
      stockEl.className = "stock-status in-stock";
      stockEl.innerHTML = `<span class="status-dot"></span> In Stock — Only ${p.stock} left`;
    }
  }

  if (p.description) {
    const descEl    = document.querySelector(".product-desc-short");
    const tabDescEl = document.querySelector("#tab-desc p");
    if (descEl)    descEl.textContent    = p.description;
    if (tabDescEl) tabDescEl.textContent = p.description;
  }

  const mainImg = document.getElementById("main-product-image");
  if (mainImg && p.images?.[0]) mainImg.src = p.images[0];

  const thumbList = document.querySelector(".thumbnail-list");
  if (thumbList && p.images?.length) {
    const thumbImages = p.images.length === 1
      ? [p.images[0], p.images[0], p.images[0]]
      : p.images;
    thumbList.style.display = "";
    thumbList.innerHTML = thumbImages.map((img, i) => `
      <button class="thumb-btn ${i === 0 ? "active" : ""}" data-image="${img}">
        <img src="${img}" alt="${p.name} view ${i + 1}" />
      </button>`).join("");
  }

  const colorRow = document.querySelector(".color-options-row");
  if (colorRow && p.colors?.length) {
    colorRow.innerHTML = p.colors.map((color, i) => {
      const key      = color.toLowerCase().trim();
      const cssClass = COLOR_MAP[key] || "";
      const style    = cssClass ? "" : `style="background-color:${color};"`;
      return `
        <button class="color-swatch-circle ${cssClass} ${i === 0 ? "active" : ""}"
          aria-label="${color}" data-color="${color}" ${style}>
          <i class="ph ph-check" ${i !== 0 ? 'style="display:none"' : ""}></i>
        </button>`;
    }).join("");
    initColorSelection();
  }

  const sizeRow = document.querySelector(".size-options-row");
  if (sizeRow && p.sizes?.length) {
    sizeRow.innerHTML = p.sizes.map((size, i) => `
      <button class="size-pill-btn ${i === 0 ? "active" : ""}">${size}</button>`
    ).join("");
    initSizeSelection();
  }

  const stickyPrice = document.querySelector(".sticky-price");
  if (stickyPrice) stickyPrice.textContent = `$${displayPrice}`;
}

// ==========================================
// YOU MIGHT ALSO LIKE
// ==========================================
async function loadRecommended(currentProductId, categoryName) {
  const grid = document.getElementById("recommended-grid");
  if (!grid) return;

  try {
    let products = [];

    if (categoryName) {
      const res  = await fetch(`${API_BASE}/api/products?category=${encodeURIComponent(categoryName)}&limit=5`);
      const data = await res.json();
      if (data.success) {
        products = (data.products || []).filter(p => p._id !== currentProductId);
      }
    }

    if (products.length < 4) {
      const res  = await fetch(`${API_BASE}/api/products?sort=newest&limit=8`);
      const data = await res.json();
      if (data.success) {
        const extras = (data.products || []).filter(p =>
          p._id !== currentProductId &&
          !products.find(e => e._id === p._id)
        );
        products = [...products, ...extras];
      }
    }

    products = products.slice(0, 4);

    if (products.length === 0) {
      grid.closest("section")?.remove();
      return;
    }

    grid.innerHTML = products.map(renderCard).join("");

  } catch (err) {
    console.warn("Could not load recommended:", err.message);
    grid.closest("section")?.remove();
  }
}

// ==========================================
// RENDER CARD
// ==========================================
function renderCard(p) {
  const image        = p.images?.[0] || "images/placeholder.png";
  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  let discountBadge  = "";
  if (p.salePrice && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    discountBadge = `<span class="discount-badge">-${pct}%</span>`;
  }
  const priceHTML = p.salePrice && p.salePrice < p.price
    ? `<span class="current-price">$${p.salePrice}</span><span class="original-price">$${p.price}</span>${discountBadge}`
    : `<span class="current-price">$${p.price}</span>`;

  return `
    <div class="product-card"
      data-id="${p._id}" data-name="${p.name}"
      data-price="${displayPrice}" data-image="${image}">
      <div class="product-image-container">
        <img src="${image}" alt="${p.name}" class="product-image" />
        <button class="wishlist-btn" aria-label="Add to wishlist">
          <i class="ph ph-heart"></i>
        </button>
        <div class="card-hover-actions">
          <button class="btn btn-primary add-to-cart-btn">
            <i class="ph ph-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i>
          <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i>
          <i class="ph-fill ph-star-half"></i>
          <span class="rating-text">4.5/5</span>
        </div>
        <div class="product-price">${priceHTML}</div>
      </div>
    </div>`;
}

// ==========================================
// SIZE / COLOR / GALLERY / TABS
// ==========================================
function initSizeSelection() {
  document.querySelectorAll(".size-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".size-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function initColorSelection() {
  document.querySelectorAll(".color-swatch-circle").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".color-swatch-circle").forEach(b => {
        b.classList.remove("active");
        const i = b.querySelector("i"); if (i) i.style.display = "none";
      });
      btn.classList.add("active");
      const i = btn.querySelector("i"); if (i) i.style.display = "block";
    });
  });
}

function initGallery() {
  const mainImage = document.getElementById("main-product-image");
  document.querySelector(".thumbnail-list")?.addEventListener("click", e => {
    const thumb = e.target.closest(".thumb-btn");
    if (!thumb) return;
    document.querySelectorAll(".thumb-btn").forEach(t => t.classList.remove("active"));
    thumb.classList.add("active");
    if (mainImage) mainImage.src = thumb.dataset.image;
  });
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b  => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("active");
    });
  });
}

// ==========================================
// CART BUTTONS
// ==========================================
function initCartButtons() {
  const qtyInput = document.querySelector(".qty-input-main");

  document.querySelector(".qty-minus-main")?.addEventListener("click", () => {
    let v = parseInt(qtyInput.value);
    if (v > 1) qtyInput.value = v - 1;
  });
  document.querySelector(".qty-plus-main")?.addEventListener("click", () => {
    let v = parseInt(qtyInput.value);
    if (v < 99) qtyInput.value = v + 1;
  });

  const getSelection = () => {
    const container   = document.querySelector(".single-product-section");
    const activeSize  = document.querySelector(".size-pill-btn.active");
    const activeColor = document.querySelector(".color-swatch-circle.active");
    if (!activeSize) { showToast("Please select a size", "error"); return null; }
    return {
      id:       container?.dataset.id    || "",
      name:     container?.dataset.name  || "",
      price:    parseFloat(container?.dataset.price) || 0,
      image:    container?.dataset.image || "",
      size:     activeSize.textContent.trim(),
      color:    activeColor?.dataset.color || "",
      quantity: qtyInput ? parseInt(qtyInput.value) : 1
    };
  };

  // ✅ Add to Cart — calls backend API
  const handleAddToCart = async () => {
    if (!checkAuth("Please login to add to cart")) return;
    const item = getSelection();
    if (!item) return;

    const token = localStorage.getItem("token");
    if (token) {
      const data = await addToCartAPI(item.id, item.quantity);
      if (data?.success) {
        const count = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
        document.querySelectorAll(
          ".cart-count, .header-cart-badge, .cart-badge"
        ).forEach(badge => {
          badge.textContent   = count;
          badge.style.display = count > 0 ? "flex" : "none";
        });
        showCartConfirmModal(item);
      } else {
        showToast("Failed to add to cart", "error");
      }
    } else {
      addToCart(item);
      showCartConfirmModal(item);
    }
  };

  // ✅ Buy Now — calls backend API then redirects
  const handleBuyNow = async () => {
    if (!checkAuth("Please login to continue")) return;
    const item = getSelection();
    if (!item) return;

    const token = localStorage.getItem("token");
    if (token) {
      await addToCartAPI(item.id, item.quantity);
    } else {
      addToCart(item);
    }
    window.location.href = "checkout.html";
  };

  document.getElementById("add-to-cart-btn")?.addEventListener("click", handleAddToCart);
  document.querySelector(".add-to-cart-main-btn-sticky")?.addEventListener("click", handleAddToCart);
  document.getElementById("buy-now-btn")?.addEventListener("click", handleBuyNow);
  document.querySelector(".buy-now-main-btn-sticky")?.addEventListener("click", handleBuyNow);
}