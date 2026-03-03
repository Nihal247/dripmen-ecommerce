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

export function renderLayout() {
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
