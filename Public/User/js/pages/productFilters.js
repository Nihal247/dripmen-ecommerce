import { getProductDataFromElement } from '../core.js';

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