import { API_BASE_URL } from "../config.js";
import { initPasswordToggles } from "../utils/helpers.js";

export async function initAccountPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // ==============================
  // CLEAR ANY BROWSER-AUTOFILLED PASSWORDS
  // Browsers sometimes ignore autocomplete="off" — this ensures fields
  // start empty on page load (the professional standard).
  // ==============================
  setTimeout(() => {
    ["currentPassword", "newPassword", "confirmPassword"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }, 100);

  // ==============================
  // PASSWORD SHOW / HIDE TOGGLES
  // ==============================
  initPasswordToggles();

  // ==============================
  // LOAD USER DATA
  // ==============================
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || "Failed to load user", "error");
      return;
    }

    const user = data.user;

    document.getElementById("firstName").value = user.name || "";
    document.getElementById("email").value = user.email || "";

  } catch (error) {
    console.error(error);
    showToast("Network error while loading user", "error");
  }

  // ==============================
  // FORM SUBMIT
  // ==============================
  const form = document.getElementById("account-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("save-changes-btn");

    const name    = document.getElementById("firstName")?.value.trim();
    const email   = document.getElementById("email")?.value.trim();
    const current = document.getElementById("currentPassword")?.value;
    const newPass = document.getElementById("newPassword")?.value;
    const confirm = document.getElementById("confirmPassword")?.value;

    // ==============================
    // VALIDATION
    // ==============================
    const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;
    const emailRegex = /^[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@(?![0-9]+\.)[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/i;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!name || !nameRegex.test(name)) {
      showToast("Name must contain only letters and single spaces (2-50 chars)", "error");
      return;
    }

    if (!email || !emailRegex.test(email)) {
      showToast("Enter a valid email", "error");
      return;
    }

    // ==============================
    // LOADING STATE
    // ==============================
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = "Saving...";
    }

    // ==============================
    // UPDATE PROFILE
    // ==============================
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || "Failed to update profile", "error");
        resetButton(saveBtn);
        return;
      }

      showToast("Profile updated successfully ✅");

    } catch (err) {
      showToast("Network error", "error");
      resetButton(saveBtn);
      return;
    }

    // ==============================
    // PASSWORD CHANGE
    // ==============================
    if (current || newPass || confirm) {

      if (!current || !newPass || !confirm) {
        showToast("Fill all password fields", "error");
        resetButton(saveBtn);
        return;
      }

      if (newPass !== confirm) {
        showToast("Passwords do not match", "error");
        resetButton(saveBtn);
        return;
      }

      if (!passwordRegex.test(newPass)) {
        showToast("Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character", "error");
        resetButton(saveBtn);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: current,
            newPassword: newPass
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          showToast(data.message || "Failed to change password", "error");
          resetButton(saveBtn);
          return;
        }

        showToast("Password changed successfully ✅");

        // clear fields
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";

      } catch (err) {
        showToast("Network error", "error");
      }
    }

    resetButton(saveBtn);
  });

  // ==============================
  // CANCEL BUTTON
  // ==============================
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

// ==============================
// HELPER FUNCTION
// ==============================
function resetButton(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerText = "Save Changes";
}

// ==============================
// TOAST FUNCTION
// ==============================
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <i class="ph-fill ph-${type === "success" ? "check-circle" : "warning-circle"}"></i>
      <span>${message}</span>
    </div>
  `;


  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}