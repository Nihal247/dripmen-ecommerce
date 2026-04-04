// ==========================================
// IMPORTS
// ==========================================
import { showToast } from "../core.js";
import { initPasswordToggles } from "../utils/helpers.js";

// ==========================================
// PAGE: LOGIN
// ==========================================
export function initLoginPage() {
    // Wire up eye toggles on password fields
    initPasswordToggles();

    // ---- Check for token in URL (Google Auth Success) ----
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get("token");

    if (googleToken) {
        localStorage.setItem("token", googleToken);
        showToast("Logged in with Google ✅");
        
        // Remove token from URL to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
            window.location.href = "account.html";
        }, 1000);
        return;
    }

    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch("http://127.0.0.1:4000/api/auth/login", {
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
