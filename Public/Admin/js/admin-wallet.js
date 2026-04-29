document.addEventListener('DOMContentLoaded', () => {
    const API = window.API_BASE_URL;
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    const tableBody = document.getElementById("wallet-table-body");
    const totalBalanceEl = document.getElementById("total-wallet-balance");
    const totalUsersEl = document.getElementById("total-wallet-users");
    const searchInput = document.getElementById("wallet-search");

    let allWallets = [];

    // ==========================================
    // FETCH ALL WALLETS
    // ==========================================
    async function fetchWallets() {
        try {
            const res = await fetch(`${API}/api/admin/wallets`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                allWallets = data.wallets;

                // Update summary cards
                if (totalBalanceEl) totalBalanceEl.textContent = `₹${(data.totalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (totalUsersEl)   totalUsersEl.textContent   = data.count || 0;

                renderWallets(allWallets);
            } else {
                showError(data.message || "Failed to load wallets");
            }
        } catch (err) {
            console.error("Error fetching wallets:", err);
            showError("Network error. Could not load wallet data.");
        }
    }

    // ==========================================
    // RENDER WALLETS TABLE
    // ==========================================
    function renderWallets(wallets) {
        if (!tableBody) return;

        if (!wallets || wallets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:2.5rem; color:#9ca3af;">
                        <i class="ph ph-wallet" style="font-size:2rem; display:block; margin-bottom:0.5rem;"></i>
                        No wallet data found
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = wallets.map(wallet => {
            const last = wallet.lastTransaction;
            const balanceColor = wallet.balance > 0 ? '#16a34a' : '#6b7280';

            let lastTxHtml = `<span style="color:#9ca3af;">No transactions</span>`;
            let typeHtml   = `<span class="status-badge" style="background:#f3f4f6;color:#9ca3af;">—</span>`;

            if (last) {
                const sign   = last.type === 'credit' ? '+' : '-';
                const color  = last.type === 'credit' ? '#16a34a' : '#dc2626';
                const desc   = last.description || (last.type === 'credit' ? 'Credit' : 'Debit');
                lastTxHtml   = `<div style="font-weight:600; color:${color};">${sign}₹${(last.amount || 0).toLocaleString()}</div>
                                <div style="font-size:0.75rem; color:#6b7280;">${desc.length > 40 ? desc.slice(0, 40) + '...' : desc}</div>`;
                const typeClass = last.type === 'credit' ? 'status-active' : 'status-blocked';
                typeHtml = `<span class="status-badge ${typeClass}">${last.type === 'credit' ? 'Credit' : 'Debit'}</span>`;
            }

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(wallet.userName)}&background=1a1a2e&color=fff&size=36"
                                 style="width:36px; height:36px; border-radius:50%;" alt="${wallet.userName}">
                            <div>
                                <div style="font-weight:600;">${wallet.userName}</div>
                                <div style="font-size:0.75rem; color:#6b7280;">${wallet.userEmail}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span style="font-weight:700; font-size:1rem; color:${balanceColor};">
                            ₹${(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </td>
                    <td>
                        <span style="background:#eff6ff; color:#2563eb; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600;">
                            ${wallet.transactionCount || 0}
                        </span>
                    </td>
                    <td>${lastTxHtml}</td>
                    <td>${typeHtml}</td>
                    <td>
                        <a href="admin-user-details.html?id=${wallet.userId}"
                           class="action-btn view-btn" title="View User Details"
                           style="color:#3b82f6; display:inline-flex; align-items:center; gap:4px; font-size:0.85rem;">
                            <i class="ph ph-eye"></i> View User
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================
    // SEARCH FILTER
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) {
                renderWallets(allWallets);
                return;
            }
            const filtered = allWallets.filter(w =>
                w.userName.toLowerCase().includes(q) ||
                w.userEmail.toLowerCase().includes(q)
            );
            renderWallets(filtered);
        });
    }

    function showError(msg) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:#dc2626;">
                        <i class="ph ph-warning-circle" style="font-size:1.5rem; display:block; margin-bottom:0.5rem;"></i>
                        ${msg}
                    </td>
                </tr>`;
        }
    }

    // Initial load
    fetchWallets();
});
