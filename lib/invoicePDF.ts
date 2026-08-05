export function generateInvoicePDF(approval: any, orgGstin: string, orgName?: string, orgLogo?: string) {
  const fd = approval.flight_data
  const hd = approval.hotel_data
  const amount      = approval.amount ?? 0
  const base        = Math.round(amount / 1.18)
  const gst         = amount - base
  const invoiceNum  = `INV-${approval.id.slice(0, 8).toUpperCase()}`
  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const travelDate  = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
  const travelFmt   = travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const traveler    = approval.requester?.work_email ?? '—'
  const approver    = approval.reviewer?.work_email ?? '—'
  const dept        = approval.dept ?? ''
  const purpose     = approval.purpose ?? approval.notes ?? ''

  // Trip description
  let tripDesc = ''
  let tripDetail = ''
  if (fd) {
    const from    = fd.from    || fd.origin      || ''
    const to      = fd.to      || fd.destination || ''
    const airline = fd.airline || ''
    const cls     = fd.class   || fd.cabin_class  || ''
    tripDesc   = `${from} → ${to} Flight`
    tripDetail = [airline, cls, travelFmt].filter(Boolean).join(' · ')
  } else if (hd) {
    const name = hd.hotelName || hd.hotel_name || 'Hotel'
    const city = hd.city || ''
    tripDesc   = `${name}${city ? ', ' + city : ''}`
    tripDetail = `Check-in: ${travelFmt}`
  } else {
    tripDesc   = approval.booking_type === 'flight' ? 'Flight Booking' : (approval.booking_type ?? 'Booking')
    tripDetail = travelFmt
  }

  const fmtAmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  // Amount in words (simple, up to lakhs)
  function amountInWords(n: number): string {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
      'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
    if (n === 0) return 'Zero'
    function below100(x: number) {
      if (x < 20) return ones[x]
      return tens[Math.floor(x/10)] + (x%10 ? ' ' + ones[x%10] : '')
    }
    function below1000(x: number) {
      if (x < 100) return below100(x)
      return ones[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' ' + below100(x%100) : '')
    }
    const parts: string[] = []
    if (n >= 100000) { parts.push(below1000(Math.floor(n/100000)) + ' Lakh'); n %= 100000 }
    if (n >= 1000)   { parts.push(below1000(Math.floor(n/1000))   + ' Thousand'); n %= 1000 }
    if (n > 0)       { parts.push(below1000(n)) }
    return parts.join(' ') + ' Rupees Only'
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${invoiceNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; background:#fff; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
  .page { max-width: 780px; margin: 0 auto; padding: 40px; }

  /* Header */
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom:3px solid #E31E24; }
  .logo-wrap { display:flex; align-items:center; gap:6px; }
  .logo-my { background:#E31E24; color:#fff; font-weight: 700; font-size:16px; padding:3px 8px; border-radius:4px; }
  .logo-biz { font-weight: 700; font-size:22px; color:#1a1a2e; }
  .logo-dot { color:#E31E24; font-weight: 700; font-size:22px; }
  .logo-admin { font-weight:700; font-size:22px; color:#1a1a2e; }
  .logo-sub { font-size:11px; color:#9CA3AF; margin-top:4px; }
  .invoice-title { text-align:right; }
  .invoice-title h1 { font-size:28px; font-weight: 700; color:#E31E24; letter-spacing:-0.5px; }
  .invoice-title .inv-num { font-size:13px; color:#6B7280; margin-top:4px; }
  .invoice-title .inv-date { font-size:13px; color:#374151; font-weight:600; }

  /* Info row */
  .info-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin:24px 0; }
  .info-box { }
  .info-box h3 { font-size:10px; font-weight:800; color:#9CA3AF; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px; }
  .info-box p { font-size:13px; color:#374151; line-height:1.7; }
  .info-box .highlight { font-weight:700; color:#1a1a2e; }

  /* Status badge */
  .badge { display:inline-block; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:800; letter-spacing:0.06em; }
  .badge-approved { background:#D1FAE5; color:#065F46; }

  /* Table */
  .section-title { font-size:11px; font-weight:800; color:#9CA3AF; letter-spacing:0.08em; text-transform:uppercase; margin:24px 0 10px; }
  table.items { width:100%; border-collapse:collapse; }
  table.items thead tr { background:#1a1a2e; }
  table.items thead th { padding:10px 14px; font-size:11px; font-weight:700; color:#fff; text-align:left; letter-spacing:0.04em; }
  table.items tbody tr { border-bottom:1px solid #F3F4F6; }
  table.items tbody tr:nth-child(even) { background:#F9FAFB; }
  table.items tbody td { padding:14px; font-size:13px; color:#374151; vertical-align:top; }
  table.items tfoot td { padding:10px 14px; font-size:13px; }

  /* Totals */
  .totals { margin-top:20px; display:flex; justify-content:flex-end; }
  .totals-box { width:280px; }
  .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#374151; border-bottom:1px solid #F3F4F6; }
  .totals-row.total { border-top:2px solid #1a1a2e; border-bottom:none; padding-top:10px; margin-top:4px; font-size:16px; font-weight: 700; color:#1a1a2e; }
  .totals-row .lbl { color:#6B7280; }

  /* Words */
  .amount-words { margin-top:16px; padding:12px 16px; background:#FEF2F2; border-left:3px solid #E31E24; border-radius:0 6px 6px 0; font-size:12px; color:#374151; }
  .amount-words strong { color:#E31E24; }

  /* Meta */
  .meta-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin:24px 0; padding:18px; background:#F9FAFB; border-radius:8px; }
  .meta-item h4 { font-size:10px; font-weight:800; color:#9CA3AF; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:4px; }
  .meta-item p { font-size:13px; color:#374151; }

  /* Footer */
  .footer { margin-top:40px; padding-top:20px; border-top:1px solid #E5E7EB; display:flex; justify-content:space-between; align-items:flex-end; }
  .footer-left { font-size:11px; color:#9CA3AF; line-height:1.8; }
  .footer-right { text-align:right; font-size:11px; color:#9CA3AF; }
  .print-btn { position:fixed; bottom:24px; right:24px; padding:12px 24px; background:#E31E24; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(227,30,36,0.4); }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      ${orgLogo
        ? `<img src="${orgLogo}" alt="Company Logo" style="height:56px;max-width:180px;object-fit:contain;margin-bottom:6px;display:block;" />`
        : `<div class="logo-wrap">
            <span class="logo-my">my</span>
            <span class="logo-biz">Biz</span>
            <span class="logo-dot"> .</span>
            <span class="logo-admin">Admin</span>
          </div>`
      }
      <div class="logo-sub">${orgName ?? 'AirDunia Travel Technology Pvt. Ltd.'}</div>
    </div>
    <div class="invoice-title">
      <h1>TAX INVOICE</h1>
      <div class="inv-num">${invoiceNum}</div>
      <div class="inv-date">${invoiceDate}</div>
    </div>
  </div>

  <!-- Bill from / Bill to -->
  <div class="info-row">
    <div class="info-box">
      <h3>From</h3>
      <p>
        <span class="highlight">${orgName ?? 'AirDunia Travel Technology Pvt. Ltd.'}</span><br/>
        ${orgGstin ? `GSTIN: ${orgGstin}<br/>` : ''}
        Powered by AirDunia Corporate
      </p>
    </div>
    <div class="info-box">
      <h3>Bill To</h3>
      <p>
        <span class="highlight">${traveler}</span><br/>
        ${dept ? `Dept: ${dept}<br/>` : ''}
        ${orgGstin ? `GSTIN: <span class="highlight" style="font-family:monospace">${orgGstin}</span>` : 'GSTIN: Not provided'}
      </p>
    </div>
  </div>

  <!-- Trip details table -->
  <div class="section-title">Trip Details</div>
  <table class="items">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN/SAC</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>${tripDesc}</strong><br/>
          <span style="font-size:12px; color:#9CA3AF">${tripDetail}</span>
        </td>
        <td style="color:#9CA3AF">9964</td>
        <td style="text-align:right">${fmtAmt(base)}</td>
        <td style="text-align:right; font-weight:700">${fmtAmt(base)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span class="lbl">Sub-total</span><span>${fmtAmt(base)}</span></div>
      <div class="totals-row"><span class="lbl">IGST @ 18%</span><span>${fmtAmt(gst)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${fmtAmt(amount)}</span></div>
    </div>
  </div>

  <!-- Amount in words -->
  <div class="amount-words">
    <strong>Amount in words:</strong> ${amountInWords(amount)}
  </div>

  <!-- Meta -->
  <div class="meta-row">
    <div class="meta-item"><h4>Booking Reference</h4><p style="font-family:monospace">${approval.booking_ref ?? approval.id.slice(0,16) + '…'}</p></div>
    <div class="meta-item"><h4>Status</h4><p><span class="badge badge-approved">APPROVED</span></p></div>
    <div class="meta-item"><h4>Approved By</h4><p>${approver}</p></div>
    ${purpose ? `<div class="meta-item"><h4>Purpose</h4><p>${purpose}</p></div>` : ''}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      This is a computer-generated invoice. No signature required.<br/>
      HSN/SAC 9964 — Passenger Transport Services<br/>
      For queries: support@airdunia.com
    </div>
    <div class="footer-right">
      Generated by AirDunia Corporate<br/>
      ${invoiceDate}
    </div>
  </div>

</div>

<button class="print-btn no-print" onclick="window.print()">⬇ Download PDF</button>

<script>
  // Auto-open print dialog after a short delay for rendering
  setTimeout(() => window.print(), 600)
</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
