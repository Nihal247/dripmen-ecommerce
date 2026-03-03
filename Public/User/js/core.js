// ==========================================
// PRODUCT DATA EXTRACTION & VALIDATION
// ==========================================
export function getProductDataFromElement(el) {
  const container = el.closest('[data-id]') || el.closest('.product-card') || el.closest('.single-product-section');
  if (!container) return null;

  // Strict attribute extraction
  const data = {
    id: container.dataset.id || "",
    name: container.dataset.name || container.querySelector('.product-name, .product-title-main')?.textContent?.trim() || "",
    price: parseFloat(container.dataset.price || container.querySelector('.current-price, .current-price-main')?.textContent?.replace(/[^0-9.]/g, '') || "0"),
    image: container.dataset.image || container.querySelector('.product-image, .main-image')?.src || "",
    rating: parseFloat(container.dataset.rating || container.querySelector('.rating-text, .rating-value')?.textContent?.split('/')[0] || "4.5"),
    priceText: `$${container.dataset.price || "0"}`
  };

  // Critical Validation Layer
  if (!data.id || !data.name || data.price <= 0 || !data.image) {
    console.error("DRIPMEN Error: Missing critical product attributes in element:", container);
    return null;
  }

  return data;
}


// ==========================================
// CORE LOGIC (WISHLIST & CART)
// ==========================================
export function toggleWishlist(btn) {
  const productData = getProductDataFromElement(btn);
  if (!productData) return;

  let wishlist = getWishlist();
  const index = wishlist.findIndex(item => item.id === productData.id);

  if (index === -1) {
    wishlist.push(productData);
    btn.classList.add('active');
    const icon = btn.querySelector('i');
    if (icon) icon.classList.replace('ph', 'ph-fill');
    showToast("Added to wishlist");
  } else {
    wishlist.splice(index, 1);
    btn.classList.remove('active');
    const icon = btn.querySelector('i');
    if (icon) icon.classList.replace('ph-fill', 'ph');
    showToast("Removed from wishlist");
  }

  saveWishlist(wishlist);
  updateHeaderCounts();

  // Small animation
  btn.classList.add('wishlist-bounce');
  setTimeout(() => btn.classList.remove('wishlist-bounce'), 400);

  // Dispatch event for wishlist page to re-render if open
  window.dispatchEvent(new Event('wishlist-updated'));
}

window.addToCart = function (product) {
  // Safety filter for the entire cart before saving
  let cart = getCart().filter(item => item && item.id && item.name && typeof item.price === "number");

  const existingIndex = cart.findIndex(item =>
    item.id === product.id &&
    item.size === product.size &&
    item.color === (product.color || 'Black')
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += (product.quantity || 1);
    showToast("Quantity updated in cart");
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      rating: Number(product.rating || 0),
      size: product.size || 'L',
      color: product.color || 'Black',
      quantity: product.quantity || 1
    });
    showToast("Added to cart");
  }

  saveCart(cart);
  updateHeaderCounts();
  window.dispatchEvent(new Event('cart-updated'));
};

export function handleGridAddToCart(btn) {
  const productData = getProductDataFromElement(btn);
  if (!productData) {
    showToast("Could not read product details", "error");
    return;
  }

  const sizeModal = document.getElementById("size-selection-modal");
  if (sizeModal) {
    window.currentSelection = productData;

    // Clear previous size selection
    sizeModal.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));

    const modalImg = sizeModal.querySelector("#size-modal-img");
    const modalName = sizeModal.querySelector("#size-modal-name");
    const modalPrice = sizeModal.querySelector("#size-modal-price");

    if (modalImg) modalImg.src = productData.image;
    if (modalName) modalName.textContent = productData.name;
    if (modalPrice) modalPrice.textContent = productData.priceText;

    openModal(sizeModal);
  } else {
    // Fallback/Direct add if no size modal (should normally open modal)
    addToCart({ ...productData, size: 'M' });
  }
}

export function showCartConfirmModal(productData) {
  const cartModal = document.getElementById("cart-modal");
  if (cartModal) {
    const modalImg = cartModal.querySelector("#cart-modal-img, #modal-cart-img, .cart-modal-img");
    const modalName = cartModal.querySelector("#cart-modal-name, #modal-cart-title, .cart-modal-name");
    const modalPrice = cartModal.querySelector("#cart-modal-price, #modal-cart-price, .cart-modal-price");

    if (modalImg) modalImg.src = productData.image;
    if (modalName) modalName.textContent = productData.name;
    if (modalPrice) modalPrice.textContent = productData.priceText;

    openModal(cartModal);
  }
}

export function initializeWishlistState() {
  const wishlist = getWishlist();
  document.querySelectorAll('.wishlist-btn, .wishlist-main').forEach(btn => {
    const product = getProductDataFromElement(btn);
    if (product && wishlist.some(item => item.id === product.id)) {
      btn.classList.add('active');
      const icon = btn.querySelector('i');
      if (icon) icon.classList.replace('ph', 'ph-fill');
    }
  });
}

// ==========================================
// LAYOUT INJECTION (Replaces Python Scripts)
