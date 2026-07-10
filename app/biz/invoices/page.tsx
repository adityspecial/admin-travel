'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { generateInvoicePDF } from '@/lib/invoicePDF'

const MONTHS_NOW = (() => {
  const now = new Date(); const m = now.getMonth(); const y = now.getFullYear()
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(y, m - i, 1)
    return { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, from: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }
  })
})()

const QTR_LABEL = (() => {
  const now = new Date(); const m = now.getMonth(); const y = now.getFullYear()
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const qm = Math.floor(m/3)*3
  return `QTR ${Math.floor(m/3)+1} - (${MONTHS[qm]}-${MONTHS[qm+2<12?qm+2:11]})`
})()

export default function InvoicesPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [gstin,     setGstin]     = useState('')
  const [orgName,   setOrgName]   = useState('')
  const [orgLogo,   setOrgLogo]   = useState('')
  const [search,    setSearch]    = useState('')
  const [automailer,setAutomailer]= useState(false)
  const [datePreset,setDatePreset]= useState('qtr')
  const [invoiceType, setInvoiceType] = useState<string[]>([])
  const [tripType,    setTripType]    = useState<string[]>([])
  const [folders, setFolders] = useState([{ id: 'qtr', label: `BDR :${QTR_LABEL}` }])

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/approvals?status=approved'),
      adminFetch('/api/admin/biz/identifiers'),
      adminFetch('/api/admin/biz/policy'),
    ])
      .then(([appData, idData, policyData]) => {
        setApprovals(appData.approvals ?? [])
        const ids: any[] = idData.identifiers ?? []
        const hq = ids.find((x: any) => x.is_hq) ?? ids[0] ?? null
        setGstin(hq?.number ?? '')
        setOrgName(policyData.policy?.name ?? '')
        setOrgLogo(policyData.policy?.logo_url ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const INVOICE_TYPES = ['MakeMyTrip Invoice', 'Vendor (GST) Invoice', 'E-ticket/Voucher']
  const TRIP_TYPES    = ['Flights', 'Hotels', 'Cabs', 'Bus', 'Train', 'Meals']

  const filtered = approvals.filter(a => {
    if (!a.booking_ref && !search) return true
    if (search) return (a.booking_ref ?? '').toLowerCase().includes(search.toLowerCase()) || (a.id ?? '').toLowerCase().includes(search.toLowerCase())
    if (tripType.length > 0) return tripType.map(t => t.toLowerCase()).includes(a.booking_type?.toLowerCase())
    return true
  })

  function CheckItem({ label, arr, setArr }: { label: string; arr: string[]; setArr: (v: string[]) => void }) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={arr.includes(label)} onChange={e => setArr(e.target.checked ? [...arr, label] : arr.filter(x => x !== label))} style={{ accentColor: '#E31E24' }} />
        <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      </label>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* Left sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '24px 20px', overflowY: 'auto', position: 'sticky', top: 54, height: 'calc(100vh - 54px)' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Booking Date Range</div>
          {MONTHS_NOW.map(p => (
            <label key={p.from} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name="bdr" checked={datePreset === p.label} onChange={() => setDatePreset(p.label)} style={{ accentColor: '#E31E24' }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{p.label}</span>
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
            <input type="radio" name="bdr" checked={datePreset === 'qtr'} onChange={() => setDatePreset('qtr')} style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{QTR_LABEL}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="radio" name="bdr" checked={datePreset === 'custom'} onChange={() => setDatePreset('custom')} style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>Enter Dates</span>
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>MMT Invoice Date Range</div>
          {MONTHS_NOW.map(p => (
            <label key={p.from} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name="mmt" style={{ accentColor: '#E31E24' }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{p.label}</span>
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
            <input type="radio" name="mmt" style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{QTR_LABEL}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="radio" name="mmt" style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>Enter Dates</span>
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Invoice Type</div>
          {INVOICE_TYPES.map(t => <CheckItem key={t} label={t} arr={invoiceType} setArr={setInvoiceType} />)}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Trip Type</div>
          {TRIP_TYPES.map(t => <CheckItem key={t} label={t} arr={tripType} setArr={setTripType} />)}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Invoices</h1>

        {/* Invoice Folders */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#9CA3AF', marginBottom: 4 }}>Invoice Folders</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Download folder of related invoices in a single go</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {folders.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                {f.label}
                <button onClick={() => setFolders(prev => prev.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Automailer toggle */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setAutomailer(a => !a)} style={{
              width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: automailer ? '#E31E24' : '#D1D5DB', position: 'relative', flexShrink: 0,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: automailer ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>Enable Automailer</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>- Turn on the option to receive emails for invoice downloading.</span>
          </div>
          <button style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Mailer Settings</button>
        </div>

        {/* Invoices table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Invoices</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={{ padding: '8px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#9CA3AF', fontWeight: 700, fontSize: 13, cursor: 'default' }}>
                Download Invoices
              </button>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Invoice no. or Booking ID"
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ width: 40, padding: '12px 16px' }}><input type="checkbox" /></th>
                {['BOOKING ID','ISSUER','INVOICES','BOOKETAL','TRAVEL ON','COMPANY GSTIN'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>No invoices found</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try removing some filters to see more results</div>
                    {datePreset && <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#F3F4F6', borderRadius: 99, fontSize: 13 }}>
                      {datePreset === 'qtr' ? `BDR :${QTR_LABEL}` : `BDR :${datePreset}`}
                      <button onClick={() => setDatePreset('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
                    </div>}
                  </td>
                </tr>
              ) : filtered.map(a => {
                const fd = a.flight_data
                const hd = a.hotel_data
                const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                const amount = a.amount ?? 0
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 16px' }}><input type="checkbox" /></td>
                    <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 700, color: '#2563EB' }}>
                      {a.booking_ref ?? a.id.slice(0, 14) + '…'}
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13 }}>{a.requester?.work_email ?? '—'}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <button
                        onClick={() => generateInvoicePDF(a, gstin, orgName, orgLogo)}
                        style={{
                          padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                          background: '#FEF2F2', color: '#E31E24', border: '1.5px solid #FECACA',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        📄 Create
                      </button>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                      {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#374151' }}>
                      {travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>
                      {gstin || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
