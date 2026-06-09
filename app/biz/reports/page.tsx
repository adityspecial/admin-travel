'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { downloadExcel } from '@/lib/excel'

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

function fmt(paise: number) {
  if (paise === 0) return '₹0'
  const rs = paise / 100
  if (rs >= 100000) return `₹${(rs / 100000).toFixed(1)}L`
  if (rs >= 1000)   return `₹${(rs / 1000).toFixed(1)}k`
  return `₹${rs.toLocaleString('en-IN')}`
}

function pct(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

const TYPE_COLORS: Record<string, string> = {
  flight: '#2563eb', hotel: '#0d9488', bus: '#f97316', package: '#7c3aed'
}

export default function ReportsPage() {
  const thisYear  = new Date().getFullYear()
  const [data, setData]     = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom]     = useState(`${thisYear}-01-01`)
  const [to, setTo]         = useState(new Date().toISOString().slice(0, 10))
  const [tab, setTab]       = useState<'overview' | 'dept' | 'employee' | 'gst' | 'cost-center'>('overview')

  useEffect(() => { load() }, [from, to])

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/biz/reports?from=${from}&to=${to}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const s = data?.summary
  const g = data?.gst

  function handleExcelDownload() {
    if (!data || !s || !g) return
    const rs = (paise: number) => paise / 100

    downloadExcel(`AirDunia-BizReport-${from}-to-${to}`, [
      {
        name: 'Summary',
        headers: ['Metric', 'Value'],
        rows: [
          ['Period', `${from} to ${to}`],
          ['Total Spend (₹)', rs(s.totalSpend)],
          ['Total Bookings', s.totalBookings],
          ['Avg Booking Value (₹)', rs(s.avgBookingValue)],
          ['Pending Approvals', s.pendingCount],
          ['Rejected', s.rejectedCount],
          ['Base Amount excl. GST (₹)', rs(g.baseAmount)],
          ['GST Amount 18% (₹)', rs(g.gstAmount)],
          ['Total incl. GST (₹)', rs(g.totalWithGst)],
        ],
      },
      {
        name: 'Monthly Trend',
        headers: ['Month', 'Bookings', 'Spend (₹)'],
        rows: data.monthly.map(m => [m.month, m.count, rs(m.spend)]),
      },
      {
        name: 'By Department',
        headers: ['Department', 'Bookings', 'Spend (₹)', 'Share %'],
        rows: data.byDept.map(d => [
          d.dept ?? 'Unassigned', d.count, rs(d.spend),
          s.totalSpend > 0 ? +((d.spend / s.totalSpend) * 100).toFixed(1) : 0,
        ]),
      },
      {
        name: 'By Employee',
        headers: ['Employee Email', 'Bookings', 'Spend (₹)', 'Avg per Trip (₹)'],
        rows: data.byEmployee.map(e => [e.email, e.count, rs(e.spend), rs(Math.round(e.spend / e.count))]),
      },
      {
        name: 'By Booking Type',
        headers: ['Type', 'Bookings', 'Spend (₹)', 'GST (₹)', 'Base (₹)'],
        rows: data.byType.map(t => {
          const base = Math.round(t.spend / 1.18)
          return [t.booking_type, t.count, rs(t.spend), rs(t.spend - base), rs(base)]
        }),
      },
      {
        name: 'Cost Centers',
        headers: ['Code', 'Name', 'Bookings', 'Spend (₹)', 'Share %'],
        rows: data.byCostCenter.map(c => [
          c.code, c.name, c.count, rs(c.spend),
          s.totalSpend > 0 ? +((c.spend / s.totalSpend) * 100).toFixed(1) : 0,
        ]),
      },
      {
        name: 'GST Summary',
        headers: ['Type', 'Bookings', 'Total incl. GST (₹)', 'Base excl. GST (₹)', 'GST 18% (₹)'],
        rows: [
          ...data.byType.map(t => {
            const base = Math.round(t.spend / 1.18)
            return [t.booking_type, t.count, rs(t.spend), rs(base), rs(t.spend - base)]
          }),
          ['TOTAL', s.totalBookings, rs(g.totalWithGst), rs(g.baseAmount), rs(g.gstAmount)],
        ],
      },
    ])
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Reports</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="date" className="toolbar-search" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>to</span>
          <input type="date" className="toolbar-search" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          {data && (
            <button className="btn btn-primary btn-sm" onClick={handleExcelDownload}>
              ⬇ Download Excel
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        <div className="page-stack">

          {/* Summary stat cards */}
          {s && (
            <div className="stat-grid">
              {[
                { label: 'Total Spend',     value: fmt(s.totalSpend),     sub: `${s.totalBookings} bookings`, icon: '₹' },
                { label: 'Avg Booking',     value: fmt(s.avgBookingValue), sub: 'per approved trip',          icon: '📊', tone: 'teal' },
                { label: 'Pending',         value: s.pendingCount,         sub: 'awaiting approval',          icon: '⏳', tone: 'orange' },
                { label: 'Rejected',        value: s.rejectedCount,        sub: 'this period',                icon: '✗',  tone: 'rose' },
              ].map(card => (
                <div key={card.label} className={`stat-card ${card.tone ?? ''}`.trim()}>
                  <div className="stat-head">
                    <div className="stat-num">{card.value}</div>
                    <div className="stat-icon">{card.icon}</div>
                  </div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-sub">{card.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="segmented-row">
            {(['overview', 'dept', 'employee', 'cost-center', 'gst'] as const).map(t => (
              <button key={t} className={`segment-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'cost-center' ? 'Cost Centers' : t === 'gst' ? 'GST Report' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading && <div className="surface-card empty-state">Loading report…</div>}

          {/* OVERVIEW — monthly trend + by type */}
          {!loading && data && tab === 'overview' && (
            <div className="dashboard-grid">
              <div className="chart-card">
                <div className="card-title">Monthly Spend Trend</div>
                <div className="card-copy">Total approved bookings per month</div>
                <div className="mini-chart" style={{ marginTop: 20 }}>
                  {data.monthly.length === 0 ? (
                    <div className="empty-state">No data for this period.</div>
                  ) : data.monthly.map((m, i) => {
                    const max = Math.max(...data.monthly.map(x => x.spend))
                    const h   = max > 0 ? Math.round((m.spend / max) * 140) : 4
                    return (
                      <div key={i} className="mini-bar-group">
                        <div className="mini-bar-track">
                          <div className="mini-bar" style={{ height: h }} title={`${fmt(m.spend)} · ${m.count} bookings`} />
                        </div>
                        <div className="mini-bar-label">{m.month.slice(5)}</div>
                        <div className="mini-bar-value">{fmt(m.spend)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="chart-card">
                <div className="card-title">By Booking Type</div>
                <div className="metric-list" style={{ marginTop: 16 }}>
                  {data.byType.length === 0 ? (
                    <div className="empty-state">No data.</div>
                  ) : data.byType.map(t => (
                    <div key={t.booking_type} className="metric-row">
                      <div className="metric-row-head">
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{t.booking_type}</span>
                        <span>{fmt(t.spend)} ({t.count})</span>
                      </div>
                      <div className="metric-track">
                        <div className="metric-fill" style={{
                          width: pct(t.spend, s?.totalSpend ?? 1),
                          background: TYPE_COLORS[t.booking_type] ?? 'var(--accent)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DEPT */}
          {!loading && data && tab === 'dept' && (
            <div className="table-card">
              <div className="table-header"><div className="card-title">Spend by Department</div></div>
              <table>
                <thead><tr><th>Department</th><th>Bookings</th><th>Total Spend</th><th>Share</th></tr></thead>
                <tbody>
                  {data.byDept.length === 0 ? (
                    <tr><td colSpan={4} className="empty-state">No data for this period.</td></tr>
                  ) : data.byDept.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{d.dept ?? 'Unassigned'}</td>
                      <td>{d.count}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(d.spend)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: pct(d.spend, s?.totalSpend ?? 1), height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{pct(d.spend, s?.totalSpend ?? 1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EMPLOYEE */}
          {!loading && data && tab === 'employee' && (
            <div className="table-card">
              <div className="table-header"><div className="card-title">Spend by Employee</div><div className="card-copy">Top 20 travellers</div></div>
              <table>
                <thead><tr><th>Employee</th><th>Bookings</th><th>Total Spend</th><th>Avg per Trip</th></tr></thead>
                <tbody>
                  {data.byEmployee.length === 0 ? (
                    <tr><td colSpan={4} className="empty-state">No data for this period.</td></tr>
                  ) : data.byEmployee.map((e, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{e.email}</td>
                      <td>{e.count}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(e.spend)}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{fmt(Math.round(e.spend / e.count))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* COST CENTER */}
          {!loading && data && tab === 'cost-center' && (
            <div className="table-card">
              <div className="table-header"><div className="card-title">Spend by Cost Center</div></div>
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Bookings</th><th>Total Spend</th><th>Share</th></tr></thead>
                <tbody>
                  {data.byCostCenter.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No cost center data. Assign cost centers to approvals first.</td></tr>
                  ) : data.byCostCenter.map((c, i) => (
                    <tr key={i}>
                      <td><code>{c.code}</code></td>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>{c.count}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(c.spend)}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{pct(c.spend, s?.totalSpend ?? 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GST REPORT */}
          {!loading && data && tab === 'gst' && g && (
            <div style={{ display: 'grid', gap: 20 }}>
              <div className="surface-card" style={{ borderLeft: '4px solid var(--success)', background: 'var(--success-lt)' }}>
                <p style={{ fontSize: 13, color: 'var(--success)' }}>
                  <strong>For GST Input Credit:</strong> The base amount (excl. GST) is eligible for input tax credit (ITC) claims. Your accountant will need this breakdown for monthly GST filing.
                </p>
              </div>

              <div className="stat-grid">
                {[
                  { label: 'Total Invoiced',  value: fmt(g.totalWithGst), sub: 'incl. 18% GST' },
                  { label: 'Base Amount',     value: fmt(g.baseAmount),   sub: 'excl. GST',  tone: 'teal' },
                  { label: 'GST Amount (18%)', value: fmt(g.gstAmount),   sub: 'input credit eligible', tone: 'orange' },
                ].map(c => (
                  <div key={c.label} className={`stat-card ${c.tone ?? ''}`.trim()}>
                    <div className="stat-head"><div className="stat-num">{c.value}</div></div>
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-sub">{c.sub}</div>
                  </div>
                ))}
              </div>

              <div className="table-card">
                <div className="table-header"><div className="card-title">GST Breakdown by Type</div></div>
                <table>
                  <thead><tr><th>Booking Type</th><th>Bookings</th><th>Total (incl. GST)</th><th>Base (excl. GST)</th><th>GST Amount</th></tr></thead>
                  <tbody>
                    {data.byType.length === 0 ? (
                      <tr><td colSpan={5} className="empty-state">No data for this period.</td></tr>
                    ) : data.byType.map((t, i) => {
                      const base = Math.round(t.spend / 1.18)
                      const gst  = t.spend - base
                      return (
                        <tr key={i}>
                          <td style={{ textTransform: 'capitalize', fontWeight: 700 }}>{t.booking_type}</td>
                          <td>{t.count}</td>
                          <td>{fmt(t.spend)}</td>
                          <td>{fmt(base)}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(gst)}</td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                      <td>Total</td>
                      <td>{s?.totalBookings}</td>
                      <td>{fmt(g.totalWithGst)}</td>
                      <td>{fmt(g.baseAmount)}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(g.gstAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
