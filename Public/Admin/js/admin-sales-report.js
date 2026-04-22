document.addEventListener('DOMContentLoaded', () => {
    const API = window.API_BASE_URL;
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

    // Elements
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const reportTypeSelect = document.getElementById('reportType');
    const dateRangePreset = document.getElementById('dateRangePreset');
    const generateBtn = document.getElementById('generateReport');
    
    const totalSalesEl = document.getElementById('totalSales');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalDiscountEl = document.getElementById('totalDiscount');
    const tableBody = document.getElementById('reportTableBody');

    const downloadPDFBtn = document.getElementById('downloadPDF');
    const downloadExcelBtn = document.getElementById('downloadExcel');

    let currentReportData = [];
    let currentSummary = null;

    // 1. Handle Date Range Presets
    function setDateRange() {
        const preset = dateRangePreset.value;
        const now = new Date();
        let start, end;
        
        startDateInput.disabled = true;
        endDateInput.disabled = true;

        if (preset === 'Custom') {
            startDateInput.disabled = false;
            endDateInput.disabled = false;
            return; // Keep existing values or allow manual entry
        } else if (preset === 'Today') {
            start = new Date();
            end = new Date();
        } else if (preset === 'Last7Days') {
            start = new Date();
            start.setDate(now.getDate() - 7);
            end = new Date();
        } else if (preset === 'Last30Days') {
            start = new Date();
            start.setDate(now.getDate() - 30);
            end = new Date();
        } else if (preset === 'ThisYear') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date();
        }

        if (start && end) {
            // Adjust to local timezone format (YYYY-MM-DD)
            startDateInput.value = new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            endDateInput.value = new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        }
    }

    dateRangePreset.addEventListener('change', () => {
        setDateRange();
        // Automatically fetch report if not custom
        if (dateRangePreset.value !== 'Custom') {
            fetchSalesReport();
        }
    });

    reportTypeSelect.addEventListener('change', () => {
        fetchSalesReport();
    });

    // Initialize default range
    setDateRange();

    // 2. Fetch Data
    async function fetchSalesReport() {
        const start = startDateInput.value;
        const end = endDateInput.value;
        const type = reportTypeSelect.value;

        try {
            const url = `${API}/api/admin/sales-report?startDate=${start}&endDate=${end}&reportType=${type}`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                currentReportData = data.reportData;
                currentSummary = data.summary;
                renderReport();
            } else {
                alert(data.message || "Failed to fetch report");
            }
        } catch (err) {
            console.error("Error fetching sales report:", err);
            alert("An error occurred while fetching the report.");
        }
    }

    // 3. Render Report to UI
    function renderReport() {
        // Update Summary Cards
        totalSalesEl.textContent = `₹${currentSummary.totalNet.toLocaleString()}`;
        totalOrdersEl.textContent = currentSummary.totalOrders.toLocaleString();
        totalDiscountEl.textContent = `₹${currentSummary.totalDiscount.toLocaleString()}`;

        // Update Table
        tableBody.innerHTML = currentReportData.map(row => `
            <tr>
                <td>${formatDate(row._id, reportTypeSelect.value)}</td>
                <td>${row.ordersCount}</td>
                <td>₹${row.grossSales.toLocaleString()}</td>
                <td>₹${row.discounts.toLocaleString()}</td>
                <td><strong>₹${row.netSales.toLocaleString()}</strong></td>
            </tr>
        `).join("");
    }

    function formatDate(dateStr, type) {
        const date = new Date(dateStr);
        if (type === "Monthly") {
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (type === "Yearly") {
            return date.getFullYear().toString();
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // 4. Export to PDF
    function exportToPDF() {
        if (!currentReportData.length) return alert("No data to export");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("DRIPMEN - Sales Report", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${startDateInput.value} to ${endDateInput.value}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

        // Summary Boxes
        doc.setDrawColor(200);
        doc.line(14, 40, 196, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Orders: ${currentSummary.totalOrders}`, 14, 50);
        doc.text(`Total Gross: ₹${currentSummary.totalGross.toLocaleString()}`, 70, 50);
        doc.text(`Total Discount: ₹${currentSummary.totalDiscount.toLocaleString()}`, 130, 50);
        doc.setFont(undefined, 'bold');
        doc.text(`Net Revenue: ₹${currentSummary.totalNet.toLocaleString()}`, 14, 60);
        doc.setFont(undefined, 'normal');

        // Table
        const tableData = currentReportData.map(row => [
            formatDate(row._id, reportTypeSelect.value),
            row.ordersCount,
            `₹${row.grossSales.toLocaleString()}`,
            `₹${row.discounts.toLocaleString()}`,
            `₹${row.netSales.toLocaleString()}`
        ]);

        doc.autoTable({
            startY: 70,
            head: [['Date', 'Orders', 'Gross Sales', 'Discounts', 'Net Sales']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`DripMen_Sales_Report_${new Date().getTime()}.pdf`);
    }

    // 5. Export to Excel
    function exportToExcel() {
        if (!currentReportData.length) return alert("No data to export");

        const summaryData = [
            ["Category", "Value"],
            ["Total Orders", currentSummary.totalOrders],
            ["Total Gross Sales", currentSummary.totalGross],
            ["Total Discounts", currentSummary.totalDiscount],
            ["Total Net Revenue", currentSummary.totalNet],
            [], // Empty row
            ["Date", "Orders", "Gross Sales", "Discounts", "Net Sales"]
        ];

        const rowData = currentReportData.map(row => [
            formatDate(row._id, reportTypeSelect.value),
            row.ordersCount,
            row.grossSales,
            row.discounts,
            row.netSales
        ]);

        const fullData = [...summaryData, ...rowData];
        const ws = XLSX.utils.aoa_to_sheet(fullData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

        XLSX.writeFile(wb, `DripMen_Sales_Report_${new Date().getTime()}.xlsx`);
    }

    // Event Listeners
    generateBtn.addEventListener('click', fetchSalesReport);
    downloadPDFBtn.addEventListener('click', exportToPDF);
    downloadExcelBtn.addEventListener('click', exportToExcel);

    // Initial Load
    fetchSalesReport();
});
