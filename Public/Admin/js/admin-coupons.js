const API = "http://127.0.0.1:4000/api/coupons";

function getToken() {
  return localStorage.getItem("adminToken");
}

async function loadCoupons() {
  const token = getToken();
  const tbody = document.getElementById("coupons-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>`;

  try {
    const res = await fetch(API, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      if (data.coupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No coupons found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.coupons.map(coupon => {
        const date = new Date(coupon.expiryDate).toLocaleDateString();
        const isExpired = new Date(coupon.expiryDate) < new Date();
        const status = coupon.isActive && !isExpired ? "Active" : isExpired ? "Expired" : "Inactive";
        const statusColor = status === "Active" ? "#10b981" : "#ef4444";

        return `
          <tr>
            <td><strong>${coupon.code}</strong></td>
            <td>${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue}</td>
            <td>$${coupon.minPurchase || 0}</td>
            <td style="color: ${isExpired ? '#ef4444' : 'inherit'}">${date}</td>
            <td>
              <span style="background:${statusColor}20; color:${statusColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600;">
                ${status}
              </span>
            </td>
            <td>
              <button class="action-btn delete" onclick="deleteCoupon('${coupon._id}')">
                <i class="ph ph-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Failed to load coupons", err);
  }
}

async function deleteCoupon(id) {
  if (!confirm("Are you sure you want to delete this coupon?")) return;
  const token = getToken();

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      loadCoupons();
    }
  } catch (err) {
    console.error("Delete coupon failed", err);
  }
}

// Global scope for onclick
window.deleteCoupon = deleteCoupon;

document.addEventListener("DOMContentLoaded", () => {
  loadCoupons();

  const modal = document.getElementById("coupon-modal");
  const openBtn = document.getElementById("open-coupon-modal");
  const closeBtn = document.querySelector(".close-modal-btn");
  const form = document.getElementById("coupon-form");

  if (openBtn) {
    openBtn.onclick = () => modal.classList.add("active");
  }

  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("active");
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const token = getToken();
      const formData = new FormData(form);
      const couponData = {
        code: formData.get("code").toUpperCase(),
        discountType: formData.get("discountType"),
        discountValue: Number(formData.get("discountValue")),
        minPurchase: Number(formData.get("minPurchase")),
        expiryDate: formData.get("expiryDate")
      };

      try {
        const res = await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(couponData)
        });
        const data = await res.json();

        if (data.success) {
          modal.classList.remove("active");
          form.reset();
          loadCoupons();
        } else {
          alert(data.message || "Failed to create coupon");
        }
      } catch (err) {
        console.error("Create coupon failed", err);
      }
    };
  }
});
