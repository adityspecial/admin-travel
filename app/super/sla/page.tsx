'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface StaleRefund { id: string; amount: number; created_at: string; booking_type: string; hoursPending: number }
interface StaleApproval { id: string; orgName: string; amount: number; purpose: string; createdAt: string; hoursPending: number }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function SlaPage() {
  const [refunds, setRefunds] = useState<StaleRefund[]>([])
  const [approvals, setApprovals] = useState<StaleApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/admin/super/sla')
      .then(d => { setRefunds(d.staleRefunds ?? []); setApprovals(d.staleApprovals ?? []) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="admin-topbar">
        <h2>SLA Tracker</h2>
        <span className="topbar-meta">Refunds pending &gt;48h and approvals pending &gt;24h — auto-flagged</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400E' }}>
            "Unresponded support tickets" isn't tracked here — there's no support ticket system anywhere in the codebase to pull from yet.
          </div>

          <section className="stat-grid">
            <div className="stat-card rose">
              <div className="stat-head"><div className="stat-num">{refunds.length}</div></div>
              <div className="stat-label">Stale Refunds</div>
              <div className="stat-sub">Pending &gt; 48 hours</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-head"><div className="stat-num">{approvals.length}</div></div>
              <div className="stat-label">Stale Approvals</div>
              <div className="stat-sub">Pending &gt; 24 hours</div>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header"><div><div className="card-title">Stale Refunds</div></div></div>
            <table>
              <thead><tr><th>Requested</th><th>Pending For</th><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="empty-state">Loading…</td></tr>
                ) : refunds.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">None stale.</td></tr>
                ) : refunds.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                    <td style={{ fontWeight: 800, color: '#DC2626' }}>{r.hoursPending}h</td>
                    <td>{r.booking_type}</td>
                    <td>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-card">
            <div className="table-header"><div><div className="card-title">Stale Approvals</div></div></div>
            <table>
              <thead><tr><th>Requested</th><th>Pending For</th><th>Org</th><th>Amount</th><th>Purpose</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                ) : approvals.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">None stale.</td></tr>
                ) : approvals.map(a => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(a.createdAt)}</td>
                    <td style={{ fontWeight: 800, color: '#D97706' }}>{a.hoursPending}h</td>
                    <td>{a.orgName}</td>
                    <td>₹{Number(a.amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>{a.purpose}</td>
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
