// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  getCart,
  saveCart,
  updateHeaderCounts,
  checkAuth,
  showToast,
  getCartFromAPI,
  removeFromCartAPI,
  updateCartItemAPI
} from "../core.js";

// ==========================================
// PAGE: CART
// ==========================================
export function initCartPage() {

  const container = document.getElementById("cart-items-container");
  if (!container) return;

  // ── render ──────────────────────────────
  async function renderCart() {
    const token = localStorage.getItem("token");
    const cart  = token ? await getCartFromAPI() : getCart();

    if (cart.length === 0) {
      document.getElementById("empty-cart-state").style.display = "block";
      document.getElementById("cart-layout").style.display      = "none";
      return;
    }

    document.getElementById("empty-cart-state").style.display = "none";
    document.getElementById("cart-layout").style.display      = "grid";

    container.innerHTML = cart.map((item, index) => {

      // support both API format { product: {...}, quantity }
      // and localStorage format { id, name, price, image, quantity }
      const id    = item.product?._id    || item.id    || "";
      const name  = item.product?.name   || item.name  || "Unknown Product";
      const price = item.product?.price  || item.price || 0;
      const image = item.product?.images?.[0] || item.image || "";
      const qty   = item.quantity || 1;
      const size  = item.size  || "N/A";
      const color = item.color || "Black";

      if (!id) return "";

      return `
        <div class="cart-item" data-id="${id}" data-index="${index}">

          <div class="cart-item-img">
            <img src="${image}">
          </div>

          <div class="cart-item-details">

            <div class="cart-item-header">
              <h3 class="cart-item-title">${name}</h3>
              <button class="remove-cart-item-btn remove-btn"
                      data-id="${id}" data-index="${index}">
                <i class="ph-fill ph-trash"></i>
              </button>
            </div>

            <p class="cart-item-meta">
              Size: ${size} | Color: ${color}
            </p>

            <div class="cart-item-actions">
              <span class="cart-item-price">$${price}</span>

              <div class="qty-stepper">
                <button class="qty-change"
                        data-id="${id}" data-index="${index}" data-delta="-1"
                        ${qty <= 1 ? "disabled" : ""}>
                  <i class="ph ph-minus"></i>
                </button>
                <input type="number" class="qty-input" value="${qty}" readonly>
                <button class="qty-change"
                        data-id="${id}" data-index="${index}" data-delta="1">
                  <i class="ph ph-plus"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
    }).join("");

    updateSummary(cart);
  }

  // ── summary ─────────────────────────────
  function updateSummary(cart) {
    cart = cart || getCart();

    const subtotal = cart.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    const threshold = 200;
    const delivery  = subtotal >= threshold || subtotal === 0 ? 0 : 20;

    document.getElementById("summary-subtotal").textContent =
      `$${subtotal}`;
    document.getElementById("summary-delivery").textContent =
      delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("summary-total").textContent =
      `$${subtotal + delivery}`;

    const mobileTotal  = document.getElementById("mobile-summary-total");
    const mobileSticky = document.getElementById("mobile-sticky-checkout");
    if (mobileTotal)  mobileTotal.textContent  = `$${subtotal + delivery}`;
    if (mobileSticky) mobileSticky.style.display = cart.length > 0 ? "flex" : "none";

    const progressContainer = document.getElementById("shipping-progress-container");
    if (progressContainer)
      progressContainer.style.display = cart.length > 0 ? "block" : "none";

    const progressFill = document.getElementById("shipping-progress-fill");
    const shippingMsg  = document.getElementById("shipping-message");
    if (progressFill && shippingMsg) {
      const percent = Math.min(100, (subtotal / threshold) * 100);
      progressFill.style.width = `${percent}%`;
      shippingMsg.innerHTML =
        subtotal >= threshold
          ? "🎉 Free shipping applied!"
          : `Add $${threshold - subtotal} more for FREE shipping`;
    }
  }

  // ── click handler ────────────────────────
  container.addEventListener("click", async (e) => {

    const removeBtn = e.target.closest(".remove-cart-item-btn");
    if (removeBtn) {
      const productId = removeBtn.dataset.id;
      const token     = localStorage.getItem("token");

      if (token && productId) {
        await removeFromCartAPI(productId);
      } else {
        const cart = getCart();
        cart.splice(removeBtn.dataset.index, 1);
        saveCart(cart);
      }

      renderCart();
      updateHeaderCounts();
      return;
    }

    const qtyBtn = e.target.closest(".qty-change");
    if (qtyBtn) {
      const productId = qtyBtn.dataset.id;
      const delta     = parseInt(qtyBtn.dataset.delta);
      const token     = localStorage.getItem("token");
      const input     = qtyBtn.closest(".qty-stepper").querySelector(".qty-input");
      const newQty    = parseInt(input.value) + delta;

      if (newQty < 1) return;

      if (token && productId) {
        await updateCartItemAPI(productId, newQty);
      } else {
        const cart = getCart();
        cart[qtyBtn.dataset.index].quantity += delta;
        saveCart(cart);
      }

      renderCart();
      updateHeaderCounts();
    }
  });

  // ── init ─────────────────────────────────
  renderCart();

  // ── checkout buttons ─────────────────────
  const checkoutBtn = document.getElementById("go-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (checkAuth("Please login to checkout")) {
        window.location.href = "checkout.html";
      }
    });
  }

  const mobileCheckoutBtn = document.getElementById("go-checkout-btn-mobile");
  if (mobileCheckoutBtn) {
    mobileCheckoutBtn.addEventListener("click", () => {
      if (checkAuth("Please login to checkout")) {
        window.location.href = "checkout.html";
      }
    });
  }

  // ── coupon ───────────────────────────────
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", () => {
      if (!checkAuth("Please login to apply coupon")) return;
      const input = document.getElementById("promo-input");
      const msg   = document.getElementById("promo-message");
      if (input?.value.trim() === "DRIP20") {
        if (msg) { msg.textContent = "Coupon applied successfully!"; msg.className = "promo-message success"; }
      } else {
        if (msg) { msg.textContent = "Invalid coupon code"; msg.className = "promo-message error"; }
      }
    });
  }
}