import { API_BASE_URL } from "../config.js";
<<<<<<< HEAD
import { initPasswordToggles } from "../utils/helpers.js";
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

export async function initAccountPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

<<<<<<< HEAD
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
=======
  // ───────── LOAD USER DATA ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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

<<<<<<< HEAD
  // ==============================
  // FORM SUBMIT
  // ==============================
=======
  // ───────── FORM SUBMIT ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  const form = document.getElementById("account-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("save-changes-btn");

    const name    = document.getElementById("firstName")?.value.trim();
    const email   = document.getElementById("email")?.value.trim();
    const current = document.getElementById("currentPassword")?.value;
    const newPass = document.getElementById("newPassword")?.value;
    const confirm = document.getElementById("confirmPassword")?.value;

<<<<<<< HEAD
    // ==============================
    // VALIDATION
    // ==============================
=======
    // ───────── VALIDATION ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    if (!name) {
      showToast("Name cannot be empty", "error");
      return;
    }

    if (!email || !email.includes("@")) {
      showToast("Enter a valid email", "error");
      return;
    }

<<<<<<< HEAD
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
=======
    // ───────── LOADING STATE ─────────
    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";

    // ───────── UPDATE PROFILE ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
        resetButton(saveBtn);
=======
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        return;
      }

      showToast("Profile updated successfully ✅");

    } catch (err) {
      showToast("Network error", "error");
<<<<<<< HEAD
      resetButton(saveBtn);
      return;
    }

    // ==============================
    // PASSWORD CHANGE
    // ==============================
=======
      saveBtn.disabled = false;
      saveBtn.innerText = "Save Changes";
      return;
    }

    // ───────── PASSWORD CHANGE ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    if (current || newPass || confirm) {

      if (!current || !newPass || !confirm) {
        showToast("Fill all password fields", "error");
<<<<<<< HEAD
        resetButton(saveBtn);
=======
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        return;
      }

      if (newPass !== confirm) {
        showToast("Passwords do not match", "error");
<<<<<<< HEAD
        resetButton(saveBtn);
=======
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        return;
      }

      if (newPass.length < 6) {
        showToast("Password must be at least 6 characters", "error");
<<<<<<< HEAD
        resetButton(saveBtn);
=======
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
<<<<<<< HEAD
          resetButton(saveBtn);
=======
          saveBtn.disabled = false;
          saveBtn.innerText = "Save Changes";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
          return;
        }

        showToast("Password changed successfully ✅");

<<<<<<< HEAD
        // clear fields
=======
        // clear password fields
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";

      } catch (err) {
        showToast("Network error", "error");
      }
    }

<<<<<<< HEAD
    resetButton(saveBtn);
  });

  // ==============================
  // CANCEL BUTTON
  // ==============================
=======
    // ───────── RESET BUTTON ─────────
    saveBtn.disabled = false;
    saveBtn.innerText = "Save Changes";
  });

  // ───────── CANCEL BUTTON ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

<<<<<<< HEAD
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
=======
// ───────── TOAST FUNCTION ─────────
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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

<<<<<<< HEAD

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}