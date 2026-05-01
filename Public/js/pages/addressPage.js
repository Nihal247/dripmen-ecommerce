import { API_BASE_URL } from "../config.js";
// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  checkAuth,
  openModal,
  closeAllModals,
  showToast
} from "../core.js";

import { isValidEmail, isValidPhone, isValidName, isValidZip, isValidStreet, isValidCity } from "../utils/validators.js";

const API = `${API_BASE_URL}/api/address`;

// ==========================================
// PAGE: ADDRESS BOOK
// ==========================================
export function initAddressPage() {
  const container = document.getElementById('address-grid');
  if (!container) return;

  async function fetchAddresses() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
      const res = await fetch(API, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success ? data.addresses : [];
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      return [];
    }
  }

  async function renderAddresses() {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p class="text-muted">Loading your address book...</p>
      </div>`;

    const addresses = await fetchAddresses();

    if (addresses.length === 0) {
      container.innerHTML = `
        <p class="text-muted"
           style="grid-column: 1/-1; text-align: center; padding: 2rem;">
          No addresses found. Click "Add New Address" to get started.
        </p>
      `;
      return;
    }

    container.innerHTML = addresses.map((addr, index) => `
      <div class="address-card">
        <div class="address-header">
          <span class="address-name">${addr.name}</span>
          ${addr.isDefault ? '<span class="badge-default">Default</span>' : ''}
        </div>
        <div class="address-details">
          <p>${addr.street}</p>
          <p>${addr.city}, ${addr.zip}</p>
          <p>${addr.email || ''}</p>
          <p>${addr.mobile}</p>
        </div>
        <div class="address-actions">
          <button class="btn-link edit-address-btn" data-id="${addr._id}">
            Edit
          </button>
          <button class="btn-link text-red remove-address-btn" data-id="${addr._id}">
            Remove
          </button>
        </div>
      </div>
    `).join("");
  }

  renderAddresses();

  // Add address modal logic
  const addBtn = document.getElementById('add-address-btn');
  const modal = document.getElementById('add-address-modal');
  const form = document.getElementById('add-address-form');
  const modalTitle = document.getElementById('address-modal-title');
  const editIdInput = document.getElementById('address-edit-index'); // reusing index input for ID

  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to add address")) return;
      form.reset();
      if (editIdInput) editIdInput.value = "";
      if (modalTitle) modalTitle.textContent = "Add New Address";
      openModal(modal);
    });
  }

  if (form) {
    let isSubmitting = false; // ✅ Guard against double-submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return; // Prevent duplicate API calls
      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData(form);
      const nameVal = formData.get('name').trim();
      const mobileVal = formData.get('mobile').replace(/\D/g, "");
      const emailVal = formData.get('email').trim();
      const streetVal = formData.get('street').trim();
      const cityVal = formData.get('city').trim();
      const zipVal = formData.get('zip').trim();

      if (!isValidName(nameVal)) return showToast("Please enter a valid name (only letters, min 2 chars)", "error");
      if (!isValidPhone(mobileVal)) return showToast("Please enter a valid 10-digit mobile number", "error");
      if (emailVal && !isValidEmail(emailVal)) return showToast("Please enter a valid email address", "error");
      if (!isValidStreet(streetVal)) return showToast("Please enter a valid street address (min 5 chars)", "error");
      if (!isValidCity(cityVal)) return showToast("Please enter a valid city (only letters, min 2 chars)", "error");
      if (!isValidZip(zipVal)) return showToast("Please enter a valid 6-digit PIN code", "error");

      const addressData = {
        name: nameVal,
        email: emailVal,
        mobile: mobileVal,
        street: streetVal,
        city: cityVal,
        zip: zipVal,
        isDefault: formData.get('is-default') === 'on'
      };

      const editId = editIdInput.value;
      const url = editId ? `${API}/${editId}` : API;
      const method = editId ? "PUT" : "POST";

      const submitBtn = form.querySelector('button[type="submit"]');
      isSubmitting = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving..."; }
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(addressData)
        });

        const data = await res.json();
        if (data.success) {
          showToast(editId ? "Address updated! ✅" : "Address added! ✅");
          renderAddresses();
          closeAllModals();
          form.reset();
        } else {
          showToast(data.message || "Failed to save address", "error");
        }
      } catch (err) {
        showToast("Network error", "error");
      } finally {
        isSubmitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Save Address"; }
      }
    });
  }

  // Edit + Remove logic
  container.addEventListener('click', async (e) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (e.target.classList.contains('edit-address-btn')) {
      const id = e.target.dataset.id;
      const addresses = await fetchAddresses();
      const addr = addresses.find(a => a._id === id);

      if (addr && form) {
        form.name.value = addr.name || '';
        form.mobile.value = addr.mobile || '';
        form.email.value = addr.email || '';
        form.street.value = addr.street || '';
        form.city.value = addr.city || '';
        form.zip.value = addr.zip || '';
        
        if (editIdInput) editIdInput.value = id;
        if (modalTitle) modalTitle.textContent = "Edit Address";
        openModal(modal);
      }
    }

    if (e.target.classList.contains('remove-address-btn')) {
      const id = e.target.dataset.id;
      if (!confirm("Are you sure you want to remove this address?")) return;

      try {
        const res = await fetch(`${API}/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          showToast("Address removed");
          renderAddresses();
        }
      } catch (err) {
        showToast("Network error", "error");
      }
    }
  });
}