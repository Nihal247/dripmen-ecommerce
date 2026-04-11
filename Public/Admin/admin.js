document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Mobile Sidebar Toggle Logic
    // ==========================================
    
    // 1. Inject Menu Toggle if missing (For Categories, Orders, Coupons pages)
    let menuToggle = document.querySelector('.menu-toggle');
    let adminHeader = document.querySelector('.admin-header');
    const adminMain = document.querySelector('.admin-main') || document.querySelector('main');

    // Fix: If admin-header is missing (common in simple pages), create it
    if (!adminHeader && adminMain) {
        adminHeader = document.createElement('div');
        adminHeader.className = 'admin-header';
        adminMain.insertBefore(adminHeader, adminMain.firstChild);
    }

    if (!menuToggle && adminHeader) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="ph ph-list"></i>';
        
        let headerLeft = adminHeader.querySelector('.header-left');

        // If header-left exists, just prepend the button
        if (headerLeft) {
            headerLeft.insertBefore(menuToggle, headerLeft.firstChild);
        } 
        // If header-left is missing (e.g. Categories/Orders pages), create it to maintain layout
        else {
            headerLeft = document.createElement('div');
            headerLeft.className = 'header-left';
            
            // Move existing title into new wrapper if it exists
            let pageTitle = adminHeader.querySelector('.page-title') || adminHeader.querySelector('h2') || adminHeader.querySelector('h1');
            
            // If not in header, check if it's floating in main (orphaned)
            if (!pageTitle && adminMain) {
                // Find the first heading that isn't inside a table or card
                const candidates = adminMain.querySelectorAll('h2, h1, .page-title');
                for (const candidate of candidates) {
                    if (!candidate.closest('.admin-table') && !candidate.closest('.card') && !candidate.closest('.stat-card')) {
                        pageTitle = candidate;
                        break;
                    }
                }
            }

            if (pageTitle) headerLeft.appendChild(pageTitle);
            
            headerLeft.insertBefore(menuToggle, headerLeft.firstChild);
            adminHeader.insertBefore(headerLeft, adminHeader.firstChild);
        }
    }

    const sidebar = document.querySelector('.admin-sidebar');
    
    // 2. Create Overlay dynamically if not present in HTML
    // This ensures the dark background appears even if you forgot to add the div
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // 3. Toggle Event (Connect the 3 dots/menu button)
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    // 4. Close on Overlay Click
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // 5. Close on Window Resize (Cleanup)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });

    // ==========================================
    // Mobile Table Actions (Three Dot Toggle)
    // ==========================================
    function initMobileTableActions() {
        const actionContainers = document.querySelectorAll('.action-buttons');
        
        actionContainers.forEach(container => {
            // Check if toggle already exists
            if (container.querySelector('.mobile-action-toggle')) return;

            // Create Toggle Button
            const toggle = document.createElement('button');
            toggle.className = 'mobile-action-toggle';
            toggle.innerHTML = '<i class="ph-fill ph-dots-three-vertical"></i>';
            
            // Insert at beginning
            container.insertBefore(toggle, container.firstChild);

            // Click Event
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close others
                document.querySelectorAll('.action-buttons.active').forEach(el => {
                    if (el !== container) el.classList.remove('active');
                });
                container.classList.toggle('active');
            });
        });

        // Close on click outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.action-buttons.active').forEach(el => el.classList.remove('active'));
        });
    }

    initMobileTableActions();

    // ==========================================
    // Dashboard Stats & Recent Orders
    // ==========================================
    const API = "http://127.0.0.1:4000";
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

    let revenueChart = null;

    async function fetchDashboardStats() {
        const statOrders   = document.getElementById("stat-orders");
        const statRevenue  = document.getElementById("stat-revenue");
        const statUsers    = document.getElementById("stat-users");
        const statProducts = document.getElementById("stat-products");
        const statPending  = document.getElementById("stat-pending");
        const statLowStock = document.getElementById("stat-lowstock");
        const recentBody   = document.getElementById("recent-orders-body");
        const sellersList  = document.querySelector(".best-sellers-list");

        if (!statOrders) return; // Not on dashboard home

        try {
            const res = await fetch(`${API}/api/admin/stats`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                const { stats, recentOrders, bestSellers, revenueByDay } = data;
                
                // 1. Update Stat Cards
                if (statOrders)   statOrders.textContent   = stats.totalOrders;
                if (statRevenue)  statRevenue.textContent  = `₹${stats.totalRevenue.toLocaleString()}`;
                if (statUsers)    statUsers.textContent    = stats.totalUsers;
                if (statProducts) statProducts.textContent = stats.totalProducts;
                if (statPending)  statPending.textContent  = stats.pendingOrders;
                if (statLowStock) statLowStock.textContent = stats.lowStockItems;

                // 2. Render Recent Orders
                if (recentBody && recentOrders) {
                    recentBody.innerHTML = recentOrders.map(order => {
                        const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const status = order.orderStatus || "Processing";
                        const customer = order.user?.name || "Guest";
                        const productImg = order.items?.[0]?.image || "https://via.placeholder.com/40";
                        const productName = order.items?.[0]?.name || "Product";
                        
                        return `
                            <tr>
                                <td>#${order._id.slice(-6).toUpperCase()}</td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <img src="${productImg}" style="width:32px; height:32px; border-radius:4px; object-fit:cover;">
                                        <span>${productName}</span>
                                    </div>
                                </td>
                                <td>${date}</td>
                                <td>${customer}</td>
                                <td>₹${order.total}</td>
                                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                                <td><button class="btn-text">Detail</button></td>
                            </tr>
                        `;
                    }).join("");
                }

                // 3. Render Best Sellers
                if (sellersList && bestSellers) {
                    sellersList.innerHTML = bestSellers.map(product => `
                        <div class="seller-item" style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f4f6;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${product.images?.[0] || 'https://via.placeholder.com/50'}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">
                                <div>
                                    <h4 style="font-size:0.9rem; font-weight:600; margin:0;">${product.name}</h4>
                                    <span style="font-size:0.8rem; color:#6b7280;">₹${product.price}</span>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700; color:var(--text-main);">${product.sales || 0}</div>
                                <div style="font-size:0.75rem; color:#9ca3af;">Sales</div>
                            </div>
                        </div>
                    `).join("");
                }

                // 4. Initialize/Update Revenue Chart
                if (revenueByDay) {
                    initRevenueChart(revenueByDay);
                }
            }
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
        }
    }

    function initRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const labels = data.map(item => {
            const d = new Date(item._id);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });
        const values = data.map(item => item.revenue);

        if (revenueChart) {
            revenueChart.destroy();
        }

        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => `₹${context.parsed.y}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [5, 5], color: '#e5e7eb' },
                        ticks: {
                            callback: (val) => `₹${val}`
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    if (window.location.pathname.includes("admin.html") || window.location.pathname.endsWith("/Admin/") || window.location.pathname.endsWith("admin")) {
        fetchDashboardStats();
    }

    // ==========================================
    // Auto-Wrap Tables for Responsiveness
    // ==========================================
    const tables = document.querySelectorAll('.admin-table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });

    // Handle logout
    const logoutBtn = document.querySelector(".ph-sign-out")?.closest("a");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");
            localStorage.removeItem("dripmen_user");
            window.location.href = "admin-login.html";
        });
    }

    // ==========================================
    // Admin Notifications (Badges) & Dynamic Filtering
    // ==========================================
    async function updateAdminNotifications() {
        const currentToken = localStorage.getItem("adminToken") || localStorage.getItem("token");
        if (!currentToken) return;

        try {
            const res = await fetch(`${API}/api/admin/notifications`, {
                headers: { "Authorization": `Bearer ${currentToken}` }
            });
            const data = await res.json();

            if (data.success) {
                const { newOrders, returnRequests, lowStock } = data.notifications;

                // Define configuration for badge injection and filtering
                const badgeConfigs = [
                    { href: 'admin-orders.html',    count: newOrders,      filter: '?status=processing' },
                    { href: 'admin-returns.html',   count: returnRequests, filter: '' },
                    { href: 'admin-inventory.html', count: lowStock,       filter: '?status=low_stock' }
                ];

                badgeConfigs.forEach(config => {
                    // Match sidebar links that start with the target href
                    const navItems = document.querySelectorAll(`.sidebar-nav a[href^="${config.href}"]`);
                    
                    navItems.forEach(navItem => {
                        // 1. Update HREF for Filtered Navigation (only if count > 0)
                        if (config.count > 0 && config.filter) {
                            navItem.setAttribute('href', config.href + config.filter);
                        } else {
                            navItem.setAttribute('href', config.href);
                        }

                        // 2. Manage Badge Element
                        let badge = navItem.querySelector('.notification-badge');
                        if (config.count > 0) {
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.className = 'notification-badge';
                                navItem.appendChild(badge);
                            }
                            badge.textContent = config.count > 99 ? '99+' : config.count;
                            badge.style.display = 'flex';
                        } else if (badge) {
                            badge.remove();
                        }
                    });
                });
            }
        } catch (err) {
            console.error("Admin Notification Poll Error:", err);
        }
    }

    // Initialize and start polling cycle (5s)
    const tokenForInit = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (tokenForInit) {
        updateAdminNotifications();
        setInterval(updateAdminNotifications, 5000);
    }
});