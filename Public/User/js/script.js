import './config.js';
import './services.js';
import './ui.js';
import { toggleWishlist, handleGridAddToCart, showCartConfirmModal, initializeWishlistState, getProductDataFromElement } from './core.js';
import { renderLayout } from './layout.js';
import { initAuthSystem } from './auth.js';
import { 
    initProductFilters, initProductPage, initCartPage, initWishlistPage, 
    initCheckoutPage, initAddressPage, initContactPage, initOrderDetailsPage, 
    initOrdersPage, initReturnsPage, initCancellationsPage, initPaymentPage,
    initSignupPage, initForgotPasswordPage
} from './pages.js';

// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderLayout(); // Inject Navbar and Footer first
  updateHeaderCounts();
  initializeWishlistState();
  initAuthSystem(); // Initialize Auth Logic

  // 1. Mobile Menu Logic
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      if (mobileMenuOverlay) mobileMenuOverlay.classList.toggle("active");
      const icon = mobileMenuBtn.querySelector("i");
      if (navLinks.classList.contains("active")) {
        icon.classList.replace("ph-list", "ph-x");
      } else {
        icon.classList.replace("ph-x", "ph-list");
      }
    });
  }

  // 2. Global Interactions (Event Delegation)
  document.body.addEventListener('click', function (e) {
    const target = e.target;

    // Wishlist Toggle
    const wishlistBtn = target.closest('.wishlist-btn, .wishlist-main');
    if (wishlistBtn) {
      e.preventDefault();
      if (!checkAuth("Please login to add to wishlist")) return;
      toggleWishlist(wishlistBtn);
      return;
    }

    // Add to Cart Buttons (Grid/Slider)
    const addToCartBtn = target.closest('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.classList.contains('add-to-cart-main-btn')) {
      e.preventDefault();
      if (!checkAuth("Please login to add to cart")) return;
      handleGridAddToCart(addToCartBtn);
      return;
    }

    // Size Selection Button within Modal
    const sizeBtn = target.closest('.size-selection-container .size-btn, .size-options-grid .size-btn');
    if (sizeBtn) {
      const parent = sizeBtn.parentElement;
      parent.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      sizeBtn.classList.add('active');
      return;
    }

    // Modal Size Confirmation
    const confirmSizeBtn = target.closest('#confirm-size-btn');
    if (confirmSizeBtn) {
      if (!window.currentSelection) {
        closeAllModals();
        return;
      }
      const activeSizeBtn = document.querySelector(".modal.active .size-btn.active");
      if (!activeSizeBtn) {
        showToast("Please select a size", "error");
        return;
      }
      const size = activeSizeBtn.getAttribute('data-size') || activeSizeBtn.textContent.trim();
      addToCart({ ...window.currentSelection, size, quantity: 1 });
      closeAllModals();
      setTimeout(() => showCartConfirmModal(window.currentSelection), 300);
      return;
    }

    // Go to Cart button in modal
    const goToCartBtn = target.closest('.go-to-cart-btn');
    if (goToCartBtn) {
      window.location.href = 'cart.html';
      return;
    }

    // Modal Close
    if (target.closest('.modal-close, .close-modal, .cancel-btn, .continue-shopping-btn, .modal-overlay')) {
      closeAllModals();
      return;
    }

    // Announcement Close
    if (target.closest('.close-announcement')) {
      const banner = document.getElementById('announcement-bar');
      if (banner) banner.style.display = 'none';
      return;
    }

    // Payment Selection
    const paymentOpt = target.closest('.payment-option-modern');
    if (paymentOpt) {
      document.querySelectorAll('.payment-option-modern').forEach(el => el.classList.remove('active'));
      paymentOpt.classList.add('active');
      const radio = paymentOpt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      return;
    }

    // Product Card Redirection
    const productCard = target.closest('.product-card');
    const isInteractive = target.closest('button') || target.closest('a') || target.closest('.wishlist-btn') || target.closest('.add-to-cart-btn') || target.closest('.card-hover-actions') || target.closest('.remove-wishlist-btn');
    
    if (productCard && !isInteractive) {
      window.location.href = "product.html";
      return;
    }
  });

  // 3. Page Specific Logic Initialization
  if (document.querySelector(".product-page")) initProductPage();
  if (document.querySelector(".cart-page")) initCartPage();
  if (document.querySelector(".wishlist-page")) initWishlistPage();
  if (document.querySelector(".checkout-page")) initCheckoutPage();
  if (document.querySelector(".address-page")) initAddressPage();
  if (document.querySelector(".payment-page")) initPaymentPage();
  if (document.querySelector(".orders-page")) initOrdersPage();
  if (document.querySelector(".returns-page")) initReturnsPage();
  if (document.querySelector(".cancellations-page")) initCancellationsPage();
  if (document.querySelector(".products-page")) initProductFilters();
  if (document.querySelector(".contact-page")) initContactPage();
  if (document.querySelector(".order-details-page")) initOrderDetailsPage();
  if (document.getElementById("fp-email-form")) initForgotPasswordPage();
  if (document.getElementById("signup-form")) initSignupPage();

  // Global search enter
  document.querySelectorAll(".search-container input").forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") window.location.href = "products.html";
    });
  });
});

// ==========================================
// AUTHENTICATION SYSTEM
