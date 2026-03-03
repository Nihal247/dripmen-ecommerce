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

