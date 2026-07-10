'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending Review', color: '#D97706', bg: '#FEF3C7' },
  approved: { label: 'Approved',       color: '#15803D', bg: '#DCFCE7' },
  rejected: { label: 'Rejected',       color: '#DC2626', bg: '#FEF2F2' },
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
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

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
  if (!approval) return <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Not found.</div>

  const st    = STATUS_CFG[approval.status] ?? STATUS_CFG.pending
  const fd    = approval.flight_data
  const hd    = approval.hotel_data
  const isHotel = approval.booking_type === 'hotel'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#374151' }}>
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>Approval Request</h1>
        <span style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Trip summary */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 14 }}>Trip Summary</div>
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
            ) : <div style={{ color: '#9CA3AF', fontSize: 13 }}>No trip details</div>}
          </div>

          {/* Business details */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 14 }}>Business Details</div>
            <Row label="Department"   value={approval.dept || '—'} />
            <Row label="Cost Center"  value={approval.cost_center || '—'} />
            <Row label="Purpose"      value={approval.purpose || '—'} />
            <Row label="Requested By" value={approval.requester?.work_email || '—'} />
            <Row label="Submitted"    value={new Date(approval.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          </div>

          {/* Reason / notes */}
          {approval.notes && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '18px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#92400E', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 10 }}>Reason for Exceeding Policy</div>
              <p style={{ margin: 0, fontSize: 14, color: '#78350F', lineHeight: 1.6 }}>{approval.notes}</p>
            </div>
          )}

          {/* Rejection comment */}
          {approval.status === 'rejected' && approval.comment && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '18px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#991B1B', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 10 }}>Rejection Reason</div>
              <p style={{ margin: 0, fontSize: 14, color: '#991B1B', lineHeight: 1.6 }}>{approval.comment}</p>
            </div>
          )}

          {/* Message thread */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 14 }}>
              Clarification Thread {messages.length > 0 ? `(${messages.length})` : ''}
            </div>
            {messages.length === 0 ? (
              <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No messages yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(msg => {
                  const isAdmin = msg.sender_type === 'admin'
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                        background: isAdmin ? '#EFF6FF' : '#F9FAFB',
                        border: `1px solid ${isAdmin ? '#BFDBFE' : '#E5E7EB'}`,
                        borderBottomRightRadius: isAdmin ? 4 : 14,
                        borderBottomLeftRadius:  isAdmin ? 14 : 4,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: isAdmin ? '#1D4ED8' : '#6B7280', marginBottom: 4 }}>
                          {isAdmin ? 'Manager' : 'Employee'}
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{msg.message}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 14 }}>Request Amount</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>₹{Number(approval.amount).toLocaleString('en-IN')}</div>
            {approval.approved_amount && (
              <div style={{ marginTop: 8, fontSize: 14, color: '#15803D', fontWeight: 700 }}>
                Approved: ₹{Number(approval.approved_amount).toLocaleString('en-IN')}
              </div>
            )}
            {approval.expires_at && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>
                Expires: {new Date(approval.expires_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
              Reviewer: {approval.reviewer?.work_email || <span style={{ color: '#D1D5DB' }}>Not assigned</span>}
            </div>
          </div>

          {approval.status === 'pending' && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 4 }}>Actions</div>
              <button
                onClick={() => doAction('approve')}
                disabled={acting}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#15803D', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              >
                {acting ? 'Processing…' : '✓ Approve Request'}
              </button>
              <button
                onClick={() => doAction('reject')}
                disabled={acting}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              >
                ✕ Reject Request
              </button>
            </div>
          )}

          {approval.status !== 'pending' && (
            <div style={{ background: approval.status === 'approved' ? '#DCFCE7' : '#FEF2F2', border: `1px solid ${approval.status === 'approved' ? '#BBF7D0' : '#FECACA'}`, borderRadius: 12, padding: '16px 20px', fontSize: 13, fontWeight: 700, color: approval.status === 'approved' ? '#15803D' : '#DC2626', textAlign: 'center' }}>
              {approval.status === 'approved' ? '✓ Request approved' : '✕ Request rejected'}
              {approval.reviewed_at && (
                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, color: approval.status === 'approved' ? '#166534' : '#991B1B' }}>
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
