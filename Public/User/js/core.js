// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

export function getCart() {
  return JSON.parse(localStorage.getItem("dripmen_cart") || "[]");
}

export function saveCart(cart) {
  localStorage.setItem("dripmen_cart", JSON.stringify(cart));
}

export function getWishlist() {
  return JSON.parse(localStorage.getItem("dripmen_wishlist") || "[]");
}

export function saveWishlist(wishlist) {
  localStorage.setItem("dripmen_wishlist", JSON.stringify(wishlist));
}

// ==========================================
// UI HELPERS
// ==========================================

export function showToast(message, type = "success") {
  // Try the simple #toast element first (product.html)
  const simpleToast = document.getElementById("toast");
  if (simpleToast) {
    simpleToast.textContent = message;
    simpleToast.className = `toast show ${type}`;
    setTimeout(() => { simpleToast.classList.remove("show"); }, 2500);
    return;
  }

  // Fallback: create a dynamic toast (all other pages)
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `<div class="toast-content">
    <i class="ph-fill ph-${type === "success" ? "check-circle" : "warning-circle"}"></i>
    <span>${message}</span>
  </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 3000);
}

export function updateHeaderCounts() {
  const cart = getCart();
  const wishlist = getWishlist();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Support both naming conventions used across pages
  document.querySelectorAll(
    ".cart-count, .header-cart-badge, .cart-badge"
  ).forEach(badge => {
    badge.textContent = cartCount;
    badge.style.display = cartCount > 0 ? "flex" : "none";
  });

  document.querySelectorAll(
    ".wishlist-count, .header-wishlist-badge, .wishlist-badge"
  ).forEach(badge => {
    badge.textContent = wishlistCount;
    badge.style.display = wishlistCount > 0 ? "flex" : "none";
  });
}

// ==========================================
// PRODUCT DATA EXTRACTION
// ==========================================

export function getProductDataFromElement(el) {
  const container =
    el.closest("[data-id]") ||
    el.closest(".product-card") ||
    el.closest(".single-product-section");

  if (!container) return null;

  const data = {
    id: container.dataset.id || "",
    name:
      container.dataset.name ||
      container.querySelector(".product-name, .product-title-main")
        ?.textContent?.trim() || "",
    price: parseFloat(
      container.dataset.price ||
      container.querySelector(".current-price, .current-price-main")
        ?.textContent.replace(/[^0-9.]/g, "") || "0"
    ),
    image:
      container.dataset.image ||
      container.querySelector(".product-image, .main-image")?.src || "",
    rating: parseFloat(
      container.dataset.rating ||
      container.querySelector(".rating-text, .rating-value")
        ?.textContent.split("/")[0] || "4.5"
    ),
  };

  if (!data.id || !data.name || data.price <= 0 || !data.image) {
    console.warn("Missing product attributes", container);
    return null;
  }

  return data;
}

// ==========================================
// WISHLIST STATE INITIALIZATION
// ==========================================

export function initializeWishlistState() {
  const wishlist = getWishlist();
  const wishlistIds = new Set(wishlist.map(item => item.id));

  document.querySelectorAll(".wishlist-btn, .wishlist-main").forEach(btn => {
    const product = getProductDataFromElement(btn);
    if (product && wishlistIds.has(product.id)) {
      btn.classList.add("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-heart");
        icon.classList.add("ph-fill", "ph-heart");
      }
    }
  });
}

// ==========================================
// WISHLIST TOGGLE
// ==========================================

export function toggleWishlist(btn) {
  const product = getProductDataFromElement(btn);
  if (!product) return;

  let wishlist = getWishlist();
  const index = wishlist.findIndex(item => item.id === product.id);

  if (index === -1) {
    wishlist.push(product);
    btn.classList.add("active");
    const icon = btn.querySelector("i");
    if (icon) { icon.classList.remove("ph-heart"); icon.classList.add("ph-fill", "ph-heart"); }
    showToast("Added to wishlist ❤️");
  } else {
    wishlist.splice(index, 1);
    btn.classList.remove("active");
    const icon = btn.querySelector("i");
    if (icon) { icon.classList.remove("ph-fill", "ph-heart"); icon.classList.add("ph-heart"); }
    showToast("Removed from wishlist");
  }

  saveWishlist(wishlist);
  updateHeaderCounts();
  window.dispatchEvent(new Event("wishlist-updated"));
}

// ==========================================
// CART
// ==========================================

export function addToCart(product) {
  let cart = getCart();

  const existing = cart.find(
    item =>
      item.id === product.id &&
      item.size === product.size &&
      item.color === (product.color || "Black")
  );

  if (existing) {
    existing.quantity += product.quantity || 1;
    showToast("Cart updated ✔️");
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      size: product.size || "L",
      color: product.color || "Black",
      quantity: product.quantity || 1,
    });
    showToast("Added to cart 🛒");
  }

  saveCart(cart);
  updateHeaderCounts();
  window.dispatchEvent(new Event("cart-updated"));
}

// ==========================================
// GRID ADD TO CART (from product cards)
// ==========================================

export function handleGridAddToCart(btn) {
  const product = getProductDataFromElement(btn);
  if (!product) return;

  // Store current selection for the size modal flow
  window.currentSelection = product;

  // Try to show the size-selection modal
  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal) {
    const imgEl = document.getElementById("size-modal-img");
    const nameEl = document.getElementById("size-modal-name");
    const priceEl = document.getElementById("size-modal-price");
    if (imgEl) imgEl.src = product.image;
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `$${product.price}`;
    openModal(sizeModal);
    return;
  }

  // No size modal — add immediately with default size
  addToCart({ ...product, size: "L", quantity: 1 });
  showCartConfirmModal(product);
}

// ==========================================
// AUTH CHECK
// ==========================================

export function checkAuth(message = "Please login first") {
  // Support both token storage keys used by auth.js
  const isLoggedIn =
    localStorage.getItem("dripmen_token") === "true" ||
    !!localStorage.getItem("token") ||
    !!localStorage.getItem("dripmen_user");

  if (!isLoggedIn) {
    showToast(message, "error");
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
    return false;
  }
  return true;
}

// ==========================================
// MODALS
// ==========================================

export function closeAllModals() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("active");
  });
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.classList.remove("active");
  });
  document.body.style.overflow = "";
}

export function openModal(modal) {
  if (!modal) return;
  closeAllModals();
  modal.classList.add("active");

  // Also activate overlay if present
  const overlay =
    document.getElementById("modal-overlay") ||
    document.querySelector(".modal-overlay");
  if (overlay) overlay.classList.add("active");

  document.body.style.overflow = "hidden";

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAllModals();
  }, { once: true });

  // Close on .close-modal / .close-btn button click
  const closeBtn = modal.querySelector(
    ".close-modal, .modal-close, .close-btn, [data-close-modal]"
  );
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAllModals, { once: true });
  }
}

// ==========================================
// CART CONFIRM MODAL
// ==========================================

export function showCartConfirmModal(item) {
  // The HTML uses id="cart-modal" (not "cart-confirm-modal")
  const modal = document.getElementById("cart-modal");
  if (!modal) {
    showToast(`"${item.name}" added to cart! 🛒`);
    return;
  }

  const nameEl = document.getElementById("cart-modal-name");
  const imgEl = document.getElementById("cart-modal-img");
  const priceEl = document.getElementById("cart-modal-price");

  if (nameEl) nameEl.textContent = item.name || "";
  if (imgEl) imgEl.src = item.image || "";
  if (priceEl) priceEl.textContent = `$${item.price}`;

  openModal(modal);
}