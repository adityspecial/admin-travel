'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { downloadExcel } from '@/lib/excel'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { IndianRupee, TrendingUp, XCircle, BarChart3 } from 'lucide-react'
import './reports.css'

interface ReportData {
  summary: { totalGmv: number; totalCommission: number; totalBookings: number; cancelledCount: number; commissionRate: string }
  byType:  { booking_type: string; count: number; gmv: number; commission: number }[]
  monthly: { month: string; count: number; gmv: number; commission: number }[]
  dateRange: { from: string; to: string }
}

const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toLocaleString('en-IN')}`

// Same mapping used on /partner/bookings — the real badge system only ships
// green/red/yellow/blue/gray.
const TYPE_TONE: Record<string, string> = { flight: 'badge-blue', hotel: 'badge-green', bus: 'badge-gray' }

export default function PartnerReportsPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
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

  const typeColumns: ColumnDef<ReportData['byType'][number]>[] = [
    {
      key: 'booking_type',
      header: 'Type',
      render: (t) => <span className={`badge ${TYPE_TONE[t.booking_type] ?? 'badge-gray'}`}>{t.booking_type}</span>,
    },
    { key: 'count', header: 'Bookings', render: (t) => t.count },
    { key: 'gmv', header: 'GMV', render: (t) => fmt(t.gmv) },
    { key: 'commission', header: 'Commission', render: (t) => <span className="preport-commission-cell">{fmt(t.commission)}</span> },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Reports</h2>
        <div className="preport-date-range">
          <input type="date" className="toolbar-search preport-date-input" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="preport-to-label">to</span>
          <input type="date" className="toolbar-search preport-date-input" value={to} onChange={e => setTo(e.target.value)} />
          {data && <button className="btn btn-primary btn-sm" onClick={handleExcel}>⬇ Excel</button>}
        </div>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {s && (
            <div className="stat-grid preport-stat-grid">
              <StatCard Icon={IndianRupee} label="Total GMV" value={fmt(s.totalGmv)} sub={`${s.totalBookings} bookings`} badge="Volume" />
              <StatCard Icon={TrendingUp} label="Commission Earned" value={fmt(s.totalCommission)} sub={`${s.commissionRate}% rate`} badge="Earnings" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
              <StatCard Icon={XCircle} label="Cancelled" value={s.cancelledCount} sub="This period" badge="This Period" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
            </div>
          )}

          {loading && <div className="surface-card empty-state">Loading report…</div>}

          {!loading && data && (
            <div className="dashboard-grid">
              <div className="dashboard-card-lucrative">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title-group">
                    <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                      <BarChart3 size={19} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="dashboard-card-title">Monthly Trend</h3>
                      <p className="dashboard-card-subtitle">Commission earned per month</p>
                    </div>
                  </div>
                </div>

                <div className="mini-chart">
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

              <DataTable
                title="By Booking Type"
                columns={typeColumns}
                data={data.byType}
                emptyMessage="No data."
                keyExtractor={(t) => t.booking_type}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
