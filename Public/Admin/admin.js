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
});