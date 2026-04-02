// ==========================================
// IMPORTS
// ==========================================
import {
  getWishlist,
  saveWishlist,
  addToCart,
  addToCartAPI,
  getWishlistFromAPI,
  removeFromWishlistAPI,
  clearWishlistAPI,
  checkAuth,
  showToast,
  updateHeaderCounts
} from "../core.js";

const API = "http://localhost:4000";

// ==========================================
// BADGE UPDATE HELPER
// ==========================================
function updateCartBadge(count) {
  document.querySelectorAll(
    ".cart-count, .header-cart-badge, .cart-badge"
  ).forEach(badge => {
    badge.textContent   = count;
    badge.style.display = count > 0 ? "flex" : "none";
  });
}

function updateWishlistBadge(count) {
  document.querySelectorAll(
    ".wishlist-count, .header-wishlist-badge, .wishlist-badge"
  ).forEach(badge => {
    badge.textContent   = count;
    badge.style.display = count > 0 ? "flex" : "none";
  });
}

// ==========================================
// PAGE: WISHLIST
// ==========================================
export function initWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  if (!grid) return;

  // ── render ───────────────────────────────
  function render(items) {
    if (!items || items.length === 0) {
      document.getElementById("empty-wishlist-state").style.display = "block";
      document.getElementById("wishlist-content").style.display     = "none";
      return;
    }

    document.getElementById("empty-wishlist-state").style.display = "none";
    document.getElementById("wishlist-content").style.display     = "block";

    grid.innerHTML = items.map((item, index) => {

      // support both API format { product: {...} } and localStorage format
      const productId = item.product?._id || item.id  || "";
      const name      = item.product?.name || item.name || "Unknown";
      const price     = item.product?.price|| item.price|| 0;
      const image     = item.product?.images?.[0] || item.image || "";
      const rating    = item.rating || "4.5";

      return `
        <div class="wishlist-card product-card"
          data-id="${productId}"
          data-name="${name}"
          data-price="${price}"
          data-image="${image}"
          style="border:none;background:transparent;padding:0;">

          <button class="remove-wishlist-btn" data-id="${productId}" data-index="${index}">
            <i class="ph-fill ph-trash"></i>
          </button>

          <div class="wishlist-img-wrapper" style="background-color:var(--bg-card);border-radius:var(--radius-lg);padding:10px;margin-bottom:1rem;overflow:hidden;display:flex;justify-content:center;align-items:center;aspect-ratio:1/1;">
            <img src="${image}" style="width:100%;height:100%;object-fit:contain;">
          </div>

          <div class="wishlist-info" style="padding:0 0.25rem;">
            <h3 class="product-name" style="font-weight:800;font-size:1.15rem;margin-bottom:0.35rem;color:var(--text-main);text-transform:capitalize;">
              ${name}
            </h3>

            <div class="product-rating" style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;font-weight:600;color:var(--text-main);margin-bottom:0.6rem;">
              <div class="stars" style="color:var(--accent-yellow);display:flex;gap:3px;font-size:1rem;">
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star-half"></i>
              </div>
              <span class="rating-text">${rating}/5</span>
            </div>

            <div class="price-container" style="display:flex;align-items:center;gap:0.75rem;">
              <span class="product-price" style="font-size:1.4rem;font-weight:800;color:var(--text-main);">
                $${price}
              </span>
            </div>

            <button class="btn btn-primary full-width add-to-cart-wishlist-btn"
                    data-id="${productId}" data-index="${index}"
                    style="margin-top:1rem;padding:0.5rem;font-size:0.9rem;">
              Add to Cart
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── load wishlist ─────────────────────────
  async function loadWishlist() {
    const token = localStorage.getItem("token");

    if (token) {
      const items = await getWishlistFromAPI();
      render(items);
      updateWishlistBadge(items.length);
    } else {
      const wishlist = getWishlist();
      render(wishlist);
    }
  }

  // ── click handler ─────────────────────────
  grid.addEventListener("click", async (e) => {

    // remove from wishlist
    const removeBtn = e.target.closest(".remove-wishlist-btn");
    if (removeBtn) {
      const productId = removeBtn.dataset.id;
      const token     = localStorage.getItem("token");

      if (token && productId) {
        await removeFromWishlistAPI(productId);
        const items = await getWishlistFromAPI();
        render(items);
        updateWishlistBadge(items.length);
        showToast("Removed from wishlist");
      } else {
        const index  = removeBtn.dataset.index;
        let wishlist = getWishlist();
        wishlist.splice(index, 1);
        saveWishlist(wishlist);
        render(wishlist);
        updateHeaderCounts();
        showToast("Removed from wishlist");
      }
      return;
    }

    // add to cart
    const addBtn = e.target.closest(".add-to-cart-wishlist-btn");
    if (addBtn) {
      if (!checkAuth("Please login to add to cart")) return;

      const productId = addBtn.dataset.id;
      const token     = localStorage.getItem("token");

      addBtn.textContent = "Moving...";
      addBtn.disabled    = true;

      // Since checkAuth passed, token & productId MUST exist for a professional flow
      const data = await addToCartAPI(productId, 1);
      if (data?.success) {
        // 🚀 PROFESSIONAL FIX: Remove from wishlist after moving to cart
        await removeFromWishlistAPI(productId);
        
        const count = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
        updateCartBadge(count);
        
        // Refresh wishlist display
        const items = await getWishlistFromAPI();
        render(items);
        updateWishlistBadge(items.length);
        
        showToast("Moved to cart 🛒");
      } else {
        showToast("Failed to move to cart", "error");
        addBtn.textContent = "Add to Cart";
        addBtn.disabled    = false;
      }
      return;
    }
  });

  // ── move all to cart ──────────────────────
  const moveAllBtn = document.getElementById("move-all-to-cart-btn");
  if (moveAllBtn) {
    moveAllBtn.addEventListener("click", async () => {
      if (!checkAuth("Please login to move items")) return;

      const token = localStorage.getItem("token");

      if (token) {
        const items = await getWishlistFromAPI();
        if (items.length === 0) {
          showToast("Wishlist is empty", "info");
          return;
        }

        moveAllBtn.textContent = "Moving...";
        moveAllBtn.disabled    = true;

        for (const item of items) {
          const productId = item.product?._id || item.id;
          if (productId) await addToCartAPI(productId, 1);
        }

        // update cart badge
        const res  = await fetch(`${API}/api/cart`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const count = (data.items || []).reduce((sum, i) => sum + i.quantity, 0);
        updateCartBadge(count);

        // clear wishlist
        await clearWishlistAPI();
        updateWishlistBadge(0);
        render([]);
        showToast("All items moved to cart 🛒");

        moveAllBtn.textContent = "Move All to Cart →";
        moveAllBtn.disabled    = false;

      } else {
        const wishlist = getWishlist();
        if (wishlist.length === 0) {
          showToast("Wishlist is empty", "info");
          return;
        }
        wishlist.forEach(item => addToCart({ ...item, quantity: 1 }));
        saveWishlist([]);
        render([]);
        updateHeaderCounts();
        showToast("All items moved to cart 🛒");
      }
    });
  }

  window.addEventListener("wishlist-updated", loadWishlist);
  loadWishlist();
}