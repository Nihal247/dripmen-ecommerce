// ==========================================
// IMPORTS
// ==========================================
import { showToast } from "../core.js";

// ==========================================
// PAGE: LOGIN
// ==========================================
export function initLoginPage() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch("http://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("dripmen_user", JSON.stringify({ email }));
                showToast("Logged in successfully ✅");
                setTimeout(() => {
                    window.location.href = "account.html";
                }, 1000);
            } else {
                showToast(data.message || "Login failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Login error:", error);
            showToast("Network error. Please check your connection.", "error");
        }
    });
}
