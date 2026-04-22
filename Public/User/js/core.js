import { API_BASE_URL } from "./config.js";
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
  const simpleToast = document.getElementById("toast");
  if (simpleToast) {
    simpleToast.textContent = message;
    simpleToast.className = `toast show ${type}`;
    setTimeout(() => { simpleToast.classList.remove("show"); }, 2500);
    return;
  }

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
    <i class="ph-fill ph-₹{type === "success" ? "check-circle" : "warning-circle"}"></i>
    <span>${message}</span>
  </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export async function updateHeaderCounts() {
  let cartCount = 0;
  let wishlistCount = 0;
  
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const [cartItems, wishlistItems] = await Promise.all([
        getCartFromAPI(),
        getWishlistFromAPI()
      ]);
      cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      wishlistCount = wishlistItems.length;
    } catch (err) {
      console.warn("Failed to fetch header counts from API");
    }
  } else {
    const cart = getCart();
    const wishlist = getWishlist();
    cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    wishlistCount = wishlist.length;
  }

  document.querySelectorAll(
    ".cart-count, .header-cart-badge, .cart-badge"
  ).forEach(badge => {
    badge.textContent   = cartCount;
    badge.style.display = cartCount > 0 ? "flex" : "none";
  });

  document.querySelectorAll(
    ".wishlist-count, .header-wishlist-badge, .wishlist-badge"
  ).forEach(badge => {
    badge.textContent   = wishlistCount;
    badge.style.display = wishlistCount > 0 ? "flex" : "none";
  });
}

export function updateNavbarProfile() {
  const userStr = localStorage.getItem("dripmen_user");
  const userNameNav = document.getElementById("user-name-nav");
  
  if (userStr && userNameNav) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.name) {
        // Get first name for more professional fit
        const firstName = user.name.split(" ")[0];
        userNameNav.textContent = `Hi, ${firstName}`;
        userNameNav.style.display = "inline-block";
      }
    } catch (err) {
      console.warn("Could not parse user for navbar", err);
    }
  } else if (userNameNav) {
    userNameNav.style.display = "none";
  }
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
    stock: parseInt(container.dataset.stock || "0"),
    sizes: container.dataset.sizes ? JSON.parse(decodeURIComponent(container.dataset.sizes)) : []
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

export async function initializeWishlistState() {
  let wishlistIds = new Set();
  const token = localStorage.getItem("token");

  if (token) {
    const items = await getWishlistFromAPI();
    items.forEach(item => {
      const id = item.product?._id || item.product;
      if (id) wishlistIds.add(id);
    });
  } else {
    const wishlist = getWishlist();
    wishlist.forEach(item => { if (item.id) wishlistIds.add(item.id); });
  }

  document.querySelectorAll(".wishlist-btn, .wishlist-main").forEach(btn => {
    const product = getProductDataFromElement(btn);
    if (product && wishlistIds.has(product.id)) {
      btn.classList.add("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-heart");
        icon.classList.add("ph-fill", "ph-heart");
      }
    } else if (product) {
       btn.classList.remove("active");
       const icon = btn.querySelector("i");
       if (icon) {
         icon.classList.remove("ph-fill", "ph-heart");
         icon.classList.add("ph-heart");
       }
    }
  });
}


export async function toggleWishlist(btn) {
  if (!checkAuth("Please login to manage your wishlist")) return;
  
  const product = getProductDataFromElement(btn);
  if (!product) return;

  const isActive = btn.classList.contains("active");

  // Optimistic UI for removal
  if (isActive) {
    btn.classList.remove("active");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.remove("ph-fill", "ph-heart");
      icon.classList.add("ph-heart");
    }
    showToast("Removed from wishlist");
    
    try {
      await removeFromWishlistAPI(product.id);
      updateHeaderCounts();
    } catch (err) {
      console.error("Removal failed", err);
      // Revert if failed? Or just leave it. Usually better to stay quiet unless it's critical.
    }
    return;
  }

  // For addition, we might need a size if the product has sizes
  // But first, check if it's already in wishlist just in case (though isActive check covers most)
  let exists = false;
  try {
    const wishlistItems = await getWishlistFromAPI();
    exists = wishlistItems.find(
      item => (item.product?._id || item.product) === product.id
    );
  } catch (err) {
    console.warn("Could not verify wishlist existence", err);
  }

  if (exists) {
    // If somehow it was already in wishlist but button wasn't active
    showToast("Already in wishlist ❤️");
    btn.classList.add("active");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.remove("ph-heart");
      icon.classList.add("ph-fill", "ph-heart");
    }
    return;
  }

  // If has sizes, open modal first
  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal && product.sizes && product.sizes.length > 0) {
    window.currentSelection = product;
    window.wishlistAction   = true;
    window.wishlistBtn      = btn;

    const imgEl   = document.getElementById("size-modal-img");
    const nameEl  = document.getElementById("size-modal-name");
    const priceEl = document.getElementById("size-modal-price");
    const titleEl = sizeModal.querySelector(".modal-title");
    const confirmBtn = document.getElementById("confirm-size-btn");

    if (imgEl)   imgEl.src           = product.image;
    if (nameEl)  nameEl.textContent  = product.name;
    if (priceEl) priceEl.textContent = `₹${product.price}`;
    if (titleEl) titleEl.textContent = "Select Size for Wishlist";
    if (confirmBtn) confirmBtn.textContent = "Add to Wishlist";

    // Populate Sizes dynamically (reusing logic from handleGridAddToCart)
    const sizeContainer = sizeModal.querySelector(".size-options-grid");
    if (sizeContainer) {
      sizeContainer.innerHTML = "";
      const availableSizes = product.sizes.filter(s => s.stock > 0);
      if (availableSizes.length > 0) {
        availableSizes.forEach((s, index) => {
          const btn = document.createElement("button");
          btn.className = `size-btn ${index === 0 ? "active" : ""}`;
          btn.dataset.size = s.size;
          btn.textContent = s.size;
          sizeContainer.appendChild(btn);
        });
      } else {
        sizeContainer.innerHTML = `<p style="color:var(--danger)">No sizes in stock.</p>`;
      }
    }

    openModal(sizeModal);
    return;
  }

  // No sizes — add directly
  await addToWishlistAPI(product.id);
  btn.classList.add("active");
  const icon = btn.querySelector("i");
  if (icon) {
    icon.classList.remove("ph-heart");
    icon.classList.add("ph-fill", "ph-heart");
  }
  showToast("Added to wishlist ❤️");
  updateHeaderCounts();
}

// ==========================================
// CART (localStorage — fallback)
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
      id:       product.id,
      name:     product.name,
      price:    Number(product.price),
      image:    product.image,
      size:     product.size  || "L",
      color:    product.color || "Black",
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

export async function handleGridAddToCart(btn) {
  if (!checkAuth("Please login to add to cart")) return;

  const product = getProductDataFromElement(btn);
  if (!product) return;

  // 📝 Stock Check
  if (product.stock <= 0) {
    showToast(`${product.name} is out of stock`, "error");
    return;
  }

  window.currentSelection = product;

  // if size modal exists and product has sizes — open it first
  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal && product.sizes && product.sizes.length > 0) {
    const imgEl   = document.getElementById("size-modal-img");
    const nameEl  = document.getElementById("size-modal-name");
    const priceEl = document.getElementById("size-modal-price");
    if (imgEl)   imgEl.src           = product.image;
    if (nameEl)  nameEl.textContent  = product.name;
    if (priceEl) priceEl.textContent = `₹${product.price}`;

    // Populating Sizes dynamically
    const sizeContainer = sizeModal.querySelector(".size-options-grid");
    if (sizeContainer && product.sizes && product.sizes.length > 0) {
      sizeContainer.innerHTML = "";
      
      const availableSizes = product.sizes.filter(s => s.stock > 0);
      
      if (availableSizes.length > 0) {
        availableSizes.forEach((s, index) => {
          const btn = document.createElement("button");
          btn.className = `size-btn ${index === 0 ? "active" : ""}`;
          btn.dataset.size = s.size;
          btn.textContent = s.size;
          sizeContainer.appendChild(btn);
        });
      } else {
        sizeContainer.innerHTML = `<p class="text-muted text-sm" style="color:var(--danger)">No sizes in stock.</p>`;
      }
    }

    openModal(sizeModal);
    return;
  }

  // no size modal — call backend API directly
  const data = await addToCartAPI(product.id, 1);
  if (data?.success) {
    const count = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll(
      ".cart-count, .header-cart-badge, .cart-badge"
    ).forEach(badge => {
      badge.textContent   = count;
      badge.style.display = count > 0 ? "flex" : "none";
    });
    showCartConfirmModal(product);
  } else if (data?.message) {
    showToast(data.message, "error");
  }
}

// ==========================================
// AUTH CHECK
// ==========================================

export function checkAuth(message = "Please login first") {
  const isLoggedIn = !!localStorage.getItem("token");

  if (!isLoggedIn) {
    showToast(message, "error");
    const authModal = document.getElementById("auth-modal");
    if (authModal) {
      openModal(authModal);
    } else {
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
    }
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

  const overlay =
    document.getElementById("modal-overlay") ||
    document.querySelector(".modal-overlay");
  if (overlay) overlay.classList.add("active");

  document.body.style.overflow = "hidden";

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAllModals();
  }, { once: true });

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
  const modal = document.getElementById("cart-modal");
  if (!modal) {
    showToast(`"${item.name}" added to cart! 🛒`);
    return;
  }

  const nameEl  = document.getElementById("cart-modal-name");
  const imgEl   = document.getElementById("cart-modal-img");
  const priceEl = document.getElementById("cart-modal-price");

  if (nameEl)  nameEl.textContent = item.name  || "";
  if (imgEl)   imgEl.src          = item.image  || "";
  if (priceEl) priceEl.textContent = `₹${item.price}`;

  openModal(modal);
}

// ==========================================
// CART API FUNCTIONS
// ==========================================

const API = API_BASE_URL;

export async function getCartFromAPI() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const res  = await fetch(`${API}/api/cart`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("getCartFromAPI failed:", err);
    return [];
  }
}

export async function addToCartAPI(productId, quantity = 1, size = "N/A", color = "Black") {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res  = await fetch(`${API}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity, size, color })
    });
    return res.json();
  } catch (err) {
    console.error("addToCartAPI failed:", err);
    return null;
  }
}

export async function removeFromCartAPI(itemId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${itemId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.json();
  } catch (err) {
    console.error("removeFromCartAPI failed:", err);
    return null;
  }
}

export async function updateCartItemAPI(itemId, quantity) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });
    return res.json();
  } catch (err) {
    console.error("updateCartItemAPI failed:", err);
    return null;
  }
}

// ==========================================
// WISHLIST API FUNCTIONS
// ==========================================

export async function getWishlistFromAPI() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const res  = await fetch(`${API}/api/wishlist`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("getWishlistFromAPI failed:", err);
    return [];
  }
}

export async function addToWishlistAPI(productId, size = "N/A") {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId, size })
    });
    return res.json();
  } catch (err) {
    console.error("addToWishlistAPI failed:", err);
    return null;
  }
}

export async function removeFromWishlistAPI(productId, size = null) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const url = size ? `${API}/api/wishlist/${productId}?size=${size}` : `${API}/api/wishlist/${productId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.json();
  } catch (err) {
    console.error("removeFromWishlistAPI failed:", err);
    return null;
  }
}

export async function clearWishlistAPI() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.json();
  } catch (err) {
    console.error("clearWishlistAPI failed:", err);
    return null;
  }
}

// ==========================================
// COUPON API FUNCTIONS
// ==========================================

export async function getAvailableCouponsAPI() {
  try {
    const res = await fetch(`${API}/api/coupons/available`);
    const data = await res.json();
    return data.success ? data.coupons : [];
  } catch (err) {
    console.error("getAvailableCouponsAPI failed:", err);
    return [];
  }
}

export async function applyCouponAPI(code, cartTotal) {
  const token = localStorage.getItem("token");
  if (!token) return { success: false, message: "Please login to apply coupon" };
  try {
    const res = await fetch(`${API}/api/coupons/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ code, cartTotal })
    });
    return res.json();
  } catch (err) {
    console.error("applyCouponAPI failed:", err);
    return { success: false, message: "Failed to apply coupon" };
  }
}