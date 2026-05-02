import { API_BASE_URL } from "../config.js";
import { showToast } from "../core.js";
import { initPasswordToggles } from "../utils/helpers.js";

export function initResetPasswordPage() {
  // Wire up eye toggles
  initPasswordToggles();

  const form = document.getElementById("reset-password-form");

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("new-password").value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!passwordRegex.test(password)) {
      showToast("Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character", "error");
      return;
    }

    try {

      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message, "error");
        return;
      }

      showToast("Password reset successful", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);

    } catch (error) {

      console.error(error);
      showToast("Network error", "error");

    }

  });

}