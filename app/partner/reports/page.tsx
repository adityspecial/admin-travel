'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { downloadExcel } from '@/lib/excel'

interface ReportData {
  summary: { totalGmv: number; totalCommission: number; totalBookings: number; cancelledCount: number; commissionRate: string }
  byType:  { booking_type: string; count: number; gmv: number; commission: number }[]
  monthly: { month: string; count: number; gmv: number; commission: number }[]
  dateRange: { from: string; to: string }
}

const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toLocaleString('en-IN')}`
const TYPE_COLORS: Record<string, string> = { flight: '#1663eb', hotel: '#6d4aff', bus: '#16a34a' }

export default function PartnerReportsPage() {
  const sp        = useSearchParams()
  const agentId   = sp.get('agentId') ?? ''
  const agentName = sp.get('agentName') ?? 'Agent'
  const yr = new Date().getFullYear()
  const [data, setData]     = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom]     = useState(`${yr}-01-01`)
  const [to, setTo]         = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    adminFetch(`/api/admin/partner/reports?from=${from}&to=${to}`, { agentId })
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [agentId, from, to])

  function handleExcel() {
    if (!data) return
    const s = data.summary
    downloadExcel(`AirDunia-PartnerReport-${agentId}-${from}-${to}`, [
      { name: 'Summary', headers: ['Metric', 'Value'],
        rows: [['Total GMV (₹)', s.totalGmv], ['Commission (₹)', s.totalCommission], ['Bookings', s.totalBookings], ['Cancelled', s.cancelledCount], ['Commission Rate (%)', s.commissionRate]] },
      { name: 'Monthly', headers: ['Month', 'Bookings', 'GMV (₹)', 'Commission (₹)'],
        rows: data.monthly.map(m => [m.month, m.count, m.gmv, m.commission]) },
      { name: 'By Type', headers: ['Type', 'Bookings', 'GMV (₹)', 'Commission (₹)'],
        rows: data.byType.map(t => [t.booking_type, t.count, t.gmv, t.commission]) },
    ])
  }

  const s = data?.summary

  return (
    <div>
      <div className="admin-topbar">
        <h2>{agentName} — Reports</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" className="toolbar-search" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>to</span>
          <input type="date" className="toolbar-search" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          {data && <button className="btn btn-primary btn-sm" onClick={handleExcel}>⬇ Excel</button>}
        </div>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {s && (
            <div className="stat-grid">
              <div className="stat-card"><div className="stat-num">{fmt(s.totalGmv)}</div><div className="stat-label">Total GMV</div><div className="stat-sub">{s.totalBookings} bookings</div></div>
              <div className="stat-card teal"><div className="stat-num">{fmt(s.totalCommission)}</div><div className="stat-label">Commission Earned</div><div className="stat-sub">{s.commissionRate}% rate</div></div>
              <div className="stat-card orange"><div className="stat-num">{s.cancelledCount}</div><div className="stat-label">Cancelled</div><div className="stat-sub">this period</div></div>
            </div>
          )}

          {loading && <div className="surface-card empty-state">Loading report…</div>}

          {!loading && data && (
            <div className="dashboard-grid">
              <div className="chart-card">
                <div className="card-title">Monthly Trend</div>
                <div className="mini-chart" style={{ marginTop: 16 }}>
                  {data.monthly.length === 0 ? <div className="empty-state">No data.</div> : data.monthly.map((m, i) => {
                    const max = Math.max(...data.monthly.map(x => x.commission))
                    const h   = max > 0 ? Math.round((m.commission / max) * 140) : 4
                    return (
                      <div key={i} className="mini-bar-group">
                        <div className="mini-bar-track"><div className="mini-bar" style={{ height: h }} /></div>
                        <div className="mini-bar-label">{m.month.slice(5)}</div>
                        <div className="mini-bar-value">{fmt(m.commission)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="table-card">
                <div className="table-header"><div className="card-title">By Booking Type</div></div>
                <table>
                  <thead><tr><th>Type</th><th>Bookings</th><th>GMV</th><th>Commission</th></tr></thead>
                  <tbody>
                    {data.byType.length === 0 ? (
                      <tr><td colSpan={4} className="empty-state">No data.</td></tr>
                    ) : data.byType.map((t, i) => (
                      <tr key={i}>
                        <td><span className="badge" style={{ background: `${TYPE_COLORS[t.booking_type] ?? '#888'}20`, color: TYPE_COLORS[t.booking_type] ?? '#888' }}>{t.booking_type}</span></td>
                        <td>{t.count}</td>
                        <td>{fmt(t.gmv)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(t.commission)}</td>
                      </tr>
                    ))}
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
