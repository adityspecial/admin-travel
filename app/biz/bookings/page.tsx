'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { AppPopup } from '@/components/ui/AppPopup'
import { Search, AlertTriangle } from 'lucide-react'

interface Booking {
  id: string; bookingType: string; bookingRef: string | null; status: string
  amount: number; customerName: string | null; createdAt: string
}

const TYPE_LABELS: Record<string, string> = { flight: 'Flight', hotel: 'Hotel', cab: 'Cab', insurance: 'Insurance' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BizBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [disputeTarget, setDisputeTarget] = useState<Booking | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    adminFetch('/api/admin/biz/bookings')
      .then(d => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (b.bookingRef ?? '').toLowerCase().includes(q) || (b.customerName ?? '').toLowerCase().includes(q)
  })

  async function submitDispute() {
    if (!disputeTarget || !reason.trim()) return
    setSubmitting(true); setError('')
    try {
      await adminFetch('/api/admin/biz/disputes', {
        method: 'POST',
        body: JSON.stringify({ bookingType: disputeTarget.bookingType, bookingId: disputeTarget.id, reason: reason.trim() }),
      })
      setDisputedIds(prev => new Set(prev).add(disputeTarget.id))
      setDisputeTarget(null)
      setReason('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to raise dispute')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Bookings</h2>
        <span className="topbar-meta">Every confirmed flight, hotel, cab, and insurance booking for your organisation</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Search</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search booking ref or traveller name..."
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 280 }} />
            </div>
          </section>

          <div className="table-card">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Reference</th><th>Traveller</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No bookings found.</td></tr>
                ) : filtered.map(b => (
                  <tr key={`${b.bookingType}-${b.id}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.createdAt)}</td>
                    <td>{TYPE_LABELS[b.bookingType] ?? b.bookingType}</td>
                    <td><code style={{ fontSize: 11 }}>{b.bookingRef ?? '--'}</code></td>
                    <td>{b.customerName ?? '--'}</td>
                    <td style={{ fontWeight: 800 }}>₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-gray">{b.status}</span></td>
                    <td>
                      {disputedIds.has(b.id) ? (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Dispute raised</span>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }}
                          onClick={() => { setDisputeTarget(b); setReason(''); setError('') }}>
                          <AlertTriangle size={12} /> Raise Dispute
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AppPopup
        isOpen={!!disputeTarget}
        title="Raise a Dispute"
        subtitle={disputeTarget ? `${TYPE_LABELS[disputeTarget.bookingType] ?? disputeTarget.bookingType} · ${disputeTarget.bookingRef ?? disputeTarget.id}` : undefined}
        icon={<AlertTriangle size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={440}
        onClose={() => setDisputeTarget(null)}
      >
        {error && <div className="login-error">{error}</div>}
        <div className="app-input-group">
          <label className="app-input-label">Reason *</label>
          <textarea
            className="app-input"
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe the issue with this booking — e.g. wrong PNR, no-show handling, refund not received…"
          />
        </div>
        <div className="app-popup-footer">
          <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setDisputeTarget(null)}>Cancel</button>
          <button type="button" className="confirm-modal-btn confirm-modal-btn-success" disabled={submitting || !reason.trim()} onClick={submitDispute}>
            {submitting ? 'Submitting…' : 'Raise Dispute'}
          </button>
        </div>
      </AppPopup>
    </div>
  )
}
