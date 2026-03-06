// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { openModal, closeAllModals, showToast } from "../core.js";


//==========================================
// PAGE: PAYMENT OPTIONS
// ==========================================
export function initPaymentPage() {

  const container = document.getElementById("payment-grid");
  if (!container) return;


  function renderCards() {

    const cards = JSON.parse(localStorage.getItem("dripmen_cards") || "[]");

    if (cards.length === 0) {

      container.innerHTML = `
        <div class="payment-card">

          <div class="card-top">
            <div class="card-chip"></div>
            <button class="remove-card-btn" disabled>
              <i class="ph-fill ph-lock-key"></i>
            </button>
          </div>

          <div class="card-number">
            4242 4242 4242 4242
          </div>

          <div class="card-bottom">

            <div>
              <span class="card-holder-label">Card Holder</span>
              <span class="card-holder-name">Muhammed Nihal</span>
            </div>

            <div>
              <span class="card-expiry-label">Expires</span>
              <span class="card-expiry-date">12/25</span>
            </div>

            <div class="card-brand">
              <i class="ph-fill ph-credit-card"></i>
            </div>

          </div>

        </div>
      `;

      return;
    }


    container.innerHTML = cards
      .map(
        (card, index) => `

        <div class="payment-card">

          <div class="card-top">

            <div class="card-chip"></div>

            <button class="remove-card-btn"
                    data-index="${index}">
              <i class="ph-fill ph-trash"></i>
            </button>

          </div>

          <div class="card-number">
            ${card.number}
          </div>

          <div class="card-bottom">

            <div>
              <span class="card-holder-label">Card Holder</span>
              <span class="card-holder-name">${card.holder}</span>
            </div>

            <div>
              <span class="card-expiry-label">Expires</span>
              <span class="card-expiry-date">${card.expiry}</span>
            </div>

            <div class="card-brand">
              <i class="ph-fill ph-credit-card"></i>
            </div>

          </div>

        </div>

      `
      )
      .join("");
  }


  renderCards();


  // =========================
  // Add Card Logic
  // =========================

  const addBtn = document.getElementById("add-card-btn");
  const modal = document.getElementById("add-card-modal");
  const form = document.getElementById("add-card-form");

  if (addBtn && modal) {
    addBtn.addEventListener("click", () => openModal(modal));
  }


  if (form) {

    form.addEventListener("submit", (e) => {

      e.preventDefault();

      const formData = new FormData(form);

      const newCard = {
        number: formData.get("cardNumber"),
        holder: formData.get("cardHolder"),
        expiry: formData.get("expiry"),
      };

      const cards = JSON.parse(localStorage.getItem("dripmen_cards") || "[]");

      cards.push(newCard);

      localStorage.setItem("dripmen_cards", JSON.stringify(cards));

      renderCards();

      closeAllModals();

      form.reset();

      showToast("Card added successfully");

    });

  }


  // =========================
  // Remove Card Logic
  // =========================

  container.addEventListener("click", (e) => {

    const btn = e.target.closest(".remove-card-btn");

    if (btn && !btn.disabled) {

      const index = btn.dataset.index;

      const cards = JSON.parse(localStorage.getItem("dripmen_cards") || "[]");

      cards.splice(index, 1);

      localStorage.setItem("dripmen_cards", JSON.stringify(cards));

      renderCards();

      showToast("Card removed");

    }

  });

}