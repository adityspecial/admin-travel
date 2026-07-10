'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { downloadExcel } from '@/lib/excel'
import { ReportTabs } from './ReportTabs'

interface ReportData {
  summary: { totalSpend: number; totalBookings: number; pendingCount: number; rejectedCount: number; avgBookingValue: number }
  gst: { totalWithGst: number; baseAmount: number; gstAmount: number; gstRate: string }
  byDept:       { dept: string; count: number; spend: number }[]
  byType:       { booking_type: string; count: number; spend: number }[]
  byEmployee:   { email: string; count: number; spend: number }[]
  byCostCenter: { name: string; code: string; count: number; spend: number }[]
  monthly:      { month: string; count: number; spend: number }[]
  dateRange:    { from: string; to: string }
}

function fmt(n: number) {
  if (n === 0) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`
  return `₹${n.toLocaleString('en-IN')}`
}

const now = new Date()
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getPresets() {
  const y = now.getFullYear()
  const m = now.getMonth()
  const presets: { label: string; from: string; to: string; id: string }[] = []
  // Last 3 months + current
  for (let i = 0; i <= 3; i++) {
    const d = new Date(y, m - i, 1)
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    const from  = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
    const lastDay = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()
    const to = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${lastDay}`
    presets.push({ label, from, to, id: label })
  }
  // Last quarter
  const qm = Math.floor(m / 3) * 3
  const qLabel = `QTR ${Math.floor(m/3)+1} (${MONTHS[qm]}-${MONTHS[qm+2 < 12 ? qm+2 : 11]})`
  presets.push({ label: qLabel, from: `${y}-${String(qm+1).padStart(2,'0')}-01`, to: now.toISOString().slice(0,10), id: 'qtr' })
  return presets
}

const REPORT_TYPES = [
  { key: 'flight',    label: 'Flight',    icon: '✈️' },
  { key: 'flightpnr', label: 'Flight PNR', icon: '🎫' },
  { key: 'hotel',    label: 'Hotel',     icon: '🏨' },
  { key: 'cab',      label: 'Cab',       icon: '🚕' },
  { key: 'bus',      label: 'Bus',       icon: '🚌' },
]

export default function ReportsPage() {
  const presets      = getPresets()
  const defaultPreset = presets.find(p => p.id === 'qtr') ?? presets[0]

  const [data,      setData]      = useState<ReportData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState('')
  const [from,      setFrom]      = useState(defaultPreset.from)
  const [to,        setTo]        = useState(defaultPreset.to)
  const [preset,    setPreset]    = useState(defaultPreset.id)
  const [customDate,setCustomDate]= useState(false)
  const [tab,       setTab]       = useState<'overview' | 'dept' | 'employee' | 'gst' | 'cost-center'>('overview')

  useEffect(() => { load() }, [from, to])

  function load() {
    setLoading(true); setLoadErr('')
    adminFetch(`/api/admin/biz/reports?from=${from}&to=${to}`)
      .then(setData)
      .catch((e: any) => setLoadErr(e.message ?? 'Failed to load report'))
      .finally(() => setLoading(false))
  }

  function selectPreset(p: { label: string; from: string; to: string; id: string }) {
    setPreset(p.id); setFrom(p.from); setTo(p.to); setCustomDate(false)
  }

  function getTypeCount(key: string) {
    if (key === 'flightpnr') key = 'flight'
    return data?.byType.find(t => t.booking_type === key)?.count ?? 0
  }
  function getTypeSpend(key: string) {
    if (key === 'flightpnr') key = 'flight'
    const spend = data?.byType.find(t => t.booking_type === key)?.spend ?? 0
    return spend
  }

  function handleExcelDownload() {
    if (!data) return
    const s = data.summary
    downloadExcel(`AirDunia-BizReport-${from}-to-${to}`, [
      { name: 'Summary', headers: ['Metric','Value'], rows: [
        ['Period',`${from} to ${to}`],['Total Spend (₹)',s.totalSpend],['Total Bookings',s.totalBookings],
        ['Avg Booking Value (₹)',s.avgBookingValue],['Pending Approvals',s.pendingCount],['Rejected',s.rejectedCount],
      ]},
      { name: 'By Type', headers: ['Type','Bookings','Spend (₹)'], rows: data.byType.map(t => [t.booking_type, t.count, t.spend]) },
      { name: 'By Department', headers: ['Dept','Bookings','Spend (₹)'], rows: data.byDept.map(d => [d.dept??'Unassigned', d.count, d.spend]) },
      { name: 'By Employee', headers: ['Email','Bookings','Spend (₹)'], rows: data.byEmployee.map(e => [e.email, e.count, e.spend]) },
    ])
  }

  const currentLabel = presets.find(p => p.id === preset)?.label ?? 'Custom'

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* Left sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '24px 20px', overflowY: 'auto', position: 'sticky', top: 54, height: 'calc(100vh - 54px)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: 16 }}>ACTION DATE RANGE</div>
        {presets.map(p => (
          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
            <input type="radio" name="period" checked={preset === p.id && !customDate} onChange={() => selectPreset(p)} style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{p.label}</span>
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
          <input type="radio" name="period" checked={customDate} onChange={() => setCustomDate(true)} style={{ accentColor: '#E31E24' }} />
          <span style={{ fontSize: 13, color: '#374151' }}>Enter Dates</span>
        </label>
        {customDate && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }} />
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }} />
          </div>
        )}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Reports</h1>

        {/* Create & Schedule Custom Reports */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>Create &amp; Schedule Custom Reports</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: 16 }}>
            {/* Create New */}
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: 10, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#E31E24')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #E31E24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#E31E24', marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#E31E24' }}>CREATE NEW</div>
            </div>
            {/* What is custom report */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E31E24', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>?</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>What is a custom report?</div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#6B7280', lineHeight: 1.8 }}>
                <li>Reports are data heavy files with range of data sets.</li>
                <li>We provide you the flexibility to <strong>select your required data</strong> for <span style={{ color: '#2563EB' }}>effective data handling.</span></li>
              </ul>
            </div>
            {/* How to create */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E31E24', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>+</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>How to create Your custom report?</div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#6B7280', lineHeight: 1.8 }}>
                <li>Click on <strong>"Create new"</strong> to get a form.</li>
                <li>Fill the form by providing the report type, frequency &amp; required data. <strong>We will timely mail you your Report!</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Report Summary</span>
              <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 8 }}>({currentLabel})</span>
            </div>
            <button onClick={handleExcelDownload} disabled={!data} style={{
              padding: '8px 18px', border: '1.5px solid #E31E24', color: '#E31E24',
              background: 'transparent', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: data ? 'pointer' : 'default',
              opacity: data ? 1 : 0.4,
            }}>DOWNLOAD ALL</button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
          ) : loadErr ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontSize: 13 }}>
              Failed to load report: {loadErr}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}></th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>TOTAL BOOKINGS</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>TOTAL SPEND</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>OUT OF POLICY BOOKINGS (%)</th>
                  <th style={{ width: 48, padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {REPORT_TYPES.map(rt => (
                  <tr key={rt.key} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>{rt.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{rt.label}</span>
                    </td>
                    <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 700 }}>{getTypeCount(rt.key)}</td>
                    <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 700 }}>{fmt(getTypeSpend(rt.key))}</td>
                    <td style={{ padding: '16px 16px', fontSize: 14, color: '#6B7280' }}>0.0%</td>
                    <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                      <button onClick={handleExcelDownload} disabled={!data} title="Download" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E31E24', fontSize: 16 }}>↓</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ReportTabs data={data} tab={tab} setTab={setTab} loading={loading} />
      </div>
    </div>
  )
}
