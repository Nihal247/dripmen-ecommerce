// ==========================================
// IMPORTS
// ==========================================
import {
  getProductDataFromElement,
  showToast,
  checkAuth,
  addToCart,
  showCartConfirmModal
} from "../core.js";

// ==========================================
// PAGE: PRODUCT
// ==========================================
export function initProductPage() {
  const container = document.querySelector('.single-product-section');
  if (!container) return;

  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const mobileAddToCartBtn = document.querySelector('.add-to-cart-main-btn-sticky');
  const mobileBuyNowBtn = document.querySelector('.buy-now-main-btn-sticky');
  const qtyInput = document.querySelector(".qty-input-main");
  const minusBtn = document.querySelector(".qty-minus-main");
  const plusBtn = document.querySelector(".qty-plus-main");

  // Quantity Logic
  if (minusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });
  }
  if (plusBtn && qtyInput) {
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val < 12) qtyInput.value = val + 1;
    });
  }

  // Size Selection
  const sizeBtns = document.querySelectorAll('.size-pill-btn:not(.disabled)');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Color Selection
  const colorBtns = document.querySelectorAll('.color-swatch-circle');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => {
        b.classList.remove('active');
        const check = b.querySelector('.ph-check');
        if (check) check.style.display = 'none';
      });
      btn.classList.add('active');
      const check = btn.querySelector('.ph-check');
      if (check) check.style.display = 'block';
    });
  });

  // Helper to get current selection
  const getSelection = () => {
    const product = getProductDataFromElement(container);
    if (!product) return null;
    const activeSize = document.querySelector(".size-pill-btn.active");
    const activeColor = document.querySelector(".color-swatch-circle.active") || document.querySelector(".color-swatch.active");

    if (!activeSize) {
      showToast("Please select a size", "error");
      return null;
    }
    return {
      ...product,
      size: activeSize.textContent.trim(),
      color: activeColor ? (activeColor.getAttribute('data-color') || activeColor.getAttribute('aria-label')) : 'Black',
      quantity: qtyInput ? parseInt(qtyInput.value) : 1
    };
  };

  const handleAddToCart = () => {
    if (!checkAuth("Please login to add to cart")) return;
    const item = getSelection();
    if (item) {
      addToCart(item);
      showCartConfirmModal(item);
    }
  };

  const handleBuyNow = () => {
    if (!checkAuth("Please login to continue")) return;
    const item = getSelection();
    if (item) {
      addToCart(item);
      window.location.href = "checkout.html";
    }
  };

  if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);
  if (mobileAddToCartBtn) mobileAddToCartBtn.addEventListener('click', handleAddToCart);

  if (buyNowBtn) buyNowBtn.addEventListener('click', handleBuyNow);
  if (mobileBuyNowBtn) mobileBuyNowBtn.addEventListener('click', handleBuyNow);

  // Image Gallery
  const mainImage = document.getElementById('main-product-image');
  const thumbs = document.querySelectorAll('.thumb-btn');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImage) mainImage.src = thumb.dataset.image;
    });
  });

  // Product Tabs Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}