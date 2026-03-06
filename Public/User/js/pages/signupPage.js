// ==========================================
// IMPORTS
// ==========================================
import { showToast } from "../core.js";

// ==========================================
// PAGE: SIGN UP
// ==========================================
export function initSignupPage() {
  const signupForm = document.getElementById("signup-form");
  const otpForm = document.getElementById("signup-otp-form");
  const step1 = document.getElementById("signup-step-1");
  const stepOtp = document.getElementById("signup-step-otp");

  // =========================
  // STEP 1 — SEND OTP
  // =========================
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("signup-name")?.value?.trim();
      const email = document.getElementById("signup-email")?.value?.trim();
      const password = document.getElementById("signup-password")?.value;
      const confirmPassword = document.getElementById("signup-confirm-password")?.value;

      // Required fields
      if (!name || !email || !password || !confirmPassword) {
        showToast("All fields are required", "error");
        return;
      }

      // Strong password validation (Frontend UX only)
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

      if (!strongPasswordRegex.test(password)) {
        showToast(
          "Password must be at least 6 characters and include uppercase, lowercase, and number",
          "error"
        );
        return;
      }

      // Confirm password match
      if (password !== confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }), // Only email needed here
        });

        const data = await response.json(); // Always parse response first

        if (!response.ok) {
          showToast(data.message || "Signup failed", "error");
          return;
        }

        showToast("OTP sent successfully ✅");

        // Store data temporarily for step 2
        sessionStorage.setItem(
          "signupData",
          JSON.stringify({ name, email, password })
        );

        step1.style.display = "none";
        stepOtp.style.display = "block";

      } catch (error) {
        console.error(error);
        showToast("Network error. Please try again.", "error");
      }
    });
  }

  // =========================
  // STEP 2 — VERIFY OTP
  // =========================
  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const otp = document.getElementById("signup-otp")?.value?.trim();

      if (!otp) {
        showToast("Please enter OTP", "error");
        return;
      }

      try {
        const storedData = JSON.parse(sessionStorage.getItem("signupData"));

        if (!storedData) {
          showToast("Session expired. Please signup again.", "error");
          return;
        }

        const response = await fetch(
          "http://localhost:4000/api/auth/verify-signup-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...storedData,
              otp,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          showToast(data.message || "Invalid OTP", "error");
          return;
        }

        showToast("Account created successfully! 🎉");

        // Save JWT
        localStorage.setItem("token", data.token);

        // Clear temp signup data
        sessionStorage.removeItem("signupData");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);

      } catch (error) {
        console.error(error);
        showToast("Network error during OTP verification.", "error");
      }
    });
  }
}