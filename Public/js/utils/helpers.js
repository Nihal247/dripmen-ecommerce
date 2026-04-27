// js/utils/helpers.js

// Format date → shows "Nov 12, 2023" (matches your existing order dates)
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// Shorten long text → "Nike Black T-Shi..."
export function truncateText(text, maxLength = 50) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Debounce → prevents search from firing on every keypress
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// =========================================================
// SHARED: Password show / hide eye toggles
// Call once on any page that has .toggle-password-btn buttons.
// =========================================================
export function initPasswordToggles() {
  document.querySelectorAll(".toggle-password-btn:not(.toggle-initialized)").forEach(function(btn) {
    btn.classList.add("toggle-initialized");
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      const targetId = btn.getAttribute("data-target");
      const input    = document.getElementById(targetId);
      const icon     = btn.querySelector("i");

      if (!input) return;

      const isHidden = input.type === "password";

      // Toggle input visibility
      input.type = isHidden ? "text" : "password";

      // Swap the icon explicitly (don't use toggle — it can misfire)
      if (icon) {
        if (isHidden) {
          icon.classList.remove("ph-eye");
          icon.classList.add("ph-eye-slash");
        } else {
          icon.classList.remove("ph-eye-slash");
          icon.classList.add("ph-eye");
        }
      }

      btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });
}
