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
  updateCartItemAPI,
  getAvailableCouponsAPI,
  applyCouponAPI
} from "../core.js";

const MAX_LIMIT_PER_ITEM = 10;

// Applied coupon state (session-scoped)
let appliedCoupon = null; // { code, discount }

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
      
      const progressContainer = document.getElementById("shipping-progress-container");
      if (progressContainer) progressContainer.style.display = "none";
      
      const mobileSticky = document.getElementById("mobile-sticky-checkout");
      if (mobileSticky) mobileSticky.style.display = "none";
      
      return;
    }

    document.getElementById("empty-cart-state").style.display = "none";
    document.getElementById("cart-layout").style.display      = "grid";

    container.innerHTML = cart.map((item, index) => {

      const itemId = item._id          || item.id    || "";
      const prodId = item.product?._id || item.id    || "";
      
      const name  = item.product?.name   || item.name  || "Unknown Product";
      const price = item.product?.price  || item.price || 0;
      const image = item.product?.images?.[0] || item.image || "";
      const qty   = item.quantity || 1;
      const size  = item.size  || "N/A";
      const color = item.color || "Black";
      const stock = item.product?.stock || 0;

      if (!prodId) return "";

      const isMaxReached   = qty >= MAX_LIMIT_PER_ITEM;
      const isStockReached = qty >= stock;

      return `
        <div class="cart-item" data-id="${itemId}" data-index="${index}">
          <div class="cart-item-img">
            <img src="${image}">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-header">
              <h3 class="cart-item-title">${name}</h3>
              <button class="remove-cart-item-btn remove-btn"
                      data-id="${itemId}" data-index="${index}">
                <i class="ph-fill ph-trash"></i>
              </button>
            </div>
            <p class="cart-item-meta">
              Size: ${size} | Color: ${color}
              ${stock < 5 ? `<br><small style="color:var(--accent-red);font-weight:600;">Only ${stock} left in stock!</small>` : ""}
            </p>
            <div class="cart-item-actions">
              <span class="cart-item-price">$${price}</span>
              <div class="qty-stepper">
                <button class="qty-change"
                        data-id="${itemId}" data-index="${index}" data-delta="-1"
                        ${qty <= 1 ? "disabled" : ""}>
                  <i class="ph ph-minus"></i>
                </button>
                <input type="number" class="qty-input" value="${qty}" readonly>
                <button class="qty-change"
                        data-id="${itemId}" data-index="${index}" data-delta="1"
                        ${isMaxReached || isStockReached ? "disabled" : ""}>
                  <i class="ph ph-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    updateSummary(cart);
    loadAvailableCoupons();
  }

  // ── summary ─────────────────────────────
  function updateSummary(cart) {
    cart = cart || getCart();

    const subtotal = cart.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const threshold = 200;
    const delivery  = discountedSubtotal >= threshold || discountedSubtotal === 0 ? 0 : 20;

    document.getElementById("summary-subtotal").textContent = `$${subtotal}`;
    document.getElementById("summary-delivery").textContent = delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("summary-total").textContent    = `$${discountedSubtotal + delivery}`;

    const discountRow = document.getElementById("summary-discount-row");
    const discPct     = document.getElementById("discount-percent");
    const discVal     = document.getElementById("summary-discount");
    if (discountRow) {
      if (couponDiscount > 0) {
        discountRow.style.display = "flex";
        if (discPct) discPct.textContent = appliedCoupon.code;
        if (discVal) discVal.textContent = `-$${couponDiscount}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    const mobileTotal  = document.getElementById("mobile-summary-total");
    const mobileSticky = document.getElementById("mobile-sticky-checkout");
    if (mobileTotal)  mobileTotal.textContent  = `$${discountedSubtotal + delivery}`;
    if (mobileSticky) mobileSticky.style.display = cart.length > 0 ? "flex" : "none";

    const progressContainer = document.getElementById("shipping-progress-container");
    if (progressContainer)
      progressContainer.style.display = cart.length > 0 ? "block" : "none";

    const progressFill = document.getElementById("shipping-progress-fill");
    const shippingMsg  = document.getElementById("shipping-message");
    if (progressFill && shippingMsg) {
      const percent = Math.min(100, (discountedSubtotal / threshold) * 100);
      progressFill.style.width = `${percent}%`;
      shippingMsg.innerHTML =
        discountedSubtotal >= threshold
          ? "🎉 Free shipping applied!"
          : `Add $${threshold - discountedSubtotal} more for FREE shipping`;
    }
  }

  // ── available coupons panel ──────────────
  async function loadAvailableCoupons() {
    const section = document.getElementById("available-coupons-section");
    const list    = document.getElementById("available-coupons-list");
    if (!section || !list) return;

    const coupons = await getAvailableCouponsAPI();
    if (!coupons.length) { section.style.display = "none"; return; }

    section.style.display = "block";

    const tagMeta = {
      HOT:     { bg: "#FF4D4D", glow: "rgba(255,77,77,0.35)" },
      NEW:     { bg: "#6C63FF", glow: "rgba(108,99,255,0.35)" },
      LIMITED: { bg: "#F59E0B", glow: "rgba(245,158,11,0.35)" },
    };

    list.innerHTML = coupons.map(c => {
      const discountText = c.discountType === "percentage"
        ? `${c.discountValue}% OFF`
        : `$${c.discountValue} OFF`;

      const minText = c.minPurchase > 0
        ? `Min order: $${c.minPurchase}`
        : "No minimum order";

      const expiry = new Date(c.expiryDate).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      });

      const tm = tagMeta[c.tag];
      const tagBadge = (c.tag && tm)
        ? `<span class="coupon-tag-badge" style="background:${tm.bg};box-shadow:0 0 8px ${tm.glow};">${c.tag}</span>`
        : "";

      const isApplied = appliedCoupon?.code === c.code;

      return `
        <div class="coupon-card ${isApplied ? "coupon-card--applied" : ""}" data-code="${c.code}">
          <div class="coupon-card-left">
            <div class="coupon-code-row">
              ${tagBadge}
              <span class="coupon-code-text">${c.code}</span>
              <button class="coupon-copy-btn" title="Copy code" data-copy="${c.code}">
                <i class="ph ph-copy"></i>
              </button>
            </div>
            <p class="coupon-desc">${minText} &bull; Expires ${expiry}</p>
          </div>
          <div class="coupon-card-right">
            <span class="coupon-discount-badge">${discountText}</span>
            <button class="coupon-apply-btn btn btn-primary ${isApplied ? "coupon-applied-btn" : ""}"
                    data-code="${c.code}">
              ${isApplied ? '<i class="ph ph-check"></i> Applied' : "Apply"}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── apply coupon (real API) ───────────────
  async function applyPromoCode(code) {
    const token = localStorage.getItem("token");
    if (!token) { showToast("Please login to apply a coupon", "error"); return; }

    const promoInput = document.getElementById("promo-input");
    const applyBtn   = document.getElementById("apply-promo-btn");
    const msg        = document.getElementById("promo-message");

    if (applyBtn) { applyBtn.disabled = true; applyBtn.classList.add("loading"); }

    // Get current cart subtotal
    const cart = token ? await getCartFromAPI() : getCart();
    const subtotal = cart.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    const data = await applyCouponAPI(code, subtotal);

    if (applyBtn) { applyBtn.disabled = false; applyBtn.classList.remove("loading"); }

    if (data.success) {
      appliedCoupon = { 
        code: data.couponCode, 
        discount: data.discount,
        discountType: data.discountType,
        discountValue: data.discountValue
      };
      
      // PERSIST FOR CHECKOUT
      localStorage.setItem("dripmen_applied_coupon", data.couponCode);

      // Show Applied Card, Hide Input
      const appliedCard    = document.getElementById("applied-promo-card");
      const inputContainer = document.getElementById("promo-input-container");
      const cardCode       = document.getElementById("applied-promo-code-text");
      const cardDesc       = document.getElementById("applied-promo-desc-text");

      if (appliedCard && inputContainer) {
        appliedCard.style.display = "flex";
        inputContainer.style.display = "none";
        if (cardCode) cardCode.textContent = data.couponCode;
        if (cardDesc) cardDesc.textContent = `${data.discountType === 'percentage' ? data.discountValue + '%' : '$' + data.discountValue} Discount Applied`;
      }

      if (msg) { msg.textContent = ""; msg.className = "promo-message success"; }
      if (promoInput) promoInput.value = data.couponCode;
      showToast(`Coupon ${data.couponCode} applied! 🎉`);
      updateSummary(cart);
      loadAvailableCoupons(); // refresh tags
    } else {
      if (msg) { msg.textContent = data.message || "Invalid coupon"; msg.className = "promo-message error"; }
      showToast(data.message || "Invalid coupon", "error");
    }
  }

  // ── remove coupon ────────────────────────
  async function removeAppliedCoupon() {
    appliedCoupon = null;
    localStorage.removeItem("dripmen_applied_coupon");
    
    const appliedCard    = document.getElementById("applied-promo-card");
    const inputContainer = document.getElementById("promo-input-container");
    const promoInput     = document.getElementById("promo-input");
    const msg            = document.getElementById("promo-message");

    if (appliedCard && inputContainer) {
      appliedCard.style.display = "none";
      inputContainer.style.display = "flex";
    }

    if (promoInput) promoInput.value = "";
    if (msg) { msg.textContent = ""; msg.className = "promo-message"; }

    const token = localStorage.getItem("token");
    const cart = token ? await getCartFromAPI() : getCart();
    
    updateSummary(cart);
    loadAvailableCoupons();
    showToast("Coupon removed", "info");
  }

  // ── click handler ────────────────────────
  container.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".remove-cart-item-btn");
    if (removeBtn) {
      const itemId = removeBtn.dataset.id;
      const token  = localStorage.getItem("token");
      if (token && itemId) {
        await removeFromCartAPI(itemId);
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
      const itemId = qtyBtn.dataset.id;
      const delta  = parseInt(qtyBtn.dataset.delta);
      const token  = localStorage.getItem("token");
      const input  = qtyBtn.closest(".qty-stepper").querySelector(".qty-input");
      const currentQty = parseInt(input.value);
      const newQty = currentQty + delta;

      if (newQty < 1) return;

      const cart   = token ? await getCartFromAPI() : getCart();
      const item   = token ? cart.find(i => i._id === itemId) : cart[qtyBtn.dataset.index];
      const product = item.product || item;
      const stock   = product.stock || 0;

      if (delta > 0) {
        if (newQty > stock) {
          showToast(`Only ${stock} items available in stock`, "error");
          return;
        }
        if (newQty > MAX_LIMIT_PER_ITEM) {
          showToast(`Maximum ${MAX_LIMIT_PER_ITEM} items per product allowed`, "error");
          return;
        }
      }

      if (token && itemId) {
        const res = await updateCartItemAPI(itemId, newQty);
        if (!res?.success && res?.message) {
          showToast(res.message, "error");
          return;
        }
      } else {
        const localCart = getCart();
        localCart[qtyBtn.dataset.index].quantity += delta;
        saveCart(localCart);
      }

      renderCart();
      updateHeaderCounts();
    }
  });

  // ── coupon panel click delegation ────────
  document.addEventListener("click", async (e) => {

    // Copy button
    const copyBtn = e.target.closest(".coupon-copy-btn");
    if (copyBtn) {
      const code = copyBtn.dataset.copy;
      try {
        await navigator.clipboard.writeText(code);
        const icon = copyBtn.querySelector("i");
        if (icon) { icon.className = "ph ph-check"; setTimeout(() => { icon.className = "ph ph-copy"; }, 1500); }
        showToast(`Copied "${code}" to clipboard!`);
      } catch {
        showToast("Failed to copy", "error");
      }
      return;
    }

    // Apply button in coupon card
    const applyCardBtn = e.target.closest(".coupon-apply-btn");
    if (applyCardBtn && !applyCardBtn.classList.contains("coupon-applied-btn")) {
      const code = applyCardBtn.dataset.code;
      const promoInput = document.getElementById("promo-input");
      if (promoInput) promoInput.value = code;
      await applyPromoCode(code);
      return;
    }

    // Apply promo from input
    const applyPromoBtn = e.target.closest("#apply-promo-btn");
    if (applyPromoBtn) {
      if (!checkAuth("Please login to apply coupon")) return;
      const input = document.getElementById("promo-input");
      const code  = input?.value.trim().toUpperCase();
      if (!code) {
        const msg = document.getElementById("promo-message");
        if (msg) { msg.textContent = "Please enter a coupon code"; msg.className = "promo-message error"; }
        return;
      }
      await applyPromoCode(code);
      return;
    }

    // Remove promo from cart card
    const removeBtn = e.target.closest("#cart-remove-promo");
    if (removeBtn) {
      await removeAppliedCoupon();
      return;
    }
  });

  // ── init ─────────────────────────────────
  renderCart();

  // 🔄 Auto-apply saved coupon if any
  const savedCoupon = localStorage.getItem("dripmen_applied_coupon");
  if (savedCoupon) {
    applyPromoCode(savedCoupon);
  }

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
}