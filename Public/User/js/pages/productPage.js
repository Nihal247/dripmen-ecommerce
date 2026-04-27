import { API_BASE_URL } from "../config.js";
import {
  showToast,
  checkAuth,
  addToCart,
  addToCartAPI,
  showCartConfirmModal,
  initializeWishlistState,
  optimizeImage
} from "../core.js";

const API_BASE = API_BASE_URL;

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
      loadReviews(productId); // NEW: Load real reviews
      checkReviewEligibility(productId); // NEW: Check if user can review
      initializeWishlistState();
    }
  }

  initGallery();
  initTabs();
  initCartButtons();
}

// ==========================================
// REVIEWS SYSTEM
// ==========================================
async function loadReviews(productId) {
  const listContainer = document.getElementById("reviews-list-container");
  const avgRatingEl   = document.getElementById("avg-rating");
  const reviewCountEl = document.getElementById("review-count");

  if (!listContainer) return;

  try {
    const res  = await fetch(`${API_BASE}/api/reviews/${productId}`);
    const data = await res.json();

    if (data.success) {
      avgRatingEl.textContent   = data.averageRating.toFixed(1);
      reviewCountEl.textContent = data.count;

      if (data.reviews.length === 0) {
        listContainer.innerHTML = `<p class="text-muted" style="padding: 2rem; text-align: center;">No reviews yet. Be the first to share your experience!</p>`;
        return;
      }

      listContainer.innerHTML = data.reviews.map(rev => `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${rev.user?.name || "Customer"}</span>
            <span class="review-date">${new Date(rev.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="stars review-stars">
            ${renderStars(rev.rating)}
          </div>
          <p class="review-body">${rev.comment}</p>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Load reviews failed", err);
  }
}

function renderStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars += `<i class="ph-fill ph-star"></i>`;
    else if (i - 0.5 <= rating)   stars += `<i class="ph-fill ph-star-half"></i>`;
    else                         stars += `<i class="ph ph-star"></i>`;
  }
  return stars;
}

async function checkReviewEligibility(productId) {
  const container = document.getElementById("review-form-container");
  const token     = localStorage.getItem("token");

  if (!container || !token) {
    if (container) container.innerHTML = `<p class="text-muted" style="background:#f8f9fa; padding:1rem; border-radius:8px;">Please <a href="login.html" style="color:var(--primary);">login</a> to check if you are eligible to leave a review.</p>`;
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/api/reviews/check/${productId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.eligible) {
      container.innerHTML = `
        <div class="review-form-box" style="background:#f8f9fa; padding:1.5rem; border-radius:12px;">
          <h4 style="margin-bottom:1rem;">Write a Review</h4>
          <form id="submit-review-form">
            <div style="margin-bottom:1rem;">
              <label style="display:block; margin-bottom:0.5rem;">Your Rating</label>
              <div class="rating-stars-input" style="font-size:1.5rem; color:#facc15; cursor:pointer;">
                <i class="ph ph-star" data-val="1"></i>
                <i class="ph ph-star" data-val="2"></i>
                <i class="ph ph-star" data-val="3"></i>
                <i class="ph ph-star" data-val="4"></i>
                <i class="ph ph-star" data-val="5"></i>
              </div>
              <input type="hidden" name="rating" id="review-rating-val" value="0">
            </div>
            <div style="margin-bottom:1rem;">
              <textarea name="comment" placeholder="What did you like or dislike? How was the fit?" required style="width:100%; border:1px solid #ddd; padding:10px; border-radius:8px; min-height:100px; font-family:inherit;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Review</button>
          </form>
        </div>
      `;
      initReviewFormLogic(productId);
    } else {
      container.innerHTML = `<p class="text-muted" style="background:#f8f9fa; padding:1rem; border-radius:8px; font-size:0.9rem;">
        <i class="ph ph-info" style="vertical-align:middle; margin-right:5px;"></i>
        ${data.message || "Only verified purchasers of this item can leave a review."}
      </p>`;
    }
  } catch (err) {
    console.error("Check eligibility failed", err);
  }
}

function initReviewFormLogic(productId) {
  const form  = document.getElementById("submit-review-form");
  const stars = document.querySelectorAll(".rating-stars-input i");
  const input = document.getElementById("review-rating-val");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      const val = parseInt(star.dataset.val);
      input.value = val;
      stars.forEach(s => {
        const sVal = parseInt(s.dataset.val);
        if (sVal <= val) {
          s.classList.remove("ph");
          s.classList.add("ph-fill");
        } else {
          s.classList.remove("ph-fill");
          s.classList.add("ph");
        }
      });
    });
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const val   = parseInt(input.value);

    if (val === 0) {
      showToast("Please select a star rating", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          rating: val,
          comment: form.comment.value
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Review submitted! Thank you. ✅");
        loadReviews(productId);
        document.getElementById("review-form-container").innerHTML = `<p class="text-success" style="padding:1rem; background:#ecfdf5; border-radius:8px;">Your review has been submitted. Thank you for your feedback!</p>`;
      } else {
        showToast(data.message || "Failed to submit review", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };
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
  const container = document.querySelector(".single-product-section");
  if (!container) return;

  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  
  // Store metadata for cart actions
  container.dataset.id    = p._id;
  container.dataset.name  = p.name;
  container.dataset.price = displayPrice;
  container.dataset.image = p.images?.[0] || "";
  container.dataset.stock = p.stock || "0";
  container.dataset.sizes = JSON.stringify(p.sizes || []);

  document.title = `DripMen | ${p.name}`;
  
  // Update Breadcrumb
  const bc = document.getElementById("breadcrumb-product-name");
  if (bc) bc.textContent = p.name;

  // Render Full Content
  const image = optimizeImage(p.images?.[0] || "images/placeholder.png", 800);
  
  const discountHTML = p.salePrice && p.salePrice < p.price 
    ? `<span class="original-price-main">₹${p.price}</span>
       <span class="discount-badge-main">-${Math.round(((p.price - p.salePrice) / p.price) * 100)}%</span>`
    : "";

  container.innerHTML = `
    <div class="product-layout-grid">
      <!-- Gallery Left -->
      <div class="product-gallery">
        <div class="thumbnail-list">
          ${(p.images?.length ? p.images : [p.images?.[0], p.images?.[0], p.images?.[0]]).map((img, i) => `
            <button class="thumb-btn ${i === 0 ? "active" : ""}" data-image="${optimizeImage(img, 800)}">
              <img src="${optimizeImage(img, 150)}" alt="${p.name} view ${i + 1}" loading="lazy" />
            </button>
          `).join("")}
        </div>

        <div class="main-image-container" id="main-image-container">
          <img src="${image}" alt="${p.name}" class="main-image" id="main-product-image" />
          <button class="wishlist-btn wishlist-main" aria-label="Add to wishlist">
            <i class="ph ph-heart"></i>
          </button>
        </div>
      </div>

      <!-- Product Info Right -->
      <div class="product-info-details">
        <h1 class="product-title-main">${p.name}</h1>

        <div class="product-rating-box">
          <div class="stars">
            <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i>
            <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i>
            <i class="ph-fill ph-star-half"></i>
          </div>
          <span class="rating-value">4.5/5</span>
          <span class="review-count">(128 reviews)</span>
        </div>

        <div class="product-price-box">
          <span class="current-price-main">₹${displayPrice}</span>
          ${discountHTML}
        </div>

        <div class="stock-status"></div>

        <p class="product-desc-short">${p.description || ""}</p>

        <hr class="product-divider" />

        <div class="color-selector-section">
          <p class="selector-label">Select Colors</p>
          <div class="color-options-row">
            ${(p.colors || ["Black"]).map((color, i) => {
              const key = color.toLowerCase().trim();
              const cssClass = COLOR_MAP[key] || "";
              const style = cssClass ? "" : `style="background-color:${color};"`;
              return `
                <button class="color-swatch-circle ${cssClass} ${i === 0 ? "active" : ""}"
                  aria-label="${color}" data-color="${color}" ${style}>
                  <i class="ph ph-check" ${i !== 0 ? 'style="display:none"' : ""}></i>
                </button>`;
            }).join("")}
          </div>
        </div>

        <div class="size-selector-section">
          <p class="selector-label">Choose Size</p>
          <div class="size-options-row">
            ${(p.sizes || []).map((s, i) => {
              const isOutOfStock = s.stock <= 0;
              return `
                <button class="size-pill-btn ${i === 0 && !isOutOfStock ? "active" : ""} ${isOutOfStock ? "out-of-stock" : ""}" 
                  data-size="${s.size}" data-stock="${s.stock}" ${isOutOfStock ? "disabled" : ""}>
                  ${s.size}
                </button>`;
            }).join("")}
          </div>
        </div>

        <div class="product-actions-row">
          <div class="quantity-stepper">
            <button class="qty-btn-large qty-minus-main"><i class="ph ph-minus"></i></button>
            <input type="number" class="qty-input-main" value="1" min="1" max="10" readonly />
            <button class="qty-btn-large qty-plus-main"><i class="ph ph-plus"></i></button>
          </div>

          <div class="action-buttons-wrapper">
            <button class="btn btn-primary add-to-cart-main-btn add-to-cart-btn" id="add-to-cart-btn">Add to Cart</button>
            <button class="btn btn-primary buy-now-main-btn" id="buy-now-btn">Buy Now</button>
          </div>
        </div>

        <div class="trust-info-box">
          <div class="trust-row"><i class="ph ph-truck"></i><span>Free delivery above ₹100</span></div>
          <div class="trust-row"><i class="ph ph-arrow-counter-clockwise"></i><span>Easy 7-day returns</span></div>
          <div class="trust-row"><i class="ph ph-lock-key"></i><span>Secure payment</span></div>
        </div>
      </div>
    </div>
  `;

  // Update Description Tab
  const tabDescEl = document.querySelector("#tab-desc");
  if (tabDescEl) tabDescEl.innerHTML = `<p>${p.description || ""}</p>`;

  // Update Sticky Bar
  const stickyPrice = document.querySelector(".sticky-price");
  if (stickyPrice) stickyPrice.textContent = `₹${displayPrice}`;

  // Re-initialize listeners and initial states
  initGallery();
  initColorSelection();
  initSizeSelection();
  initCartButtons();
  
  // Set initial stock status based on selected size
  const activeSize = container.querySelector(".size-pill-btn.active");
  if (activeSize) {
    updateStockStatus(activeSize.dataset.size, activeSize.dataset.stock);
  } else {
    updateStockStatus("N/A", p.stock || 0);
  }

  // Sync wishlist icon
  initializeWishlistState();
}

function updateStockStatus(size, stock) {
  const stockEl = document.querySelector(".stock-status");
  const cartBtn = document.getElementById("add-to-cart-btn");
  const buyBtn  = document.getElementById("buy-now-btn");
  const stickyCartBtn = document.querySelector(".add-to-cart-main-btn-sticky");
  const stickyBuyBtn  = document.querySelector(".buy-now-main-btn-sticky");
  
  const s = parseInt(stock);
  const isOutOfStock = s <= 0;

  if (stockEl) {
    if (isOutOfStock) {
      stockEl.className = "stock-status out-of-stock";
      stockEl.innerHTML = `<span class="status-dot"></span> Out of Stock`;
      stockEl.style.color = "#ef4444";
    } else if (s <= 5) {
      stockEl.className = "stock-status low-stock";
      stockEl.innerHTML = `<span class="status-dot"></span> Only ${s} left!`;
      stockEl.style.color = "#f97316";
    } else {
      stockEl.className = "stock-status in-stock";
      stockEl.innerHTML = `<span class="status-dot"></span> In Stock`;
      stockEl.style.color = "#10b981";
    }
  }

  // Update button states
  const updateBtn = (btn, out) => {
    if (!btn) return;
    btn.disabled = out;
    if (out) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<i class="ph ph-prohibit"></i> Out of Stock`;
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
    } else {
      if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }
  };

  updateBtn(cartBtn, isOutOfStock);
  updateBtn(buyBtn, isOutOfStock);
  updateBtn(stickyCartBtn, isOutOfStock);
  updateBtn(stickyBuyBtn, isOutOfStock);
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

    // Show Skeletons
    grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
      </div>
    `).join("");

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
  const image        = optimizeImage(p.images?.[0] || "images/placeholder.png", 500);
  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  let discountBadge  = "";
  if (p.salePrice && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    discountBadge = `<span class="discount-badge">-${pct}%</span>`;
  }
  const priceHTML = p.salePrice && p.salePrice < p.price
    ? `<span class="current-price">₹${p.salePrice}</span><span class="original-price">₹${p.price}</span>${discountBadge}`
    : `<span class="current-price">₹${p.price}</span>`;

  return `
    <div class="product-card"
      data-id="${p._id}" data-name="${p.name}" data-stock="${p.stock}"
      data-price="${displayPrice}" data-image="${image}"
      data-sizes="${encodeURIComponent(JSON.stringify(p.sizes || []))}">
      <div class="product-image-container">
        <img src="${image}" alt="${p.name}" class="product-image" loading="lazy" />
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
      if (btn.classList.contains("out-of-stock")) return;
      
      document.querySelectorAll(".size-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Update stock display
      updateStockStatus(btn.dataset.size, btn.dataset.stock);
      
      // Reset quantity to 1 when changing size to avoid exceeding new limit
      const qtyInput = document.querySelector(".qty-input-main");
      if (qtyInput) qtyInput.value = 1;
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
  const MAX_LIMIT_PER_ITEM = 10;

  document.querySelector(".qty-minus-main")?.addEventListener("click", () => {
    let v = parseInt(qtyInput.value);
    if (v > 1) qtyInput.value = v - 1;
  });

  document.querySelector(".qty-plus-main")?.addEventListener("click", () => {
    const activeSize = document.querySelector(".size-pill-btn.active");
    if (!activeSize) {
      showToast("Please select a size first", "error");
      return;
    }

    const stock = parseInt(activeSize.dataset.stock || "0"); 
    let v = parseInt(qtyInput.value);

    if (v >= MAX_LIMIT_PER_ITEM) {
      showToast(`Maximum ${MAX_LIMIT_PER_ITEM} items allowed`, "error");
      return;
    }
    if (v >= stock) {
      showToast(`Only ${stock} items in stock`, "error");
      return;
    }

    qtyInput.value = v + 1;
  });

  const getSelection = () => {
    const container   = document.querySelector(".single-product-section");
    const activeSize  = document.querySelector(".size-pill-btn.active");
    const activeColor = document.querySelector(".color-swatch-circle.active");
    if (!activeSize && document.querySelectorAll(".size-pill-btn").length > 0) { 
      showToast("Please select a size", "error"); 
      return null; 
    }
    return {
      id:       container?.dataset.id    || "",
      name:     container?.dataset.name  || "",
      price:    parseFloat(container?.dataset.price) || 0,
      image:    container?.dataset.image || "",
      size:     activeSize ? activeSize.textContent.trim() : "N/A",
      color:    activeColor?.dataset.color || "Black",
      quantity: qtyInput ? parseInt(qtyInput.value) : 1
    };
  };

  // ✅ Add to Cart — calls backend API
  const handleAddToCart = async (e) => {
    const btn = e.currentTarget;
    const item = getSelection();
    if (!item) return;

    if (!checkAuth("Please login to add to cart")) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-circle-notch spinning"></i> Adding...`;
    btn.disabled = true;

    try {
      const data = await addToCartAPI(item.id, item.quantity, item.size, item.color);
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
        showToast(data?.message || "Failed to add to cart", "error");
      }
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  };

  // ✅ Buy Now — isolates item for checkout
  const handleBuyNow = async () => {
    const item = getSelection();
    if (!item) return;

    if (!checkAuth("Please login to continue")) return;

    // 🚀 Isolation: Store in special 'buy_now' key for checkoutPage.js
    localStorage.setItem("dripmen_buy_now_item", JSON.stringify({
      product:  item.id,
      name:     item.name,
      price:    item.price,
      image:    item.image,
      size:     item.size,
      color:    item.color,
      quantity: item.quantity
    }));

    window.location.href = "checkout.html";
  };

  document.getElementById("add-to-cart-btn")?.addEventListener("click", handleAddToCart);
  document.querySelector(".add-to-cart-main-btn-sticky")?.addEventListener("click", handleAddToCart);
  document.getElementById("buy-now-btn")?.addEventListener("click", handleBuyNow);
  document.querySelector(".buy-now-main-btn-sticky")?.addEventListener("click", handleBuyNow);
}