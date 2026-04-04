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

    try {

      const res = await fetch("http://127.0.0.1:4000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Password reset successful");
      window.location.href = "login.html";

    } catch (error) {

      console.error(error);
      alert("Network error");

    }

  });

}