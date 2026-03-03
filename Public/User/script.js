// Storage Keys
const CART_KEY = 'dripmen_cart';
const WISHLIST_KEY = 'dripmen_wishlist';

// ==========================================
// STORAGE HELPERS
// ==========================================
window.getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
window.saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
window.getWishlist = () => JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
window.saveWishlist = (wishlist) => localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));

// ==========================================
// GLOBAL UI UPDATES
// ==========================================
window.updateHeaderCounts = function () {
  const cart = getCart();
  const wishlist = getWishlist();

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistTotal = wishlist.length;

  const cartBadges = document.querySelectorAll('.header-cart-badge, .cart-badge');
  const wishlistBadges = document.querySelectorAll('.header-wishlist-badge, .wishlist-badge');

  cartBadges.forEach(badge => {
    badge.textContent = cartTotal;
    badge.style.display = cartTotal > 0 ? 'flex' : 'none';
  });

  wishlistBadges.forEach(badge => {
    badge.textContent = wishlistTotal;
    badge.style.display = wishlistTotal > 0 ? 'flex' : 'none';
  });
};

window.showToast = function (message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="ph-fill ph-${type === 'success' ? 'check-circle' : 'info'}"></i>
      <span>${message}</span>
    </div>
  `;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Auto hide after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// ==========================================
// MODAL MANAGEMENT
// ==========================================
window.openModal = function (modal) {
  if (modal) {
    modal.classList.add("active");
    const overlay = document.getElementById("modal-overlay") || document.getElementById("product-modal-overlay") || document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.closeAllModals = function () {
  document.querySelectorAll(".modal, .modal-overlay, .mobile-menu-overlay, .nav-links").forEach((m) => m.classList.remove("active"));
  const overlay = document.getElementById("modal-overlay") || document.getElementById("product-modal-overlay") || document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
};

window.closeModals = window.closeAllModals;

// ==========================================
// PRODUCT DATA EXTRACTION & VALIDATION
// ==========================================
function getProductDataFromElement(el) {
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
// AUTH GUARD
// ==========================================
window.checkAuth = function(message = "Please login to continue") {
    const isLoggedIn = localStorage.getItem('dripmen_token') === 'true';
    if (isLoggedIn) return true;

    showToast(message, 'info');
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        // Reset to login view
        document.getElementById('login-form-wrapper').classList.add('active');
        document.getElementById('signup-form-wrapper').classList.remove('active');
        openModal(authModal);
    }
    return false;
}

// ==========================================
// CORE LOGIC (WISHLIST & CART)
// ==========================================
function toggleWishlist(btn) {
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

function handleGridAddToCart(btn) {
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

function showCartConfirmModal(productData) {
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

function initializeWishlistState() {
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
// ==========================================
const NAVBAR_HTML = `
    <div class="nav-container">
      <button class="mobile-menu-btn" aria-label="Toggle Menu"><i class="ph ph-list"></i></button>
      <a href="index.html" class="logo">DRIPMEN</a>
      <nav class="nav-links">
        <a href="index.html">Home</a>
        <a href="contact.html">Contact</a>
        <a href="about.html">About</a>
        <a href="signup.html">Sign Up</a>
      </nav>
      <div class="search-container desktop-search">
        <i class="ph ph-magnifying-glass search-icon"></i>
        <input type="text" placeholder="Search for products..." />
      </div>
      <div class="nav-icons">
        <a href="#" aria-label="Search" class="mobile-search-icon"><i class="ph ph-magnifying-glass"></i></a>
        <a href="wishlist.html" aria-label="Wishlist" class="wishlist-icon-wrapper">
          <i class="ph ph-heart"></i>
          <span class="wishlist-badge header-wishlist-badge" style="display: none;">0</span>
        </a>
        <a href="cart.html" aria-label="Cart" class="cart-icon-wrapper">
          <i class="ph ph-shopping-cart"></i>
          <span class="cart-badge header-cart-badge">0</span>
        </a>
        <div class="account-dropdown-container">
          <a href="javascript:void(0)" aria-label="Profile" class="account-icon-link"><i class="ph ph-user"></i></a>
          <div class="account-dropdown">
            <a href="account.html"><i class="ph ph-user"></i> Account</a>
            <a href="orders.html"><i class="ph ph-package"></i> My Orders</a>
            <a href="#" id="nav-sign-out"><i class="ph ph-sign-out"></i> Sign out</a>
          </div>
        </div>
      </div>
    </div>
`;

const FOOTER_HTML = `
    <div class="footer-container">
      <div class="footer-brand">
        <h2 class="footer-logo">DRIPMEN</h2>
        <div class="footer-contact-info" style="margin-top: 16px;">
          <p style="font-size: 14px; line-height: 1.6; color: #666;">We offer premium T-shirts, hoodies, sweatshirts, and jackets designed to match your style and confidence.</p>
        </div>
      </div>
      <div class="footer-links-group">
        <div class="footer-column">
          <h3>HELP</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 12px; font-size: 14px; color: #666;">+91 7907347823</li>
            <li style="margin-bottom: 12px; font-size: 14px; color: #666;">dripmen@gmail.com</li>
            <li style="font-size: 14px; color: #666; line-height: 1.6;">123 Main St, Apt 4B<br>New York, NY 10001<br>USA</li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>ACCOUNT</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 12px;"><a href="wishlist.html" style="font-size: 14px; color: #666; text-decoration: none;">My account</a></li>
            <li style="margin-bottom: 12px;"><a href="cart.html" style="font-size: 14px; color: #666; text-decoration: none;">Orders</a></li>
            <li><a href="products.html" style="font-size: 14px; color: #666; text-decoration: none;">Products</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>QUICK LINK</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 12px;"><a href="#" style="font-size: 14px; color: #666; text-decoration: none;">Privacy policy</a></li>
            <li style="margin-bottom: 12px;"><a href="about.html" style="font-size: 14px; color: #666; text-decoration: none;">About Us</a></li>
            <li style="margin-bottom: 12px;"><a href="#" style="font-size: 14px; color: #666; text-decoration: none;">Terms of Use</a></li>
            <li><a href="#" style="font-size: 14px; color: #666; text-decoration: none;">FAQ</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>DripMen © 2000-2023, All Rights Reserved</p>
      <div class="payment-methods">
        <i class="ph ph-visa-logo"></i>
        <i class="ph ph-mastercard-logo"></i>
        <i class="ph ph-paypal-logo"></i>
        <i class="ph ph-apple-podcasts-logo"></i>
      </div>
    </div>
`;

const AUTH_MODAL_HTML = `
    <div class="modal" id="auth-modal">
        <button class="close-modal"><i class="ph ph-x"></i></button>
        <div class="modal-body">
            <!-- Login Form -->
            <div id="login-form-wrapper" class="auth-form-wrapper active">
                <div class="auth-header">
                    <h2>Log In</h2>
                    <p>Welcome back to DripMen</p>
                </div>
                <form id="modal-login-form" class="auth-form-stack">
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required class="auth-input">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required class="auth-input">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary full-width">Log In</button>
                    </div>
                    <div class="form-footer" style="text-align: center; margin-top: 1rem;">
                        <a href="forgot-password.html" class="text-muted text-sm">Forgot Password?</a>
                    </div>
                    <div class="auth-footer-text" style="margin-top: 1.5rem;">
                        <p>Don't have an account? <a href="#" class="switch-to-signup">Sign up</a></p>
                    </div>
                </form>
            </div>

            <!-- Signup Form -->
            <div id="signup-form-wrapper" class="auth-form-wrapper">
                <div class="auth-header">
                    <h2>Sign Up</h2>
                    <p>Create an account to get started</p>
                </div>
                <form id="modal-signup-form" class="auth-form-stack">
                    <div class="form-group">
                        <input type="text" placeholder="Full Name" required class="auth-input">
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required class="auth-input">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required class="auth-input">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary full-width">Create Account</button>
                    </div>
                    <div class="auth-footer-text" style="margin-top: 1.5rem;">
                        <p>Already have an account? <a href="#" class="switch-to-login">Log in</a></p>
                    </div>
                </form>
            </div>
        </div>
    </div>
`;

function renderLayout() {
  const header = document.querySelector('.navbar');
  if (header) header.innerHTML = NAVBAR_HTML;

  const footer = document.querySelector('.footer');
  if (footer) footer.innerHTML = FOOTER_HTML;
  
  // Inject Auth Modal
  if (!document.getElementById('auth-modal')) {
      const div = document.createElement('div');
      div.innerHTML = AUTH_MODAL_HTML;
      document.body.appendChild(div.firstElementChild);
  }
}

// ==========================================
// MAIN INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderLayout(); // Inject Navbar and Footer first
  updateHeaderCounts();
  initializeWishlistState();
  initAuthSystem(); // Initialize Auth Logic

  // 1. Mobile Menu Logic
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      if (mobileMenuOverlay) mobileMenuOverlay.classList.toggle("active");
      const icon = mobileMenuBtn.querySelector("i");
      if (navLinks.classList.contains("active")) {
        icon.classList.replace("ph-list", "ph-x");
      } else {
        icon.classList.replace("ph-x", "ph-list");
      }
    });
  }

  // 2. Global Interactions (Event Delegation)
  document.body.addEventListener('click', function (e) {
    const target = e.target;

    // Wishlist Toggle
    const wishlistBtn = target.closest('.wishlist-btn, .wishlist-main');
    if (wishlistBtn) {
      e.preventDefault();
      if (!checkAuth("Please login to add to wishlist")) return;
      toggleWishlist(wishlistBtn);
      return;
    }

    // Add to Cart Buttons (Grid/Slider)
    const addToCartBtn = target.closest('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.classList.contains('add-to-cart-main-btn')) {
      e.preventDefault();
      if (!checkAuth("Please login to add to cart")) return;
      handleGridAddToCart(addToCartBtn);
      return;
    }

    // Size Selection Button within Modal
    const sizeBtn = target.closest('.size-selection-container .size-btn, .size-options-grid .size-btn');
    if (sizeBtn) {
      const parent = sizeBtn.parentElement;
      parent.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      sizeBtn.classList.add('active');
      return;
    }

    // Modal Size Confirmation
    const confirmSizeBtn = target.closest('#confirm-size-btn');
    if (confirmSizeBtn) {
      if (!window.currentSelection) {
        closeAllModals();
        return;
      }
      const activeSizeBtn = document.querySelector(".modal.active .size-btn.active");
      if (!activeSizeBtn) {
        showToast("Please select a size", "error");
        return;
      }
      const size = activeSizeBtn.getAttribute('data-size') || activeSizeBtn.textContent.trim();
      addToCart({ ...window.currentSelection, size, quantity: 1 });
      closeAllModals();
      setTimeout(() => showCartConfirmModal(window.currentSelection), 300);
      return;
    }

    // Go to Cart button in modal
    const goToCartBtn = target.closest('.go-to-cart-btn');
    if (goToCartBtn) {
      window.location.href = 'cart.html';
      return;
    }

    // Modal Close
    if (target.closest('.modal-close, .close-modal, .cancel-btn, .continue-shopping-btn, .modal-overlay')) {
      closeAllModals();
      return;
    }

    // Announcement Close
    if (target.closest('.close-announcement')) {
      const banner = document.getElementById('announcement-bar');
      if (banner) banner.style.display = 'none';
      return;
    }

    // Payment Selection
    const paymentOpt = target.closest('.payment-option-modern');
    if (paymentOpt) {
      document.querySelectorAll('.payment-option-modern').forEach(el => el.classList.remove('active'));
      paymentOpt.classList.add('active');
      const radio = paymentOpt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      return;
    }

    // Product Card Redirection
    const productCard = target.closest('.product-card');
    const isInteractive = target.closest('button') || target.closest('a') || target.closest('.wishlist-btn') || target.closest('.add-to-cart-btn') || target.closest('.card-hover-actions') || target.closest('.remove-wishlist-btn');
    
    if (productCard && !isInteractive) {
      window.location.href = "product.html";
      return;
    }
  });

  // 3. Page Specific Logic Initialization
  if (document.querySelector(".product-page")) initProductPage();
  if (document.querySelector(".cart-page")) initCartPage();
  if (document.querySelector(".wishlist-page")) initWishlistPage();
  if (document.querySelector(".checkout-page")) initCheckoutPage();
  if (document.querySelector(".address-page")) initAddressPage();
  if (document.querySelector(".payment-page")) initPaymentPage();
  if (document.querySelector(".orders-page")) initOrdersPage();
  if (document.querySelector(".returns-page")) initReturnsPage();
  if (document.querySelector(".cancellations-page")) initCancellationsPage();
  if (document.querySelector(".products-page")) initProductFilters();
  if (document.querySelector(".contact-page")) initContactPage();
  if (document.querySelector(".order-details-page")) initOrderDetailsPage();
  if (document.getElementById("fp-email-form")) initForgotPasswordPage();
  if (document.getElementById("signup-form")) initSignupPage();

  // Global search enter
  document.querySelectorAll(".search-container input").forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") window.location.href = "products.html";
    });
  });
});

// ==========================================
// AUTHENTICATION SYSTEM
// ==========================================
function initAuthSystem() {
    const authModal = document.getElementById('auth-modal');
    const accountIcon = document.querySelector('.account-icon-link');
    const dropdown = document.querySelector('.account-dropdown');
    const signOutBtn = document.getElementById('nav-sign-out');

    // Check Auth State
    function checkAuth() {
        const isLoggedIn = localStorage.getItem('dripmen_token') === 'true';
        
        if (isLoggedIn) {
            // Logged In State
            if (dropdown) dropdown.style.display = ''; // Reset to CSS hover
            if (accountIcon) {
                accountIcon.href = 'account.html';
                // Remove click listener that opens modal
                accountIcon.onclick = null; 
            }
        } else {
            // Logged Out State
            if (dropdown) dropdown.style.display = 'none'; // Hide dropdown
            if (accountIcon) {
                accountIcon.href = 'javascript:void(0)';
                accountIcon.onclick = (e) => {
                    e.preventDefault();
                    openModal(authModal);
                };
            }
        }
    }

    // Modal Tabs Logic
    if (authModal) {
        // Switch to Signup from Link
        const switchSignupBtn = authModal.querySelector('.switch-to-signup');
        if (switchSignupBtn) {
            switchSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-form-wrapper').classList.remove('active');
                document.getElementById('signup-form-wrapper').classList.add('active');
            });
        }

        // Switch to Login from Link
        const switchLoginBtn = authModal.querySelector('.switch-to-login');
        if (switchLoginBtn) {
            switchLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('signup-form-wrapper').classList.remove('active');
                document.getElementById('login-form-wrapper').classList.add('active');
            });
        }

        // Login Form Submit
        const loginForm = document.getElementById('modal-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Simulate API Call
                localStorage.setItem('dripmen_token', 'true');
                showToast("Logged in successfully!");
                closeAllModals();
                checkAuth();
                // Optional: Reload to update other UI parts if needed
                // window.location.reload(); 
            });
        }

        // Signup Form Submit
        const signupForm = document.getElementById('modal-signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Simulate API Call
                localStorage.setItem('dripmen_token', 'true');
                showToast("Account created successfully!");
                closeAllModals();
                checkAuth();
            });
        }
    }

    // Sign Out Logic
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('dripmen_token');
            showToast("Signed out successfully");
            checkAuth();
            
            // If on a protected page, redirect to home
            const protectedPages = ['account.html', 'orders.html', 'address.html', 'payment.html', 'returns.html', 'cancellations.html'];
            const currentPage = window.location.pathname.split('/').pop();
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        });
    }

    // Initial Check
    checkAuth();
}

// ==========================================
// PAGE: PRODUCTS (FILTERS & SORT)
// ==========================================
function initProductFilters() {
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
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('filters-sidebar');
            if (sidebar) sidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const sidebar = document.getElementById('filters-sidebar');
    if (filterToggleBtn && sidebar) {
        filterToggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeFilterBtn && sidebar) {
        closeFilterBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Initial Render
    renderProducts();
}

// ==========================================
// PAGE: PRODUCT
// ==========================================
function initProductPage() {
  const container = document.querySelector('.single-product-section');
  if (!container) return;

  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const buyNowBtn = document.getElementById('buy-now-btn');
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

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to add to cart")) return;
      const item = getSelection();
      if (item) {
        addToCart(item);
        showCartConfirmModal(item);
      }
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (!checkAuth("Please login to continue")) return;
      const item = getSelection();
      if (item) {
        addToCart(item);
        window.location.href = "checkout.html";
      }
    });
  }

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
function initCartPage() {
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
function initWishlistPage() {
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
function initCheckoutPage() {
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
function initAddressPage() {
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
function initContactPage() {
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
function initSignupPage() {
  const signupForm = document.getElementById('signup-form');
  const otpForm = document.getElementById('signup-otp-form');
  const step1 = document.getElementById('signup-step-1');
  const stepOtp = document.getElementById('signup-step-otp');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const password = document.getElementById('signup-password')?.value;
      const confirmPassword = document.getElementById('signup-confirm-password')?.value;
      const email = document.getElementById('signup-email')?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }

      showToast(`OTP sent to ${email}`);
      step1.style.display = 'none';
      stepOtp.style.display = 'block';
    });
  }

  if (otpForm) {
    otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const otp = document.getElementById('signup-otp').value;

      if (otp !== '1234') {
        showToast("Invalid OTP (Try 1234)", "error");
        return;
      }

      showToast("Account created successfully!");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    });
  }
}

// ==========================================
// PAGE: FORGOT PASSWORD
// ==========================================
function initForgotPasswordPage() {
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
function initOrderDetailsPage() {
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
function initOrdersPage() {
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
function initReturnsPage() {
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
function initCancellationsPage() {
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
function initPaymentPage() {
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
