'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Dispute {
  id: string; reason: string; status: 'open' | 'resolved'; admin_response: string | null
  created_at: string; resolved_at: string | null
  source: 'partner' | 'biz'
  booking_type: string | null
  partner_bookings?: { booking_ref: string; booking_type: string; customer_name: string | null }
  partner_agents?: { agency_name: string; agent_code: string; email: string }
  biz_organizations?: { name: string; org_code: string }
  biz_members?: { work_email: string }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BookingDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('open')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  function load() {
    setLoading(true)
    const qs = status ? `?status=${status}` : ''
    adminFetch(`/api/admin/super/booking-disputes${qs}`)
      .then(d => setDisputes(d.disputes ?? []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [status]) // eslint-disable-line

  async function resolve(id: string) {
    await adminFetch(`/api/admin/super/booking-disputes/${id}`, {
      method: 'PATCH', body: JSON.stringify({ adminResponse: responseText }),
    }).catch(() => {})
    setResolvingId(null); setResponseText('')
    load()
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Booking Disputes</h2>
        <span className="topbar-meta">Problems raised on a specific booking, by partner agents or corporate members</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Filter</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px' }}>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="">All</option>
              </select>
            </div>
          </section>

          <div className="table-card">
            <table>
              <thead>
                <tr><th>Raised</th><th>Source</th><th>Raised By</th><th>Booking</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading…</td></tr>
                ) : disputes.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No disputes.</td></tr>
                ) : disputes.map(d => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(d.created_at)}</td>
                    <td><span className={`badge ${d.source === 'partner' ? 'badge-blue' : 'badge-purple'}`}>{d.source === 'partner' ? 'Partner' : 'Corporate'}</span></td>
                    <td>
                      {d.source === 'partner' ? (
                        <>{d.partner_agents?.agency_name ?? '--'} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({d.partner_agents?.agent_code})</span></>
                      ) : (
                        <>{d.biz_organizations?.name ?? '--'} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({d.biz_members?.work_email})</span></>
                      )}
                    </td>
                    <td><code style={{ fontSize: 11 }}>{d.partner_bookings?.booking_ref ?? d.booking_type ?? '--'}</code></td>
                    <td style={{ maxWidth: 320, fontSize: 13 }}>{d.reason}</td>
                    <td><span className={`badge ${d.status === 'open' ? 'badge-yellow' : 'badge-green'}`}>{d.status}</span></td>
                    <td>
                      {d.status === 'open' && (
                        resolvingId === d.id ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Response"
                              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, width: 140 }} />
                            <button className="btn btn-primary btn-sm" onClick={() => resolve(d.id)}>Save</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setResolvingId(d.id); setResponseText('') }}>Resolve</button>
                        )
                      )}
                      {d.status === 'resolved' && d.admin_response && (
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{d.admin_response}</span>
                      )}
                    </td>
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
