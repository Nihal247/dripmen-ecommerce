const API = "http://localhost:4000/api/banners";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken");
}

async function loadBanners() {
  const token = getToken();
  const grid = document.getElementById("banners-grid");
  if (!grid) return;

  grid.innerHTML = `<p style="grid-column:1/-1; text-align:center;">Loading banners...</p>`;

  try {
    const res = await fetch(`${API}/admin`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      if (data.banners.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center;">No banners found.</p>`;
        return;
      }

      grid.innerHTML = data.banners.map(banner => `
        <div class="admin-card-item">
          <img src="${banner.image}" alt="${banner.title}" class="admin-card-img">
          <div class="admin-card-body">
            <div class="admin-card-header">
              <h3 class="admin-card-title">${banner.title}</h3>
              <label class="switch">
                <input type="checkbox" ${banner.isActive ? 'checked' : ''} onchange="toggleBanner('${banner._id}', ${banner.isActive})">
                <span class="slider"></span>
              </label>
            </div>
            <p style="color: var(--text-gray); font-size: 0.9rem;">Link: ${banner.link}</p>
            <p style="color: var(--text-gray); font-size: 0.8rem;">Order: ${banner.order}</p>
            <div class="admin-card-actions">
              <button class="action-btn" onclick="openEditModal('${banner._id}')">
                <i class="ph ph-pencil-simple"></i>
              </button>
              <button class="action-btn delete" onclick="deleteBanner('${banner._id}')">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Failed to load banners", err);
  }
}

async function toggleBanner(id, currentStatus) {
  const token = getToken();
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    if ((await res.json()).success) loadBanners();
  } catch (err) {
    console.error("Toggle banner failed", err);
  }
}

async function deleteBanner(id) {
  if (!confirm("Are you sure?")) return;
  const token = getToken();
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if ((await res.json()).success) loadBanners();
  } catch (err) {
    console.error("Delete banner failed", err);
  }
}

async function openEditModal(id) {
  const token = getToken();
  const res = await fetch(`${API}/admin`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  const banner = data.banners.find(b => b._id === id);

  if (banner) {
    const form = document.getElementById("banner-form");
    form.title.value = banner.title;
    form.link.value = banner.link;
    form.order.value = banner.order;
    document.getElementById("banner-id").value = id;
    document.getElementById("modal-title").innerText = "Edit Banner";
    document.getElementById("banner-modal").classList.add("active");
  }
}

window.toggleBanner = toggleBanner;
window.deleteBanner = deleteBanner;
window.openEditModal = openEditModal;

document.addEventListener("DOMContentLoaded", () => {
  loadBanners();

  const modal = document.getElementById("banner-modal");
  const addBtn = document.getElementById("add-banner-btn");
  const closeBtn = document.querySelector(".close-modal-btn");
  const form = document.getElementById("banner-form");

  if (addBtn) addBtn.onclick = () => {
    form.reset();
    document.getElementById("banner-id").value = "";
    document.getElementById("modal-title").innerText = "Add New Banner";
    modal.classList.add("active");
  };
  
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const token = getToken();
      const id = document.getElementById("banner-id").value;
      const formData = new FormData(form);

      const url = id ? `${API}/${id}` : API;
      const method = id ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          modal.classList.remove("active");
          loadBanners();
        }
      } catch (err) {
        console.error("Save banner failed", err);
      }
    };
  }
});
