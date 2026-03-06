// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  getCart,
  saveCart,
  updateHeaderCounts,
  checkAuth,
  showToast
} from "../core.js";


// ==========================================
// PAGE: CART
// ==========================================
export function initCartPage() {

  const container = document.getElementById("cart-items-container");
  if (!container) return;


  function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
      document.getElementById("empty-cart-state").style.display = "block";
      document.getElementById("cart-layout").style.display = "none";
      return;
    }

    document.getElementById("empty-cart-state").style.display = "none";
    document.getElementById("cart-layout").style.display = "grid";


    container.innerHTML = cart.map((item, index) => {

      if (!item || !item.id) return "";

      return `
        <div class="cart-item" data-index="${index}">
        
          <div class="cart-item-img">
            <img src="${item.image || ''}">
          </div>

          <div class="cart-item-details">

            <div class="cart-item-header">
              <h3 class="cart-item-title">
                ${item.name || 'Unknown Product'}
              </h3>

              <button class="remove-cart-item-btn remove-btn" data-index="${index}">
                <i class="ph-fill ph-trash"></i>
              </button>
            </div>

            <p class="cart-item-meta">
              Size: ${item.size || 'N/A'} | Color: ${item.color || 'Black'}
            </p>

            <div class="cart-item-actions">

              <span class="cart-item-price">
                $${item.price || 0}
              </span>

              <div class="qty-stepper">

                <button class="qty-change"
                        data-index="${index}"
                        data-delta="-1"
                        ${item.quantity <= 1 ? 'disabled' : ''}>
                  <i class="ph ph-minus"></i>
                </button>

                <input type="number"
                       class="qty-input"
                       value="${item.quantity || 1}"
                       readonly>

                <button class="qty-change"
                        data-index="${index}"
                        data-delta="1">
                  <i class="ph ph-plus"></i>
                </button>

              </div>

            </div>

          </div>

        </div>
      `;

    }).join("");

    updateSummary();
  }



  function updateSummary() {

    const cart = getCart();

    const subtotal = cart.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const threshold = 200;

    const delivery =
      subtotal >= threshold || subtotal === 0
        ? 0
        : 20;

    document.getElementById("summary-subtotal").textContent =
      `$${subtotal}`;

    document.getElementById("summary-delivery").textContent =
      delivery === 0 ? "Free" : `$${delivery}`;

    document.getElementById("summary-total").textContent =
      `$${subtotal + delivery}`;

    // Update mobile sticky bar
    const mobileTotal = document.getElementById("mobile-summary-total");
    const mobileSticky = document.getElementById("mobile-sticky-checkout");
    if (mobileTotal) mobileTotal.textContent = `$${subtotal + delivery}`;
    if (mobileSticky) mobileSticky.style.display = getCart().length > 0 ? "flex" : "none";

    // Show/hide shipping progress bar
    const progressContainer = document.getElementById("shipping-progress-container");
    if (progressContainer) progressContainer.style.display = getCart().length > 0 ? "block" : "none";

    const progressFill = document.getElementById("shipping-progress-fill");
    const shippingMsg = document.getElementById("shipping-message");

    if (progressFill && shippingMsg) {

      const percent = Math.min(100, (subtotal / threshold) * 100);

      progressFill.style.width = `${percent}%`;

      shippingMsg.innerHTML =
        subtotal >= threshold
          ? "🎉 Free shipping applied!"
          : `Add $${threshold - subtotal} more for FREE shipping`;

    }

  }



  container.addEventListener("click", (e) => {

    const cart = getCart();

    const removeBtn = e.target.closest(".remove-cart-item-btn");

    if (removeBtn) {

      const index = removeBtn.dataset.index;

      cart.splice(index, 1);

      saveCart(cart);

      renderCart();

      updateHeaderCounts();

      return;

    }



    const qtyBtn = e.target.closest(".qty-change");

    if (qtyBtn) {

      const index = qtyBtn.dataset.index;

      const delta = parseInt(qtyBtn.dataset.delta);

      cart[index].quantity += delta;

      saveCart(cart);

      renderCart();

      updateHeaderCounts();

    }

  });



  renderCart();



  // Checkout buttons

  const checkoutBtn = document.getElementById("go-checkout-btn");

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (checkAuth("Please login to checkout")) {
        window.location.href = "checkout.html";
      }
    });
  }



  const mobileCheckoutBtn =
    document.getElementById("go-checkout-btn-mobile");

  if (mobileCheckoutBtn) {
    mobileCheckoutBtn.addEventListener("click", () => {
      if (checkAuth("Please login to checkout")) {
        window.location.href = "checkout.html";
      }
    });
  }



  // Coupon logic

  const applyPromoBtn = document.getElementById("apply-promo-btn");

  if (applyPromoBtn) {

    applyPromoBtn.addEventListener("click", () => {

      if (!checkAuth("Please login to apply coupon")) return;

      const input = document.getElementById("promo-input");
      const msg = document.getElementById("promo-message");

      if (input && input.value.trim() === "DRIP20") {

        if (msg) {
          msg.textContent = "Coupon applied successfully!";
          msg.className = "promo-message success";
        }

      } else {

        if (msg) {
          msg.textContent = "Invalid coupon code";
          msg.className = "promo-message error";
        }

      }

    });

  }

}