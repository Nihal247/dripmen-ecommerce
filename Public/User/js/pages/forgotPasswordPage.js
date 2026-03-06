// ==========================================
// IMPORTS
// ==========================================
import { showToast } from "../core.js";


// ==========================================
// PAGE: FORGOT PASSWORD
// ==========================================
export function initForgotPasswordPage() {

  const emailForm = document.getElementById('fp-email-form');
  const otpForm = document.getElementById('fp-otp-form');
  const passForm = document.getElementById('fp-pass-form');

  const stepEmail = document.getElementById('step-email');
  const stepOtp = document.getElementById('step-otp');
  const stepPass = document.getElementById('step-new-pass');


  // STEP 1: SEND EMAIL
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {

      e.preventDefault();

      const email = document.getElementById('fp-email').value;

      if (email) {

        showToast(`Code sent to ${email}`);

        stepEmail.style.display = 'none';
        stepOtp.style.display = 'block';

      }

    });
  }


  // STEP 2: VERIFY OTP
  if (otpForm) {
    otpForm.addEventListener('submit', (e) => {

      e.preventDefault();

      const otp = document.getElementById('fp-otp').value;

      if (otp === '1234') {

        showToast("Code verified successfully");

        stepOtp.style.display = 'none';
        stepPass.style.display = 'block';

      } else {

        showToast("Invalid code (Try 1234)", "error");

      }

    });
  }


  // STEP 3: RESET PASSWORD
  if (passForm) {
    passForm.addEventListener('submit', (e) => {

      e.preventDefault();

      const p1 = document.getElementById('fp-new-pass').value;
      const p2 = document.getElementById('fp-confirm-pass').value;

      if (p1 !== p2) {

        showToast("Passwords do not match", "error");
        return;

      }

      showToast("Password reset successfully!");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    });
  }

}