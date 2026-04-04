const API_BASE = "http://127.0.0.1:4000";
const token = localStorage.getItem("token");

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    fetchWalletData();
    initTopupLogic();
});

// ==============================
// FETCH WALLET
// ==============================
async function fetchWalletData() {
    try {
        const res = await fetch(`${API_BASE}/api/wallet`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderWallet(data.wallet);
        } else {
            console.error("Failed to load wallet:", data.message);
        }
    } catch (err) {
        console.error("Wallet Load Error:", err);
    }
}

// ==============================
// RENDER UI
// ==============================
function renderWallet(wallet) {
    document.getElementById("wallet-balance").textContent = wallet.balance.toFixed(2);
    
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    if (!wallet.transactions || wallet.transactions.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; padding: 2rem;">No transactions yet.</p>`;
        return;
    }

    wallet.transactions.reverse().forEach(trx => {
        const iconClass = trx.type === "credit" ? "ph-trend-up" : "ph-trend-down";
        const dateStr = new Date(trx.date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
        });

        list.innerHTML += `
            <div class="transaction-item">
                <div class="trx-info">
                    <div class="trx-icon ${trx.type}">
                        <i class="ph-bold ${iconClass}"></i>
                    </div>
                    <div class="trx-details">
                        <h4>${trx.description}</h4>
                        <span>${dateStr}</span>
                    </div>
                </div>
                <div class="trx-amount ${trx.type}">
                    ${trx.type === "credit" ? "+" : "-"} ₹${trx.amount.toFixed(2)}
                </div>
            </div>
        `;
    });
}

// ==============================
// TOP-UP LOGIC (Razorpay)
// ==============================
function initTopupLogic() {
    window.openTopupModal = () => {
        document.getElementById("topupModal").style.display = "flex";
    };

    window.closeTopupModal = () => {
        document.getElementById("topupModal").style.display = "none";
    };

    document.getElementById("confirm-topup-btn").addEventListener("click", async () => {
        const amount = document.getElementById("topup-amount").value;
        if (!amount || amount < 1) return alert("Min. $1 required");

        try {
            // 1. Create Topup Order
            const res = await fetch(`${API_BASE}/api/wallet/topup`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();
            if (!data.success) return alert(data.message);

            // 2. Open Razorpay
            const options = {
                key:      data.keyId,
                amount:   data.order.amount,
                currency: data.order.currency,
                name:     "DripMen Wallet",
                description: "Wallet Top-up",
                order_id: data.order.id,
                handler: async (response) => {
                    // 3. Verify Payment
                    await verifyTopup(response, amount);
                },
                theme: { color: "#111" }
            };

            const rzp = new Razorpay(options);
            rzp.open();
            closeTopupModal();

        } catch (err) {
            console.error("Topup Initiation Failed:", err);
        }
    });
}

async function verifyTopup(rzpResponse, amount) {
    try {
        const res = await fetch(`${API_BASE}/api/wallet/verify`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                ...rzpResponse,
                amount
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("Wallet topped up successfully!");
            renderWallet(data.wallet);
        } else {
            alert("Verification failed: " + data.message);
        }
    } catch (err) {
        console.error("Verification Error:", err);
    }
}
