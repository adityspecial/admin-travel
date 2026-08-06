'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { IndianRupee, Receipt, XCircle, Clock, TrendingUp, Search } from 'lucide-react'
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
interface OrderPayment {
  id: string; status: string; amount: number
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
  const [orderResults, setOrderResults] = useState<OrderPayment[] | null>(null)
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

  const orderColumns: ColumnDef<OrderPayment>[] = [
    { key: 'id', header: 'Payment ID', render: (p) => <span className="data-table-code-pill">{p.id}</span> },
    { key: 'status', header: 'Status', render: (p) => <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="data-table-cell-bold">₹{(p.amount / 100).toLocaleString('en-IN')}</span> },
  ]

  const paymentColumns: ColumnDef<Payment>[] = [
    { key: 'created_at', header: 'Date', render: (p) => <span className="data-table-muted-cell">{formatDate(p.created_at)}</span> },
    { key: 'booking_type', header: 'Booking Type', render: (p) => BOOKING_TYPE_LABELS[p.booking_type] ?? p.booking_type },
    { key: 'amount', header: 'Amount', render: (p) => <span className="data-table-cell-bold">₹{Number(p.amount).toLocaleString('en-IN')}</span> },
    { key: 'status', header: 'Status', render: (p) => <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span> },
    { key: 'payment_method', header: 'Method', render: (p) => <span className="data-table-muted-cell">{p.payment_method ?? '--'}</span> },
    { key: 'razorpay_payment_id', header: 'Razorpay Payment ID', render: (p) => <span className="data-table-code-pill">{p.razorpay_payment_id ?? '--'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => <a href={`/super/payments/${p.id}`} className="data-table-btn data-table-btn-edit">View</a>,
    },
  ]

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
            <div className="pay-filters-row">
              <label className="pay-field-label-col">
                From
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="pay-filter-field" />
              </label>
              <label className="pay-field-label-col">
                To
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="pay-filter-field" />
              </label>
              <label className="pay-field-label-col">
                Status
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="pay-filter-field">
                  <option value="">All</option>
                  <option value="captured">Captured</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </label>
              <label className="pay-field-label-col">
                Booking Type
                <select value={bookingType} onChange={e => setBookingType(e.target.value)}
                  className="pay-filter-field">
                  <option value="">All</option>
                  {Object.entries(BOOKING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div className="pay-filter-apply">
                <button className="quick-action-btn-primary" onClick={load}>Apply</button>
              </div>
            </div>
          </section>

          {/* Stat tiles */}
          <section className="stat-grid">
            <StatCard Icon={IndianRupee} label="Total Revenue" value={formatMoney(stats?.totalRevenue ?? 0)} sub={`${formatCount(stats?.capturedCount ?? 0)} captured payments`} badge="Revenue" />
            <StatCard Icon={Receipt} label="Total Payments" value={formatCount(stats?.totalCount ?? 0)} sub="In the selected range" badge="Volume" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={XCircle} label="Failed" value={formatCount(stats?.failedCount ?? 0)} sub="Payment attempts that failed" badge="Attention" iconBg="#fef2f2" iconColor="#dc2626" badgeBg="#fee2e2" badgeColor="#b91c1c" />
            <StatCard Icon={Clock} label="Pending" value={formatCount(stats?.pendingCount ?? 0)} sub="Awaiting capture or reconciliation" badge="Review" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
          </section>

          {/* Revenue timeline */}
          <div className="dashboard-card-lucrative">
            <div className="dashboard-card-header">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                  <TrendingUp size={19} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Revenue Timeline</h3>
                  <p className="dashboard-card-subtitle">Captured revenue per day for the selected range</p>
                </div>
              </div>
            </div>
            <div className="pay-chart-wrap">
              {chartData.length === 0 ? (
                <div className="pay-chart-empty">
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
          </div>

          {/* Order lookup */}
          <DataTable
            title="Order → Payments Lookup"
            subtitle="Paste a Razorpay order_id to see every payment attempt made against it, live from Razorpay."
            headerAction={
              <div className="pay-lookup-row">
                <div style={{ width: 260 }}>
                  <AppInput
                    value={orderQuery}
                    onChange={e => setOrderQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookupOrder()}
                    placeholder="order_XXXXXXXXXXXXXX"
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                  />
                </div>
                <button className="quick-action-btn-primary" onClick={lookupOrder} disabled={orderLoading}>
                  {orderLoading ? 'Looking up…' : 'Look up'}
                </button>
              </div>
            }
            columns={orderColumns}
            data={orderResults ?? []}
            emptyMessage={orderError || (orderResults ? 'No payment attempts found for this order.' : 'Paste an order_id above and look it up.')}
            keyExtractor={(p) => p.id}
          />

          {/* Payments table */}
          <DataTable
            title="Recent Payments"
            subtitle="Most recent 1,000 payments matching the current filters."
            columns={paymentColumns}
            data={pagePayments}
            loading={loading}
            emptyMessage={error || 'No payments match these filters.'}
            keyExtractor={(p) => p.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
