// ==========================================
// IMPORTS
// ==========================================
import {
  getWishlist,
  saveWishlist,
  getCart,
  saveCart,
  addToCart,
  checkAuth,
  showToast,
  updateHeaderCounts
} from "../core.js";

// ==========================================
// PAGE: WISHLIST
// ==========================================
export function initWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  if (!grid) return;

  function render() {
    const wishlist = getWishlist();
    if (wishlist.length === 0) {
      document.getElementById("empty-wishlist-state").style.display = "block";
      document.getElementById("wishlist-content").style.display = "none";
      return;
    }

    document.getElementById("empty-wishlist-state").style.display = "none";
    document.getElementById("wishlist-content").style.display = "block";

    grid.innerHTML = wishlist.map((item, index) => `
      <div class="wishlist-card product-card" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}" style="border: none; background: transparent; padding: 0;">
        <button class="remove-wishlist-btn" data-index="${index}"><i class="ph-fill ph-trash"></i></button>
        <div class="wishlist-img-wrapper" style="background-color: var(--bg-card); border-radius: var(--radius-lg); padding: 10px; margin-bottom: 1rem; overflow: hidden; display: flex; justify-content: center; align-items: center; aspect-ratio: 1/1;">
          <img src="${item.image}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <div class="wishlist-info" style="padding: 0 0.25rem;">
          <h3 class="product-name" style="font-weight: 800; font-size: 1.15rem; margin-bottom: 0.35rem; color: var(--text-main); text-transform: capitalize;">${item.name}</h3>
          <div class="product-rating" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.6rem;">
            <div class="stars" style="color: var(--accent-yellow); display: flex; gap: 3px; font-size: 1rem;">
              <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star-half"></i>
            </div>
            <span class="rating-text">${item.rating || '4.5'}/5</span>
          </div>
          <div class="price-container" style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="product-price" style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">$${item.price}</span>
          </div>
          <button class="btn btn-primary full-width add-to-cart-wishlist-btn" data-index="${index}" style="margin-top: 1rem; padding: 0.5rem; font-size: 0.9rem;">Add to Cart</button>
        </div>
      </div>
    `).join('');
  }

  // Event Delegation for Wishlist Grid
  grid.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-wishlist-btn');
    if (removeBtn) {
      const index = removeBtn.dataset.index;
      let wishlist = getWishlist();
      wishlist.splice(index, 1);
      saveWishlist(wishlist);
      render();
      updateHeaderCounts();
      showToast("Removed from wishlist");
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-wishlist-btn');
    if (addBtn) {
      if (!checkAuth("Please login to add to cart")) return;
      const index = addBtn.dataset.index;
      let wishlist = getWishlist();
      const item = wishlist[index];
      addToCart({ ...item, quantity: 1 });
    }
  });

  // Move All to Cart
  const moveAllBtn = document.getElementById("move-all-to-cart-btn");
  if (moveAllBtn) {
    moveAllBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to move items")) return;
      let wishlist = getWishlist();
      if (wishlist.length === 0) {
        showToast("Wishlist is empty", "info");
        return;
      }

      let cart = getCart();
      wishlist.forEach(item => {
        const existingIndex = cart.findIndex(c => c.id === item.id && c.size === (item.size || 'L') && c.color === (item.color || 'Black'));
        if (existingIndex > -1) {
          cart[existingIndex].quantity += 1;
        } else {
          cart.push({ ...item, quantity: 1, size: item.size || 'L', color: item.color || 'Black' });
        }
      });

      saveCart(cart);
      saveWishlist([]); // Clear wishlist
      render();
      updateHeaderCounts();
      showToast("All items moved to cart");
    });
  }

  window.addEventListener('wishlist-updated', render);
  render();
}