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

<<<<<<< HEAD
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

=======
export function updateHeaderCounts() {
  const cart     = getCart();
  const wishlist = getWishlist();

  const cartCount     = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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

<<<<<<< HEAD
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
=======
export function initializeWishlistState() {
  const wishlist    = getWishlist();
  const wishlistIds = new Set(wishlist.map(item => item.id));
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

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
<<<<<<< HEAD
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
=======
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
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
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
=======
  const product = getProductDataFromElement(btn);
  if (!product) return;

  window.currentSelection = product;

  // if size modal exists — open it first
  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal) {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    const imgEl   = document.getElementById("size-modal-img");
    const nameEl  = document.getElementById("size-modal-name");
    const priceEl = document.getElementById("size-modal-price");
    if (imgEl)   imgEl.src           = product.image;
    if (nameEl)  nameEl.textContent  = product.name;
<<<<<<< HEAD
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

=======
    if (priceEl) priceEl.textContent = `$${product.price}`;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    openModal(sizeModal);
    return;
  }

  // no size modal — call backend API directly
<<<<<<< HEAD
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
=======
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
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
  if (priceEl) priceEl.textContent = `₹${item.price}`;
=======
  if (priceEl) priceEl.textContent = `$${item.price}`;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

  openModal(modal);
}

// ==========================================
// CART API FUNCTIONS
// ==========================================

<<<<<<< HEAD
const API = "http://127.0.0.1:4000";
=======
const API = "http://localhost:4000";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

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

<<<<<<< HEAD
export async function addToCartAPI(productId, quantity = 1, size = "N/A", color = "Black") {
=======
export async function addToCartAPI(productId, quantity = 1) {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res  = await fetch(`${API}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
<<<<<<< HEAD
      body: JSON.stringify({ productId, quantity, size, color })
=======
      body: JSON.stringify({ productId, quantity })
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    });
    return res.json();
  } catch (err) {
    console.error("addToCartAPI failed:", err);
    return null;
  }
}

<<<<<<< HEAD
export async function removeFromCartAPI(itemId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${itemId}`, {
=======
export async function removeFromCartAPI(productId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${productId}`, {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return res.json();
  } catch (err) {
    console.error("removeFromCartAPI failed:", err);
    return null;
  }
}

<<<<<<< HEAD
export async function updateCartItemAPI(itemId, quantity) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${itemId}`, {
=======
export async function updateCartItemAPI(productId, quantity) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/cart/${productId}`, {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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

<<<<<<< HEAD
export async function addToWishlistAPI(productId, size = "N/A") {
=======
export async function addToWishlistAPI(productId) {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
<<<<<<< HEAD
      body: JSON.stringify({ productId, size })
=======
      body: JSON.stringify({ productId })
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    });
    return res.json();
  } catch (err) {
    console.error("addToWishlistAPI failed:", err);
    return null;
  }
}

<<<<<<< HEAD
export async function removeFromWishlistAPI(productId, size = null) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const url = size ? `${API}/api/wishlist/${productId}?size=${size}` : `${API}/api/wishlist/${productId}`;
    const res = await fetch(url, {
=======
export async function removeFromWishlistAPI(productId) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/wishlist/${productId}`, {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
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
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
}