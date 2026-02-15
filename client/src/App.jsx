import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState({
    docType: 'BILL',
    to: '',
    toAddress: '',
    date: new Date().toLocaleDateString('en-GB'),
    showQty: true,
    showPrice: true,
    showAmount: true,
    items: [
      { description: '', qty: '', price: '', amount: '' }
    ],
    subtotal: '',
    gstPercent: '',
    gst: '',
    advancePayment: '',
    paymentDone: '',
    paymentRemaining: '',
    finalAmount: '',
    terms: [
      'Payment 100% advance against invoice',
      'Delivery charges and GST extra as applicable',
      'Warranty one year from date of delivery'
    ]
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const totalItems = data.items.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    setData(prev => ({ ...prev, subtotal: totalItems > 0 ? totalItems.toString() : prev.subtotal }));
  }, [data.items]);

  useEffect(() => {
    const sub = parseFloat(data.subtotal) || 0;
    const perc = parseFloat(data.gstPercent) || 0;
    if (sub && perc) {
      const gstVal = (sub * (perc / 100)).toFixed(2);
      setData(prev => ({ ...prev, gst: gstVal }));
    }
  }, [data.subtotal, data.gstPercent]);

  useEffect(() => {
    const sub = parseFloat(data.subtotal) || 0;
    const g = parseFloat(data.gst) || 0;
    const adv = parseFloat(data.advancePayment) || 0;
    const done = parseFloat(data.paymentDone) || 0;

    const final = (sub + g).toFixed(2);
    const totalPaid = adv + done;
    const remaining = (sub + g - totalPaid).toFixed(2);

    setData(prev => ({
      ...prev,
      finalAmount: final !== "0.00" ? final : prev.finalAmount,
      paymentRemaining: data.paymentDone ? remaining : ''
    }));
  }, [data.subtotal, data.gst, data.advancePayment, data.paymentDone]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;

    if (field === 'qty' || field === 'price') {
      const qty = parseFloat(newItems[index].qty) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      if (qty && price) {
        newItems[index].amount = (qty * price).toString();
      }
    }

    setData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', qty: '', price: '', amount: '' }]
    }));
  };

  const removeItem = (index) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, items: newItems.length ? newItems : [{ description: '', qty: '', price: '', amount: '' }] }));
  };

  const handleTermChange = (index, value) => {
    const newTerms = [...data.terms];
    newTerms[index] = value;
    setData(prev => ({ ...prev, terms: newTerms }));
  };

  const addTerm = () => {
    setData(prev => ({ ...prev, terms: [...prev.terms, ''] }));
  };

  const removeTerm = (index) => {
    setData(prev => ({ ...prev, terms: prev.terms.filter((_, i) => i !== index) }));
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('PDF Generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPreview(true); // Auto-show on mobile
    } catch (error) {
      console.error(error);
      alert('Error generating PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;

    // Prompt for filename
    const defaultName = `${data.docType}_${data.to || 'document'}`;
    const fileName = prompt("Enter the name for your file:", defaultName);

    // Check if user cancelled or provided empty string
    if (fileName === null) return;

    const finalName = fileName.trim() || defaultName;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${finalName}.pdf`;
    link.click();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">📄</span>
          <h1>DocGen<span>RST</span></h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={generatePDF} disabled={loading}>
            {loading ? 'Processing...' : 'Generate PDF'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className={`editor-view ${showPreview ? 'hide-on-mobile' : ''}`}>
          <section className="glass-card">
            <h2 className="card-title">Document Info</h2>
            <div className="form-grid doc-info-grid">
              <div className="input-field">
                <label>Type</label>
                <select name="docType" value={data.docType} onChange={handleChange}>
                  <option value="BILL">BILL</option>
                  <option value="QUOTATION">QUOTATION</option>
                  <option value="CHALLAN">CHALLAN</option>
                </select>
              </div>
              <div className="input-field">
                <label>Date</label>
                <input name="date" value={data.date} onChange={handleChange} />
              </div>
              <div className="input-field full-width">
                <label>To</label>
                <input name="to" value={data.to} onChange={handleChange} placeholder="Dr. Vinay Kumar" />
              </div>
              <div className="input-field full-width">
                <label>Address / Hospital</label>
                <textarea name="toAddress" value={data.toAddress} onChange={handleChange} placeholder="AIIMS Patna, Bihar" rows="2" />
              </div>
            </div>
          </section>

          <section className="glass-card">
            <h2 className="card-title">Table Items</h2>
            <div className="visibility-toggles">
              <label className="toggle">
                <input type="checkbox" name="showQty" checked={data.showQty} onChange={handleChange} />
                <span>{data.showQty && '✓ '}Qty</span>
              </label>
              <label className="toggle">
                <input type="checkbox" name="showPrice" checked={data.showPrice} onChange={handleChange} />
                <span>{data.showPrice && '✓ '}Price</span>
              </label>
              <label className="toggle">
                <input type="checkbox" name="showAmount" checked={data.showAmount} onChange={handleChange} />
                <span>{data.showAmount && '✓ '}Amount</span>
              </label>
            </div>

            <div className="items-list">
              {data.items.map((item, index) => (
                <div key={index} className="item-row">
                  <button className="btn-icon-danger remove-item-btn" onClick={() => removeItem(index)}>×</button>
                  <div className="item-desc">
                    <input placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                  </div>
                  <div className="item-details">
                    {data.showQty && <input type="number" className="qty-input" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} />}
                    {data.showPrice && <input type="number" className="price-input" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />}
                    {data.showAmount && <input type="number" className="amount-input" placeholder="Amt" value={item.amount} onChange={(e) => handleItemChange(index, 'amount', e.target.value)} />}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline" onClick={addItem}>+ Add Item</button>
          </section>

          {/* Pricing & Summary */}
          <section className="glass-card">
            <h2 className="card-title">Summary</h2>
            <div className="form-grid">
              <div className="input-field">
                <label>Subtotal</label>
                <input name="subtotal" value={data.subtotal} onChange={handleChange} />
              </div>
              <div className="input-field">
                <label>GST %</label>
                <input name="gstPercent" value={data.gstPercent} onChange={handleChange} />
              </div>
              <div className="input-field">
                <label>GST Amount</label>
                <input name="gst" value={data.gst} onChange={handleChange} />
              </div>
              <div className="input-field">
                <label>Advance</label>
                <input name="advancePayment" value={data.advancePayment} onChange={handleChange} />
              </div>
              <div className="input-field">
                <label>Payment Done</label>
                <input name="paymentDone" value={data.paymentDone} onChange={handleChange} />
              </div>
              <div className="input-field">
                <label>Remaining Payment</label>
                <input name="paymentRemaining" value={data.paymentRemaining} onChange={handleChange} className="highlight" />
              </div>
              <div className="input-field">
                <label>Final Total</label>
                <input name="finalAmount" value={data.finalAmount} onChange={handleChange} className="highlight" />
              </div>
            </div>
          </section>

          {/* Terms */}
          <section className="glass-card">
            <h2 className="card-title">Terms & Conditions</h2>
            <div className="terms-list">
              {data.terms.map((term, index) => (
                <div key={index} className="term-row">
                  <input value={term} onChange={(e) => handleTermChange(index, e.target.value)} />
                  <button className="btn-icon-danger" onClick={() => removeTerm(index)}>×</button>
                </div>
              ))}
            </div>
            <button className="btn btn-outline" onClick={addTerm}>+ Add Term</button>
          </section>
        </div>

        {/* Preview View */}
        <div className={`preview-view ${!showPreview ? 'hide-on-mobile' : ''}`}>
          <div className="preview-header">
            <h3>Document Preview</h3>
            <div className="preview-btns">
              <button className="btn btn-secondary mobile-only" onClick={() => setShowPreview(false)}>Back</button>
              {pdfUrl && <button className="btn btn-primary" onClick={downloadPDF}>Download</button>}
            </div>
          </div>
          <div className="preview-content">
            {pdfUrl ? (
              <iframe src={pdfUrl} title="PDF Preview"></iframe>
            ) : (
              <div className="empty-preview">
                <div className="pulse-circle"></div>
                <p>Preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Toggle Button */}
      {pdfUrl && !showPreview && (
        <button className="fab-btn mobile-only" onClick={() => setShowPreview(true)}>
          👁️
        </button>
      )}
    </div>
  );
}

export default App;
