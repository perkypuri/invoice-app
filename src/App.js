import React, { useState } from "react";
import "./App.css";

const emptyInvoice = () => ({
  client: "",
  invoiceNo: "",
  date: "",
  items: [{ desc: "", qty: 1, price: 0 }]
});

export default function App() {
  const [invoices, setInvoices] = useState([emptyInvoice()]);

  // Add new invoice
  const addInvoice = () => setInvoices([...invoices, emptyInvoice()]);

  // Remove invoice
  const removeInvoice = (i) =>
    setInvoices(invoices.filter((_, index) => index !== i));

  // Update invoice fields
  const updateInvoice = (i, field, value) => {
    const updated = [...invoices];
    updated[i][field] = value;
    setInvoices(updated);
  };

  // Update item fields
  const updateItem = (invIndex, itemIndex, field, value) => {
    const updated = [...invoices];
    updated[invIndex].items[itemIndex][field] = value;
    setInvoices(updated);
  };

  // Add item to invoice
  const addItem = (i) => {
    const updated = [...invoices];
    updated[i].items.push({ desc: "", qty: 1, price: 0 });
    setInvoices(updated);
  };

  // Remove item
  const removeItem = (invIndex, itemIndex) => {
    const updated = [...invoices];
    updated[invIndex].items.splice(itemIndex, 1);
    setInvoices(updated);
  };

  // Calculate total
  const calcTotal = (items) =>
    items.reduce((sum, it) => sum + it.qty * it.price, 0);

  // Print all invoices
  const printAll = () => window.print();

  return (
    <div className="container">
      <h1>Bulk Invoice Handling System</h1>

      {invoices.map((inv, i) => (
        <div key={i} className="invoice">
          <h2>Invoice {i + 1}</h2>

          <input
            placeholder="Client Name"
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

          <h3>Items</h3>

          {inv.items.map((item, j) => (
            <div key={j} className="itemRow">
              <input
                placeholder="Description"
                value={item.desc}
                onChange={(e) =>
                  updateItem(i, j, "desc", e.target.value)
                }
              />

              <input
                type="number"
                value={item.qty}
                onChange={(e) =>
                  updateItem(i, j, "qty", +e.target.value)
                }
              />

              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateItem(i, j, "price", +e.target.value)
                }
              />

              <button onClick={() => removeItem(i, j)}>❌</button>
            </div>
          ))}

          <button onClick={() => addItem(i)}>+ Add Item</button>

          <h3>Total: ₹ {calcTotal(inv.items)}</h3>

          <button className="remove" onClick={() => removeInvoice(i)}>
            Remove Invoice
          </button>

          <hr />
        </div>
      ))}

      <button className="add" onClick={addInvoice}>
        + Add Another Invoice
      </button>

      <button className="print" onClick={printAll}>
        Print / Download All
      </button>
    </div>
  );
}
