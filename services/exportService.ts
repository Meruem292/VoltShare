
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { BillRecord } from "../types";

// Using any for the document type to handle jspdf-autotable augmentation and core method accessibility
type jsPDFWithAutoTable = any;

export const exportService = {
  toPDF: (bill: BillRecord) => {
    // Cast to any (via type alias) to avoid property missing errors across the doc instance
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const title = `VoltShare Billing Statement - ${bill.month} ${bill.year}`;
    
    // Set font size and header text
    doc.setFontSize(20);
    doc.text("VoltShare Statement", 14, 22);
    
    // Configure metadata text styles and positions
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Property: ${bill.propertyName || 'Manual Entry'}`, 14, 32);
    doc.text(`Billing Period: ${bill.month} ${bill.year}`, 14, 37);
    doc.text(`Main Meter Reading: ${bill.mainMeterKwh.toFixed(2)} kWh`, 14, 42);
    doc.text(`Rate: P${bill.ratePerKwh.toFixed(2)}/kWh`, 14, 47);
    doc.text(`Total Discrepancy Shared: ${bill.missingKwh.toFixed(2)} kWh`, 14, 52);

    const tableRows = bill.rooms.map(room => [
      room.name,
      room.originalKwh.toFixed(2),
      (room.share * 100).toFixed(2) + "%",
      room.compensationKwh.toFixed(2),
      room.finalKwh.toFixed(2),
      "P" + room.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    // Use autoTable plugin to generate the breakdown table
    doc.autoTable({
      startY: 60,
      head: [['Room', 'Actual kWh', 'Share %', 'Loss Shared (kWh)', 'Total kWh', 'Total Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Access finalY from lastAutoTable property provided by the autotable plugin
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    const totalAmount = bill.rooms.reduce((s, r) => s + r.billAmount, 0);
    doc.text(`Total Property Bill: P${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, finalY);

    // Trigger download for the generated PDF
    doc.save(`VoltShare_Statement_${bill.month}_${bill.year}.pdf`);
  },

  toExcel: (bill: BillRecord) => {
    const data = bill.rooms.map(room => ({
      "Room": room.name,
      "Actual Consumption (kWh)": room.originalKwh,
      "Consumption Share (%)": (room.share * 100).toFixed(2),
      "Loss Shared (kWh)": room.compensationKwh,
      "Final Billed Consumption (kWh)": room.finalKwh,
      "Rate (P/kWh)": bill.ratePerKwh,
      "Total Bill (P)": room.billAmount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Billing Statement");

    // Add summary information rows to the Excel sheet
    XLSX.utils.sheet_add_aoa(ws, [
      [],
      ["Property", bill.propertyName || 'Manual Entry'],
      ["Billing Period", `${bill.month} ${bill.year}`],
      ["Main Meter Total", bill.mainMeterKwh],
      ["Total Submeter Sum", bill.totalSubmeterKwh],
      ["Missing kWh Distributed", bill.missingKwh],
      ["Grand Total Bill", bill.rooms.reduce((s, r) => s + r.billAmount, 0)]
    ], { origin: -1 });

    XLSX.writeFile(wb, `VoltShare_Statement_${bill.month}_${bill.year}.xlsx`);
  }
};
