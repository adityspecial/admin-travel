'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

function formatMoney(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`
  if (value >= 1_00_000)    return `₹${(value / 1_00_000).toFixed(2)}L`
  return '₹' + Math.round(value).toLocaleString('en-IN')
}
function formatCount(n: number) { return n.toLocaleString('en-IN') }
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function formatChartDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const STATUS_BADGE: Record<string, string> = {
  captured: 'badge-green',
  pending:  'badge-yellow',
  failed:   'badge-red',
}

const BOOKING_TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', bus: 'Bus', package: 'Package', cab: 'Cab', insurance: 'Insurance', charter: 'Charter',
}

interface Payment {
  id: string; profile_id: string; booking_type: string; booking_id: string | null
  razorpay_order_id: string | null; razorpay_payment_id: string | null
  amount: number; currency: string; status: string; payment_method: string | null
  failure_reason: string | null; created_at: string
}
interface Stats {
  totalRevenue: number; totalCount: number; capturedCount: number; failedCount: number; pendingCount: number
  timeline: { date: string; revenue: number; count: number }[]
  byType: { type: string; revenue: number }[]
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const [from,   setFrom]   = useState('')
  const [to,     setTo]     = useState('')
  const [status, setStatus] = useState('')
  const [bookingType, setBookingType] = useState('')

  const [orderQuery,   setOrderQuery]   = useState('')
  const [orderResults, setOrderResults] = useState<any[] | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError,   setOrderError]   = useState('')

  function load() {
    setLoading(true); setError('')
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to)   qs.set('to', to)
    if (status) qs.set('status', status)
    if (bookingType) qs.set('bookingType', bookingType)
    adminFetch(`/api/admin/super/payments?${qs.toString()}`)
      .then(d => { setPayments(d.payments ?? []); setStats(d.stats ?? null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const { slice: pagePayments, page, setPage, total } = usePagination(payments, 20)

  async function lookupOrder() {
    if (!orderQuery.trim()) return
    setOrderLoading(true); setOrderError(''); setOrderResults(null)
    try {
      const d = await adminFetch(`/api/admin/super/payments/order/${encodeURIComponent(orderQuery.trim())}`)
      setOrderResults(d.payments ?? [])
    } catch (e: any) {
      setOrderError(e.message ?? 'Lookup failed')
    } finally {
      setOrderLoading(false)
    }
  }

  const chartData = useMemo(
    () => (stats?.timeline ?? []).map(t => ({ ...t, label: formatChartDate(t.date) })),
    [stats],
  )

  return (
    <div>
      <div className="admin-topbar">
        <h2>Razorpay Payments</h2>
        <span className="topbar-meta">Real-time payment tracking, revenue, and refunds</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Filters */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Filters</div>
                <div className="card-copy">Narrow the payment list and revenue chart by date range, status, or booking type.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px 20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                From
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                To
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Status
                <select value={status} onChange={e => setStatus(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="">All</option>
                  <option value="captured">Captured</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Booking Type
                <select value={bookingType} onChange={e => setBookingType(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="">All</option>
                  {Object.entries(BOOKING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
              </div>
            </div>
          </section>

          {/* Stat tiles */}
          <section className="stat-grid">
            {[
              { label: 'Total Revenue', value: formatMoney(stats?.totalRevenue ?? 0), sub: `${formatCount(stats?.capturedCount ?? 0)} captured payments`, icon: '₹', tone: '' },
              { label: 'Total Payments', value: formatCount(stats?.totalCount ?? 0), sub: 'In the selected range', icon: 'PAY', tone: 'teal' },
              { label: 'Failed', value: formatCount(stats?.failedCount ?? 0), sub: 'Payment attempts that failed', icon: 'ERR', tone: 'rose' },
              { label: 'Pending', value: formatCount(stats?.pendingCount ?? 0), sub: 'Awaiting capture or reconciliation', icon: 'WAIT', tone: 'orange' },
            ].map(card => (
              <div className={`stat-card ${card.tone}`.trim()} key={card.label}>
                <div className="stat-head">
                  <div className="stat-num">{card.value}</div>
                  <span className="stat-icon">{card.icon}</span>
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            ))}
          </section>

          {/* Revenue timeline */}
          <section className="chart-card">
            <div className="card-title">Revenue Timeline</div>
            <div className="card-copy">Captured revenue per day for the selected range.</div>
            <div style={{ marginTop: 16, height: 260 }}>
              {chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  No captured revenue in this range yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => formatMoney(v)} width={64} />
                    <Tooltip
                      formatter={(v: any, name: any) => name === 'revenue' ? [formatMoney(Number(v)), 'Revenue'] : [v, 'Payments']}
                      labelStyle={{ fontSize: 12, fontWeight: 700 }}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Revenue by booking type — stats.byType was already computed
              server-side but never rendered anywhere. */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Revenue by Booking Type</div>
                <div className="card-copy">Captured revenue breakdown for the selected range.</div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(!stats?.byType || stats.byType.length === 0) ? (
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>No captured revenue in this range yet.</div>
              ) : (() => {
                const sorted = [...stats.byType].sort((a, b) => b.revenue - a.revenue)
                const max = Math.max(...sorted.map(t => t.revenue), 1)
                return sorted.map(t => (
                  <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 90, fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>
                      {BOOKING_TYPE_LABELS[t.type] ?? t.type}
                    </div>
                    <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden', height: 18 }}>
                      <div style={{ width: `${(t.revenue / max) * 100}%`, background: '#2563EB', height: '100%', borderRadius: 6 }} />
                    </div>
                    <div style={{ width: 110, textAlign: 'right', fontSize: 13, fontWeight: 800 }}>{formatMoney(t.revenue)}</div>
                  </div>
                ))
              })()}
            </div>
          </section>

          {/* Order lookup */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Order → Payments Lookup</div>
                <div className="card-copy">Paste a Razorpay order_id to see every payment attempt made against it, live from Razorpay.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '16px 20px' }}>
              <input
                value={orderQuery}
                onChange={e => setOrderQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupOrder()}
                placeholder="order_XXXXXXXXXXXXXX"
                style={{ flex: 1, maxWidth: 360, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'monospace' }}
              />
              <button className="btn btn-primary btn-sm" onClick={lookupOrder} disabled={orderLoading}>
                {orderLoading ? 'Looking up…' : 'Look up'}
              </button>
            </div>
            {orderError && <div style={{ padding: '0 20px 16px', color: '#DC2626', fontSize: 13 }}>{orderError}</div>}
            {orderResults && (
              <table>
                <thead>
                  <tr><th>Payment ID</th><th>Status</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {orderResults.length === 0 ? (
                    <tr><td colSpan={3} className="empty-state">No payment attempts found for this order.</td></tr>
                  ) : orderResults.map((p: any) => (
                    <tr key={p.id}>
                      <td><code>{p.id}</code></td>
                      <td><span className={`badge ${STATUS_BADGE[p.status] ?? ''}`}>{p.status}</span></td>
                      <td>₹{(p.amount / 100).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Payments table */}
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Recent Payments</div>
                <div className="card-copy">Most recent 1,000 payments matching the current filters.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Booking Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Razorpay Payment ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="empty-state" style={{ color: '#DC2626' }}>{error}</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No payments match these filters.</td></tr>
                ) : pagePayments.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                    <td>{BOOKING_TYPE_LABELS[p.booking_type] ?? p.booking_type}</td>
                    <td style={{ fontWeight: 800 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status] ?? ''}`}>{p.status}</span></td>
                    <td style={{ color: '#6B7280' }}>{p.payment_method ?? '--'}</td>
                    <td><code style={{ fontSize: 11 }}>{p.razorpay_payment_id ?? '--'}</code></td>
                    <td>
                      <a href={`/super/payments/${p.id}`} className="btn btn-ghost btn-sm">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
