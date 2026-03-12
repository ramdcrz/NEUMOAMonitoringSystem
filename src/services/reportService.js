import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportMOAsToPDF = (moas) => {
  try {
    console.log("Exporting PDF for:", moas.length, "items");

    if (!moas || moas.length === 0) {
      alert("No MOA data available to export.");
      return;
    }

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Header Styling
    doc.setFontSize(20);
    doc.setTextColor(128, 0, 0); // NEU Maroon
    doc.text("NEW ERA UNIVERSITY", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Linkages and MOA Monitoring Report", 14, 28);
    doc.text(`Generated on: ${timestamp}`, 14, 34);

    // Data Preparation - only non-deleted items
    const tableData = moas
      .filter(m => !m.isDeleted)
      .map(m => [
        m.hteId || 'N/A',
        m.companyName || 'N/A',
        m.college || 'N/A',
        m.status || 'N/A',
        m.expiryDate || 'N/A'
      ]);

    // Generate Table
    autoTable(doc, {
      startY: 40,
      head: [['HTE ID', 'Partner Name', 'College', 'Status', 'Expiry Date']],
      body: tableData,
      headStyles: { 
        fillColor: [128, 0, 0], 
        fontSize: 10,
        halign: 'center' 
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
      },
      margin: { top: 40 },
    });

    // Save the File
    doc.save(`NEU_MOA_Report_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Failed to export PDF. Check console for details.");
  }
};