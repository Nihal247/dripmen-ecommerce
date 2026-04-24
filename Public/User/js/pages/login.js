import { API_BASE_URL } from "../config.js";
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

    // Set dynamic Google Auth URL
    const googleBtn = document.getElementById("google-login-btn");
    if (googleBtn) {
        // Construct target index.html URL relative to current page
        const targetUrl = new URL("index.html", window.location.href).href;
        googleBtn.href = `${API_BASE_URL}/api/auth/google?origin=${encodeURIComponent(targetUrl)}`;
    }

    // ---- Check for token in URL (Google Auth Success) ----
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get("token");
    const errorParam = urlParams.get("error");

    if (errorParam === "account_suspended") {
        showToast("Your account has been suspended. Please contact support.", "error");
        window.history.replaceState({}, document.title, window.location.pathname);
    }

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
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
