// ==========================================
// IMPORT ALL MODULES
// ==========================================
import {
  updateHeaderCounts,
  initializeWishlistState,
  toggleWishlist,
  handleGridAddToCart,
  checkAuth,
  addToCart,
  addToCartAPI,
  showToast,
  openModal,
  closeAllModals,
  showCartConfirmModal
} from "./core.js";

import { renderLayout } from "./layout.js";
import { initAuthSystem } from "./services/auth.js";

// Page modules
import { initHomePage } from "./pages/homePage.js";
import { initProductFilters } from "./pages/productFilters.js";
import { initProductPage } from "./pages/productPage.js";
import { initCartPage } from "./pages/cartPage.js";
import { initWishlistPage } from "./pages/wishlistPage.js";
import { initCheckoutPage } from "./pages/checkoutPage.js";
import { initSignupPage } from "./pages/signupPage.js";
import { initLoginPage } from "./pages/login.js";
import { initForgotPasswordPage } from "./pages/forgotPasswordPage.js";
import { initResetPasswordPage } from "./pages/resetPasswordPage.js";
import { initOrdersPage } from "./pages/ordersPage.js";
import { initOrderDetailsPage } from "./pages/orderDetailsPage.js";
import { initAddressPage } from "./pages/addressPage.js";
import { initContactPage } from "./pages/contactPage.js";
import { initPaymentPage } from "./pages/paymentPage.js";
import { initReturnsPage } from "./pages/returnsPage.js";
import { initCancellationsPage } from "./pages/cancellationsPage.js";
import { initAccountPage } from "./pages/accountPage.js";

// ==========================================
// INIT ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------------------
  // 1. LAYOUT: Render navbar + footer on all pages
  // ----------------------------------------
  renderLayout();

  // ----------------------------------------
  // 2. AUTH: Set up login modal & account dropdown
  // ----------------------------------------
  initAuthSystem();

  // ----------------------------------------
  // 3. HEADER COUNTS: Always update cart/wishlist badges
  // ----------------------------------------
  updateHeaderCounts();

  // ----------------------------------------
  // 4. WISHLIST STATE: Highlight filled hearts
  // ----------------------------------------
  initializeWishlistState();

  // ----------------------------------------
  // 5. MOBILE MENU
  // ----------------------------------------
  const mobileMenuBtn     = document.querySelector(".mobile-menu-btn");
  const navLinks          = document.querySelector(".nav-links");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      if (mobileMenuOverlay) mobileMenuOverlay.classList.toggle("active");
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        if (navLinks.classList.contains("active")) {
          icon.classList.replace("ph-list", "ph-x");
        } else {
          icon.classList.replace("ph-x", "ph-list");
        }
      }
    });
    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener("click", () => {
        navLinks.classList.remove("active");
        mobileMenuOverlay.classList.remove("active");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) icon.classList.replace("ph-x", "ph-list");
      });
    }
  }

  // ----------------------------------------
  // 6. GLOBAL CLICK DELEGATION
  // ----------------------------------------
  document.body.addEventListener("click", async (e) => {
    const target = e.target;

    // ---- Wishlist button ----
    const wishlistBtn = target.closest(".wishlist-btn, .wishlist-main");
    if (wishlistBtn) {
      e.preventDefault();
      if (!checkAuth("Please login to add to wishlist")) return;
      toggleWishlist(wishlistBtn);
      return;
    }

    // ---- Add to Cart (product grid cards) ----
    const addToCartBtn = target.closest(".add-to-cart-btn");
    if (addToCartBtn && !addToCartBtn.classList.contains("add-to-cart-main-btn")) {
      e.preventDefault();
      if (!checkAuth("Please login to add to cart")) return;
      handleGridAddToCart(addToCartBtn);
      return;
    }

    // ---- Size button in modal ----
    const sizeBtn = target.closest(".size-btn");
    if (sizeBtn) {
      const container = sizeBtn.closest(".size-options-grid, .size-selection-container");
      if (container) {
        container.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        sizeBtn.classList.add("active");
      }
      return;
    }

    // ---- Confirm size in size-selection-modal ----
    if (target.closest("#confirm-size-btn")) {
      if (!window.currentSelection) { closeAllModals(); return; }

      const activeSizeBtn = document.querySelector(".modal.active .size-btn.active");
      if (!activeSizeBtn) { showToast("Please select a size", "error"); return; }

      const size  = activeSizeBtn.dataset.size || activeSizeBtn.textContent.trim();
      const token = localStorage.getItem("token");

      if (token) {
        // ✅ call backend API
        const data = await addToCartAPI(window.currentSelection.id, 1);
        if (data?.success) {
          const count = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
          document.querySelectorAll(
            ".cart-count, .header-cart-badge, .cart-badge"
          ).forEach(badge => {
            badge.textContent   = count;
            badge.style.display = count > 0 ? "flex" : "none";
          });
          showToast("Added to cart 🛒");
        } else {
          showToast("Failed to add to cart", "error");
        }
      } else {
        // fallback localStorage
        addToCart({ ...window.currentSelection, size, quantity: 1 });
      }

      closeAllModals();
      setTimeout(() => showCartConfirmModal(window.currentSelection), 300);
      return;
    }

    // ---- Go to Cart button in cart modal ----
    if (target.closest(".go-to-cart-btn")) {
      window.location.href = "cart.html";
      return;
    }

    // ---- Proceed to checkout in Buy Now modal ----
    if (target.closest(".proceed-checkout-btn")) {
      window.location.href = "checkout.html";
      return;
    }

    // ---- Close any modal ----
    if (target.closest(
      ".close-modal, .modal-close, .cancel-btn, .continue-shopping-btn, .modal-overlay"
    )) {
      closeAllModals();
      return;
    }

    // ---- Announcement bar close ----
    if (target.closest(".close-announcement")) {
      const bar = document.getElementById("announcement-bar");
      if (bar) bar.style.display = "none";
      return;
    }

    // ---- Payment method selection (checkout page) ----
    const paymentOpt = target.closest(".payment-option-modern");
    if (paymentOpt) {
      document.querySelectorAll(".payment-option-modern").forEach(el =>
        el.classList.remove("active")
      );
      paymentOpt.classList.add("active");
      const radio = paymentOpt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      return;
    }

    // ---- Product card click → navigate to product page ----
    const productCard = target.closest(".product-card");
    const isInteractive = target.closest(
      "button, a, .wishlist-btn, .add-to-cart-btn, .card-hover-actions, .remove-wishlist-btn"
    );
    if (productCard && !isInteractive) {
      const id = productCard.dataset.id;
      window.location.href = id ? `product.html?id=${id}` : "product.html";
      return;
    }
  });

  // ----------------------------------------
  // 7. GLOBAL SEARCH (Enter key)
  // ----------------------------------------
  document.querySelectorAll(".search-container input").forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") window.location.href = "products.html";
    });
  });

  // ----------------------------------------
  // 8. PAGE SPECIFIC INIT
  // ----------------------------------------

  if (document.getElementById("new-arrivals-grid")) {
    initHomePage();
  }

  if (document.getElementById("products-grid")) {
    initProductFilters();
  }

  if (document.querySelector(".single-product-section")) {
    initProductPage();
  }

  if (document.getElementById("cart-items-container")) {
    initCartPage();
  }

  if (document.getElementById("wishlist-grid")) {
    initWishlistPage();
  }

  if (
    document.getElementById("place-order-btn-modern") ||
    document.getElementById("checkout-form")
  ) {
    initCheckoutPage();
  }

  if (document.getElementById("orders-list")) {
    initOrdersPage();
  }

  if (document.querySelector(".invoice-container")) {
    initOrderDetailsPage();
  }

  if (document.getElementById("returns-list")) {
    initReturnsPage();
  }

  if (document.getElementById("cancellations-list")) {
    initCancellationsPage();
  }

  if (document.getElementById("address-grid")) {
    initAddressPage();
  }

  if (document.getElementById("contact-form")) {
    initContactPage();
  }

  if (document.getElementById("payment-grid")) {
    initPaymentPage();
  }

  if (document.getElementById("loginForm")) {
    initLoginPage();
  }

  if (document.getElementById("signup-form")) {
    initSignupPage();
  }

  if (document.getElementById("fp-email-form")) {
    initForgotPasswordPage();
  }

  if (document.getElementById("reset-password-form")) {
    initResetPasswordPage();
  }

  if (document.getElementById("account-form")) {
    initAccountPage();
  }

});