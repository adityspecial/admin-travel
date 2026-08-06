'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'
import '../approvals.css'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending Review', cls: 'apprd-status-badge--pending' },
  approved: { label: 'Approved',       cls: 'apprd-status-badge--approved' },
  rejected: { label: 'Rejected',       cls: 'apprd-status-badge--rejected' },
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="apprd-row">
      <span className="apprd-row-label">{label}</span>
      <span className="apprd-row-value">{value}</span>
    </div>
  )
}

export default function ApprovalDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [approval, setApproval] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(false)

  useEffect(() => {
    adminFetch(`/api/admin/biz/approvals/${id}`)
      .then(d => { setApproval(d.approval); setMessages(d.messages ?? []) })
      .finally(() => setLoading(false))
  }, [id])

  async function doAction(action: 'approve' | 'reject') {
    if (!confirm(action === 'approve' ? 'Approve this request?' : 'Reject this request?')) return
    setActing(true)
    try {
      const res = await adminFetch(`/api/admin/biz/approvals/${id}`, {
        method: 'PATCH', body: JSON.stringify({ action }),
      })
      setApproval((a: any) => ({ ...a, ...res.approval }))
    } catch (e: any) { alert(e.message) }
    finally { setActing(false) }
  }

  if (loading) return <div className="apprd-loading">Loading…</div>
  if (!approval) return <div className="apprd-loading">Not found.</div>

  const st    = STATUS_CFG[approval.status] ?? STATUS_CFG.pending
  const fd    = approval.flight_data
  const hd    = approval.hotel_data
  const isHotel = approval.booking_type === 'hotel'

  return (
    <div className="apprd-page">

      {/* Back + header */}
      <div className="apprd-header">
        <button onClick={() => router.back()} className="apprd-back-btn">
          ← Back
        </button>
        <h1 className="apprd-title">Approval Request</h1>
        <span className={`apprd-status-badge ${st.cls}`}>{st.label}</span>
      </div>

      <div className="apprd-grid">

        {/* Left column */}
        <div className="apprd-left-col">

          {/* Trip summary */}
          <div className="apprd-card">
            <div className="apprd-section-label">Trip Summary</div>
            {isHotel && hd ? (
              <>
                <Row label="Hotel" value={hd.hotelName || hd.hotel_name || '—'} />
                <Row label="City" value={hd.cityName || hd.city_name || '—'} />
                <Row label="Check-in" value={hd.checkIn || hd.check_in || '—'} />
                <Row label="Check-out" value={hd.checkOut || hd.check_out || '—'} />
                <Row label="Nights" value={hd.nights || '—'} />
                <Row label="Rooms" value={hd.rooms || '—'} />
              </>
            ) : fd ? (
              <>
                <Row label="Route" value={`${fd.from || fd.origin} → ${fd.to || fd.destination}`} />
                <Row label="Date" value={fd.date || fd.departure_date || '—'} />
                <Row label="Airline" value={`${fd.airline || ''}${fd.flightNum || fd.flight_num ? ` ${fd.flightNum || fd.flight_num}` : ''}`} />
                <Row label="Departure" value={fd.departTime || fd.depart_time || '—'} />
                <Row label="Arrival" value={fd.arrivalTime || fd.arrival_time || '—'} />
              </>
            ) : <div className="apprd-no-data">No trip details</div>}
          </div>

          {/* Business details */}
          <div className="apprd-card">
            <div className="apprd-section-label">Business Details</div>
            <Row label="Department"   value={approval.dept || '—'} />
            <Row label="Cost Center"  value={approval.cost_center || '—'} />
            <Row label="Purpose"      value={approval.purpose || '—'} />
            <Row label="Requested By" value={approval.requester?.work_email || '—'} />
            <Row label="Submitted"    value={new Date(approval.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          </div>

          {/* Reason / notes */}
          {approval.notes && (
            <div className="apprd-notes-card">
              <div className="apprd-notes-label">Reason for Exceeding Policy</div>
              <p className="apprd-notes-text">{approval.notes}</p>
            </div>
          )}

          {/* Rejection comment */}
          {approval.status === 'rejected' && approval.comment && (
            <div className="apprd-rejection-card">
              <div className="apprd-rejection-label">Rejection Reason</div>
              <p className="apprd-rejection-text">{approval.comment}</p>
            </div>
          )}

          {/* Message thread */}
          <div className="apprd-card">
            <div className="apprd-section-label">
              Clarification Thread {messages.length > 0 ? `(${messages.length})` : ''}
            </div>
            {messages.length === 0 ? (
              <div className="apprd-no-messages">No messages yet</div>
            ) : (
              <div className="apprd-messages-list">
                {messages.map(msg => {
                  const isAdmin = msg.sender_type === 'admin'
                  return (
                    <div key={msg.id} className={`apprd-msg-row ${isAdmin ? 'apprd-msg-row--admin' : ''}`}>
                      <div className={`apprd-msg-bubble ${isAdmin ? 'apprd-msg-bubble--admin' : ''}`}>
                        <div className={`apprd-msg-sender ${isAdmin ? 'apprd-msg-sender--admin' : ''}`}>
                          {isAdmin ? 'Manager' : 'Employee'}
                        </div>
                        <div className="apprd-msg-text">{msg.message}</div>
                        <div className="apprd-msg-time">
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — amount + actions */}
        <div className="apprd-right-col">
          <div className="apprd-card">
            <div className="apprd-section-label">Request Amount</div>
            <div className="apprd-amount">₹{Number(approval.amount).toLocaleString('en-IN')}</div>
            {approval.approved_amount && (
              <div className="apprd-approved-amount">
                Approved: ₹{Number(approval.approved_amount).toLocaleString('en-IN')}
              </div>
            )}
            {approval.expires_at && (
              <div className="apprd-expiry">
                Expires: {new Date(approval.expires_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className="apprd-reviewer">
              Reviewer: {approval.reviewer?.work_email || <span className="apprd-not-assigned">Not assigned</span>}
            </div>
          </div>

          {approval.status === 'pending' && (
            <div className="apprd-card apprd-actions-card">
              <div className="apprd-section-label apprd-section-label--tight">Actions</div>
              <button
                onClick={() => doAction('approve')}
                disabled={acting}
                className="apprd-btn-approve"
              >
                {acting ? 'Processing…' : '✓ Approve Request'}
              </button>
              <button
                onClick={() => doAction('reject')}
                disabled={acting}
                className="apprd-btn-reject"
              >
                ✕ Reject Request
              </button>
            </div>
          )}

          {approval.status !== 'pending' && (
            <div className={`apprd-result-card ${approval.status === 'approved' ? 'apprd-result-card--approved' : 'apprd-result-card--rejected'}`}>
              {approval.status === 'approved' ? '✓ Request approved' : '✕ Request rejected'}
              {approval.reviewed_at && (
                <div className={`apprd-result-time ${approval.status === 'approved' ? 'apprd-result-time--approved' : 'apprd-result-time--rejected'}`}>
                  {new Date(approval.reviewed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
