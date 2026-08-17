'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface Dispute {
  id: string; razorpay_dispute_id: string; razorpay_payment_id: string
  amount: number; currency: string; reason_code: string | null
  status: string; respond_by: string | null; created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-red', under_review: 'badge-yellow', won: 'badge-green', lost: 'badge-red', closed: 'badge-yellow',
}

function formatDate(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  function load(sync = false) {
    if (sync) setSyncing(true); else setLoading(true)
    setError(''); setPermissionDenied(false)
    adminFetch(`/api/admin/super/disputes${sync ? '?sync=1' : ''}`)
      .then(d => setDisputes(d.disputes ?? []))
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => { setLoading(false); setSyncing(false) })
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="admin-topbar">
        <h2>Razorpay Disputes</h2>
        <span className="topbar-meta">Chargebacks and disputes, populated live from Razorpay's webhook</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Disputes</div>
                <div className="card-copy">New disputes appear here as soon as Razorpay sends the webhook event — before their own email notification arrives.</div>
              </div>
              {!permissionDenied && (
                <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={syncing}>
                  {syncing ? 'Syncing…' : 'Sync from Razorpay'}
                </button>
              )}
            </div>
            {permissionDenied ? (
              <PermissionDenied message={error} />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Raised</th>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Respond By</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="empty-state" style={{ color: '#DC2626' }}>{error}</td></tr>
                  ) : disputes.length === 0 ? (
                    <tr><td colSpan={6} className="empty-state">No disputes recorded. Use "Sync from Razorpay" to check for any that predate the webhook.</td></tr>
                  ) : disputes.map(d => (
                    <tr key={d.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(d.created_at)}</td>
                      <td><code style={{ fontSize: 11 }}>{d.razorpay_payment_id}</code></td>
                      <td style={{ fontWeight: 800 }}>₹{Number(d.amount).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#6B7280' }}>{d.reason_code ?? '--'}</td>
                      <td><span className={`badge ${STATUS_BADGE[d.status] ?? ''}`}>{d.status}</span></td>
                      <td style={{ color: d.respond_by ? '#DC2626' : '#6B7280', fontWeight: d.respond_by ? 700 : 400 }}>{formatDate(d.respond_by)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
