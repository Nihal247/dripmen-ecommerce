const API = `${window.API_BASE_URL}/api/coupons`;

function getToken() {
  return localStorage.getItem("adminToken");
}

// ─── Utility: show a quick inline toast ────────────────────────────────────
function showToast(msg, type = "success") {
  let container = document.getElementById("admin-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "admin-toast-container";
    container.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.style.cssText = `
    padding:12px 18px; border-radius:10px; font-weight:600; font-size:0.9rem;
    color:#fff; box-shadow:0 4px 16px rgba(0,0,0,.15);
    background:${type === "success" ? "#10b981" : "#ef4444"};
    animation: fadeInRight .3s ease;
  `;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── Load & render table ────────────────────────────────────────────────────
async function loadCoupons() {
  const token = getToken();
  const tbody = document.getElementById("coupons-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">Loading…</td></tr>`;

  try {
    const res  = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (!data.success || !data.coupons.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">No coupons found.</td></tr>`;
      return;
    }

    const tagColors = { HOT: "tag-HOT", NEW: "tag-NEW", LIMITED: "tag-LIMITED" };

    tbody.innerHTML = data.coupons.map(c => {
      const date      = new Date(c.expiryDate).toLocaleDateString("en-US", { day:"numeric", month:"short", year:"numeric" });
      const isExpired = new Date(c.expiryDate) < new Date();
      const status    = c.isActive && !isExpired ? "Active" : isExpired ? "Expired" : "Inactive";
      const statusColor = status === "Active" ? "#10b981" : "#ef4444";
      const tagClass  = tagColors[c.tag] || "";
      const tagHtml   = c.tag ? `<span class="tag-badge ${tagClass}">${c.tag}</span>` : `<span style="color:#d1d5db">—</span>`;
      const topBarHtml = c.showOnTopBar
        ? `<span class="topbar-indicator">✓ On</span>`
        : `<span class="topbar-indicator off">Off</span>`;

      return `
        <tr>
          <td><strong style="letter-spacing:.5px;">${c.code}</strong></td>
          <td>${c.discountType === "percentage" ? c.discountValue + "%" : "$" + c.discountValue}</td>
          <td>₹${c.minPurchase || 0}</td>
          <td style="color:${isExpired ? "#ef4444" : "inherit"}">${date}</td>
          <td>${tagHtml}</td>
          <td>${topBarHtml}</td>
          <td>
            <span style="background:${statusColor}20;color:${statusColor};padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">
              ${status}
            </span>
          </td>
          <td>
            <div class="action-btns">
              <button class="action-btn edit" title="Edit" onclick="openEditModal('${c._id}')">
                <i class="ph ph-pencil-simple"></i>
              </button>
              <button class="action-btn delete" title="Delete" onclick="deleteCoupon('${c._id}')">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Failed to load coupons", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;">Failed to load coupons.</td></tr>`;
  }
}

// ─── Delete ─────────────────────────────────────────────────────────────────
async function deleteCoupon(id) {
  if (!confirm("Delete this coupon? This cannot be undone.")) return;
  try {
    const res  = await fetch(`${API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.success) { showToast("Coupon deleted"); loadCoupons(); }
    else showToast(data.message || "Delete failed", "error");
  } catch (err) { showToast("Delete failed", "error"); }
}

// ─── Open modal for editing (pre-fill) ──────────────────────────────────────
async function openEditModal(id) {
  try {
    const res  = await fetch(API, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    const c    = data.coupons?.find(x => x._id === id);
    if (!c) return showToast("Coupon not found", "error");

    // Set mode
    document.getElementById("modal-title").textContent     = "Edit Coupon";
    document.getElementById("form-submit-btn").innerHTML   = '<i class="ph ph-floppy-disk"></i> Update Coupon';
    document.getElementById("edit-coupon-id").value        = id;

    // Pre-fill fields
    document.getElementById("f-code").value                = c.code;
    document.getElementById("f-code").readOnly             = true; // code shouldn't change
    document.getElementById("f-discountType").value        = c.discountType;
    document.getElementById("f-discountValue").value       = c.discountValue;
    document.getElementById("f-minPurchase").value         = c.minPurchase || 0;
    document.getElementById("f-startDate").value           = new Date(c.startDate || c.createdAt).toISOString().split("T")[0];
    document.getElementById("f-expiryDate").value          = new Date(c.expiryDate).toISOString().split("T")[0];
    document.getElementById("f-tag").value                 = c.tag || "";
    document.getElementById("f-showOnTopBar").checked      = !!c.showOnTopBar;
    document.getElementById("f-isActive").checked          = !!c.isActive;

    updateToggleLabels();
    document.getElementById("coupon-modal").classList.add("active");
  } catch (err) {
    showToast("Failed to load coupon", "error");
  }
}

// Make globally accessible for inline onclick
window.deleteCoupon  = deleteCoupon;
window.openEditModal = openEditModal;

// ─── Toggle label updaters ────────────────────────────────────────────────
function updateToggleLabels() {
  const topBarEl = document.getElementById("f-showOnTopBar");
  const activeEl = document.getElementById("f-isActive");
  if (topBarEl) document.getElementById("topbar-label").textContent = topBarEl.checked ? "On" : "Off";
  if (activeEl) document.getElementById("active-label").textContent  = activeEl.checked ? "On" : "Off";
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadCoupons();

  const modal     = document.getElementById("coupon-modal");
  const openBtn   = document.getElementById("open-coupon-modal");
  const closeBtn  = document.querySelector(".close-modal-btn");
  const form      = document.getElementById("coupon-form");
  const topBarChk = document.getElementById("f-showOnTopBar");
  const activeChk = document.getElementById("f-isActive");

  // ── open (CREATE mode) ──
  if (openBtn) openBtn.onclick = () => {
    document.getElementById("modal-title").textContent   = "Create New Coupon";
    document.getElementById("form-submit-btn").innerHTML = '<i class="ph ph-floppy-disk"></i> Save Coupon';
    document.getElementById("edit-coupon-id").value      = "";
    document.getElementById("f-code").readOnly           = false;
    form.reset();
    document.getElementById("f-isActive").checked = true;
    document.getElementById("f-startDate").value = new Date().toISOString().split("T")[0];
    updateToggleLabels();
    modal.classList.add("active");
  };

  // ── close ──
  if (closeBtn) closeBtn.onclick = () => {
    modal.classList.remove("active");
    form.reset();
  };

  // Close on backdrop click
  modal.addEventListener("click", e => { if (e.target === modal) { modal.classList.remove("active"); form.reset(); } });

  // Toggle labels
  if (topBarChk) topBarChk.addEventListener("change", updateToggleLabels);
  if (activeChk) activeChk.addEventListener("change", updateToggleLabels);

  // ── Submit (CREATE or UPDATE) ──
  if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    const token  = getToken();
    const editId = document.getElementById("edit-coupon-id").value;

    const payload = {
      code:          document.getElementById("f-code").value.toUpperCase().trim(),
      discountType:  document.getElementById("f-discountType").value,
      discountValue: Number(document.getElementById("f-discountValue").value),
      minPurchase:   Number(document.getElementById("f-minPurchase").value) || 0,
      expiryDate:    document.getElementById("f-expiryDate").value,
      startDate:     document.getElementById("f-startDate").value,
      tag:           document.getElementById("f-tag").value,
      showOnTopBar:  document.getElementById("f-showOnTopBar").checked,
      isActive:      document.getElementById("f-isActive").checked,
    };

    const submitBtn = document.getElementById("form-submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-circle-notch" style="animation:spin .8s linear infinite;"></i> Saving…';

    try {
      const url    = editId ? `${API}/${editId}` : API;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(editId ? "Coupon updated ✓" : "Coupon created ✓");
        modal.classList.remove("active");
        form.reset();
        loadCoupons();
      } else {
        showToast(data.message || "Failed to save coupon", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    } finally {
      submitBtn.disabled = false;
    }
  };
});
