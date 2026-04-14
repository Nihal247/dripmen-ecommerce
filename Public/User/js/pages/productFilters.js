<<<<<<< HEAD
const API_BASE = "http://127.0.0.1:4000";
=======
const API_BASE = "http://localhost:4000";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

// ==========================================
export function initProductFilters() {

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
    const searchInput = document.getElementById("filter-search-input");

    if (!grid) return;

    let state = {
        category: "all",
<<<<<<< HEAD
        minPrice: 0,
        maxPrice: 2000,
        color: "all",
        size: "all",
        search: "",
=======
        minPrice: 50,
        maxPrice: 300,
        color: "all",
        size: "all",
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        sort: "newest",
        currentPage: 1,
        itemsPerPage: 9,
        totalPages: 1,
        total: 0,
    };

    // --- Fetch Products ---
    async function fetchProducts() {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#888;">
<<<<<<< HEAD
                <div class="loading-spinner"></div>
                <p style="margin-top:1rem;">Finding the best drip for you...</p>
=======
                Loading products...
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            </div>`;

        const params = new URLSearchParams();
        if (state.category !== "all") params.append("category", state.category);
<<<<<<< HEAD
        if (state.minPrice !== undefined) params.append("minPrice", state.minPrice);
        if (state.maxPrice !== undefined) params.append("maxPrice", state.maxPrice);
        if (state.color !== "all") params.append("color", state.color);
        if (state.size !== "all") params.append("size", state.size);
        if (state.sort) params.append("sort", state.sort);
        if (state.search) params.append("search", state.search);
        
=======
        if (state.minPrice) params.append("minPrice", state.minPrice);
        if (state.maxPrice) params.append("maxPrice", state.maxPrice);
        if (state.color !== "all") params.append("color", state.color);
        if (state.size !== "all") params.append("size", state.size);
        if (state.sort) params.append("sort", state.sort);
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        params.append("page", state.currentPage);
        params.append("limit", state.itemsPerPage);

        try {
            const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
            const data = await res.json();

            if (!data.success) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">Failed to load products.</div>`;
                return;
            }

            state.totalPages = data.totalPages || 1;
            state.total = data.total || 0;

            renderProducts(data.products);
            updatePaginationUI();

        } catch (err) {
            console.error("Failed to fetch products", err);
<<<<<<< HEAD
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">Could not connect to server.</div>`;
=======
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">Could not connect to server. Is it running on port 4000?</div>`;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        }
    }

    // --- Render Product Cards ---
<<<<<<< HEAD
=======
    // Uses EXACT CSS classes from style.css so all hover/styles apply
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    function renderProducts(products) {
        grid.innerHTML = "";

        if (!products || products.length === 0) {
            grid.innerHTML = `
<<<<<<< HEAD
                <div style="grid-column:1/-1; text-align:center; padding:5rem 2rem; color:#888;">
                    <i class="ph ph-magnifying-glass" style="font-size:3rem; opacity:0.3; margin-bottom:1rem; display:block;"></i>
                    <p style="font-size:1.1rem; font-weight:500;">No products found matching your filters.</p>
                    <p style="font-size:0.9rem; margin-top:0.5rem;">Try adjusting your price range or clearing search.</p>
=======
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#888;">
                    No products found.
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
                </div>`;
            return;
        }

<<<<<<< HEAD
        grid.innerHTML = products.map(p => {
            const image        = p.images?.[0] || "images/placeholder.png";
            const categoryName = p.categoryId?.name || "General";
            const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
            const isOutOfStock = p.status === "out_of_stock" || p.stock === 0;

=======
        products.forEach(p => {
            const image        = p.images?.[0] || "images/placeholder.png";
            const categoryName = p.categoryId?.name || "";
            const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
            const isOutOfStock = p.status === "out_of_stock" || p.stock === 0;

            // Discount badge
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            let discountBadge = "";
            if (p.salePrice && p.salePrice < p.price) {
                const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
                discountBadge = `<span class="discount-badge">-${pct}%</span>`;
            }

<<<<<<< HEAD
            const priceHTML = p.salePrice && p.salePrice < p.price
                ? `<span class="current-price">₹${p.salePrice}</span>
                   <span class="original-price">₹${p.price}</span>
                   ${discountBadge}`
                : `<span class="current-price">₹${p.price}</span>`;

            const stockBadge = isOutOfStock
                ? `<span class="oos-badge">Out of Stock</span>` : "";

            const cartBtn = isOutOfStock
                ? `<button class="btn btn-primary add-to-cart-btn" disabled>Out of Stock</button>`
                : `<button class="btn btn-primary add-to-cart-btn"><i class="ph ph-shopping-cart"></i> Add to Cart</button>`;

            return `
                <div class="product-card"
                    data-id="${p._id}"
                    data-name="${p.name}"
                    data-stock="${p.stock}"
                    data-price="${displayPrice}"
                    data-image="${image}"
                    data-sizes="${encodeURIComponent(JSON.stringify(p.sizes || []))}">
                    <div class="product-image-container">
                        <img src="${image}" alt="${p.name}" class="product-image" loading="lazy" />
=======
            // Price — uses correct CSS classes (current-price, original-price)
            const priceHTML = p.salePrice && p.salePrice < p.price
                ? `<span class="current-price">$${p.salePrice}</span>
                   <span class="original-price">$${p.price}</span>
                   ${discountBadge}`
                : `<span class="current-price">$${p.price}</span>`;

            // Out of stock badge
            const stockBadge = isOutOfStock
                ? `<span class="oos-badge">Out of Stock</span>` : "";

            // Stars
            const stars = `
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star"></i>
                <i class="ph-fill ph-star-half"></i>
                <span class="rating-text">4.5/5</span>`;

            // Cart button inside card-hover-actions → slides up on hover
            const cartBtn = isOutOfStock
                ? `<button class="btn btn-primary add-to-cart-btn" disabled style="opacity:0.6;cursor:not-allowed;">Out of Stock</button>`
                : `<button class="btn btn-primary add-to-cart-btn">
                     <i class="ph ph-shopping-cart"></i> Add to Cart
                   </button>`;

            grid.innerHTML += `
                <div class="product-card"
                    data-id="${p._id}"
                    data-name="${p.name}"
                    data-price="${displayPrice}"
                    data-image="${image}"
                    data-category="${categoryName}"
                    data-color="${p.colors?.[0] || ''}"
                    data-sizes="${p.sizes?.join(',') || ''}">

                    <div class="product-image-container">
                        <img src="${image}" alt="${p.name}" class="product-image" />
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
                        ${stockBadge}
                        <button class="wishlist-btn" aria-label="Add to wishlist">
                            <i class="ph ph-heart"></i>
                        </button>
<<<<<<< HEAD
                        <div class="card-hover-actions">${cartBtn}</div>
                    </div>
                    <div class="product-info">
                        <p class="product-category-label">${categoryName}</p>
                        <h3 class="product-name">${p.name}</h3>
                        <div class="product-rating">
                            <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star-half"></i>
                            <span class="rating-text">4.5/5</span>
                        </div>
                        <div class="product-price">${priceHTML}</div>
                    </div>
                </div>`;
        }).join("");

        // Restore wishlist hearts (uses core.js's handle logic usually, but here we just toggle UI)
        const wishlist = JSON.parse(localStorage.getItem("dripmen_wishlist") || "[]");
=======
                        <div class="card-hover-actions">
                            ${cartBtn}
                        </div>
                    </div>

                    <div class="product-info">
                        <p class="product-category-label">${categoryName}</p>
                        <h3 class="product-name">${p.name}</h3>
                        <div class="product-rating">${stars}</div>
                        <div class="product-price">${priceHTML}</div>
                    </div>
                </div>`;
        });

        // Restore wishlist hearts
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        grid.querySelectorAll(".product-card").forEach(card => {
            if (wishlist.find(w => w.id === card.dataset.id)) {
                const icon = card.querySelector(".wishlist-btn i");
                if (icon) icon.classList.add("ph-fill");
            }
        });
    }

    // --- Pagination UI ---
    function updatePaginationUI() {
        if (!paginationContainer) return;
<<<<<<< HEAD
=======

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        if (state.totalPages <= 1) {
            paginationContainer.style.display = "none";
            return;
        }
        paginationContainer.style.display = "flex";

        const pageNumbersContainer = paginationContainer.querySelector(".page-numbers");
        const prevBtn = paginationContainer.querySelector(".prev-btn");
        const nextBtn = paginationContainer.querySelector(".next-btn");

        if (pageNumbersContainer) {
            pageNumbersContainer.innerHTML = "";
            for (let i = 1; i <= state.totalPages; i++) {
                pageNumbersContainer.innerHTML += `
                    <button class="page-num ${i === state.currentPage ? "active" : ""}" data-page="${i}">
                        ${i}
                    </button>`;
            }
        }
<<<<<<< HEAD
=======

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        if (prevBtn) prevBtn.disabled = state.currentPage === 1;
        if (nextBtn) nextBtn.disabled = state.currentPage === state.totalPages;
    }

    // --- Load Categories from API ---
    async function loadCategoryFilters() {
        try {
            const res = await fetch(`${API_BASE}/api/categories`);
            const data = await res.json();
<<<<<<< HEAD
=======

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            const categoryList = document.querySelector(".category-list");
            if (!categoryList || !data.categories) return;

            categoryList.innerHTML = `
                <li>
                    <a href="#" class="filter-category-btn active" data-category="all">
                        All <i class="ph ph-caret-right"></i>
                    </a>
                </li>`;

            data.categories.forEach(cat => {
                categoryList.innerHTML += `
                    <li>
                        <a href="#" class="filter-category-btn" data-category="${cat.name}">
                            ${cat.name} <i class="ph ph-caret-right"></i>
                        </a>
                    </li>`;
            });

            bindCategoryEvents();
<<<<<<< HEAD
=======

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    }

<<<<<<< HEAD
    // --- Load Dynamic Price Range ---
    async function loadPriceRange() {
      try {
        const res = await fetch(`${API_BASE}/api/products/price-range`);
        const data = await res.json();
        if (data.success) {
          if (minRange) { minRange.min = data.min; minRange.max = data.max; minRange.value = data.min; }
          if (maxRange) { maxRange.min = data.min; maxRange.max = data.max; maxRange.value = data.max; }
          if (minVal) minVal.textContent = `₹${data.min}`;
          if (maxVal) maxVal.textContent = `₹${data.max}`;
          state.minPrice = data.min;
          state.maxPrice = data.max;
          handlePriceChange(); // update slider track
        }
      } catch (err) {
        console.warn("Could not load price range", err);
      }
    }

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    // --- Event Bindings ---
    function bindCategoryEvents() {
        document.querySelectorAll(".filter-category-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelectorAll(".filter-category-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
<<<<<<< HEAD
                state.category = btn.closest(".filter-category-btn").dataset.category || "all";
=======
                state.category = btn.dataset.category;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
                state.currentPage = 1;
                fetchProducts();
            });
        });
    }

    function handlePriceChange() {
        let min = parseInt(minRange.value);
        let max = parseInt(maxRange.value);
        if (min > max) [min, max] = [max, min];

        if (minVal) minVal.textContent = "₹" + min;
        if (maxVal) maxVal.textContent = "₹" + max;

        if (sliderTrack) {
            const range = minRange.max - minRange.min;
            const percent1 = ((min - minRange.min) / range) * 100;
            const percent2 = ((max - minRange.min) / range) * 100;
            sliderTrack.style.background = `linear-gradient(to right, #eee ${percent1}%, #000 ${percent1}%, #000 ${percent2}%, #eee ${percent2}%)`;
        }

<<<<<<< HEAD
        state.minPrice = min;
        state.maxPrice = max;
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
        state.currentPage = 1;
        fetchProducts();
    }

    // Debounce price changes for smoother sliding
    let priceTimeout;
    if (minRange && maxRange) {
        minRange.addEventListener("input", () => {
          handlePriceChange();
        });
        maxRange.addEventListener("input", () => {
          handlePriceChange();
        });
    }

    document.querySelectorAll(".filter-color-btn").forEach(btn => {
        btn.addEventListener("click", () => {
<<<<<<< HEAD
            const wasActive = btn.classList.contains("active");
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            document.querySelectorAll(".filter-color-btn").forEach(b => {
                b.classList.remove("active");
                const check = b.querySelector(".ph-check");
                if (check) check.style.display = "none";
            });
<<<<<<< HEAD
            if (!wasActive) {
                btn.classList.add("active");
                const check = btn.querySelector(".ph-check");
                if (check) check.style.display = "block";
                state.color = btn.dataset.color;
            } else {
                state.color = "all";
            }
=======
            btn.classList.add("active");
            const check = btn.querySelector(".ph-check");
            if (check) check.style.display = "block";
            state.color = btn.dataset.color;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            state.currentPage = 1;
            fetchProducts();
        });
    });

    document.querySelectorAll(".filter-size-btn").forEach(btn => {
        btn.addEventListener("click", () => {
<<<<<<< HEAD
            const wasActive = btn.classList.contains("active");
            document.querySelectorAll(".filter-size-btn").forEach(b => b.classList.remove("active"));
            if (!wasActive) {
                btn.classList.add("active");
                state.size = btn.dataset.size;
            } else {
                state.size = "all";
            }
=======
            document.querySelectorAll(".filter-size-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.size = btn.dataset.size;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            state.currentPage = 1;
            fetchProducts();
        });
    });

<<<<<<< HEAD
    // Search reactive (optional debounce)
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.search = searchInput.value.trim();
          state.currentPage = 1;
          fetchProducts();
        }, 500);
      });
    }

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    if (sortTrigger && sortOptions) {
        sortTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            sortOptions.classList.toggle("show");
        });
        document.addEventListener("click", () => sortOptions.classList.remove("show"));
        sortOptions.querySelectorAll(".sort-option").forEach(opt => {
            opt.addEventListener("click", () => {
                state.sort = opt.dataset.value;
                if (currentSortLabel) currentSortLabel.textContent = opt.textContent;
                state.currentPage = 1;
                fetchProducts();
            });
        });
    }

    if (paginationContainer) {
        paginationContainer.addEventListener("click", (e) => {
            const target = e.target;
            if (target.closest(".prev-btn") && state.currentPage > 1) {
                state.currentPage--;
                fetchProducts();
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (target.closest(".next-btn") && state.currentPage < state.totalPages) {
                state.currentPage++;
                fetchProducts();
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (target.classList.contains("page-num")) {
                const page = parseInt(target.dataset.page);
                if (page !== state.currentPage) {
                    state.currentPage = page;
                    fetchProducts();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            }
        });
    }

<<<<<<< HEAD
    // --- APPLY FILTER BUTTON (Now just for mobile closure) ---
    const applyBtn = document.querySelector(".apply-filter-btn");
    
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            // Already filtered, just close sidebar on mobile
            const sidebar = document.getElementById("filters-sidebar");
            const overlay = document.querySelector(".mobile-menu-overlay");
=======
    // Mobile filter sidebar
    const applyBtn = document.querySelector(".apply-filter-btn");
    const overlay = document.querySelector(".mobile-menu-overlay");
    const filterToggleBtn = document.getElementById("filter-toggle-btn");
    const closeFilterBtn = document.getElementById("close-filter-btn");
    const sidebar = document.getElementById("filters-sidebar");

    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            if (sidebar) sidebar.classList.remove("active");
            if (overlay) { overlay.classList.remove("active"); overlay.classList.remove("active-filters"); }
            document.body.style.overflow = "";
        });
    }
<<<<<<< HEAD

    // --- Overlay Support ---
    const overlay = document.querySelector(".mobile-menu-overlay");
    const filterToggleBtn = document.getElementById("filter-toggle-btn");
    const closeFilterBtn = document.getElementById("close-filter-btn");
    const sidebar = document.getElementById("filters-sidebar");

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    if (filterToggleBtn && sidebar) {
        filterToggleBtn.addEventListener("click", () => {
            sidebar.classList.add("active");
            if (overlay) { overlay.classList.add("active"); overlay.classList.add("active-filters"); }
            document.body.style.overflow = "hidden";
        });
    }
    if (closeFilterBtn && sidebar) {
        closeFilterBtn.addEventListener("click", () => {
            sidebar.classList.remove("active");
            if (overlay) { overlay.classList.remove("active"); overlay.classList.remove("active-filters"); }
            document.body.style.overflow = "";
        });
    }
<<<<<<< HEAD

    // Add search-filter styles
    if (!document.getElementById("filter-extra-style")) {
        const s = document.createElement("style");
        s.id = "filter-extra-style";
        s.textContent = `
            .search-filter-container { position: relative; margin-bottom: 0.5rem; }
            .filter-search-input {
                width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem;
                border: 1px solid #eee; border-radius: 8px; font-size: 0.9rem;
                transition: all 0.2s;
=======
    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            if (sidebar.classList.contains("active")) {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
                overlay.classList.remove("active-filters");
                document.body.style.overflow = "";
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
            }
            .filter-search-input:focus { border-color: #000; outline: none; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
            .search-filter-container i {
                position: absolute; left: 1rem; top: 50%;
                transform: translateY(-50%); color: #888;
            }
            .oos-badge {
                position: absolute; top: 12px; left: 12px;
                background: #dc2626; color: #fff;
                font-size: 0.72rem; font-weight: 700;
                padding: 4px 10px; border-radius: 20px; z-index: 2;
            }
            .product-category-label {
                font-size: 0.78rem; color: #888;
                text-transform: lowercase; margin-bottom: 2px;
            }
            .loading-spinner {
                width: 40px; height: 40px; border: 3px solid #f3f3f3;
                border-top: 3px solid #000; border-radius: 50%;
                margin: 0 auto; animation: spin 0.8s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(s);
    }

<<<<<<< HEAD
    // --- Boot ---
    loadPriceRange();
    loadCategoryFilters();
    fetchProducts(); // Initial load
=======
    // Add oos-badge style once
    if (!document.getElementById("oos-style")) {
        const s = document.createElement("style");
        s.id = "oos-style";
        s.textContent = `
            .oos-badge {
                position: absolute; top: 12px; left: 12px;
                background: #dc2626; color: #fff;
                font-size: 0.72rem; font-weight: 700;
                padding: 4px 10px; border-radius: 20px; z-index: 2;
            }
            .product-category-label {
                font-size: 0.78rem; color: #888;
                text-transform: lowercase; margin-bottom: 2px;
            }
        `;
        document.head.appendChild(s);
    }

    // --- Boot ---
    loadCategoryFilters().then(() => fetchProducts());
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
}