'use client'
import { Suspense, useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { Pagination, usePagination } from '@/components/Pagination'

interface Payout { id: string; amount: number; status: string; bank_name?: string; account_no?: string; upi_id?: string; notes?: string; created_at: string; processed_at?: string }

const STATUS_BADGE: Record<string, string> = { pending: 'badge-yellow', processing: 'badge-blue', paid: 'badge-green', rejected: 'badge-red' }
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })

export default function PartnerPayoutsPage() {
  return (
    <Suspense fallback={null}>
      <PartnerPayoutsContent />
    </Suspense>
  )
}

function PartnerPayoutsContent() {
  const sp        = useSearchParams()
  const agentId   = sp.get('agentId') ?? ''
  const agentName = sp.get('agentName') ?? 'Agent'
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    adminFetch('/api/admin/partner/payouts', { agentId })
      .then(d => setPayouts(d.payouts ?? []))
      .finally(() => setLoading(false))
  }, [agentId])

  async function handleAction(id: string, status: 'paid' | 'processing' | 'rejected') {
    setSaving(id)
    const updated = await adminFetch('/api/admin/partner/payouts', {
      agentId, method: 'PATCH', body: JSON.stringify({ id, status }),
    }).catch(() => null)
    if (updated) setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setSaving(null)
  }

  const pending    = payouts.filter(p => p.status === 'pending')
  const totalPaid  = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const { slice: pagePayouts, page, setPage, total } = usePagination(payouts, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>{agentName} — Payouts</h2>
        {pending.length > 0 && <span className="badge badge-yellow">{pending.length} pending</span>}
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-num">{pending.length}</div><div className="stat-label">Pending requests</div></div>
            <div className="stat-card teal"><div className="stat-num">{fmt(totalPaid)}</div><div className="stat-label">Total paid out</div></div>
            <div className="stat-card"><div className="stat-num">{fmt(pending.reduce((s, p) => s + p.amount, 0))}</div><div className="stat-label">Pending amount</div></div>
          </div>

          <div className="table-card">
            <div className="table-header"><div className="card-title">Payout Requests</div></div>
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>To</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                ) : payouts.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No payout requests.</td></tr>
                ) : pagePayouts.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--ink-3)' }}>{fmtDate(p.created_at)}</td>
                    <td style={{ fontWeight: 800 }}>{fmt(p.amount)}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {p.upi_id ? `UPI: ${p.upi_id}` : p.account_no ? `****${p.account_no.slice(-4)} · ${p.bank_name ?? ''}` : '--'}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pending' && (
                        <div className="page-actions">
                          <button className="btn btn-sm btn-muted" disabled={!!saving} onClick={() => handleAction(p.id, 'processing')}>Mark Processing</button>
                          <button className="btn btn-sm btn-primary" disabled={!!saving} onClick={() => handleAction(p.id, 'paid')}>{saving === p.id ? '…' : 'Mark Paid'}</button>
                          <button className="btn btn-sm btn-danger" disabled={!!saving} onClick={() => handleAction(p.id, 'rejected')}>Reject</button>
                        </div>
                      )}
                      {p.status === 'processing' && (
                        <button className="btn btn-sm btn-primary" disabled={!!saving} onClick={() => handleAction(p.id, 'paid')}>{saving === p.id ? '…' : 'Mark Paid'}</button>
                      )}
                      {(p.status === 'paid' || p.status === 'rejected') && (
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.processed_at ? fmtDate(p.processed_at) : '--'}</span>
                      )}
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
