const API_BASE = window.API_BASE_URL;
const token = localStorage.getItem("adminToken");

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    loadCategoryFilter();
    
    // Check for query parameters e.g. ?status=low_stock
    const urlParams  = new URLSearchParams(window.location.search);
    const status     = urlParams.get('status') || "";
    const search     = urlParams.get('search') || "";
    const category   = urlParams.get('category') || "";

    // Sync UI with query params if present
    if (status) {
        const statusSelect = document.getElementById("inventoryStatus");
        if (statusSelect) statusSelect.value = status;
    }
    if (search) {
        const searchInput = document.getElementById("inventorySearch");
        if (searchInput) searchInput.value = search;
    }

    loadInventory(search, category, status);
    initFilters();
});

// ==============================
// LOAD INVENTORY
// ==============================
async function loadInventory(search = "", category = "", status = "") {
    try {
        let url = `${API_BASE}/api/products/admin/all?`;
        if (search) url += `search=${search}&`;
        if (category) url += `category=${category}&`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            console.error("Failed to load inventory:", data.message);
            return;
        }

        let products = data.products || [];

        // Client-side filtering for stock status (Low/Out of Stock)
        if (status === "low_stock") {
            products = products.filter(p => p.stock > 0 && p.stock < 5);
        } else if (status === "out_of_stock") {
            products = products.filter(p => p.stock <= 0);
        } else if (status === "in_stock") {
            products = products.filter(p => p.stock >= 5);
        }

        renderInventoryStats(data.products || []); // Pass ALL products for stats
        renderInventoryTable(products);

    } catch (err) {
        console.error("Inventory Load Error:", err);
    }
}

// ==============================
// RENDER STATS (Cards)
// ==============================
function renderInventoryStats(allProducts) {
    const totalItems = allProducts.length;
    const lowStock   = allProducts.filter(p => p.stock > 0 && p.stock < 5).length;
    const outOfStock = allProducts.filter(p => p.stock <= 0).length;

    const totalCountEl = document.getElementById("total-inventory-count");
    const lowStockEl = document.getElementById("low-stock-count");
    const outOfStockEl = document.getElementById("out-of-stock-count");

    if (totalCountEl) totalCountEl.textContent = totalItems;
    if (lowStockEl) lowStockEl.textContent = lowStock;
    if (outOfStockEl) outOfStockEl.textContent = outOfStock;
}

// ==============================
// RENDER TABLE
// ==============================
function renderInventoryTable(products) {
    const tbody = document.getElementById("inventory-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:3rem; color:#888;">No items match your criteria.</td></tr>`;
        return;
    }

    products.forEach(p => {
        const image = p.images?.[0] || "";
        const categoryName = p.categoryId?.name || "Uncategorized";
        
        // Build size breakdown badges
        const sizeBreakdownHTML = p.sizes && p.sizes.length > 0 
            ? p.sizes.map(s => {
                const badgeColor = s.stock <= 0 ? "#fee2e2" : (s.stock < 5 ? "#ffedd5" : "#f1f5f9");
                const textColor = s.stock <= 0 ? "#dc2626" : (s.stock < 5 ? "#ea580c" : "#64748b");
                return `<span style="display:inline-block; padding:4px 8px; border-radius:6px; background:${badgeColor}; color:${textColor}; font-weight:600; font-size:0.75rem; border:1px solid rgba(0,0,0,0.05); margin-right:4px; margin-bottom:4px;">${s.size}: ${s.stock}</span>`;
            }).join("")
            : `<span style="color:#888; font-size:0.85rem;">No sizes defined</span>`;

        const statusHTML = p.stock <= 0 
            ? `<span class="status-badge status-cancelled" style="background:#fee2e2; color:#dc2626;">Sold Out</span>` 
            : (p.stock < 5 
                ? `<span class="status-badge status-pending" style="background:#ffedd5; color:#ea580c;">Low Stock</span>` 
                : `<span class="status-badge status-completed" style="background:#dcfce7; color:#16a34a;">In Stock</span>`);

        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        ${image ? `<img src="${image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">` : ""}
                        <div>
                            <span style="font-weight:600; display:block;">${p.name}</span>
                            <span style="font-size:0.75rem; color:#888;">ID: ${p._id.slice(-6).toUpperCase()}</span>
                        </div>
                    </div>
                </td>
                <td>${categoryName}</td>
                <td style="max-width: 250px; white-space: normal;">${sizeBreakdownHTML}</td>
                <td style="font-weight:700;">${p.stock}</td>
                <td>${statusHTML}</td>
                <td>
                    <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="redirectToEdit('${p._id}')">
                        <i class="ph ph-pencil-simple"></i> Manage
                    </button>
                </td>
            </tr>
        `;
    });
}

// ==============================
// FILTERS & SEARCH
// ==============================
function initFilters() {
    const searchInput   = document.getElementById("inventorySearch");
    const catSelect     = document.getElementById("inventoryCategory");
    const statusSelect  = document.getElementById("inventoryStatus");

    let timer;
    searchInput?.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            loadInventory(searchInput.value, catSelect.value, statusSelect.value);
        }, 400);
    });

    catSelect?.addEventListener("change", () => loadInventory(searchInput.value, catSelect.value, statusSelect.value));
    statusSelect?.addEventListener("change", () => loadInventory(searchInput.value, catSelect.value, statusSelect.value));
}

async function loadCategoryFilter() {
    try {
        const res = await fetch(`${API_BASE}/api/categories/admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const select = document.getElementById("inventoryCategory");
        if (!select || !data.categories) return;

        // Clear existing except first
        select.innerHTML = '<option value="">All Categories</option>';

        data.categories.forEach(cat => {
            select.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
        });
    } catch (err) {
        console.error("Failed to load categories:", err);
    }
}

// ==============================
// ACTIONS
// ==============================
window.redirectToEdit = (id) => {
    // Redirect to products page with auto-edit or just products page
    window.location.href = `admin-products.html?edit=${id}`;
};
