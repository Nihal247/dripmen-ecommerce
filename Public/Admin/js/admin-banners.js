const API = `${window.API_BASE_URL}/api/banners`;

function getToken() {
  return localStorage.getItem("adminToken");
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
          <img src="${banner.image}" alt="${banner.title}" class="admin-card-img" style="object-fit: cover;">
          <div class="admin-card-body">
            <div class="admin-card-header">
              <h3 class="admin-card-title">${banner.title}</h3>
              <label class="switch">
                <input type="checkbox" ${banner.isActive ? 'checked' : ''} onchange="toggleBanner('${banner._id}', ${banner.isActive})">
                <span class="slider"></span>
              </label>
            </div>
            <p style="color: var(--text-gray); font-size: 0.85rem;">Views: ${banner.views || 0} | Clicks: ${banner.clicks || 0}</p>
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-top: 5px;">Link: ${banner.link}</p>
            <p style="color: var(--text-gray); font-size: 0.85rem;">Order: ${banner.order}</p>
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
    const res = await fetch(`${API}/${id}/status`, {
      method: "PATCH",
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
  if (!confirm("Are you sure you want to delete this banner format?")) return;
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
    form.reset();
    
    // hide previews by default
    document.getElementById("img-preview").style.display = "none";

    form.title.value = banner.title || "";
    form.link.value = banner.link || "";
    form.order.value = banner.order || 0;
    
    const activeBox = document.getElementById("banner-active");
    if(activeBox) activeBox.checked = banner.isActive;

    // Show existing images
    if (banner.image) {
      const imgP = document.getElementById("img-preview");
      imgP.src = banner.image;
      imgP.style.display = "block";
    }

    form.image.required = false; // Only needed on create

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

  // Image previews
  const bannerImg = document.getElementById("banner-img");

  if (bannerImg) {
    bannerImg.addEventListener("change", function() {
      const file = this.files[0];
      const preview = document.getElementById("img-preview");
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }
    });
  }

  if (addBtn) addBtn.onclick = () => {
    form.reset();
    document.getElementById("img-preview").style.display = "none";
    document.getElementById("img-preview").src = "";
    
    document.getElementById("banner-id").value = "";
    document.getElementById("modal-title").innerText = "Add New Banner";
    
    form.image.required = true;
    
    modal.classList.add("active");
  };
  
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.innerText;
      submitBtn.innerText = "Saving...";
      submitBtn.disabled = true;

      const token = getToken();
      const id = document.getElementById("banner-id").value;
      const formData = new FormData(form);
      
      // Update checkbox logic for FormData (if missing, it's false)
      const isActive = document.getElementById("banner-active") ? document.getElementById("banner-active").checked : true;
      formData.set("isActive", isActive);

      const url = id ? `${API}/${id}` : API;
      const method = id ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { 
            "Authorization": `Bearer ${token}`
            // DO NOT set Content-Type, browser will set it to multipart/form-data with boundary automatically
          },
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          modal.classList.remove("active");
          loadBanners(); // refresh the view
        } else {
          alert("Error: " + data.message);
        }
      } catch (err) {
        console.error("Save banner failed", err);
        alert("An error occurred while saving the banner.");
      } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    };
  }
});
