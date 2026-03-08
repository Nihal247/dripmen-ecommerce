// ==========================================
import { openModal, closeAllModals, showToast } from "../core.js";

export function initAuthSystem() {
    const authModal = document.getElementById('auth-modal');
    const accountIcon = document.querySelector('.account-icon-link');
    const dropdown = document.querySelector('.account-dropdown');
    const signOutBtn = document.getElementById('nav-sign-out');

    // Rename "Sign out" to "Logout"
    if (signOutBtn) {
        // The text is in the last child node of the <a> element
        const textNode = signOutBtn.lastChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            textNode.textContent = ' Logout';
        }
    }

    // --- Inject Updated Modal HTML ---
    if (authModal) {
        authModal.innerHTML = `
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
                        <input type="email" id="modal-login-email" placeholder="Email Address" required class="auth-input">
                    </div>
                    <div class="form-group">
                        <input type="password" id="modal-login-password" placeholder="Password" required class="auth-input">
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

            <!-- Signup Form Wrapper -->
            <div id="signup-form-wrapper" class="auth-form-wrapper">
                
                <!-- Step 1: Details -->
                <div id="modal-signup-step-1">
                    <div class="auth-header">
                        <h2>Sign Up</h2>
                        <p>Create an account to get started</p>
                    </div>
                    <form id="modal-signup-form" class="auth-form-stack">
                        <div class="form-group">
                            <input type="text" id="modal-signup-name" placeholder="Full Name" required class="auth-input">
                        </div>
                        <div class="form-group">
                            <input type="email" id="modal-signup-email" placeholder="Email Address" required class="auth-input">
                        </div>
                        <div class="form-group">
                            <input type="password" id="modal-signup-password" placeholder="Password" required class="auth-input" minlength="6" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,}" title="Must contain at least 6 characters including uppercase, lowercase and number">
                        </div>
                        <div class="form-group">
                            <input type="password" id="modal-signup-confirm-password" placeholder="Confirm Password" required class="auth-input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary full-width">Sign Up</button>
                        </div>
                        <div class="auth-footer-text" style="margin-top: 1.5rem;">
                            <p>Already have an account? <a href="#" class="switch-to-login">Log in</a></p>
                        </div>
                    </form>
                </div>

                <!-- Step 2: OTP -->
                <div id="modal-signup-step-otp" style="display: none;">
                    <div class="auth-header">
                        <h2>Verify Email</h2>
                        <p>Enter the code sent to your email</p>
                    </div>
                    <form id="modal-signup-otp-form" class="auth-form-stack">
                        <div class="form-group">
                            <input type="text" id="modal-signup-otp" placeholder="Enter 4-digit Code" required class="auth-input" maxlength="4" style="text-align: center; letter-spacing: 4px; font-weight: 600;">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary full-width">Verify & Create Account</button>
                        </div>
                        <div class="auth-footer-text" style="margin-top: 1.5rem;">
                            <p><a href="#" id="back-to-signup-step-1">Back to details</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    }

    // Check Auth State
    function checkAuth() {
        const isLoggedIn = localStorage.getItem('dripmen_token') === 'true';

        if (isLoggedIn) {
            // Logged In State
            if (dropdown) dropdown.style.display = ''; // Reset to CSS hover
            if (accountIcon) {
                accountIcon.href = 'javascript:void(0)';
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
        const switchLoginBtn = authModal.querySelector('.switch-to-login');
        const backToSignupBtn = authModal.querySelector('#back-to-signup-step-1');

        if (switchSignupBtn) {
            switchSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-form-wrapper').classList.remove('active');
                document.getElementById('signup-form-wrapper').classList.add('active');
                // Reset steps
                document.getElementById('modal-signup-step-1').style.display = 'block';
                document.getElementById('modal-signup-step-otp').style.display = 'none';
            });
        }

        // Switch to Login from Link
        if (switchLoginBtn) {
            switchLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('signup-form-wrapper').classList.remove('active');
                document.getElementById('login-form-wrapper').classList.add('active');
            });
        }

        if (backToSignupBtn) {
            backToSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('modal-signup-step-otp').style.display = 'none';
                document.getElementById('modal-signup-step-1').style.display = 'block';
            });
        }


        // Login Form Submit
        const loginForm = document.getElementById('modal-login-form');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {

                e.preventDefault();

                const email = document.getElementById("modal-login-email").value;
                const password = document.getElementById("modal-login-password").value;

                try {

                    const response = await fetch("http://localhost:4000/api/auth/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        showToast(data.message || "Login failed", "error");
                        return;
                    }

                    // Save token
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("dripmen_token", "true");

                    showToast("Logged in successfully ✅");

                    closeAllModals();
                    checkAuth();

                } catch (error) {

                    console.error(error);
                    showToast("Network error. Try again.", "error");

                }

            });
        }

        // Signup Form Submit
        const signupForm = document.getElementById('modal-signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('modal-signup-name').value;
                const email = document.getElementById('modal-signup-email').value;
                const password = document.getElementById('modal-signup-password').value;
                const confirmPass = document.getElementById('modal-signup-confirm-password').value;

                // Strong password validation
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
                if (!strongPasswordRegex.test(password)) {
                    showToast("Password must be at least 6 characters and include uppercase, lowercase, and number", "error");
                    return;
                }

                if (password !== confirmPass) {
                    showToast("Passwords do not match", "error");
                    return;
                }

                try {
                    const response = await fetch("http://localhost:4000/api/auth/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        showToast(data.message || "Signup failed", "error");
                        return;
                    }

                    showToast("OTP sent successfully ✅");

                    // Store data temporarily for step 2
                    sessionStorage.setItem("signupData", JSON.stringify({ name, email, password }));

                    document.getElementById('modal-signup-step-1').style.display = 'none';
                    document.getElementById('modal-signup-step-otp').style.display = 'block';

                } catch (error) {
                    console.error(error);
                    showToast("Network error. Please try again.", "error");
                }
            });
        }

        // Signup OTP Submit
        const otpForm = document.getElementById('modal-signup-otp-form');
        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const otp = document.getElementById('modal-signup-otp').value;

                try {
                    const storedData = JSON.parse(sessionStorage.getItem("signupData"));

                    if (!storedData) {
                        showToast("Session expired. Please signup again.", "error");
                        return;
                    }

                    const response = await fetch("http://localhost:4000/api/auth/verify-signup-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...storedData, otp }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        showToast(data.message || "Invalid OTP", "error");
                        return;
                    }

                    showToast("Account created successfully! 🎉");

                    // Save JWT and UI flag
                    localStorage.setItem("token", data.token);
                    localStorage.setItem('dripmen_token', 'true');

                    // Clear temp signup data
                    sessionStorage.removeItem("signupData");

                    closeAllModals();
                    checkAuth();

                } catch (error) {
                    console.error(error);
                    showToast("Network error during OTP verification.", "error");
                }
            });
        }
    }

    // Sign Out Logic
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
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
