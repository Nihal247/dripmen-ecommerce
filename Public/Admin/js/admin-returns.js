const API_BASE = "http://127.0.0.1:4000";
const token = localStorage.getItem("adminToken");

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    fetchReturns();
});

// ==============================
// FETCH RETURNS
// ==============================
async function fetchReturns() {
    const tbody = document.getElementById("returns-table-body");
    try {
        const res = await fetch(`${API_BASE}/api/orders/admin/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Admin Returns Fetch status:", res.status);
        if (res.status === 401 || res.status === 403) {
            console.error("Admin Access Denied. Check token/permissions.");
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #ef4444;">Admin Access Denied. Please log in again.</td></tr>`;
            return;
        }

        const data = await res.json();

        if (data.success) {
            console.log("Admin API Response (Orders):", data.orders.length);
            const requestedReturns = data.orders.filter(o => o.returnStatus === "requested");
            console.log("Found Requested Returns:", requestedReturns.length, requestedReturns);
            
            renderReturns(requestedReturns);
            updateStats(data.orders);
        } else {
            console.error("Admin API Error:", data.message);
        }
    } catch (err) {
        console.error("Fetch Returns Error:", err);
    }
}

// ==============================
// RENDER UI
// ==============================
function renderReturns(returns) {
    const tbody = document.getElementById("returns-table-body");
    tbody.innerHTML = "";

    if (returns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #888;">No pending return requests.</td></tr>`;
        return;
    }

    returns.forEach(order => {
        const shortId = "#" + order._id.slice(-6).toUpperCase();
        const customer = order.user?.name || "Unknown";
        const refundMethodLabel = order.refundMethod === "wallet" ? "Wallet" : "Original Payment";
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 700;">${shortId}</td>
                <td>${customer}</td>
                <td style="max-width: 200px; color: #666; font-size: 0.85rem;">${order.returnReason || "N/A"}</td>
                <td><span class="badge badge-info">${refundMethodLabel}</span></td>
                <td style="font-weight: 700;">₹${order.total.toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="processReturn('${order._id}', 'approve')" class="btn btn-sm btn-success" style="background: #16a34a; color: white; padding: 0.4rem 0.8rem; border-radius: 6px;">Approve</button>
                        <button onclick="openRejectModal('${order._id}')" class="btn btn-sm btn-danger" style="background: #ef4444; color: white; padding: 0.4rem 0.8rem; border-radius: 6px;">Reject</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function updateStats(allOrders) {
    const pendingCount = allOrders.filter(o => o.returnStatus === "requested").length;
    
    // Simple mock stats for layout completeness
    const approvedToday = allOrders.filter(o => o.returnStatus === "approved").length;

    document.getElementById("pending-returns-count").textContent = pendingCount;
    document.getElementById("approved-today-count").textContent = approvedToday;
}

// ==============================
// PROCESS RETURN
// ==============================
window.processReturn = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this return?`)) return;

    try {
        const endpoint = action === "approve" ? "approve-return" : "reject-return";
        const res = await fetch(`${API_BASE}/api/orders/admin/${id}/${endpoint}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            alert(`Return ${action}d successfully. Refund triggered.`);
            fetchReturns();
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error("Process Return Error:", err);
    }
};

let currentRejectId = null;
window.openRejectModal = (id) => {
    currentRejectId = id;
    document.getElementById("rejectModal").style.display = "flex";
};

window.closeRejectModal = () => {
    document.getElementById("rejectModal").style.display = "none";
};

document.getElementById("confirm-reject-btn").onclick = async () => {
    const notes = document.getElementById("reject-reason").value;
    if (!notes) return alert("Please provide a reason for rejection.");

    try {
        const res = await fetch(`${API_BASE}/api/orders/admin/${currentRejectId}/reject-return`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ adminNotes: notes })
        });

        const data = await res.json();
        if (data.success) {
            alert("Return rejected.");
            closeRejectModal();
            fetchReturns();
        }
    } catch (err) {
        console.error("Reject Return Error:", err);
    }
};
