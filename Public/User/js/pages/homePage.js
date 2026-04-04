// ==========================================
// PAGE: HOME
// Loads products from API into homepage sections
// ==========================================

const API_BASE = "http://127.0.0.1:4000";

// ==========================================
// RENDER CARD — matches exact CSS classes in style.css
// ==========================================
function renderCard(p) {
  const image        = p.images?.[0] || "images/placeholder.png";
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
    ? `<span class="current-price">$${p.salePrice}</span>
       <span class="original-price">$${p.price}</span>
       ${discountBadge}`
    : `<span class="current-price">$${p.price}</span>`;

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
        <img src="${image}" alt="${p.name}" class="product-image" />
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
// LOAD ONE SECTION FROM API
// ==========================================
async function loadSection(gridId, section, limit) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  try {
    const res  = await fetch(`${API_BASE}/api/products?section=${section}&limit=${limit}`);
    const data = await res.json();

    if (!data.success || !data.products || data.products.length === 0) {
      grid.innerHTML = ""; // hide section if no products
      return;
    }

    grid.innerHTML = data.products.map(renderCard).join("");

    // Restore wishlist hearts from localStorage
    const wishlist = JSON.parse(localStorage.getItem("dripmen_wishlist") || "[]");
    grid.querySelectorAll(".product-card").forEach(card => {
      if (wishlist.find(w => w.id === card.dataset.id)) {
        const icon = card.querySelector(".wishlist-btn i");
        if (icon) icon.classList.add("ph-fill");
      }
    });

  } catch (err) {
    // Server down — silently keep section empty, don't break page
    console.warn(`[homePage] Could not load ${gridId}:`, err.message);
    grid.innerHTML = "";
  }
}

// ==========================================
// INIT — called by main.js
// ==========================================
export function initHomePage() {
  loadSection("new-arrivals-grid", "new_arrivals", 4);
  loadSection("top-selling-grid",  "top_selling",  4);
  loadSection("explore-grid",      "explore",      8);
}