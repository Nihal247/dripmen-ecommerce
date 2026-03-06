// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  getCart,
  saveCart,
  updateHeaderCounts,
  showToast,
  openModal
} from "../core.js";


// ==========================================
// PAGE: CHECKOUT
// ==========================================
export function initCheckoutPage() {
  function calculateTotals() {
    const cart = getCart();
    if (cart.length === 0) { window.location.href = "cart.html"; return; }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal >= 200 ? 0 : 20;

    document.getElementById("checkout-subtotal").textContent = `$${subtotal}`;
    document.getElementById("checkout-delivery").textContent = delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("checkout-total").textContent = `$${subtotal + delivery}`;
  }

  // --- Address Management ---
  const addressListContainer = document.getElementById('checkout-address-list');
  const addressForm = document.getElementById('checkout-form');
  const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');

  function renderCheckoutAddresses() {
    if (!addressListContainer || addresses.length === 0) {
      const parentSection = document.querySelector('.checkout-address-selection');
      if (parentSection) parentSection.style.display = 'none';
      const divider = document.getElementById('address-form-divider');
      if (divider) divider.style.display = 'none';
      return;
    }

    addressListContainer.innerHTML = addresses.map((addr, idx) => `
        <div class="checkout-address-card" data-index="${idx}">
            <div class="radio-indicator"></div>
            <h4 class="address-name">${addr.name}</h4>
            <div class="address-details">
                <p>${addr.street}</p>
                <p>${addr.city}${addr.zip ? `, ${addr.zip}` : ''}</p>
                <p>${addr.email || ''}</p>
                <p>${addr.mobile}</p>
            </div>
        </div>
    `).join('');
  }
  renderCheckoutAddresses();

  if (addressListContainer) {
    addressListContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.checkout-address-card');
      if (!card) return;

      addressListContainer.querySelectorAll('.checkout-address-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const idx = card.dataset.index;
      const addr = addresses[idx];
      if (addr) {
        document.getElementById('checkout-name').value = addr.name || '';
        document.getElementById('checkout-mobile').value = addr.mobile || '';
        document.getElementById('checkout-street').value = addr.street || '';
        document.getElementById('checkout-city').value = addr.city || '';
        document.getElementById('checkout-email').value = addr.email || '';
      }
    });
  }

  const placeOrderBtn = document.getElementById("place-order-btn-modern");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // --- FORM VALIDATION ---
      let isValid = true;
      const name = document.getElementById('checkout-name');
      const email = document.getElementById('checkout-email');
      const street = document.getElementById('checkout-street');
      const city = document.getElementById('checkout-city');
      const mobile = document.getElementById('checkout-mobile');

      const showError = (input, msgId) => {
        input.classList.add('error-border');
        const errEl = document.getElementById(msgId);
        if (errEl) errEl.style.display = 'block';
        isValid = false;
      };

      const clearError = (input, msgId) => {
        input.classList.remove('error-border');
        const errEl = document.getElementById(msgId);
        if (errEl) errEl.style.display = 'none';
      };

      if (!name.value.trim()) showError(name, 'error-name'); else clearError(name, 'error-name');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value.trim())) showError(email, 'error-email'); else clearError(email, 'error-email');

      if (!street.value.trim()) showError(street, 'error-street'); else clearError(street, 'error-street');
      if (!city.value.trim()) showError(city, 'error-city'); else clearError(city, 'error-city');

      const mobileRegex = /^\d{10,}$/;
      if (!mobileRegex.test(mobile.value.replace(/\D/g, ''))) showError(mobile, 'error-mobile'); else clearError(mobile, 'error-mobile');

      if (!isValid) {
        showToast("Please fix the errors in the form", "error");
        return;
      }

      // --- SAVE ADDRESS LOGIC ---
      const saveInfo = document.getElementById('checkout-save-info');
      if (saveInfo && saveInfo.checked) {
        const newAddr = {
          name: name.value,
          email: email.value,
          mobile: mobile.value,
          street: street.value,
          city: city.value
        };
        const isDuplicate = addresses.some(a => a.name === newAddr.name && a.street === newAddr.street);
        if (!isDuplicate) {
          addresses.push(newAddr);
          localStorage.setItem('dripmen_addresses', JSON.stringify(addresses));
        }
      }

      // --- PLACE ORDER ---
      const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
      const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cod';
      const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod === 'wallet' ? 'Wallet' : 'Online Payment');

      const allOrders = JSON.parse(localStorage.getItem('dripmen_orders') || '[]');
      const newOrder = {
        id: "#" + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: "Processing",
        statusClass: "status-processing",
        total: parseFloat(document.getElementById("checkout-total").textContent.replace('$', '')),
        items: getCart(),
        address: {
          name: name.value,
          street: street.value,
          city: city.value,
          mobile: mobile.value,
          email: email.value
        },
        paymentMethod: paymentLabel
      };
      allOrders.unshift(newOrder);
      localStorage.setItem('dripmen_orders', JSON.stringify(allOrders));

      // Populate and show success modal
      const totalAmount = document.getElementById("checkout-total").textContent;
      const successModal = document.getElementById('order-success-modal');
      if (successModal) {
        const idEl = document.getElementById('success-order-id');
        const totalEl = document.getElementById('success-order-total');
        if (idEl) idEl.textContent = newOrder.id;
        if (totalEl) totalEl.textContent = totalAmount;

        const viewOrderBtn = document.getElementById('order-success-view-btn');
        if (viewOrderBtn) {
          viewOrderBtn.onclick = () => window.location.href = 'orders.html';
        }

        const homeBtn = document.getElementById('order-success-home-btn');
        if (homeBtn) {
          homeBtn.onclick = () => window.location.href = 'index.html';
        }

        saveCart([]);
        updateHeaderCounts();
        openModal(successModal);
      }
    });
  }

  calculateTotals();
}
