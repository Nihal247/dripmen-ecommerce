// ==========================================
// GLOBAL UI UPDATES
// ==========================================
window.updateHeaderCounts = function () {
  const cart = getCart();
  const wishlist = getWishlist();

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistTotal = wishlist.length;

  const cartBadges = document.querySelectorAll('.header-cart-badge, .cart-badge');
  const wishlistBadges = document.querySelectorAll('.header-wishlist-badge, .wishlist-badge');

  cartBadges.forEach(badge => {
    badge.textContent = cartTotal;
    badge.style.display = cartTotal > 0 ? 'flex' : 'none';
  });

  wishlistBadges.forEach(badge => {
    badge.textContent = wishlistTotal;
    badge.style.display = wishlistTotal > 0 ? 'flex' : 'none';
  });
};

window.showToast = function (message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="ph-fill ph-${type === 'success' ? 'check-circle' : 'info'}"></i>
      <span>${message}</span>
    </div>
  `;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Auto hide after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// ==========================================
// MODAL MANAGEMENT
// ==========================================
window.openModal = function (modal) {
  if (modal) {
    modal.classList.add("active");
    const overlay = document.getElementById("modal-overlay") || document.getElementById("product-modal-overlay") || document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.closeAllModals = function () {
  document.querySelectorAll(".modal, .modal-overlay, .mobile-menu-overlay, .nav-links").forEach((m) => m.classList.remove("active"));
  const overlay = document.getElementById("modal-overlay") || document.getElementById("product-modal-overlay") || document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
};

window.closeModals = window.closeAllModals;

