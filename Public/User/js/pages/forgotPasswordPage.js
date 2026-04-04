import { showToast } from "../core.js";
import { initPasswordToggles } from "../utils/helpers.js";

export function initForgotPasswordPage() {
  // Wire up eye toggles (shown on step 3 — Reset Password)
  initPasswordToggles();

  const form = document.getElementById("fp-email-form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("fp-email").value;

    try {

      const res = await fetch("http://127.0.0.1:4000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Failed to send reset link", "error");
        return;
      }

      showToast("Reset link sent to your email");

    } catch (error) {

      console.error(error);
      showToast("Network error", "error");

    }

  });

}
