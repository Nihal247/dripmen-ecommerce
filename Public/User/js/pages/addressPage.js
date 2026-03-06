// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import {
  checkAuth,
  openModal,
  closeAllModals,
  showToast
} from "../core.js";


// ==========================================
// PAGE: ADDRESS BOOK
// ==========================================
export function initAddressPage() {

  const container = document.getElementById('address-grid');
  if (!container) return;


  // Initialize default address if empty
  if (!localStorage.getItem('dripmen_addresses')) {

    const defaultAddr = [{
      name: "Muhammed Nihal",
      street: "Kingston, 5236, United State",
      city: "New York",
      zip: "10001",
      email: "nihal@gmail.com",
      mobile: "+1 234 567 890"
    }];

    localStorage.setItem(
      'dripmen_addresses',
      JSON.stringify(defaultAddr)
    );

  }



  function renderAddresses() {

    const addresses = JSON.parse(
      localStorage.getItem('dripmen_addresses') || '[]'
    );

    if (addresses.length === 0) {

      container.innerHTML = `
        <p class="text-muted"
           style="grid-column: 1/-1; text-align: center; padding: 2rem;">
          No addresses found.
        </p>
      `;

      return;
    }



    container.innerHTML = addresses.map((addr, index) => `

      <div class="address-card">

        <div class="address-header">
          <span class="address-name">${addr.name}</span>
          ${index === 0 ? '<span class="badge-default">Default</span>' : ''}
        </div>

        <div class="address-details">
          <p>${addr.street}</p>
          <p>${addr.city}</p>
          <p>${addr.email || ''}</p>
          <p>${addr.mobile}</p>
        </div>

        <div class="address-actions">
          <button class="btn-link edit-address-btn" data-index="${index}">
            Edit
          </button>

          <button class="btn-link text-red remove-address-btn" data-index="${index}">
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
  const editIndexInput = document.getElementById('address-edit-index');



  if (addBtn && modal) {

    addBtn.addEventListener('click', () => {

      if (!checkAuth("Please login to add address")) return;

      form.reset();

      if (editIndexInput) editIndexInput.value = "-1";

      if (modalTitle)
        modalTitle.textContent = "Add New Address";

      openModal(modal);

    });

  }



  if (form) {

    form.addEventListener('submit', (e) => {

      e.preventDefault();

      const formData = new FormData(form);

      const newAddress = {
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        street: formData.get('street'),
        city: formData.get('city'),
        zip: formData.get('zip')
      };


      const addresses = JSON.parse(
        localStorage.getItem('dripmen_addresses') || '[]'
      );

      const editIndex = parseInt(editIndexInput.value);



      if (editIndex > -1 && addresses[editIndex]) {

        addresses[editIndex] = newAddress;

        showToast("Address updated successfully");

      } else {

        addresses.push(newAddress);

        showToast("Address added successfully");

      }



      localStorage.setItem(
        'dripmen_addresses',
        JSON.stringify(addresses)
      );



      renderAddresses();

      closeAllModals();

      form.reset();

    });

  }



  // Edit + Remove logic
  container.addEventListener('click', (e) => {

    if (e.target.classList.contains('edit-address-btn')) {

      const index = e.target.dataset.index;

      const addresses = JSON.parse(
        localStorage.getItem('dripmen_addresses') || '[]'
      );

      const addr = addresses[index];

      if (addr && form) {

        form.name.value = addr.name || '';
        form.mobile.value = addr.mobile || '';
        form.email.value = addr.email || '';
        form.street.value = addr.street || '';
        form.city.value = addr.city || '';
        form.zip.value = addr.zip || '';

        if (editIndexInput) editIndexInput.value = index;

        if (modalTitle)
          modalTitle.textContent = "Edit Address";

        openModal(modal);

      }

    }



    if (e.target.classList.contains('remove-address-btn')) {

      const index = e.target.dataset.index;

      const addresses = JSON.parse(
        localStorage.getItem('dripmen_addresses') || '[]'
      );

      addresses.splice(index, 1);

      localStorage.setItem(
        'dripmen_addresses',
        JSON.stringify(addresses)
      );

      renderAddresses();

      showToast("Address removed");

    }

  });

}