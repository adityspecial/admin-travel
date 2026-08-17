'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface RefundRow {
  id: string; paymentId: string; bookingType: string; bookingId: string | null
  razorpayRefundId: string | null; razorpayPaymentId: string | null
  amount: number; reason: string | null; createdAt: string; hoursPending: number
}

const TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', cab: 'Cab', bus: 'Bus', insurance: 'Insurance', package: 'Package',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Days/hours/minutes/seconds instead of a big flat hour count — computed
// from the raw timestamp (not the backend's hoursPending, which is
// hour-granularity only) so minutes/seconds are actually meaningful.
function formatPending(iso: string) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const days    = Math.floor(totalSeconds / 86400)
  const hours   = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (days)              parts.push(`${days}d`)
  if (days || hours)     parts.push(`${hours}h`)
  if (days || hours || minutes) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)
  return parts.join(' ')
}

export default function RefundAgingPage() {
  const [refunds, setRefunds] = useState<RefundRow[]>([])
  const [stats, setStats] = useState<{ count: number; totalAmount: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hours, setHours] = useState('48')

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    adminFetch(`/api/admin/super/refunds/aging?hours=${hours}`)
      .then(d => { setRefunds(d.refunds ?? []); setStats(d.stats ?? null) })
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div>
      <div className="admin-topbar">
        <h2>Refund Aging</h2>
        <span className="topbar-meta">Refunds still pending past the threshold — Razorpay-side stalls or a stuck retry</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <section className="stat-grid">
            <div className="stat-card rose">
              <div className="stat-head">
                <div className="stat-num">{stats?.count ?? 0}</div>
                <span className="stat-icon">!</span>
              </div>
              <div className="stat-label">Stuck Refunds</div>
              <div className="stat-sub">Pending &gt; {hours}h</div>
            </div>
            <div className="stat-card rose">
              <div className="stat-head">
                <div className="stat-num">₹{Number(stats?.totalAmount ?? 0).toLocaleString('en-IN')}</div>
                <span className="stat-icon">₹</span>
              </div>
              <div className="stat-label">Amount Stuck</div>
              <div className="stat-sub">Total pending refund value</div>
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div><div className="card-title">Threshold</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Pending longer than (hours)
                <input type="number" min="1" value={hours} onChange={e => setHours(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, width: 100 }} />
              </label>
              <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Stuck Refunds</div>
                <div className="card-copy">Oldest first — these need a human look, not just another automatic retry.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Pending For</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Razorpay Payment ID</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="empty-state">{permissionDenied ? <PermissionDenied message={error} /> : <span style={{ color: '#DC2626' }}>{error}</span>}</td></tr>
                ) : refunds.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No refunds stuck past this threshold.</td></tr>
                ) : refunds.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                    <td style={{ fontWeight: 800, color: r.hoursPending > 96 ? '#DC2626' : '#D97706', whiteSpace: 'nowrap' }}>{formatPending(r.createdAt)}</td>
                    <td>{TYPE_LABELS[r.bookingType] ?? r.bookingType}</td>
                    <td style={{ fontWeight: 800 }}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    <td><code style={{ fontSize: 11 }}>{r.razorpayPaymentId ?? '--'}</code></td>
                    <td style={{ color: '#6B7280' }}>{r.reason ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
