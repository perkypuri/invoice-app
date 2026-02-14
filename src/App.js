import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

const emptyInvoice = () => ({
  client: "",
  invoiceNo: "",
  date: "",
  gst: 18,
  items: [{ desc: "", qty: 1, price: 0 }]
});

export default function App() {
  // ---------------- LOAD FROM LOCAL STORAGE ----------------
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem("invoices");
    return saved ? JSON.parse(saved) : [emptyInvoice()];
  });

  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }, [invoices]);

  // ---------------- INVOICE HANDLING ----------------
  const addInvoice = () => setInvoices([...invoices, emptyInvoice()]);
  const removeInvoice = (i) =>
    setInvoices(invoices.filter((_, idx) => idx !== i));

  const updateInvoice = (i, field, value) => {
    const updated = [...invoices];
    updated[i][field] = value;
    setInvoices(updated);
  };

  const updateItem = (i, j, field, value) => {
    const updated = [...invoices];
    updated[i].items[j][field] = value;
    setInvoices(updated);
  };

  const addItem = (i) => {
    const updated = [...invoices];
    updated[i].items.push({ desc: "", qty: 1, price: 0 });
    setInvoices(updated);
  };

  const removeItem = (i, j) => {
    const updated = [...invoices];
    updated[i].items.splice(j, 1);
    setInvoices(updated);
  };

  // ---------------- CALCULATIONS ----------------
  const subtotal = (items) =>
    items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const gstAmount = (inv) => subtotal(inv.items) * (inv.gst / 100);
  const grandTotal = (inv) => subtotal(inv.items) + gstAmount(inv);

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + grandTotal(inv),
    0
  );

  // ---------------- EXCEL UPLOAD ----------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      generateInvoicesFromExcel(rows);
    };

    reader.readAsArrayBuffer(file);
  };

  const generateInvoicesFromExcel = (rows) => {
    const grouped = {};

    rows.forEach((row) => {
      const key = row.InvoiceNo;

      if (!grouped[key]) {
        grouped[key] = {
          client: row.Client,
          invoiceNo: row.InvoiceNo,
          date: row.Date,
          gst: 18,
          items: []
        };
      }

      grouped[key].items.push({
        desc: row.Description,
        qty: Number(row.Qty),
        price: Number(row.Price)
      });
    });

    setInvoices(Object.values(grouped));
  };

  // ---------------- PROFESSIONAL PDF EXPORT ----------------
  const downloadAllPDF = () => {
    const pdf = new jsPDF();

    invoices.forEach((inv, index) => {
      if (index !== 0) pdf.addPage();

      pdf.setFontSize(16);
      pdf.text("INVOICE", 14, 15);

      pdf.setFontSize(11);
      pdf.text(`Client: ${inv.client}`, 14, 25);
      pdf.text(`Invoice No: ${inv.invoiceNo}`, 14, 32);
      pdf.text(`Date: ${inv.date}`, 14, 39);
      pdf.text(`GST: ${inv.gst}%`, 14, 46);

      const tableData = inv.items.map((item) => [
        item.desc,
        item.qty,
        item.price.toFixed(2),
        (item.qty * item.price).toFixed(2)
      ]);

      autoTable(pdf, {
        startY: 55,
        head: [["Description", "Qty", "Price", "Total"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10 }
      });

      const finalY = pdf.lastAutoTable.finalY + 10;

      pdf.text(`Subtotal: ₹ ${subtotal(inv.items).toFixed(2)}`, 140, finalY);
      pdf.text(`GST: ₹ ${gstAmount(inv).toFixed(2)}`, 140, finalY + 7);

      pdf.setFontSize(13);
      pdf.text(
        `Grand Total: ₹ ${grandTotal(inv).toFixed(2)}`,
        140,
        finalY + 16
      );
    });

    pdf.save("All_Invoices.pdf");
  };

  // ---------------- UI ----------------
  return (
    <div className="container">
      <h1>Bulk Invoice Handling System</h1>

      <div className="dashboard">
        <div>Total Invoices: {invoices.length}</div>
        <div>Total Revenue: ₹ {totalRevenue.toFixed(2)}</div>
      </div>

      <div className="uploadBox">
        <label>Upload Excel:</label>
        <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} />
      </div>

      {invoices.map((inv, i) => (
        <div key={i} className="invoice">
          <input
            placeholder="Client"
            value={inv.client}
            onChange={(e) => updateInvoice(i, "client", e.target.value)}
          />

          <input
            placeholder="Invoice Number"
            value={inv.invoiceNo}
            onChange={(e) => updateInvoice(i, "invoiceNo", e.target.value)}
          />

          <input
            type="date"
            value={inv.date}
            onChange={(e) => updateInvoice(i, "date", e.target.value)}
          />

          <label>GST %</label>
          <select
            value={inv.gst}
            onChange={(e) => updateInvoice(i, "gst", +e.target.value)}
          >
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>

          {inv.items.map((item, j) => (
            <div key={j} className="itemRow">
              <input
                placeholder="Description"
                value={item.desc}
                onChange={(e) => updateItem(i, j, "desc", e.target.value)}
              />
              <input
                type="number"
                value={item.qty}
                onChange={(e) => updateItem(i, j, "qty", +e.target.value)}
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(i, j, "price", +e.target.value)}
              />
              <button onClick={() => removeItem(i, j)}>❌</button>
            </div>
          ))}

          <button onClick={() => addItem(i)}>+ Add Item</button>

          <h3>Subtotal: ₹ {subtotal(inv.items).toFixed(2)}</h3>
          <h3>GST: ₹ {gstAmount(inv).toFixed(2)}</h3>
          <h2>Grand Total: ₹ {grandTotal(inv).toFixed(2)}</h2>
        </div>
      ))}

      <button className="downloadAll" onClick={downloadAllPDF}>
        Download All Invoices
      </button>

      <button className="add" onClick={addInvoice}>
        + Add Invoice
      </button>
    </div>
  );
}
