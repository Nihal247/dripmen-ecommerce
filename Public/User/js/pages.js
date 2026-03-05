import { getProductDataFromElement, showCartConfirmModal } from './core.js';

// ==========================================
export function initProductFilters() {
    // --- 1. Elements ---
    const minRange = document.getElementById("min-range");
    const maxRange = document.getElementById("max-range");
    const minVal = document.getElementById("min-val");
    const maxVal = document.getElementById("max-val");
    const sliderTrack = document.getElementById("slider-track");
    const grid = document.getElementById("products-grid");
    const sortTrigger = document.getElementById("sort-trigger");
    const sortOptions = document.getElementById("sort-options");
    const currentSortLabel = document.getElementById("current-sort");
    const paginationContainer = document.querySelector(".pagination");

    if (!grid) return;

    // --- 2. State ---
    const allProducts = Array.from(grid.children); // Store original full list
    let state = {
        category: 'all',
        minPrice: 50,
        maxPrice: 300,
        color: 'all',
        size: 'all',
        sort: 'popular',
        currentPage: 1,
        itemsPerPage: 6,
    };

    // --- 3. Rendering Pipeline ---

    function renderProducts() {
        // Step 1: Filter products from the original list
        const filteredProducts = allProducts.filter(card => {
            const pCat = card.dataset.category;
            const pPrice = parseFloat(card.dataset.price);
            const pColor = card.dataset.color;
            const pSizes = (card.dataset.sizes || "").split(',');

            if (state.category !== 'all' && pCat !== state.category) return false;
            if (pPrice < state.minPrice || pPrice > state.maxPrice) return false;
            if (state.color !== 'all' && pColor !== state.color) return false;
            if (state.size !== 'all' && !pSizes.includes(state.size)) return false;
            return true;
        });

        // Step 2: Sort the filtered list
        filteredProducts.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price);
            const priceB = parseFloat(b.dataset.price);
            const dateA = new Date(a.dataset.date || '2023-01-01');
            const dateB = new Date(b.dataset.date || '2023-01-01');
            const ratingA = parseFloat(a.dataset.rating);
            const ratingB = parseFloat(b.dataset.rating);

            switch (state.sort) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'newest':
                    return dateB - dateA;
                case 'popular':
                default:
                    return ratingB - ratingA;
            }
        });

        // Step 3: Paginate and display the sorted, filtered list
        renderPage(filteredProducts);
    }

    function renderPage(productsToDisplay) {
        const totalPages = Math.ceil(productsToDisplay.length / state.itemsPerPage);
        if (state.currentPage > totalPages && totalPages > 0) {
            state.currentPage = totalPages;
        }

        updatePaginationUI(totalPages, productsToDisplay.length);

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const pageProducts = productsToDisplay.slice(startIndex, endIndex);

        grid.innerHTML = ''; // Clear grid
        pageProducts.forEach(product => grid.appendChild(product)); // Add current page's products
    }

    function updatePaginationUI(totalPages, totalItems) {
        if (!paginationContainer) return;

        if (totalItems <= state.itemsPerPage) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';

        const pageNumbersContainer = paginationContainer.querySelector(".page-numbers");
        const prevBtn = paginationContainer.querySelector(".prev-btn");
        const nextBtn = paginationContainer.querySelector(".next-btn");

        pageNumbersContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            pageNumbersContainer.innerHTML += `<button class="page-num ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === totalPages;
    }

    // --- 4. Event Listeners ---

    // Price Slider
    function handlePriceChange() {
        let minPrice = parseInt(minRange.value);
        let maxPrice = parseInt(maxRange.value);
        if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

        if (minVal) minVal.textContent = "$" + minPrice;
        if (maxVal) maxVal.textContent = "$" + maxPrice;

        state.minPrice = minPrice;
        state.maxPrice = maxPrice;

        if (sliderTrack) {
            const percent1 = ((minPrice - minRange.min) / (minRange.max - minRange.min)) * 100;
            const percent2 = ((maxPrice - maxRange.min) / (maxRange.max - minRange.min)) * 100;
            sliderTrack.style.background = `linear-gradient(to right, #eee ${percent1}%, #000 ${percent1}%, #000 ${percent2}%, #eee ${percent2}%)`;
        }
        state.currentPage = 1; // Reset page on filter change
        renderProducts();
    }

    if (minRange && maxRange) {
        minRange.addEventListener("input", handlePriceChange);
        maxRange.addEventListener("input", handlePriceChange);
    }

    // Other filters
    document.querySelectorAll('.filter-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            state.category = btn.dataset.category;
            state.currentPage = 1;
            renderProducts();
        });
    });

    document.querySelectorAll('.filter-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-color-btn').forEach(b => {
                b.classList.remove('active');
                const check = b.querySelector('.ph-check');
                if (check) check.style.display = 'none';
            });
            btn.classList.add('active');
            const check = btn.querySelector('.ph-check');
            if (check) check.style.display = 'block';

            state.color = btn.dataset.color;
            state.currentPage = 1;
            renderProducts();
        });
    });

    document.querySelectorAll('.filter-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.size = btn.dataset.size;
            state.currentPage = 1;
            renderProducts();
        });
    });

    // Sort Dropdown
    if (sortTrigger && sortOptions) {
        sortTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            sortOptions.classList.toggle('show');
        });
        document.addEventListener('click', () => sortOptions.classList.remove('show'));
        sortOptions.querySelectorAll('.sort-option').forEach(opt => {
            opt.addEventListener('click', () => {
                state.sort = opt.dataset.value;
                currentSortLabel.textContent = opt.textContent;
                renderProducts();
            });
        });
    }

    // Pagination
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            const target = e.target;
            let pageChanged = false;

            if (target.closest('.prev-btn') && !target.closest('.prev-btn').disabled) {
                state.currentPage--;
                pageChanged = true;
            } else if (target.closest('.next-btn') && !target.closest('.next-btn').disabled) {
                state.currentPage++;
                pageChanged = true;
            } else if (target.classList.contains('page-num')) {
                const page = parseInt(target.dataset.page);
                if (page !== state.currentPage) {
                    state.currentPage = page;
                    pageChanged = true;
                }
            }

            if (pageChanged) {
                renderProducts();
            }
        });
    }

    // Mobile Buttons
    const applyBtn = document.querySelector('.apply-filter-btn');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('filters-sidebar');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.classList.remove('active-filters');
            }
            document.body.style.overflow = '';
        });
    }
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const sidebar = document.getElementById('filters-sidebar');
    if (filterToggleBtn && sidebar) {
        filterToggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            if (overlay) {
                overlay.classList.add('active');
                overlay.classList.add('active-filters');
            }
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeFilterBtn && sidebar) {
        closeFilterBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.classList.remove('active-filters');
            }
            document.body.style.overflow = '';
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                overlay.classList.remove('active-filters');
                document.body.style.overflow = '';
            }
        });
    }

    // Initial Render
    renderProducts();
}

// ==========================================
// PAGE: PRODUCT
// ==========================================
export function initProductPage() {
  const container = document.querySelector('.single-product-section');
  if (!container) return;

  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const mobileAddToCartBtn = document.querySelector('.add-to-cart-main-btn-sticky');
  const mobileBuyNowBtn = document.querySelector('.buy-now-main-btn-sticky');
  const qtyInput = document.querySelector(".qty-input-main");
  const minusBtn = document.querySelector(".qty-minus-main");
  const plusBtn = document.querySelector(".qty-plus-main");

  // Quantity Logic
  if (minusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });
  }
  if (plusBtn && qtyInput) {
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val < 12) qtyInput.value = val + 1;
    });
  }

  // Size Selection
  const sizeBtns = document.querySelectorAll('.size-pill-btn:not(.disabled)');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Color Selection
  const colorBtns = document.querySelectorAll('.color-swatch-circle');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => {
        b.classList.remove('active');
        const check = b.querySelector('.ph-check');
        if (check) check.style.display = 'none';
      });
      btn.classList.add('active');
      const check = btn.querySelector('.ph-check');
      if (check) check.style.display = 'block';
    });
  });

  // Helper to get current selection
  const getSelection = () => {
    const product = getProductDataFromElement(container);
    if (!product) return null;
    const activeSize = document.querySelector(".size-pill-btn.active");
    const activeColor = document.querySelector(".color-swatch-circle.active") || document.querySelector(".color-swatch.active");
    
    if (!activeSize) {
      showToast("Please select a size", "error");
      return null;
    }
    return {
      ...product,
      size: activeSize.textContent.trim(),
      color: activeColor ? (activeColor.getAttribute('data-color') || activeColor.getAttribute('aria-label')) : 'Black',
      quantity: qtyInput ? parseInt(qtyInput.value) : 1
    };
  };

  const handleAddToCart = () => {
    if (!checkAuth("Please login to add to cart")) return;
    const item = getSelection();
    if (item) {
      addToCart(item);
      showCartConfirmModal(item);
    }
  };

  const handleBuyNow = () => {
    if (!checkAuth("Please login to continue")) return;
    const item = getSelection();
    if (item) {
      addToCart(item);
      window.location.href = "checkout.html";
    }
  };

  if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);
  if (mobileAddToCartBtn) mobileAddToCartBtn.addEventListener('click', handleAddToCart);

  if (buyNowBtn) buyNowBtn.addEventListener('click', handleBuyNow);
  if (mobileBuyNowBtn) mobileBuyNowBtn.addEventListener('click', handleBuyNow);

  // Image Gallery
  const mainImage = document.getElementById('main-product-image');
  const thumbs = document.querySelectorAll('.thumb-btn');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImage) mainImage.src = thumb.dataset.image;
    });
  });

  // Product Tabs Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// ==========================================
// PAGE: CART
// ==========================================
export function initCartPage() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  function renderCart() {
    const cart = getCart();
    if (cart.length === 0) {
      document.getElementById("empty-cart-state").style.display = "block";
      document.getElementById("cart-layout").style.display = "none";
      return;
    }

    document.getElementById("empty-cart-state").style.display = "none";
    document.getElementById("cart-layout").style.display = "grid";

    container.innerHTML = cart.map((item, index) => {
      if (!item || !item.id) return ""; // Extra safety check 
      return `
        <div class="cart-item" data-index="${index}">
          <div class="cart-item-img"><img src="${item.image || ''}"></div>
          <div class="cart-item-details">
            <div class="cart-item-header">
              <h3 class="cart-item-title">${item.name || 'Unknown Product'}</h3>
              <button class="remove-cart-item-btn remove-btn" data-index="${index}"><i class="ph-fill ph-trash"></i></button>
            </div>
            <p class="cart-item-meta">Size: ${item.size || 'N/A'} | Color: ${item.color || 'Black'}</p>
            <div class="cart-item-actions">
              <span class="cart-item-price">$${item.price || 0}</span>
              <div class="qty-stepper">
                <button class="qty-change" data-index="${index}" data-delta="-1" ${item.quantity <= 1 ? 'disabled' : ''}><i class="ph ph-minus"></i></button>
                <input type="number" class="qty-input" value="${item.quantity || 1}" readonly>
                <button class="qty-change" data-index="${index}" data-delta="1"><i class="ph ph-plus"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    updateSummary();
  }

  function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const threshold = 200;
    const delivery = subtotal >= threshold || subtotal === 0 ? 0 : 20;

    document.getElementById("summary-subtotal").textContent = `$${subtotal}`;
    document.getElementById("summary-delivery").textContent = delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("summary-total").textContent = `$${subtotal + delivery}`;

    const progressFill = document.getElementById("shipping-progress-fill");
    const shippingMsg = document.getElementById("shipping-message");
    if (progressFill && shippingMsg) {
      const percent = Math.min(100, (subtotal / threshold) * 100);
      progressFill.style.width = `${percent}%`;
      shippingMsg.innerHTML = subtotal >= threshold ? "🎉 Free shipping applied!" : `Add $${threshold - subtotal} more for FREE shipping`;
    }
  }

  container.addEventListener('click', (e) => {
    const cart = getCart();
    const removeBtn = e.target.closest('.remove-cart-item-btn');
    if (removeBtn) {
      const index = removeBtn.dataset.index;
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
      updateHeaderCounts();
      return;
    }

    const qtyBtn = e.target.closest('.qty-change');
    if (qtyBtn) {
      const index = qtyBtn.dataset.index;
      const delta = parseInt(qtyBtn.dataset.delta);
      cart[index].quantity += delta;
      saveCart(cart);
      renderCart();
      updateHeaderCounts();
    }
  });

  renderCart();

  // Connect Checkout Buttons
  const checkoutBtn = document.getElementById("go-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (checkAuth("Please login to checkout")) window.location.href = "checkout.html";
    });
  }

  const mobileCheckoutBtn = document.getElementById("go-checkout-btn-mobile");
  if (mobileCheckoutBtn) {
    mobileCheckoutBtn.addEventListener("click", () => {
        if (checkAuth("Please login to checkout")) window.location.href = "checkout.html";
    });
  }

  // Coupon Logic
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", () => {
        if (checkAuth("Please login to apply coupon")) {
            const input = document.getElementById("promo-input");
            const msg = document.getElementById("promo-message");
            if(input && input.value.trim() === "DRIP20") {
                if(msg) { msg.textContent = "Coupon applied successfully!"; msg.className = "promo-message success"; }
            } else {
                if(msg) { msg.textContent = "Invalid coupon code"; msg.className = "promo-message error"; }
            }
        }
    });
  }
}

// ==========================================
// PAGE: WISHLIST
// ==========================================
export function initWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  if (!grid) return;

  function render() {
    const wishlist = getWishlist();
    if (wishlist.length === 0) {
      document.getElementById("empty-wishlist-state").style.display = "block";
      document.getElementById("wishlist-content").style.display = "none";
      return;
    }

    document.getElementById("empty-wishlist-state").style.display = "none";
    document.getElementById("wishlist-content").style.display = "block";

    grid.innerHTML = wishlist.map((item, index) => `
      <div class="wishlist-card product-card" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}" style="border: none; background: transparent; padding: 0;">
        <button class="remove-wishlist-btn" data-index="${index}"><i class="ph-fill ph-trash"></i></button>
        <div class="wishlist-img-wrapper" style="background-color: var(--bg-card); border-radius: var(--radius-lg); padding: 10px; margin-bottom: 1rem; overflow: hidden; display: flex; justify-content: center; align-items: center; aspect-ratio: 1/1;">
          <img src="${item.image}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <div class="wishlist-info" style="padding: 0 0.25rem;">
          <h3 class="product-name" style="font-weight: 800; font-size: 1.15rem; margin-bottom: 0.35rem; color: var(--text-main); text-transform: capitalize;">${item.name}</h3>
          <div class="product-rating" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.6rem;">
            <div class="stars" style="color: var(--accent-yellow); display: flex; gap: 3px; font-size: 1rem;">
              <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star-half"></i>
            </div>
            <span class="rating-text">${item.rating || '4.5'}/5</span>
          </div>
          <div class="price-container" style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="product-price" style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">$${item.price}</span>
          </div>
          <button class="btn btn-primary full-width add-to-cart-wishlist-btn" data-index="${index}" style="margin-top: 1rem; padding: 0.5rem; font-size: 0.9rem;">Add to Cart</button>
        </div>
      </div>
    `).join('');
  }

  // Event Delegation for Wishlist Grid
  grid.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-wishlist-btn');
    if (removeBtn) {
      const index = removeBtn.dataset.index;
      let wishlist = getWishlist();
      wishlist.splice(index, 1);
      saveWishlist(wishlist);
      render();
      updateHeaderCounts();
      showToast("Removed from wishlist");
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-wishlist-btn');
    if (addBtn) {
      if (!checkAuth("Please login to add to cart")) return;
      const index = addBtn.dataset.index;
      let wishlist = getWishlist();
      const item = wishlist[index];
      addToCart({ ...item, quantity: 1 });
    }
  });

  // Move All to Cart
  const moveAllBtn = document.getElementById("move-all-to-cart-btn");
  if (moveAllBtn) {
    moveAllBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to move items")) return;
      let wishlist = getWishlist();
      if (wishlist.length === 0) {
        showToast("Wishlist is empty", "info");
        return;
      }
      
      let cart = getCart();
      wishlist.forEach(item => {
         const existingIndex = cart.findIndex(c => c.id === item.id && c.size === (item.size || 'L') && c.color === (item.color || 'Black'));
         if (existingIndex > -1) {
             cart[existingIndex].quantity += 1;
         } else {
             cart.push({ ...item, quantity: 1, size: item.size || 'L', color: item.color || 'Black' });
         }
      });
      
      saveCart(cart);
      saveWishlist([]); // Clear wishlist
      render();
      updateHeaderCounts();
      showToast("All items moved to cart");
    });
  }

  window.addEventListener('wishlist-updated', render);
  render();
}

// ==========================================
// PAGE: CHECKOUT
// ==========================================
export function initCheckoutPage() {
  function calculateTotals() {
    const cart = getCart();
    if (cart.length === 0) { window.location.href = "cart.html"; return; }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal >= 200 ? 0 : 20;

    document.getElementById("checkout-subtotal").textContent = `$${subtotal}`;
    document.getElementById("checkout-delivery").textContent = delivery === 0 ? "Free" : `$${delivery}`;
    document.getElementById("checkout-total").textContent = `$${subtotal + delivery}`;
  }

  // --- Address Management ---
  const addressListContainer = document.getElementById('checkout-address-list');
  const addressForm = document.getElementById('checkout-form');
  const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');

  function renderCheckoutAddresses() {
    if (!addressListContainer || addresses.length === 0) {
        const parentSection = document.querySelector('.checkout-address-selection');
        if (parentSection) parentSection.style.display = 'none';
        const divider = document.getElementById('address-form-divider');
        if(divider) divider.style.display = 'none';
        return;
    }

    addressListContainer.innerHTML = addresses.map((addr, idx) => `
        <div class="checkout-address-card" data-index="${idx}">
            <div class="radio-indicator"></div>
            <h4 class="address-name">${addr.name}</h4>
            <div class="address-details">
                <p>${addr.street}</p>
                <p>${addr.city}${addr.zip ? `, ${addr.zip}` : ''}</p>
                <p>${addr.email || ''}</p>
                <p>${addr.mobile}</p>
            </div>
        </div>
    `).join('');
  }
  renderCheckoutAddresses();

  if (addressListContainer) {
    addressListContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.checkout-address-card');
      if (!card) return;

      addressListContainer.querySelectorAll('.checkout-address-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const idx = card.dataset.index;
      const addr = addresses[idx];
      if (addr) {
        document.getElementById('checkout-name').value = addr.name || '';
        document.getElementById('checkout-mobile').value = addr.mobile || '';
        document.getElementById('checkout-street').value = addr.street || '';
        document.getElementById('checkout-city').value = addr.city || '';
        document.getElementById('checkout-email').value = addr.email || '';
      }
    });
  }

  const placeOrderBtn = document.getElementById("place-order-btn-modern");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // --- FORM VALIDATION ---
      let isValid = true;
      const name = document.getElementById('checkout-name');
      const email = document.getElementById('checkout-email');
      const street = document.getElementById('checkout-street');
      const city = document.getElementById('checkout-city');
      const mobile = document.getElementById('checkout-mobile');

      // Helper to show error
      const showError = (input, msgId) => {
        input.classList.add('error-border');
        document.getElementById(msgId).style.display = 'block';
        isValid = false;
      };

      // Helper to clear error
      const clearError = (input, msgId) => {
        input.classList.remove('error-border');
        document.getElementById(msgId).style.display = 'none';
      };

      // Name
      if (!name.value.trim()) showError(name, 'error-name'); else clearError(name, 'error-name');

      // Email (Regex)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value.trim())) showError(email, 'error-email'); else clearError(email, 'error-email');

      // Street
      if (!street.value.trim()) showError(street, 'error-street'); else clearError(street, 'error-street');

      // City
      if (!city.value.trim()) showError(city, 'error-city'); else clearError(city, 'error-city');

      // Mobile (10+ digits)
      const mobileRegex = /^\d{10,}$/;
      if (!mobileRegex.test(mobile.value.replace(/\D/g, ''))) showError(mobile, 'error-mobile'); else clearError(mobile, 'error-mobile');

      if (!isValid) {
        showToast("Please fix the errors in the form", "error");
        return;
      }

      // --- SAVE ADDRESS LOGIC ---
      const saveInfo = document.getElementById('checkout-save-info');
      if (saveInfo && saveInfo.checked) {
        const newAddr = {
          name: name.value,
          email: email.value,
          mobile: mobile.value,
          street: street.value,
          city: city.value
        };
        // Avoid duplicates (simple check)
        const isDuplicate = addresses.some(a => a.name === newAddr.name && a.street === newAddr.street);
        if (!isDuplicate) {
          addresses.push(newAddr);
          localStorage.setItem('dripmen_addresses', JSON.stringify(addresses));
        }
      }

      // --- PLACE ORDER ---
      const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
      const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cod';
      const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod === 'wallet' ? 'Wallet' : 'Online Payment');

      const allOrders = JSON.parse(localStorage.getItem('dripmen_orders') || '[]');
      const newOrder = {
        id: "#" + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: "Processing",
        statusClass: "status-processing",
        total: parseFloat(document.getElementById("checkout-total").textContent.replace('$', '')),
        items: getCart(),
        address: {
            name: name.value,
            street: street.value,
            city: city.value,
            mobile: mobile.value,
            email: email.value
        },
        paymentMethod: paymentLabel
      };
      allOrders.unshift(newOrder);
      localStorage.setItem('dripmen_orders', JSON.stringify(allOrders));

      // Populate and show success modal
      const totalAmount = document.getElementById("checkout-total").textContent;
      const successModal = document.getElementById('order-success-modal');
      if (successModal) {
        document.getElementById('success-order-id').textContent = newOrder.id;
        document.getElementById('success-order-total').textContent = totalAmount;
        
        const viewOrderBtn = document.getElementById('order-success-view-btn');
        if(viewOrderBtn) {
            viewOrderBtn.onclick = () => window.location.href = 'orders.html';
        }

        saveCart([]);
        updateHeaderCounts();
        openModal(successModal);
      }
    });
  }

  calculateTotals();
}

// ==========================================
// PAGE: ORDER SUCCESS
// ==========================================
const successHomeBtn = document.getElementById('order-success-home-btn');
if (successHomeBtn) {
  successHomeBtn.addEventListener('click', () => window.location.href = 'index.html');
}

// ==========================================
// PAGE: ADDRESS BOOK
// ==========================================
export function initAddressPage() {
  const container = document.getElementById('address-grid');
  if (!container) return;

  // Initialize Default Address if empty
  if (!localStorage.getItem('dripmen_addresses')) {
      const defaultAddr = [{
          name: "Muhammed Nihal",
          street: "Kingston, 5236, United State",
          city: "New York",
          zip: "10001",
          email: "nihal@gmail.com",
          mobile: "+1 234 567 890"
      }];
      localStorage.setItem('dripmen_addresses', JSON.stringify(defaultAddr));
  }

  function renderAddresses() {
    const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');
    
    if (addresses.length === 0) {
        container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No addresses found.</p>';
        return;
    }

    container.innerHTML = addresses.map((addr, index) => `
      <div class="address-card">
          <div class="address-header">
              <span class="address-name">${addr.name}</span>
              ${index === 0 ? '<span class="badge-default">Default</span>' : ''}
          </div>
          <div class="address-details">
              <p>${addr.street}</p>
              <p>${addr.city}</p>
              <p>${addr.email || ''}</p>
              <p>${addr.mobile}</p>
          </div>
          <div class="address-actions">
              <button class="btn-link edit-address-btn" data-index="${index}">Edit</button>
              <button class="btn-link text-red remove-address-btn" data-index="${index}">Remove</button>
          </div>
      </div>
    `).join('');
  }

  renderAddresses();

  // Add New Address Logic
  const addBtn = document.getElementById('add-address-btn');
  const modal = document.getElementById('add-address-modal');
  const form = document.getElementById('add-address-form');
  const modalTitle = document.getElementById('address-modal-title');
  const editIndexInput = document.getElementById('address-edit-index');

  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to add address")) return;
      form.reset();
      if (editIndexInput) editIndexInput.value = "-1";
      if (modalTitle) modalTitle.textContent = "Add New Address";
      openModal(modal);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newAddress = {
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        street: formData.get('street'),
        city: formData.get('city'),
        zip: formData.get('zip')
      };

      const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');
      const editIndex = parseInt(editIndexInput.value);

      if (editIndex > -1 && addresses[editIndex]) {
        addresses[editIndex] = newAddress;
        showToast("Address updated successfully");
      } else {
        addresses.push(newAddress);
        showToast("Address added successfully");
      }
      
      localStorage.setItem('dripmen_addresses', JSON.stringify(addresses));

      renderAddresses();
      closeAllModals();
      form.reset();
      showToast("Address added successfully");
    });
  }

  // Edit & Remove Address Logic
  container.addEventListener('click', (e) => {
    // Edit
    if (e.target.classList.contains('edit-address-btn')) {
      const index = e.target.dataset.index;
      const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');
      const addr = addresses[index];
      
      if (addr && form) {
        form.name.value = addr.name || '';
        form.mobile.value = addr.mobile || '';
        form.email.value = addr.email || '';
        form.street.value = addr.street || '';
        form.city.value = addr.city || '';
        form.zip.value = addr.zip || '';
        
        if (editIndexInput) editIndexInput.value = index;
        if (modalTitle) modalTitle.textContent = "Edit Address";
        openModal(modal);
      }
    }

    // Remove
    if (e.target.classList.contains('remove-address-btn')) {
      const index = e.target.dataset.index;
      const addresses = JSON.parse(localStorage.getItem('dripmen_addresses') || '[]');
      addresses.splice(index, 1);
      localStorage.setItem('dripmen_addresses', JSON.stringify(addresses));
      renderAddresses();
      showToast("Address removed");
    }
  });
}

// ==========================================
// PAGE: CONTACT
// ==========================================
export function initContactPage() {
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast("Message sent successfully!");
      form.reset();
    });
  }
}

// ==========================================
// PAGE: SIGN UP
// ==========================================
export function initSignupPage() {
  const signupForm = document.getElementById("signup-form");
  const otpForm = document.getElementById("signup-otp-form");
  const step1 = document.getElementById("signup-step-1");
  const stepOtp = document.getElementById("signup-step-otp");

  // =========================
  // STEP 1 — SEND OTP
  // =========================
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("signup-name")?.value?.trim();
      const email = document.getElementById("signup-email")?.value?.trim();
      const password = document.getElementById("signup-password")?.value;
      const confirmPassword = document.getElementById("signup-confirm-password")?.value;

      // Required fields
if (!name || !email || !password || !confirmPassword) {
  showToast("All fields are required", "error");
  return;
}

// Strong password validation (Frontend UX only)
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

if (!strongPasswordRegex.test(password)) {
  showToast(
    "Password must be at least 6 characters and include uppercase, lowercase, and number",
    "error"
  );
  return;
}

// Confirm password match
if (password !== confirmPassword) {
  showToast("Passwords do not match", "error");
  return;
}

      try {
        const response = await fetch("http://localhost:4000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }), // Only email needed here
        });

        const data = await response.json(); // Always parse response first

        if (!response.ok) {
          showToast(data.message || "Signup failed", "error");
          return;
        }

        showToast("OTP sent successfully ✅");

        // Store data temporarily for step 2
        sessionStorage.setItem(
          "signupData",
          JSON.stringify({ name, email, password })
        );

        step1.style.display = "none";
        stepOtp.style.display = "block";

      } catch (error) {
        console.error(error);
        showToast("Network error. Please try again.", "error");
      }
    });
  }

  // =========================
  // STEP 2 — VERIFY OTP
  // =========================
  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const otp = document.getElementById("signup-otp")?.value?.trim();

      if (!otp) {
        showToast("Please enter OTP", "error");
        return;
      }

      try {
        const storedData = JSON.parse(sessionStorage.getItem("signupData"));

        if (!storedData) {
          showToast("Session expired. Please signup again.", "error");
          return;
        }

        const response = await fetch(
          "http://localhost:4000/api/auth/verify-signup-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...storedData,
              otp,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          showToast(data.message || "Invalid OTP", "error");
          return;
        }

        showToast("Account created successfully! 🎉");

        // Save JWT
        localStorage.setItem("token", data.token);

        // Clear temp signup data
        sessionStorage.removeItem("signupData");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);

      } catch (error) {
        console.error(error);
        showToast("Network error during OTP verification.", "error");
      }
    });
  }
}
// ==========================================
// PAGE: FORGOT PASSWORD
// ==========================================
export function initForgotPasswordPage() {
  const emailForm = document.getElementById('fp-email-form');
  const otpForm = document.getElementById('fp-otp-form');
  const passForm = document.getElementById('fp-pass-form');

  const stepEmail = document.getElementById('step-email');
  const stepOtp = document.getElementById('step-otp');
  const stepPass = document.getElementById('step-new-pass');

  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('fp-email').value;
      if(email) {
        showToast(`Code sent to ${email}`);
        stepEmail.style.display = 'none';
        stepOtp.style.display = 'block';
      }
    });
  }

  if (otpForm) {
    otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const otp = document.getElementById('fp-otp').value;
      if(otp === '1234') { // Mock code for demo
        showToast("Code verified successfully");
        stepOtp.style.display = 'none';
        stepPass.style.display = 'block';
      } else {
        showToast("Invalid code (Try 1234)", "error");
      }
    });
  }

  if (passForm) {
    passForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = document.getElementById('fp-new-pass').value;
      const p2 = document.getElementById('fp-confirm-pass').value;
      
      if(p1 !== p2) {
        showToast("Passwords do not match", "error");
        return;
      }
      
      showToast("Password reset successfully!");
      setTimeout(() => window.location.href = 'login.html', 2000);
    });
  }
}

// ==========================================
// PAGE: ORDER DETAILS (INVOICE)
// ==========================================
export function initOrderDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    
    if (!orderId) {
        window.location.href = 'account.html';
        return;
    }

    const orders = JSON.parse(localStorage.getItem('dripmen_orders') || '[]');
    // Handle both with and without hash prefix
    const order = orders.find(o => o.id === orderId || o.id === '#' + orderId);

    if (!order) {
        document.querySelector('.invoice-container').innerHTML = '<p class="text-center" style="padding: 4rem;">Order not found.</p>';
        return;
    }

    // Populate Data
    document.getElementById('od-id').textContent = order.id;
    document.getElementById('od-date').textContent = order.date;
    
    // Address
    const addr = order.address || {};
    document.getElementById('od-address').innerHTML = `
        <p><strong>${addr.name || 'N/A'}</strong></p>
        <p>${addr.street || ''}</p>
        <p>${addr.city || ''}</p>
        <p>${addr.mobile || ''}</p>
        <p>${addr.email || ''}</p>
    `;

    // Payment
    document.getElementById('od-payment').textContent = order.paymentMethod || 'Cash on Delivery';

    // Items
    const tbody = document.getElementById('od-items-body');
    let subtotal = 0;
    
    tbody.innerHTML = order.items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${item.name}</div>
                    <div style="font-size: 0.85rem; color: #666;">Size: ${item.size}</div>
                </td>
                <td>$${item.price}</td>
                <td>${item.quantity}</td>
                <td class="text-right">$${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // Summary
    // Assuming tax is included or 0 for this demo, but displaying a line for it as requested
    const tax = 0; 
    const total = order.total;
    const shipping = total - subtotal - tax; // Reverse calculate shipping based on total stored

    document.getElementById('od-summary').innerHTML = `
        <div class="summary-row"><span>Subtotal</span> <span>$${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Tax (0%)</span> <span>$${tax.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span> <span>$${Math.max(0, shipping).toFixed(2)}</span></div>
        <div class="summary-divider"></div>
        <div class="summary-row total-row"><span>Total</span> <span>$${total.toFixed(2)}</span></div>
    `;
}

// ==========================================
// PAGE: ORDERS
// ==========================================
export function initOrdersPage() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  function getOrdersWithDefault() {
    let orders = JSON.parse(localStorage.getItem('dripmen_orders'));
    if (!orders) {
      orders = [{
        id: "#923742",
        date: "Nov 12, 2023",
        status: "Delivered",
        statusClass: "status-delivered",
        total: 145.00,
        items: [{ name: "Black Tshirt", image: "images/Balck Tshirt.png", quantity: 1, size: "L" }]
      }, {
        id: "#923730",
        date: "Oct 24, 2023",
        status: "Processing",
        statusClass: "status-processing",
        total: 260.00,
        items: [{ name: "White Hoodie", image: "images/White hoodie.png", quantity: 1, size: "M" }, { name: "Varsity Jacket", image: "images/versity jacket.png", quantity: 1, size: "L" }]
      }];
      localStorage.setItem('dripmen_orders', JSON.stringify(orders));
    }
    return orders;
  }

  function renderOrders() {
    const orders = getOrdersWithDefault();
    if (orders.length === 0) {
      container.innerHTML = `<div class="empty-cart-state" style="padding: 2rem 0;">
            <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-package"></i></div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No orders yet</h3>
            <p style="margin-bottom: 1.5rem;">You have no active orders.</p>
            <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order, index) => {
      let actionButtons = '';
      if (order.status === 'Processing') {
        actionButtons = `<button class="btn btn-outline-danger cancel-order-btn" data-index="${index}">Cancel Order</button>`;
      } else if (order.status === 'Delivered') {
        actionButtons = `<button class="btn btn-outline return-order-btn" data-index="${index}">Return Order</button>`;
      }

      return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">Order ${order.id}</span>
                    <span class="order-date">${order.date}</span>
                </div>
                <span class="order-status ${order.statusClass}">${order.status}</span>
            </div>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-img">
                        <div class="order-item-info">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-meta">Qty: ${item.quantity}, Size: ${item.size}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div>
                    <span class="order-total-label">Total Order:</span>
                    <span class="order-total-value">$${order.total.toFixed(2)}</span>
                </div>
                <div class="order-actions-group" style="display: flex; gap: 1rem;">
                   ${actionButtons}
                   <button class="btn btn-outline download-invoice-btn" data-id="${order.id}">View Details</button>
                </div>
            </div>
        </div>
    `}).join('');
  }

  renderOrders();
  window.addEventListener('orders-updated', renderOrders);

  container.addEventListener('click', e => {
    const orders = getOrdersWithDefault();
    const target = e.target;

    if (target.classList.contains('cancel-order-btn')) {
      const index = target.dataset.index;
      const [cancelledOrder] = orders.splice(index, 1);
      const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');
      cancelledOrder.status = "Cancelled";
      cancelledOrder.statusClass = "status-cancelled";
      cancellations.unshift(cancelledOrder);
      localStorage.setItem('dripmen_orders', JSON.stringify(orders));
      localStorage.setItem('dripmen_cancellations', JSON.stringify(cancellations));
      showToast("Order has been cancelled.");
      renderOrders();
    } else if (target.classList.contains('return-order-btn')) {
      const index = target.dataset.index;
      const [returnedOrder] = orders.splice(index, 1);
      const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');
      returnedOrder.status = "Refunded";
      returnedOrder.statusClass = "status-refunded";
      returns.unshift(returnedOrder);
      localStorage.setItem('dripmen_orders', JSON.stringify(orders));
      localStorage.setItem('dripmen_returns', JSON.stringify(returns));
      showToast("Your return has been processed.");
      renderOrders();
    }
    
    if (target.classList.contains('view-details-btn')) {
        const index = target.dataset.index;
        const order = orders[index];
        openOrderDetailsModal(order);
    }

    if (target.classList.contains('download-invoice-btn')) {
        const orderId = target.dataset.id.replace('#', '');
        window.location.href = `order-details.html?id=${orderId}`;
    }
  });
}

// ==========================================
// PAGE: RETURNS
// ==========================================
export function initReturnsPage() {
  const container = document.getElementById('returns-list');
  if (!container) return;

  const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');

  if (returns.length === 0) {
    container.innerHTML = `<div class="empty-cart-state" style="padding: 2rem 0;">
          <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-arrow-u-up-left"></i></div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No returns yet</h3>
          <p style="margin-bottom: 1.5rem;">You haven't returned any orders yet.</p>
      </div>`;
  } else {
    container.innerHTML = returns.map(ret => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">Return ${ret.id}</span>
                    <span class="order-date">${ret.date}</span>
                </div>
                <span class="order-status ${ret.statusClass}">${ret.status}</span>
            </div>
            <div class="order-items-list">
                ${ret.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-img">
                        <div class="order-item-info">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-meta">Qty: ${item.quantity}, Size: ${item.size}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div>
                    <span class="order-total-label">Refund Amount:</span>
                    <span class="order-total-value">$${ret.total.toFixed(2)}</span>
                </div>
                <button class="btn btn-outline view-details-btn" data-index="${index}">View Details</button>
            </div>
        </div>
    `).join('');

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            openOrderDetailsModal(returns[e.target.dataset.index]);
        }
    });
  }
}

// ==========================================
// PAGE: CANCELLATIONS
// ==========================================
export function initCancellationsPage() {
  const container = document.getElementById('cancellations-list');
  if (!container) return;

  const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');

  if (cancellations.length === 0) {
    container.innerHTML = `<div class="empty-cart-state" style="padding: 2rem 0;">
          <div class="empty-cart-icon" style="font-size: 3rem;"><i class="ph ph-x-circle"></i></div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No cancellations yet</h3>
          <p style="margin-bottom: 1.5rem;">You have no cancelled orders.</p>
      </div>`;
  } else {
    container.innerHTML = cancellations.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">Order ${order.id}</span>
                    <span class="order-date">Cancelled on ${order.date}</span>
                </div>
                <span class="order-status ${order.statusClass}">${order.status}</span>
            </div>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-img">
                        <div class="order-item-info">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-meta">Qty: ${item.quantity}, Size: ${item.size}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div>
                    <span class="order-total-label">Total Amount:</span>
                    <span class="order-total-value">$${order.total.toFixed(2)}</span>
                </div>
                <button class="btn btn-outline view-details-btn" data-index="${index}">View Details</button>
            </div>
        </div>
    `).join('');

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            openOrderDetailsModal(cancellations[e.target.dataset.index]);
        }
    });
  }
}

// ==========================================
// HELPER: ORDER DETAILS MODAL
// ==========================================
function openOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    if (!modal || !order) return;

    document.getElementById('modal-order-id').textContent = order.id;
    document.getElementById('modal-order-date').textContent = order.date;
    document.getElementById('modal-order-total').textContent = `$${order.total.toFixed(2)}`;
    
    const statusEl = document.getElementById('modal-order-status');
    if (statusEl) {
        statusEl.className = `order-status ${order.statusClass}`;
        statusEl.textContent = order.status;
    }

    const itemsContainer = document.getElementById('modal-order-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = order.items.map(item => `
            <div class="modal-product-inline" style="margin-bottom: 0.5rem;">
                <img src="${item.image}" class="modal-product-img-small">
                <div class="modal-product-details-small">
                    <h4 class="modal-product-name">${item.name}</h4>
                    <p class="modal-product-price">Qty: ${item.quantity} | Size: ${item.size}</p>
                </div>
            </div>
        `).join('');
    }

    // --- Dynamic Action Buttons ---
    const oldActions = modal.querySelector('.modal-actions-dynamic');
    if (oldActions) oldActions.remove();

    let actionBtnHtml = '';
    if (order.status === 'Processing') {
        actionBtnHtml = `<button class="btn btn-outline-danger full-width" id="modal-cancel-btn" style="margin-top: 1rem;">Cancel Order</button>`;
    } else if (order.status === 'Delivered') {
        actionBtnHtml = `<button class="btn btn-outline full-width" id="modal-return-btn" style="margin-top: 1rem;">Return Order</button>`;
    }

    if (actionBtnHtml) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'modal-actions-dynamic';
        actionsDiv.innerHTML = actionBtnHtml;
        
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.appendChild(actionsDiv);

        // Bind Events
        const cancelBtn = actionsDiv.querySelector('#modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if(confirm('Are you sure you want to cancel this order?')) {
                    processOrderAction(order.id, 'cancel');
                }
            });
        }

        const returnBtn = actionsDiv.querySelector('#modal-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                processOrderAction(order.id, 'return');
            });
        }
    }

    openModal(modal);
}

function processOrderAction(orderId, action) {
    const orders = JSON.parse(localStorage.getItem('dripmen_orders') || '[]');
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) return;

    const [order] = orders.splice(index, 1);
    
    if (action === 'cancel') {
        const cancellations = JSON.parse(localStorage.getItem('dripmen_cancellations') || '[]');
        order.status = "Cancelled";
        order.statusClass = "status-cancelled";
        cancellations.unshift(order);
        localStorage.setItem('dripmen_cancellations', JSON.stringify(cancellations));
        showToast("Order cancelled successfully");
    } else if (action === 'return') {
        const returns = JSON.parse(localStorage.getItem('dripmen_returns') || '[]');
        order.status = "Refunded";
        order.statusClass = "status-refunded";
        returns.unshift(order);
        localStorage.setItem('dripmen_returns', JSON.stringify(returns));
        showToast("Return processed successfully");
    }

    localStorage.setItem('dripmen_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('orders-updated'));
    closeAllModals();
}

// ==========================================
// PAGE: PAYMENT OPTIONS
// ==========================================
export function initPaymentPage() {
  const container = document.getElementById('payment-grid');
  if (!container) return;

  function renderCards() {
    const cards = JSON.parse(localStorage.getItem('dripmen_cards') || '[]');
    
    if (cards.length === 0) {
        // Default mock card if empty
        container.innerHTML = `
            <div class="payment-card">
                <div class="card-top">
                    <div class="card-chip"></div>
                    <button class="remove-card-btn" disabled><i class="ph-fill ph-lock-key"></i></button>
                </div>
                <div class="card-number">4242 4242 4242 4242</div>
                <div class="card-bottom">
                    <div>
                        <span class="card-holder-label">Card Holder</span>
                        <span class="card-holder-name">Muhammed Nihal</span>
                    </div>
                    <div>
                        <span class="card-expiry-label">Expires</span>
                        <span class="card-expiry-date">12/25</span>
                    </div>
                    <div class="card-brand"><i class="ph-fill ph-credit-card"></i></div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.map((card, index) => `
        <div class="payment-card">
            <div class="card-top">
                <div class="card-chip"></div>
                <button class="remove-card-btn" data-index="${index}"><i class="ph-fill ph-trash"></i></button>
            </div>
            <div class="card-number">${card.number}</div>
            <div class="card-bottom">
                <div>
                    <span class="card-holder-label">Card Holder</span>
                    <span class="card-holder-name">${card.holder}</span>
                </div>
                <div>
                    <span class="card-expiry-label">Expires</span>
                    <span class="card-expiry-date">${card.expiry}</span>
                </div>
                <div class="card-brand"><i class="ph-fill ph-credit-card"></i></div>
            </div>
        </div>
    `).join('');
  }

  renderCards();

  // Add Card Logic
  const addBtn = document.getElementById('add-card-btn');
  const modal = document.getElementById('add-card-modal');
  const form = document.getElementById('add-card-form');

  if (addBtn && modal) addBtn.addEventListener('click', () => openModal(modal));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newCard = {
        number: formData.get('cardNumber'),
        holder: formData.get('cardHolder'),
        expiry: formData.get('expiry')
      };

      const cards = JSON.parse(localStorage.getItem('dripmen_cards') || '[]');
      cards.push(newCard);
      localStorage.setItem('dripmen_cards', JSON.stringify(cards));

      renderCards();
      closeAllModals();
      form.reset();
      showToast("Card added successfully");
    });
  }

  // Remove Card Logic
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-card-btn');
    if (btn && !btn.disabled) {
      const index = btn.dataset.index;
      const cards = JSON.parse(localStorage.getItem('dripmen_cards') || '[]');
      cards.splice(index, 1);
      localStorage.setItem('dripmen_cards', JSON.stringify(cards));
      renderCards();
      showToast("Card removed");
    }
  });
}
