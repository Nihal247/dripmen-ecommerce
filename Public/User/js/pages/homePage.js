import { API_BASE_URL } from "../config.js";
import { optimizeImage } from "../core.js";
// ==========================================
// PAGE: HOME
// Loads products from API into homepage sections
// ==========================================

const API_BASE = API_BASE_URL;

// ==========================================
// RENDER CARD — matches exact CSS classes in style.css
// ==========================================
function renderCard(p) {
  const image        = optimizeImage(p.images?.[0] || "images/placeholder.png", 500);
  const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  const isOutOfStock = p.status === "out_of_stock" || p.stock === 0;

  // Discount badge
  let discountBadge = "";
  if (p.salePrice && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    discountBadge = `<span class="discount-badge">-${pct}%</span>`;
  }

  // Price HTML
  const priceHTML = p.salePrice && p.salePrice < p.price
    ? `<span class="current-price">₹${p.salePrice}</span>
       <span class="original-price">₹${p.price}</span>
       ${discountBadge}`
    : `<span class="current-price">₹${p.price}</span>`;

  // Stars
  const stars = `
    <i class="ph-fill ph-star"></i>
    <i class="ph-fill ph-star"></i>
    <i class="ph-fill ph-star"></i>
    <i class="ph-fill ph-star"></i>
    <i class="ph-fill ph-star-half"></i>
    <span class="rating-text">4.5/5</span>`;

  // Cart button
  const cartBtn = isOutOfStock
    ? `<button class="btn btn-primary full-width add-to-cart-btn" disabled style="opacity:0.6;cursor:not-allowed;">Out of Stock</button>`
    : `<button class="btn btn-primary full-width add-to-cart-btn">Add to Cart</button>`;

  return `
    <div class="product-card"
      data-id="${p._id}"
      data-name="${p.name}"
      data-stock="${p.stock}"
      data-price="${displayPrice}"
      data-image="${image}"
      data-rating="4.5/5"
      data-sizes="${encodeURIComponent(JSON.stringify(p.sizes || []))}">
      <div class="product-image-container">
        <img src="${image}" alt="${p.name}" class="product-image" loading="lazy" />
        <button class="wishlist-btn" aria-label="Add to wishlist">
          <i class="ph ph-heart"></i>
        </button>
        <div class="card-hover-actions">
          ${cartBtn}
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">${stars}</div>
        <div class="product-price">${priceHTML}</div>
      </div>
    </div>`;
}

// ==========================================
// RENDER ALL DATA FROM ONE CONSOLIDATED API
// ==========================================
export async function initHomePage() {
  const container = document.getElementById("hero-banner-container");
  const grids = {
    "new-arrivals-grid": document.getElementById("new-arrivals-grid"),
    "top-selling-grid":  document.getElementById("top-selling-grid"),
    "explore-grid":      document.getElementById("explore-grid")
  };

  // 1. Show ALL skeletons at once
  if (container) container.innerHTML = `<div class="skeleton skeleton-banner"></div>`;
  
  if (grids["new-arrivals-grid"]) {
    grids["new-arrivals-grid"].innerHTML = Array(4).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
      </div>`).join("");
  }
  if (grids["top-selling-grid"]) {
    grids["top-selling-grid"].innerHTML = Array(4).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
      </div>`).join("");
  }
  if (grids["explore-grid"]) {
    grids["explore-grid"].innerHTML = Array(8).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
      </div>`).join("");
  }

  try {
    // 2. Fetch EVERYTHING in one go
    const res = await fetch(`${API_BASE}/api/products/homepage`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    // 3. Render Banners
    if (container && data.banners?.length > 0) {
      renderBanners(container, data.banners);
    }

    // 4. Render Sections
    const wishlist = JSON.parse(localStorage.getItem("dripmen_wishlist") || "[]");
    
    if (grids["new-arrivals-grid"] && data.sections?.new_arrivals) {
      grids["new-arrivals-grid"].innerHTML = data.sections.new_arrivals.map(renderCard).join("");
    }
    if (grids["top-selling-grid"] && data.sections?.top_selling) {
      grids["top-selling-grid"].innerHTML = data.sections.top_selling.map(renderCard).join("");
    }
    if (grids["explore-grid"] && data.sections?.explore) {
      grids["explore-grid"].innerHTML = data.sections.explore.map(renderCard).join("");
    }

    // 5. Sync Wishlist Hearts
    Object.values(grids).forEach(grid => {
      if (!grid) return;
      grid.querySelectorAll(".product-card").forEach(card => {
        if (wishlist.find(w => w.id === card.dataset.id)) {
          const icon = card.querySelector(".wishlist-btn i");
          if (icon) icon.classList.add("ph-fill");
        }
      });
    });

  } catch (err) {
    console.error("[homePage] Failed to load consolidated homepage data:", err);
    // Cleanup skeletons on error
    if (container) container.innerHTML = "";
    Object.values(grids).forEach(g => { if(g) g.innerHTML = ""; });
  }
}

function renderBanners(container, banners) {
  container.innerHTML = banners.map(b => `
      <a href="${b.link || 'products.html'}" class="hero-banner-link track-banner-click" data-id="${b._id}" style="position:relative; display:block;">
        <img src="${optimizeImage(b.image, 1200)}" alt="${b.title || 'Banner'}" class="hero-banner-img" />
      </a>
  `).join("") + "<style>#hero-banner-container::-webkit-scrollbar { display: none; } .hero-banner-link img { width: 100%; height: auto; object-fit: cover; }</style>";

  // Click & View Tracking
  container.querySelectorAll('.track-banner-click').forEach(link => {
    link.addEventListener('click', () => {
      const bannerId = link.dataset.id;
      if (bannerId) fetch(`${API_BASE}/api/banners/${bannerId}/click`, { method: "POST" }).catch(console.error);
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bannerId = entry.target.dataset.id;
          if (bannerId && !entry.target.dataset.viewed) {
            entry.target.dataset.viewed = "true";
            fetch(`${API_BASE}/api/banners/${bannerId}/view`, { method: "POST" }).catch(console.error);
          }
        }
      });
    }, { threshold: 0.5 });
    container.querySelectorAll('.track-banner-click').forEach(link => observer.observe(link));
  }

  if (banners.length > 1) {
    container.style.display = 'flex';
    container.style.overflowX = 'auto';
    container.style.scrollSnapType = 'x mandatory';
    container.style.scrollBehavior = 'smooth';
    container.style.scrollbarWidth = 'none';
    
    container.querySelectorAll('.hero-banner-link').forEach(link => {
      link.style.flex = '0 0 100%';
      link.style.scrollSnapAlign = 'start';
    });

    let currentBannerIndex = 0;
    setInterval(() => {
      if(!container.matches(':hover')){
         currentBannerIndex = (currentBannerIndex + 1) % banners.length;
         container.scrollTo(currentBannerIndex * container.offsetWidth, 0);
      }
    }, 5000);
  }
}