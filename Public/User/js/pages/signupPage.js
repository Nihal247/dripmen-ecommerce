// ==========================================
// IMPORTS
// ==========================================
import { showToast } from "../core.js";
import { isStrongPassword } from "../utils/validators.js";
import { initPasswordToggles } from "../utils/helpers.js";

// ==========================================
// PAGE: SIGN UP
// ==========================================
export function initSignupPage() {
  // Wire up eye toggles on password fields
  initPasswordToggles();

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

      const nameInput = document.getElementById("signup-name");
      const emailInput = document.getElementById("signup-email");
      const passwordInput = document.getElementById("signup-password");
      const confirmPasswordInput = document.getElementById("signup-confirm-password");

      const name = nameInput?.value?.trim();
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value;
      const confirmPassword = confirmPasswordInput?.value;

      // =========================
      // VALIDATORS
      // =========================
      
      // Professional name: Letters and single spaces only, 2-50 chars
      const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;
      
      // Strict Gmail only
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

      // Helper for real-time visual feedback
      const setValidationUI = (input, isValid) => {
        if (!input) return;
        if (isValid) {
          input.classList.remove("is-invalid");
          input.classList.add("is-valid");
        } else {
          input.classList.remove("is-valid");
          input.classList.add("is-invalid");
        }
      };

      // Real-time listeners
      [nameInput, emailInput].forEach(input => {
        if (!input) return;
        input.addEventListener("input", () => {
          const val = input.value.trim();
          const regex = input.id === "signup-name" ? nameRegex : emailRegex;
          setValidationUI(input, regex.test(val));
        });
      });

      // Submit checks
      if (!name || !email || !password || !confirmPassword) {
        showToast("All fields are required", "error");
        return;
      }

      if (!nameRegex.test(name)) {
        setValidationUI(nameInput, false);
        showToast("Name must contain only letters and single spaces (2-50 chars)", "error");
        return;
      }

      if (!emailRegex.test(email)) {
        setValidationUI(emailInput, false);
        showToast("Only @gmail.com addresses are allowed", "error");
        return;
      }

      if (!passwordRegex.test(password)) {
        showToast(
          "Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character",
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
        const response = await fetch("http://127.0.0.1:4000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

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
          "http://127.0.0.1:4000/api/auth/verify-signup-otp",
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
