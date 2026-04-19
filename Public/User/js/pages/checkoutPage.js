// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  getCart,
  saveCart,
  getCartFromAPI,
  updateHeaderCounts,
  showToast,
  openModal,
  getAvailableCouponsAPI
} from "../core.js";

import { isValidEmail, isValidPhone } from "../utils/validators.js";

const API = "http://127.0.0.1:4000";

// ==========================================
// PAGE: CHECKOUT
// ==========================================
export function initCheckoutPage() {
  let appliedCoupon = null; // Stores { code, discount, discountType, discountValue, maxDiscountAmount, minPurchase }
  let walletBalance = 0;
  let currentFinalTotal = 0;
  const token = localStorage.getItem("token");

  // DOM Elements
  const promoInput     = document.getElementById("checkout-promo-input");
  const promoMsg       = document.getElementById("checkout-promo-message");
  const applyBtn       = document.getElementById("checkout-apply-promo");
  const appliedCard    = document.getElementById("applied-promo-card");
  const inputContainer = document.getElementById("promo-input-container");
  const cardCode       = document.getElementById("applied-promo-code-text");
  const cardDesc       = document.getElementById("applied-promo-desc-text");

  // ── fetch wallet balance ─────────────────
  async function fetchWalletBalance() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/wallet`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        walletBalance = data.wallet.balance;
        updateWalletUI();
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
    }
  }

  function updateWalletUI() {
    const balanceEl = document.getElementById("wallet-balance-amount");
    const warningEl = document.getElementById("wallet-insufficient-msg");
    if (balanceEl) balanceEl.textContent = `₹${walletBalance.toFixed(2)}`;
    
    checkWalletViability();
  }

  function checkWalletViability() {
    const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
    const warningEl = document.getElementById("wallet-insufficient-msg");
    const placeOrderBtn = document.getElementById("place-order-btn-modern");

    if (paymentMethodInput?.value === "wallet") {
      if (walletBalance < currentFinalTotal) {
        if (warningEl) warningEl.style.display = "inline";
        if (placeOrderBtn) placeOrderBtn.disabled = true;
        if (placeOrderBtn) placeOrderBtn.style.opacity = "0.5";
      } else {
        if (warningEl) warningEl.style.display = "none";
        if (placeOrderBtn) placeOrderBtn.disabled = false;
        if (placeOrderBtn) placeOrderBtn.style.opacity = "1";
      }
    } else {
      // If not wallet, enable button (assuming other methods are always viable)
      if (warningEl) warningEl.style.display = "none";
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.opacity = "1";
      }
    }
  }

  // ── calculate totals ─────────────────────
  async function calculateTotals() {
    const token = localStorage.getItem("token");
    let cart = [];

    // 🚀 Check for Buy Now isolation
    const buyNowStr = localStorage.getItem("dripmen_buy_now_item");
    if (buyNowStr) {
      cart = [JSON.parse(buyNowStr)];
    } else {
      cart = token ? await getCartFromAPI() : getCart();
    }

    if (!cart || cart.length === 0) {
      window.location.href = "cart.html";
      return;
    }

    // 1. Calculate MRP total (Sum of all original prices)
    let totalMRP = 0;
    let itemCount = 0;
    cart.forEach(item => {
      const qty = item.quantity || 1;
      const originalPrice = item.product?.price || item.price || 0;
      totalMRP += originalPrice * qty;
      itemCount += qty;
    });

    // 2. Apply product-level discounts (Sum of MRP - Sale Price)
    let productDiscount = 0;
    cart.forEach(item => {
      const qty = item.quantity || 1;
      const originalPrice = item.product?.price || item.price || 0;
      const salePrice     = item.product?.salePrice || null;
      if (salePrice) {
        productDiscount += (originalPrice - salePrice) * qty;
      }
    });

    // 3. Get SUBTOTAL (MRP - Product Discount)
    const subtotal = totalMRP - productDiscount;

    // 4. Validate & Recalculate Coupon Logic
    let couponDiscount = 0;
    if (appliedCoupon) {
      // Re-validate Minimum Purchase
      if (subtotal < (appliedCoupon.minPurchase || 0)) {
        appliedCoupon = null;
        localStorage.removeItem("dripmen_applied_coupon");

        // UI Reset
        const appliedCard = document.getElementById("applied-promo-card");
        const inputContainer = document.getElementById("promo-input-container");
        if (appliedCard) appliedCard.style.display = "none";
        if (inputContainer) inputContainer.style.display = "flex";

        showToast("Coupon removed: Minimum order requirements not met", "info");
      } else {
        // Recalculate dynamic discount amount
        if (appliedCoupon.discountType === "percentage") {
          couponDiscount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscountAmount && couponDiscount > appliedCoupon.maxDiscountAmount) {
            couponDiscount = appliedCoupon.maxDiscountAmount;
          }
        } else {
          couponDiscount = appliedCoupon.discountValue;
        }

        couponDiscount = Math.round(couponDiscount);
        couponDiscount = Math.min(couponDiscount, subtotal);
        
        // Update the cached discount
        appliedCoupon.discount = couponDiscount;
      }
    }

    // 5. Apply coupon discount (Step 3 - Step 4)
    // Note: The actual discount value is calculated by the backend against the subtotal

    // 6. Add delivery fee
    const threshold = 1000;
    const delivery = (subtotal >= threshold) ? 0 : 40;

    // 7. Final total
    const finalTotal = subtotal - couponDiscount + delivery;
    const totalSavings = productDiscount + couponDiscount;

    // Render Items Summary
    const itemsList = document.getElementById("checkout-items-list");
    if (itemsList) {
      itemsList.innerHTML = cart.map(item => {
        const originalPrice = item.product?.price || item.price || 0;
        const salePrice     = item.product?.salePrice || null;
        const currentPrice  = salePrice || originalPrice;
        const qty           = item.quantity || 1;
        const lineTotal     = currentPrice * qty;
        const image         = item.product?.images?.[0] || item.image || "";

        const priceHTML = salePrice 
          ? `<span style="font-weight:600; color:#111;">₹${salePrice}</span>
             <span style="text-decoration:line-through; color:#888; font-size:0.75rem; margin-left:4px;">₹${originalPrice}</span>`
          : `<span style="font-weight:600; color:#111;">₹${originalPrice}</span>`;

        return `
          <div class="checkout-item-mini" style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem; border-bottom:1px solid #f0f0f0; padding-bottom:1rem;">
            <img src="${image}" style="width:50px; height:50px; border-radius:6px; object-fit:cover; border:1px solid #eee;">
            <div style="flex:1;">
              <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:2px; color:#111;">${item.product?.name || item.name}</h4>
              <p style="font-size:0.75rem; color:#666;">Size: ${item.size || "S"} | Qty: ${qty}</p>
              <div style="margin-top:4px;">
                ${priceHTML}
                <div style="font-size:0.75rem; color:#888; margin-top:2px;">Total: <strong>₹${lineTotal}</strong></div>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Update UI Elements (Flipkart style)
    const priceLabel  = document.getElementById("checkout-price-label");
    const mrpEl       = document.getElementById("checkout-total-mrp");
    const prodDiscEl  = document.getElementById("checkout-discount-mrp");
    const subtotalEl  = document.getElementById("checkout-subtotal");
    const couponRow   = document.getElementById("checkout-discount-row");
    const couponVal   = document.getElementById("checkout-discount");
    const deliveryEl  = document.getElementById("checkout-delivery");
    const totalEl     = document.getElementById("checkout-total");
    const savingsEl   = document.getElementById("checkout-total-savings");

    if (priceLabel) priceLabel.textContent = `Price (${itemCount} item${itemCount !== 1 ? 's' : ''})`;
    if (mrpEl)      mrpEl.textContent      = `₹${totalMRP}`;
    
    if (prodDiscEl) prodDiscEl.textContent = `−₹${productDiscount}`;
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;

    if (couponRow) {
      if (couponDiscount > 0) {
        couponRow.style.display = "flex";
        if (couponVal) couponVal.textContent = `−₹${couponDiscount}`;
      } else {
        couponRow.style.display = "none";
      }
    }

    if (deliveryEl) {
      if (delivery === 0) {
        deliveryEl.innerHTML = `<span style="color:#388e3c; font-weight:500;">FREE</span>`;
      } else {
        deliveryEl.textContent = `₹${delivery}`;
        deliveryEl.style.color = "#212121";
      }
    }

    if (totalEl) totalEl.textContent = `₹${finalTotal}`;
    
    if (savingsEl) {
      if (totalSavings > 0) {
        savingsEl.style.display = "block";
        savingsEl.textContent = `You will save ₹${totalSavings} on this order`;
      } else {
        savingsEl.style.display = "none";
      }
    }
    
    currentFinalTotal = finalTotal;
    checkWalletViability();
  }

  // ── address management ───────────────────
  const addressListContainer = document.getElementById("checkout-address-list");
  let savedAddresses = [];

  async function renderCheckoutAddresses() {
    const token = localStorage.getItem("token");
    if (!token || !addressListContainer) return;

    try {
      const res = await fetch(`${API}/api/address`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.success || data.addresses.length === 0) {
        const parentSection = document.querySelector(".checkout-address-selection");
        if (parentSection) parentSection.style.display = "none";
        const divider = document.getElementById("address-form-divider");
        if (divider) divider.style.display = "none";
        return;
      }

      savedAddresses = data.addresses;
      addressListContainer.innerHTML = savedAddresses.map((addr, idx) => `
        <div class="checkout-address-card ${addr.isDefault ? 'active' : ''}" data-id="${addr._id}">
          <div class="radio-indicator"></div>
          <h4 class="address-name">${addr.name}</h4>
          <div class="address-details">
            <p>${addr.street}</p>
            <p>${addr.city}, ${addr.zip}</p>
            <p>${addr.email || ""}</p>
            <p>${addr.mobile}</p>
          </div>
        </div>
      `).join("");

      // Pre-fill if there's a default
      const defaultAddr = savedAddresses.find(a => a.isDefault);
      if (defaultAddr) {
        fillAddressForm(defaultAddr);
      }

    } catch (err) {
      console.error("Failed to load checkout addresses", err);
    }
  }

  function fillAddressForm(addr) {
    document.getElementById("checkout-name").value   = addr.name   || "";
    document.getElementById("checkout-mobile").value = addr.mobile || "";
    document.getElementById("checkout-street").value = addr.street || "";
    document.getElementById("checkout-city").value   = addr.city   || "";
    document.getElementById("checkout-email").value  = addr.email  || "";
  }

  renderCheckoutAddresses();

  if (addressListContainer) {
    addressListContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".checkout-address-card");
      if (!card) return;

      addressListContainer.querySelectorAll(".checkout-address-card")
        .forEach(c => c.classList.remove("active"));

      card.classList.add("active");

      const addr = savedAddresses.find(a => a._id === card.dataset.id);
      if (addr) {
        fillAddressForm(addr);
      }
    });
  }

  async function applyCheckoutCoupon(code) {
    if (!token) {
      showToast("Please login to apply coupons", "error");
      return;
    }

    if (applyBtn) {
      applyBtn.textContent = "Applying...";
      applyBtn.disabled = true;
    }

    try {
      // Recalculate subtotal for the request
      let cart = [];
      const buyNowStr = localStorage.getItem("dripmen_buy_now_item");
      if (buyNowStr) {
        cart = [JSON.parse(buyNowStr)];
      } else {
        cart = token ? await getCartFromAPI() : getCart();
      }

      const subtotal = cart.reduce((sum, item) => {
        const originalPrice = item.product?.price || item.price || 0;
        const salePrice     = item.product?.salePrice || null;
        const paidPrice     = salePrice || originalPrice;
        return sum + (paidPrice * (item.quantity || 1));
      }, 0);

      const res = await fetch(`${API}/api/coupons/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code, cartTotal: subtotal })
      });

      const data = await res.json();

      if (data.success) {
        appliedCoupon = { 
          code: data.couponCode, 
          discount: data.discount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          maxDiscountAmount: data.maxDiscountAmount,
          minPurchase: data.minPurchase
        };

        // PERSIST FOR THE SESSION
        localStorage.setItem("dripmen_applied_coupon", data.couponCode);

        if (appliedCard && inputContainer) {
          appliedCard.style.display = "flex";
          inputContainer.style.display = "none";
          if (cardCode) cardCode.textContent = data.couponCode;
          if (cardDesc) {
            const displayVal = data.discountType === 'percentage' ? data.discountValue + '%' : '₹' + data.discountValue;
            cardDesc.textContent = `${displayVal} Discount Applied`;
          }
        }

        showToast(`Coupon "${data.couponCode}" applied!`, "success");
        if (promoMsg) {
          promoMsg.textContent = "";
          promoMsg.className = "promo-message success";
        }
        calculateTotals();
        loadAvailableCheckoutCoupons(); // Refresh the list checkmarks
      } else {
        showToast(data.message, "error");
        if (promoMsg) {
          promoMsg.textContent = data.message;
          promoMsg.className = "promo-message error";
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to apply coupon", "error");
    } finally {
      if (applyBtn) {
        applyBtn.textContent = "Apply";
        applyBtn.disabled = false;
      }
    }
  }
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const promoInput = document.getElementById("checkout-promo-input");
      const code = promoInput?.value.trim().toUpperCase();
      if (!code) {
        showToast("Please enter a coupon code", "error");
        return;
      }
      applyCheckoutCoupon(code);
    });
  }

  // ── available coupons logic ──────────────
  async function loadAvailableCheckoutCoupons() {
    const section = document.getElementById("checkout-available-coupons-section");
    const list    = document.getElementById("checkout-available-coupons-list");
    if (!section || !list) return;

    const coupons = await getAvailableCouponsAPI();
    if (!coupons.length) { section.style.display = "none"; return; }

    section.style.display = "block";

    // Recalculate subtotal for eligibility display
    let cart = [];
    const buyNowStr = localStorage.getItem("dripmen_buy_now_item");
    if (buyNowStr) {
      cart = [JSON.parse(buyNowStr)];
    } else {
      cart = token ? await getCartFromAPI() : getCart();
    }

    const currentSubtotal = cart.reduce((sum, item) => {
      const originalPrice = item.product?.price || item.price || 0;
      const salePrice     = item.product?.salePrice || null;
      const paidPrice     = salePrice || originalPrice;
      return sum + (paidPrice * (item.quantity || 1));
    }, 0);

    const tagMeta = {
      HOT:     { bg: "#FF4D4D", glow: "rgba(255,77,77,0.35)" },
      NEW:     { bg: "#6C63FF", glow: "rgba(108,99,255,0.35)" },
      LIMITED: { bg: "#F59E0B", glow: "rgba(245,158,11,0.35)" },
    };

    list.innerHTML = coupons.map(c => {
      const discountText = c.discountType === "percentage"
        ? `${c.discountValue}% OFF`
        : `₹${c.discountValue} OFF`;

      const expiry = new Date(c.expiryDate).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      });

      const tm = tagMeta[c.tag];
      const tagBadge = (c.tag && tm)
        ? `<span class="coupon-tag-badge" style="background:${tm.bg};box-shadow:0 0 8px ${tm.glow};">${c.tag}</span>`
        : "";

      const isApplied = appliedCoupon?.code === c.code;
      const isEligible = currentSubtotal >= c.minPurchase;
      const moreNeeded = c.minPurchase - currentSubtotal;

      let eligibilityHTML = "";
      if (!isApplied && !isEligible) {
        eligibilityHTML = `<p class="coupon-eligibility-msg">Add ₹${moreNeeded} more to apply</p>`;
      } else {
        const minText = c.minPurchase > 0 ? `Min order: ₹${c.minPurchase}` : "No minimum order";
        eligibilityHTML = `<p class="coupon-desc">${minText} &bull; Expires ${expiry}</p>`;
      }

      return `
        <div class="coupon-card ${isApplied ? "coupon-card--applied" : ""} ${!isEligible && !isApplied ? "coupon-card--locked" : ""}" data-code="${c.code}">
          <div class="coupon-card-left">
            <div class="coupon-code-row">
              ${tagBadge}
              <span class="coupon-code-text">${c.code}</span>
              <button class="coupon-copy-btn" title="Copy code" data-copy="${c.code}">
                <i class="ph ph-copy"></i>
              </button>
            </div>
            ${eligibilityHTML}
          </div>
          <div class="coupon-card-right">
            <span class="coupon-discount-badge">${discountText}</span>
            <button class="coupon-apply-btn btn btn-primary ${isApplied ? "coupon-applied-btn" : ""}"
                    data-code="${c.code}" ${!isEligible && !isApplied ? "disabled" : ""}>
              ${isApplied ? '<i class="ph ph-check"></i> Applied' : "Apply"}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── remove coupon ────────────────────────
  const removePromoBtn = document.getElementById("checkout-remove-promo");
  if (removePromoBtn) {
    removePromoBtn.addEventListener("click", () => {
      appliedCoupon = null;
      localStorage.removeItem("dripmen_applied_coupon");

      const appliedCard    = document.getElementById("applied-promo-card");
      const inputContainer = document.getElementById("promo-input-container");
      
      if (appliedCard && inputContainer) {
        appliedCard.style.display = "none";
        inputContainer.style.display = "flex";
      }

      if (promoInput) promoInput.value = "";
      if (inputContainer) inputContainer.style.display = "flex";
      
      calculateTotals();
      loadAvailableCheckoutCoupons(); // Reset checkmarks in available list
      showToast("Coupon removed", "info");
    });
  }

  // ── place order button ───────────────────
  const placeOrderBtn = document.getElementById("place-order-btn-modern");

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const name   = document.getElementById("checkout-name");
      const email  = document.getElementById("checkout-email");
      const street = document.getElementById("checkout-street");
      const city   = document.getElementById("checkout-city");
      const mobile = document.getElementById("checkout-mobile");

      let isValid = true;

      const showError = (input, msgId) => {
        input.classList.add("error-border");
        const errEl = document.getElementById(msgId);
        if (errEl) errEl.style.display = "block";
        isValid = false;
      };

      const clearError = (input, msgId) => {
        input.classList.remove("error-border");
        const errEl = document.getElementById(msgId);
        if (errEl) errEl.style.display = "none";
      };

      if (!name.value.trim()) showError(name, "error-name"); else clearError(name, "error-name");
      if (!isValidEmail(email.value.trim())) showError(email, "error-email"); else clearError(email, "error-email");
      if (!street.value.trim()) showError(street, "error-street"); else clearError(street, "error-street");
      if (!city.value.trim()) showError(city, "error-city"); else clearError(city, "error-city");
      if (!isValidPhone(mobile.value.replace(/\D/g, ""))) showError(mobile, "error-mobile"); else clearError(mobile, "error-mobile");

      if (!isValid) {
        showToast("Please fix the errors in the form", "error");
        return;
      }

      const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
      const paymentMethod = paymentMethodInput?.value || "cod";

      placeOrderBtn.textContent = "Placing order...";
      placeOrderBtn.disabled = true;

      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        // 🧾 CREATE ORDER
        const orderRes = await fetch(`${API}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            address: {
              fullName: name.value,
              phone: mobile.value,
              street: street.value,
              city: city.value,
              country: "India"
            },
            paymentMethod,
            couponCode: appliedCoupon ? appliedCoupon.code : "",
            // 🚀 Pass Buy Now items if they exist
            items: localStorage.getItem("dripmen_buy_now_item") 
              ? [JSON.parse(localStorage.getItem("dripmen_buy_now_item"))]
              : undefined
          })
        });

        const orderData = await orderRes.json();

        if (!orderData.success) {
          showToast(orderData.message, "error");
          return;
        }

        const orderId = orderData.order._id;

        // 💰 WALLET PAYMENT (NEW)
        if (paymentMethod === "wallet") {
          showSuccessModal(orderId);
          return;
        }

        // 💵 COD
        if (paymentMethod === "cod") {
          showSuccessModal(orderId);
          return;
        }

        // 💳 RAZORPAY
        const rzpRes = await fetch(`${API}/api/payment/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ orderId })
        });

        const rzpData = await rzpRes.json();

        if (!rzpData.success) {
          showToast(rzpData.message || "Payment initiation failed. Please check payment gateway configuration.", "error");
          return;
        }

        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: "DripMen",
          description: "Order Payment",
          order_id: rzpData.razorpayOrderId,

          handler: async (response) => {
            const verifyRes = await fetch(`${API}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              showSuccessModal(orderId);
            } else {
              showToast("Payment failed", "error");
            }
          },

          prefill: {
            name: name.value,
            contact: mobile.value,
            email: email.value
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        console.error(err);
        showToast("Something went wrong", "error");
      } finally {
        placeOrderBtn.textContent = "Place Order";
        placeOrderBtn.disabled = false;
      }
    });
  }

  // ── success modal ────────────────────────
  function showSuccessModal(orderId) {
    saveCart([]);
    updateHeaderCounts();
    // 🧹 Clear navigation contexts
    localStorage.removeItem("dripmen_buy_now_item");
    localStorage.removeItem("dripmen_applied_coupon");

    // Populate Modal
    const idEl    = document.getElementById("success-order-id");
    const totalEl = document.getElementById("success-order-total");
    const totalVal = document.getElementById("checkout-total").textContent;

    if (idEl)    idEl.textContent    = `#ORD-${orderId.slice(-8).toUpperCase()}`;
    if (totalEl) totalEl.textContent = totalVal;

    // Open Modal
    const modal = document.getElementById("order-success-modal");
    if (modal) {
      openModal(modal);
      
      // Button listeners
      document.getElementById("order-success-view-btn")?.addEventListener("click", () => {
        window.location.href = "orders.html";
      });
      document.getElementById("order-success-home-btn")?.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    } else {
      // Fallback if modal not found
      showToast("Order placed successfully 🎉");
      setTimeout(() => window.location.href = "orders.html", 1500);
    }
  }

  // ── init ─────────────────────────────────
  renderCheckoutAddresses();
  calculateTotals();
  fetchWalletBalance();
  loadAvailableCheckoutCoupons();

  // 🔄 Auto-apply saved coupon if any
  const savedCoupon = localStorage.getItem("dripmen_applied_coupon");
  if (savedCoupon) {
    applyCheckoutCoupon(savedCoupon);
  }

  // ── payment method change listener ──────
  document.querySelectorAll('input[name="payment_method"]').forEach(input => {
    input.addEventListener("change", () => {
      // Manage active class visually
      document.querySelectorAll(".payment-option-modern").forEach(opt => opt.classList.remove("active"));
      input.closest(".payment-option-modern")?.classList.add("active");
      
      checkWalletViability();
    });
  });

  // ── copy & apply in list logic ──────────
  document.addEventListener("click", async (e) => {
    // Copy code logic
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

    // Apply from card logic
    const applyCardBtn = e.target.closest(".coupon-apply-btn");
    if (applyCardBtn && !applyCardBtn.classList.contains("coupon-applied-btn")) {
      const code = applyCardBtn.dataset.code;
      const promoInput = document.getElementById("checkout-promo-input");
      if (promoInput) promoInput.value = code;
      await applyCheckoutCoupon(code);
      return;
    }
  });
}