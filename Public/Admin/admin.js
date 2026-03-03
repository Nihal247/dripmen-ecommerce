document.addEventListener('DOMContentLoaded', () => {
    // Initialize Revenue Chart
    const chartCanvas = document.getElementById('revenueChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue',
                    data: [1200, 1900, 3000, 5000, 2300, 3400, 4500],
                    borderColor: '#000',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Initialize Analytics Chart
    const analyticsCanvas = document.getElementById('analyticsChart');
    if (analyticsCanvas) {
        const ctx = analyticsCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Sales',
                    data: [65, 59, 80, 81, 56, 55, 40, 70, 85, 90, 100, 115],
                    backgroundColor: '#1a1a1a',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Populate Best Sellers
    const bestSellers = [
        { name: 'Black Tshirt', price: '$145', sales: '1,240 sales', img: 'images/Balck Tshirt.png' },
        { name: 'Varsity Jacket', price: '$120', sales: '850 sales', img: 'images/versity jacket.png' },
        { name: 'White Hoodie', price: '$240', sales: '620 sales', img: 'images/White hoodie.png' },
    ];

    const bsContainer = document.querySelector('.best-sellers-list');
    if (bsContainer) {
        bsContainer.innerHTML = bestSellers.map(item => `
            <div class="best-seller-item">
                <img src="${item.img}" alt="${item.name}" class="bs-img">
                <div class="bs-info">
                    <span class="bs-name">${item.name}</span>
                    <span class="bs-price">${item.price}</span>
                </div>
                <span class="bs-sales">${item.sales}</span>
            </div>
        `).join('');
    }

    // Populate Recent Orders
    const orders = [
        { id: '#923742', product: 'Black Tshirt', date: 'Nov 12, 2023', customer: 'Alex Doe', total: '$145.00', status: 'Completed', statusClass: 'status-completed' },
        { id: '#923741', product: 'White Hoodie', date: 'Nov 12, 2023', customer: 'David Smith', total: '$240.00', status: 'Pending', statusClass: 'status-pending' },
        { id: '#923740', product: 'Varsity Jacket', date: 'Nov 11, 2023', customer: 'Sarah Jones', total: '$120.00', status: 'Completed', statusClass: 'status-completed' },
        { id: '#923739', product: 'Blue Sweatshirt', date: 'Nov 10, 2023', customer: 'Mike Brown', total: '$130.00', status: 'Cancelled', statusClass: 'status-cancelled' },
    ];

    const ordersBody = document.getElementById('recent-orders-body');
    if (ordersBody) {
        ordersBody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.product}</td>
                <td>${order.date}</td>
                <td>${order.customer}</td>
                <td>${order.total}</td>
                <td><span class="status-badge ${order.statusClass}">${order.status}</span></td>
                <td><button class="action-btn"><i class="ph ph-dots-three-vertical"></i></button></td>
            </tr>
        `).join('');
    }

    // Sidebar Toggle Logic
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Close sidebar when resizing to desktop view
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    }
});