const API_BASE = window.API_BASE_URL;
const token = localStorage.getItem("adminToken");

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    fetchReturns();
});

// ==============================
// FETCH ALL ORDERS AND FILTER FOR ITEM-LEVEL RETURNS
// ==============================
async function fetchReturns() {
    const tbody = document.getElementById("returns-table-body");
    try {
        const res = await fetch(`${API_BASE}/api/orders/admin/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 401 || res.status === 403) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #ef4444;">Admin Access Denied.</td></tr>`;
            return;
        }

        const data = await res.json();

        if (data.success) {
            // Flatten orders into items that have return requests
            const returnRequests = [];
            data.orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.returnStatus === "requested") {
                        // Calculate expected refund
                        let expectedRefund = item.price * item.quantity;
                        const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
                        
                        if (activeItems.length === 1) {
                            expectedRefund = order.total;
                        } else if (order.discount > 0 && order.subtotal > 0) {
                            const proportion = (item.price * item.quantity) / order.subtotal;
                            expectedRefund -= (order.discount * proportion);
                        }

                        returnRequests.push({
                            orderId: order._id,
                            customer: order.user?.name || "Unknown",
                            productId: item.product,
                            name: item.name,
                            size: item.size,
                            price: item.price,
                            qty: item.quantity,
                            expectedRefund: Math.max(0, expectedRefund),
                            reason: item.returnReason || "N/A",
                            refundMethod: order.refundMethod
                        });
                    }
                });
            });
            
            renderReturns(returnRequests);
            // Stats (could be improved)
            document.getElementById("pending-returns-count").textContent = returnRequests.length;
        }
    } catch (err) {
        console.error("Fetch Returns Error:", err);
    }
}

// ==============================
// RENDER UI
// ==============================
function renderReturns(requests) {
    const tbody = document.getElementById("returns-table-body");
    tbody.innerHTML = "";

    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #888;">No pending item returns.</td></tr>`;
        return;
    }

    requests.forEach(req => {
        const shortId = "#ORD-" + req.orderId.slice(-6).toUpperCase();
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="font-weight: 700;">${shortId}</td>
                <td>
                    <div style="font-weight: 600;">${req.name}</div>
                    <div style="font-size: 0.75rem; color: #666;">Size: ${req.size} | Qty: ${req.qty}</div>
                </td>
                <td>${req.customer}</td>
                <td style="max-width: 200px; color: #666; font-size: 0.85rem;">${req.reason}</td>
                <td style="font-weight: 700;">₹${req.expectedRefund.toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="approveItemReturn('${req.orderId}', '${req.productId}', '${req.size}')" class="btn btn-sm" style="background: #16a34a; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Approve</button>
                        <button onclick="rejectItemReturn('${req.orderId}', '${req.productId}', '${req.size}')" class="btn btn-sm" style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Reject</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// ==============================
// PROCESS ACTIONS
// ==============================
window.approveItemReturn = async (orderId, productId, size) => {
    if (!confirm("Are you sure you want to APPROVE this return? Refund will be sent to user wallet.")) return;

    try {
        const res = await fetch(`${API_BASE}/api/orders/admin/approve-return-item`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ orderId, productId, size })
        });

        const data = await res.json();
        if (data.success) {
            alert(`Return approved. Refund processed.`);
            fetchReturns();
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error("Approve Return Error:", err);
    }
};

window.rejectItemReturn = async (orderId, productId, size) => {
    const notes = prompt("Reason for rejection:");
    if (!notes) return;

    try {
        const res = await fetch(`${API_BASE}/api/orders/admin/reject-return-item`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ orderId, productId, size, adminNotes: notes })
        });

        const data = await res.json();
        if (data.success) {
            alert("Return request rejected.");
            fetchReturns();
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error("Reject Return Error:", err);
    }
};
