// ==========================================
// IMPORT CORE FUNCTIONS
// ==========================================
import { showToast } from "../core.js";


// ==========================================
// PAGE: CONTACT
// ==========================================
export function initContactPage() {

  const form = document.getElementById("contact-form");

  if (!form) return;

  form.addEventListener("submit", (e) => {

    e.preventDefault();

    showToast("Message sent successfully!");

    form.reset();

  });

}