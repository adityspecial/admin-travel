'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'

const STATUS_BADGE: Record<string, string> = {
  captured:  'badge-green',
  pending:   'badge-yellow',
  failed:    'badge-red',
  processed: 'badge-green',
}
const BOOKING_TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', bus: 'Bus', package: 'Package', cab: 'Cab', insurance: 'Insurance', charter: 'Charter',
}

function money(n: number) { return '₹' + Number(n).toLocaleString('en-IN') }
function fmtDate(iso?: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [refundOpen,   setRefundOpen]   = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundSpeed,  setRefundSpeed]  = useState<'normal' | 'optimum'>('normal')
  const [refundReason, setRefundReason] = useState('')
  const [refundBusy,   setRefundBusy]   = useState(false)
  const [refundError,  setRefundError]  = useState('')

  const [captureBusy,  setCaptureBusy]  = useState(false)
  const [actionMsg,    setActionMsg]    = useState('')

  function load() {
    setLoading(true); setError('')
    adminFetch(`/api/admin/super/payments/${id}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  async function submitRefund() {
    if (!refundReason.trim()) { setRefundError('A reason is required.'); return }
    setRefundBusy(true); setRefundError('')
    try {
      await adminFetch(`/api/admin/super/payments/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          amount: refundAmount ? Number(refundAmount) : undefined,
          speed:  refundSpeed,
          reason: refundReason,
        }),
      })
      setRefundOpen(false); setRefundAmount(''); setRefundReason('')
      setActionMsg('Refund initiated.')
      load()
    } catch (e: any) {
      setRefundError(e.message ?? 'Refund failed')
    } finally {
      setRefundBusy(false)
    }
  }

  async function submitCapture() {
    if (!confirm('Capture this authorized payment? This charges the customer\'s payment method for the full amount.')) return
    setCaptureBusy(true); setActionMsg('')
    try {
      await adminFetch(`/api/admin/super/payments/${id}/capture`, { method: 'POST' })
      setActionMsg('Payment captured.')
      load()
    } catch (e: any) {
      setActionMsg(`Capture failed: ${e.message ?? 'unknown error'}`)
    } finally {
      setCaptureBusy(false)
    }
  }

  if (loading) return <div className="admin-content"><div className="pay-detail-loading">Loading…</div></div>
  if (error || !data) return <div className="admin-content"><div className="pay-detail-error">{error || 'Payment not found'}</div></div>

  const { payment, refunds, razorpay, razorpayError, customerEmail } = data
  const alreadyRefunded = (refunds ?? []).filter((r: any) => r.status !== 'failed').reduce((s: number, r: any) => s + Number(r.amount), 0)
  const refundable = Number(payment.amount) - alreadyRefunded

  return (
    <div>
      <div className="admin-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/super/payments')}>← Back to Payments</button>
        <span className="topbar-meta">Payment {payment.id}</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {actionMsg && (
            <div className="pay-action-msg">
              {actionMsg}
            </div>
          )}

          <section className="stat-grid">
            <div className="stat-card">
              <div className="stat-head"><div className="stat-num">{money(payment.amount)}</div></div>
              <div className="stat-label">Amount</div>
              <div className="stat-sub">{payment.currency}</div>
            </div>
            <div className="stat-card teal">
              <div className="stat-head"><div className="stat-num"><span className={`badge ${STATUS_BADGE[payment.status] ?? ''}`}>{payment.status}</span></div></div>
              <div className="stat-label">Status</div>
              <div className="stat-sub">{BOOKING_TYPE_LABELS[payment.booking_type] ?? payment.booking_type}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-head"><div className="stat-num">{money(alreadyRefunded)}</div></div>
              <div className="stat-label">Refunded</div>
              <div className="stat-sub">{money(refundable)} refundable</div>
            </div>
            <div className="stat-card rose">
              <div className="stat-head"><div className="stat-num">{payment.retry_count ?? 0}</div></div>
              <div className="stat-label">Retry Count</div>
              <div className="stat-sub">{fmtDate(payment.created_at)}</div>
            </div>
          </section>

          <section className="dashboard-grid">
            {/* Local record */}
            <div className="chart-card">
              <div className="card-title">Payment Record</div>
              <div className="card-copy">What AirDunia has on file for this payment.</div>
              <div className="metric-list pay-metric-list-mt">
                <Row label="Payment ID" value={payment.id} mono />
                <Row label="Profile ID" value={payment.profile_id} mono />
                <Row label="Customer Email" value={customerEmail ?? '--'} />
                <Row label="Razorpay Order ID" value={payment.razorpay_order_id ?? '--'} mono />
                <Row label="Razorpay Payment ID" value={payment.razorpay_payment_id ?? '--'} mono />
                <Row label="Payment Method" value={payment.payment_method ?? '--'} />
                <Row label="Booking ID" value={payment.booking_id ?? '--'} mono />
                <Row label="Failure Reason" value={payment.failure_reason ?? '--'} />
                <Row label="Created" value={fmtDate(payment.created_at)} />
                <Row label="Updated" value={fmtDate(payment.updated_at)} />
              </div>
            </div>

            {/* Live Razorpay record */}
            <div className="chart-card">
              <div className="card-title">Live Razorpay Data</div>
              <div className="card-copy">Fetched directly from Razorpay — the authoritative source.</div>
              {razorpayError ? (
                <div className="pay-razorpay-error">{razorpayError}</div>
              ) : !razorpay ? (
                <div className="pay-razorpay-empty">No Razorpay payment ID recorded yet — nothing to fetch.</div>
              ) : (
                <div className="metric-list pay-metric-list-mt">
                  <Row label="Status" value={razorpay.status} />
                  <Row label="Method" value={razorpay.method ?? '--'} />
                  <Row label="Amount" value={money((razorpay.amount ?? 0) / 100)} />
                  <Row label="Amount Refunded" value={money((razorpay.amount_refunded ?? 0) / 100)} />
                  <Row label="Captured" value={razorpay.captured ? 'Yes' : 'No'} />
                  <Row label="Bank / Wallet" value={razorpay.bank ?? razorpay.wallet ?? '--'} />
                  <Row label="Card" value={razorpay.card ? `${razorpay.card.network} •••• ${razorpay.card.last4}` : '--'} />
                  <Row label="VPA (UPI)" value={razorpay.vpa ?? '--'} />
                  <Row label="Email" value={razorpay.email ?? '--'} />
                  <Row label="Contact" value={razorpay.contact ?? '--'} />
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Actions</div>
                <div className="card-copy">These move real money — double-check before confirming.</div>
              </div>
            </div>
            <div className="page-actions pay-actions-pad">
              <button
                className="btn btn-danger btn-sm"
                disabled={payment.status !== 'captured' || refundable <= 0}
                onClick={() => setRefundOpen(o => !o)}
              >
                {refundOpen ? 'Cancel Refund' : 'Issue Refund'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={payment.status !== 'pending' || !payment.razorpay_payment_id || captureBusy}
                onClick={submitCapture}
                title={payment.status !== 'pending' ? 'Only authorized/pending payments can be captured' : ''}
              >
                {captureBusy ? 'Capturing…' : 'Capture Payment'}
              </button>
            </div>

            {refundOpen && (
              <div className="pay-refund-form">
                <label className="pay-field-label-col">
                  Amount (leave blank for full refund of {money(refundable)})
                  <input
                    type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                    placeholder={String(refundable)} max={refundable}
                    className="pay-field-input"
                  />
                </label>
                <label className="pay-field-label-col">
                  Speed
                  <select value={refundSpeed} onChange={e => setRefundSpeed(e.target.value as any)}
                    className="pay-field-input">
                    <option value="normal">Normal (5–7 business days)</option>
                    <option value="optimum">Instant (where supported)</option>
                  </select>
                </label>
                <label className="pay-field-label-col">
                  Reason (required)
                  <textarea
                    value={refundReason} onChange={e => setRefundReason(e.target.value)}
                    rows={2} placeholder="Why is this being refunded?"
                    className="pay-field-input pay-field-input--textarea"
                  />
                </label>
                {refundError && <div className="pay-refund-error">{refundError}</div>}
                <button className="btn btn-danger btn-sm pay-refund-submit" onClick={submitRefund} disabled={refundBusy}>
                  {refundBusy ? 'Processing…' : `Confirm Refund of ${money(refundAmount ? Number(refundAmount) : refundable)}`}
                </button>
              </div>
            )}
          </section>

          {/* Refund history */}
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Refund History</div>
                <div className="card-copy">All refunds recorded against this payment.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Status</th><th>Razorpay Refund ID</th><th>Reason</th></tr>
              </thead>
              <tbody>
                {(refunds ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No refunds issued for this payment.</td></tr>
                ) : refunds.map((r: any) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.created_at)}</td>
                    <td className="pay-amount-cell">{money(r.amount)}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] ?? ''}`}>{r.status}</span></td>
                    <td><code className="pay-code-sm">{r.razorpay_refund_id ?? '--'}</code></td>
                    <td className="pay-reason-cell">{r.reason ?? '--'}</td>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="metric-row-head">
      <span>{label}</span>
      <span className={mono ? 'pay-row-mono' : undefined}>{value}</span>
    </div>
  )
}
