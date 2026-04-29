document.addEventListener('DOMContentLoaded', () => {
    const API = window.API_BASE_URL;
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    const transactionsBody = document.getElementById("transactions-body");

    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    // Show loading state
    if (transactionsBody) {
        transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#9ca3af;">Loading transactions...</td></tr>`;
    }

    async function fetchTransactions() {
        try {
            const res = await fetch(`${API}/api/admin/transactions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                renderTransactions(data.transactions);
            } else {
                if (transactionsBody) {
                    transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#dc2626;">${data.message || 'Failed to load transactions'}</td></tr>`;
                }
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            if (transactionsBody) {
                transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#dc2626;">Network error. Could not load transactions.</td></tr>`;
            }
        }
    }

    function renderTransactions(transactions) {
        if (!transactionsBody) return;

        if (transactions.length === 0) {
            transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#9ca3af;">No transactions found</td></tr>`;
            return;
        }

        transactionsBody.innerHTML = transactions.map(trx => {
            const date = trx.date ? new Date(trx.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';

            const typeClass   = trx.type === 'credit' ? 'status-active' : 'status-blocked';
            const description = trx.description || '—';

            return `
                <tr>
                    <td style="font-family:monospace; font-size:0.85rem;">#${trx.transactionId ? trx.transactionId.toString().slice(-8).toUpperCase() : 'N/A'}</td>
                    <td>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:600;">${trx.userName || 'Unknown'}</span>
                            <span style="font-size:0.75rem; color:#6b7280;">${trx.userEmail || ''}</span>
                        </div>
                    </td>
                    <td style="font-weight:700; color:${trx.type === 'credit' ? '#16a34a' : '#dc2626'};">
                        ${trx.type === 'credit' ? '+' : '-'}₹${(trx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td><span class="status-badge ${typeClass}">${trx.type === 'credit' ? 'Credit' : 'Debit'}</span></td>
                    <td style="font-size:0.85rem; color:#374151; max-width:220px;">${description.length > 50 ? description.slice(0, 50) + '...' : description}</td>
                    <td><span class="status-badge status-completed">Completed</span></td>
                    <td style="font-size:0.85rem; color:#6b7280;">${date}</td>
                </tr>
            `;
        }).join("");
    }

    // Initial fetch
    fetchTransactions();
});
