document.addEventListener('DOMContentLoaded', () => {
    const API = "http://127.0.0.1:4000";
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    const transactionsBody = document.getElementById("transactions-body");

    if (!token) {
        window.location.href = "admin-login.html";
        return;
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
                console.error("Failed to fetch transactions:", data.message);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    }

    function renderTransactions(transactions) {
        if (!transactionsBody) return;

        if (transactions.length === 0) {
            transactionsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No transactions found</td></tr>`;
            return;
        }

        transactionsBody.innerHTML = transactions.map(trx => {
            const date = new Date(trx.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const typeClass = trx.type === 'credit' ? 'status-active' : 'status-blocked';
            const statusClass = 'status-completed'; // For now, all logged wallet transitions are completed

            return `
                <tr>
                    <td>#${trx.transactionId ? trx.transactionId.slice(-8).toUpperCase() : 'N/A'}</td>
                    <td>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:600;">${trx.userName}</span>
                            <span style="font-size:0.75rem; color:#6b7280;">${trx.userEmail}</span>
                        </div>
                    </td>
                    <td style="font-weight:700; color:${trx.type === 'credit' ? '#16a34a' : '#dc2626'};">
                        ${trx.type === 'credit' ? '+' : '-'}$${trx.amount.toFixed(2)}
                    </td>
                    <td><span class="status-badge ${typeClass}">${trx.type.charAt(0).toUpperCase() + trx.type.slice(1)}</span></td>
                    <td><span class="status-badge ${statusClass}">Completed</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join("");
    }

    // Initial fetch
    fetchTransactions();
});
