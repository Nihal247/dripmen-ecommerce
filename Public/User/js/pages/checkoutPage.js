// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  getCart,
  saveCart,
  getCartFromAPI,
  updateHeaderCounts,
  showToast,
  openModal
} from "../core.js";

import { isValidEmail, isValidPhone } from "../utils/validators.js";

const API = "http://localhost:4000";

// ==========================================
// PAGE: CHECKOUT
// ==========================================
export function initCheckoutPage() {

  // ── calculate totals ─────────────────────
  async function calculateTotals() {
    const token = localStorage.getItem("token");
    const cart  = token ? await getCartFromAPI() : getCart();

    if (cart.length === 0) {
      window.location.href = "cart.html";
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    const delivery = subtotal >= 200 ? 0 : 20;

    document.getElementById("checkout-subtotal").textContent =
      `$${subtotal}`;
    document.getElementById("checkout-delivery").textContent =
      delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("checkout-total").textContent =
      `$${subtotal + delivery}`;
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
            paymentMethod
          })
        });

        const orderData = await orderRes.json();

        if (!orderData.success) {
          showToast(orderData.message, "error");
          return;
        }

        const orderId = orderData.order._id;

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
  calculateTotals();
}