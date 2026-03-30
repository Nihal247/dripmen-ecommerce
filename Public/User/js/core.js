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
    <i class="ph-fill ph-${type === "success" ? "check-circle" : "warning-circle"}"></i>
    <span>${message}</span>
  </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export function updateHeaderCounts() {
  const cart     = getCart();
  const wishlist = getWishlist();

  const cartCount     = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

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
  const wishlist    = getWishlist();
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


export async function toggleWishlist(btn) {
  const product = getProductDataFromElement(btn);
  if (!product) return;

  const token = localStorage.getItem("token");

  if (token) {
    // check if already in API wishlist
    const wishlistItems = await getWishlistFromAPI();
    const exists = wishlistItems.find(
      item => (item.product?._id || item.product) === product.id
    );

    if (exists) {
      // remove from API
      await removeFromWishlistAPI(product.id);
      btn.classList.remove("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-fill", "ph-heart");
        icon.classList.add("ph-heart");
      }
      showToast("Removed from wishlist");
    } else {
      // add to API
      await addToWishlistAPI(product.id);
      btn.classList.add("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-heart");
        icon.classList.add("ph-fill", "ph-heart");
      }
      showToast("Added to wishlist ❤️");
    }

    // update badge count
    const items = await getWishlistFromAPI();
    document.querySelectorAll(
      ".wishlist-count, .header-wishlist-badge, .wishlist-badge"
    ).forEach(badge => {
      badge.textContent   = items.length;
      badge.style.display = items.length > 0 ? "flex" : "none";
    });

  } else {
    // fallback localStorage
    let wishlist  = getWishlist();
    const index   = wishlist.findIndex(item => item.id === product.id);

    if (index === -1) {
      wishlist.push(product);
      btn.classList.add("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-heart");
        icon.classList.add("ph-fill", "ph-heart");
      }
      showToast("Added to wishlist ❤️");
    } else {
      wishlist.splice(index, 1);
      btn.classList.remove("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("ph-fill", "ph-heart");
        icon.classList.add("ph-heart");
      }
      showToast("Removed from wishlist");
    }

    saveWishlist(wishlist);
    updateHeaderCounts();
    window.dispatchEvent(new Event("wishlist-updated"));
  }
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
  const product = getProductDataFromElement(btn);
  if (!product) return;

  window.currentSelection = product;

  // if size modal exists — open it first
  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal) {
    const imgEl   = document.getElementById("size-modal-img");
    const nameEl  = document.getElementById("size-modal-name");
    const priceEl = document.getElementById("size-modal-price");
    if (imgEl)   imgEl.src           = product.image;
    if (nameEl)  nameEl.textContent  = product.name;
    if (priceEl) priceEl.textContent = `$${product.price}`;
    openModal(sizeModal);
    return;
  }

  // no size modal — call backend API directly
  const token = localStorage.getItem("token");
  if (token) {
    const data = await addToCartAPI(product.id, 1);
    if (data?.success) {
      const count = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
      document.querySelectorAll(
        ".cart-count, .header-cart-badge, .cart-badge"
      ).forEach(badge => {
        badge.textContent   = count;
        badge.style.display = count > 0 ? "flex" : "none";
      });
    }
  } else {
    // not logged in — fallback to localStorage
    addToCart({ ...product, size: "L", quantity: 1 });
  }

  showCartConfirmModal(product);
}

// ==========================================
// AUTH CHECK
// ==========================================

export function checkAuth(message = "Please login first") {
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
  if (priceEl) priceEl.textContent = `$${item.price}`;

  openModal(modal);
}

// ==========================================
// CART API FUNCTIONS
// ==========================================

const API = "http://localhost:4000";

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

export async function addToCartAPI(productId, quantity = 1) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res  = await fetch(`${API}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity })
    });
    return res.json();
  } catch (err) {
    console.error("addToCartAPI failed:", err);
    return null;
  }
}

export async function removeFromCartAPI(productId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${productId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.json();
  } catch (err) {
    console.error("removeFromCartAPI failed:", err);
    return null;
  }
}

export async function updateCartItemAPI(productId, quantity) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${productId}`, {
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

export async function addToWishlistAPI(productId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });
    return res.json();
  } catch (err) {
    console.error("addToWishlistAPI failed:", err);
    return null;
  }
}

export async function removeFromWishlistAPI(productId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist/${productId}`, {
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