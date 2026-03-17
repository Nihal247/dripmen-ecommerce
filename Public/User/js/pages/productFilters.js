const API_BASE = "http://localhost:4000";

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

    if (!grid) return;

    let state = {
        category: "all",
        minPrice: 50,
        maxPrice: 300,
        color: "all",
        size: "all",
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
                Loading products...
            </div>`;

        const params = new URLSearchParams();
        if (state.category !== "all") params.append("category", state.category);
        if (state.minPrice) params.append("minPrice", state.minPrice);
        if (state.maxPrice) params.append("maxPrice", state.maxPrice);
        if (state.color !== "all") params.append("color", state.color);
        if (state.size !== "all") params.append("size", state.size);
        if (state.sort) params.append("sort", state.sort);
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
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">Could not connect to server. Is it running on port 4000?</div>`;
        }
    }

    // --- Render Product Cards ---
    // Uses EXACT CSS classes from style.css so all hover/styles apply
    function renderProducts(products) {
        grid.innerHTML = "";

        if (!products || products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#888;">
                    No products found.
                </div>`;
            return;
        }

        products.forEach(p => {
            const image        = p.images?.[0] || "images/placeholder.png";
            const categoryName = p.categoryId?.name || "";
            const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
            const isOutOfStock = p.status === "out_of_stock" || p.stock === 0;

            // Discount badge
            let discountBadge = "";
            if (p.salePrice && p.salePrice < p.price) {
                const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
                discountBadge = `<span class="discount-badge">-${pct}%</span>`;
            }

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
                        ${stockBadge}
                        <button class="wishlist-btn" aria-label="Add to wishlist">
                            <i class="ph ph-heart"></i>
                        </button>
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

        if (prevBtn) prevBtn.disabled = state.currentPage === 1;
        if (nextBtn) nextBtn.disabled = state.currentPage === state.totalPages;
    }

    // --- Load Categories from API ---
    async function loadCategoryFilters() {
        try {
            const res = await fetch(`${API_BASE}/api/categories`);
            const data = await res.json();

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

        } catch (err) {
            console.error("Failed to load categories", err);
        }
    }

    // --- Event Bindings ---
    function bindCategoryEvents() {
        document.querySelectorAll(".filter-category-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelectorAll(".filter-category-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.category = btn.dataset.category;
                state.currentPage = 1;
                fetchProducts();
            });
        });
    }

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

        state.currentPage = 1;
        fetchProducts();
    }

    if (minRange && maxRange) {
        minRange.addEventListener("input", handlePriceChange);
        maxRange.addEventListener("input", handlePriceChange);
    }

    document.querySelectorAll(".filter-color-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-color-btn").forEach(b => {
                b.classList.remove("active");
                const check = b.querySelector(".ph-check");
                if (check) check.style.display = "none";
            });
            btn.classList.add("active");
            const check = btn.querySelector(".ph-check");
            if (check) check.style.display = "block";
            state.color = btn.dataset.color;
            state.currentPage = 1;
            fetchProducts();
        });
    });

    document.querySelectorAll(".filter-size-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-size-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.size = btn.dataset.size;
            state.currentPage = 1;
            fetchProducts();
        });
    });

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

    // Mobile filter sidebar
    const applyBtn = document.querySelector(".apply-filter-btn");
    const overlay = document.querySelector(".mobile-menu-overlay");
    const filterToggleBtn = document.getElementById("filter-toggle-btn");
    const closeFilterBtn = document.getElementById("close-filter-btn");
    const sidebar = document.getElementById("filters-sidebar");

    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            if (sidebar) sidebar.classList.remove("active");
            if (overlay) { overlay.classList.remove("active"); overlay.classList.remove("active-filters"); }
            document.body.style.overflow = "";
        });
    }
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
    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            if (sidebar.classList.contains("active")) {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
                overlay.classList.remove("active-filters");
                document.body.style.overflow = "";
            }
        });
    }

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
}