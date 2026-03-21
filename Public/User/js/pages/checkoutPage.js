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
import { formatDate } from "../utils/helpers.js";

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
  const addresses = JSON.parse(localStorage.getItem("dripmen_addresses") || "[]");

  function renderCheckoutAddresses() {
    if (!addressListContainer || addresses.length === 0) {
      const parentSection = document.querySelector(".checkout-address-selection");
      if (parentSection) parentSection.style.display = "none";
      const divider = document.getElementById("address-form-divider");
      if (divider) divider.style.display = "none";
      return;
    }

    addressListContainer.innerHTML = addresses.map((addr, idx) => `
      <div class="checkout-address-card" data-index="${idx}">
        <div class="radio-indicator"></div>
        <h4 class="address-name">${addr.name}</h4>
        <div class="address-details">
          <p>${addr.street}</p>
          <p>${addr.city}${addr.zip ? `, ${addr.zip}` : ""}</p>
          <p>${addr.email || ""}</p>
          <p>${addr.mobile}</p>
        </div>
      </div>
    `).join("");
  }
  renderCheckoutAddresses();

  if (addressListContainer) {
    addressListContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".checkout-address-card");
      if (!card) return;

      addressListContainer.querySelectorAll(".checkout-address-card")
        .forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const addr = addresses[card.dataset.index];
      if (addr) {
        document.getElementById("checkout-name").value   = addr.name   || "";
        document.getElementById("checkout-mobile").value = addr.mobile || "";
        document.getElementById("checkout-street").value = addr.street || "";
        document.getElementById("checkout-city").value   = addr.city   || "";
        document.getElementById("checkout-email").value  = addr.email  || "";
      }
    });
  }

  // ── place order button ───────────────────
  const placeOrderBtn = document.getElementById("place-order-btn-modern");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // --- FORM VALIDATION ---
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

      if (!name.value.trim())
        showError(name, "error-name");   else clearError(name, "error-name");
      if (!isValidEmail(email.value.trim()))
        showError(email, "error-email"); else clearError(email, "error-email");
      if (!street.value.trim())
        showError(street, "error-street"); else clearError(street, "error-street");
      if (!city.value.trim())
        showError(city, "error-city");   else clearError(city, "error-city");
      if (!isValidPhone(mobile.value.replace(/\D/g, "")))
        showError(mobile, "error-mobile"); else clearError(mobile, "error-mobile");

      if (!isValid) {
        showToast("Please fix the errors in the form", "error");
        return;
      }

      // --- SAVE ADDRESS ---
      const saveInfo = document.getElementById("checkout-save-info");
      if (saveInfo?.checked) {
        const newAddr = {
          name:   name.value,
          email:  email.value,
          mobile: mobile.value,
          street: street.value,
          city:   city.value
        };
        const isDuplicate = addresses.some(
          a => a.name === newAddr.name && a.street === newAddr.street
        );
        if (!isDuplicate) {
          addresses.push(newAddr);
          localStorage.setItem("dripmen_addresses", JSON.stringify(addresses));
        }
      }

      // --- PAYMENT METHOD ---
      const paymentMethodInput = document.querySelector(
        'input[name="payment_method"]:checked'
      );
      const paymentMethod = paymentMethodInput?.value || "cod";
      const paymentLabel  =
        paymentMethod === "cod"    ? "Cash on Delivery" :
        paymentMethod === "wallet" ? "Wallet" : "Online Payment";

      // --- PLACE ORDER ---
      placeOrderBtn.textContent = "Placing order...";
      placeOrderBtn.disabled    = true;

      const token = localStorage.getItem("token");

      if (token) {
        // ✅ call backend API
        try {
          const res  = await fetch(`${API}/api/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              address: {
                fullName: name.value,
                phone:    mobile.value,
                street:   street.value,
                city:     city.value,
                country:  "India"
              },
              paymentMethod: paymentMethod,
              couponCode:    document.getElementById("promo-input")?.value || ""
            })
          });

          const data = await res.json();

          if (!data.success) {
            showToast(data.message || "Failed to place order", "error");
            placeOrderBtn.textContent = "Place Order";
            placeOrderBtn.disabled    = false;
            return;
          }

          // success — show modal
          showSuccessModal(data.order.id || data.order._id);

        } catch (err) {
          console.error("Order failed:", err);
          showToast("Network error. Please try again.", "error");
          placeOrderBtn.textContent = "Place Order";
          placeOrderBtn.disabled    = false;
        }

      } else {
        // fallback — save to localStorage
        const allOrders = JSON.parse(
          localStorage.getItem("dripmen_orders") || "[]"
        );
        const newOrder = {
          id:          "#" + Math.floor(100000 + Math.random() * 900000),
          date:        formatDate(new Date()),
          status:      "Processing",
          statusClass: "status-processing",
          total:       parseFloat(
            document.getElementById("checkout-total")
              .textContent.replace("$", "")
          ),
          items:         getCart(),
          address: {
            name:   name.value,
            street: street.value,
            city:   city.value,
            mobile: mobile.value,
            email:  email.value
          },
          paymentMethod: paymentLabel
        };
        allOrders.unshift(newOrder);
        localStorage.setItem("dripmen_orders", JSON.stringify(allOrders));
        showSuccessModal(newOrder.id);
      }
    });
  }

  // ── success modal ────────────────────────
  function showSuccessModal(orderId) {
    const totalAmount  = document.getElementById("checkout-total").textContent;
    const successModal = document.getElementById("order-success-modal");

    if (successModal) {
      const idEl    = document.getElementById("success-order-id");
      const totalEl = document.getElementById("success-order-total");
if (idEl) idEl.textContent = "#" + String(orderId).slice(-6).toUpperCase();
      if (totalEl) totalEl.textContent = totalAmount;

      const viewOrderBtn = document.getElementById("order-success-view-btn");
      if (viewOrderBtn) viewOrderBtn.onclick = () =>
        window.location.href = "orders.html";

      const homeBtn = document.getElementById("order-success-home-btn");
      if (homeBtn) homeBtn.onclick = () =>
        window.location.href = "index.html";

      // clear cart
      saveCart([]);
      updateHeaderCounts();
      openModal(successModal);

    } else {
      showToast("Order placed successfully! 🎉");
      saveCart([]);
      updateHeaderCounts();
      setTimeout(() => window.location.href = "orders.html", 1500);
    }

    placeOrderBtn.textContent = "Place Order";
    placeOrderBtn.disabled    = false;
  }

  // ── init ─────────────────────────────────
  calculateTotals();
}