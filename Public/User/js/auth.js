// ==========================================
export function initAuthSystem() {
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
