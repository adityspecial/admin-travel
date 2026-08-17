'use client'
import { Fragment, useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface WebhookEvent {
  id: string; razorpay_event_id: string; event_type: string
  payload: Record<string, unknown> | null; received_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function WebhookEventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [type, setType] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    adminFetch(`/api/admin/super/webhook-events?${qs.toString()}`)
      .then(d => setEvents(d.events ?? []))
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div>
      <div className="admin-topbar">
        <h2>Webhook Events</h2>
        <span className="topbar-meta">Razorpay webhook hits, what was received and when. TekTravels/TBO has no webhook mechanism — nothing to log there.</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Filter</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Event Type
                <input value={type} onChange={e => setType(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                  placeholder="e.g. payment.captured"
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 220 }} />
              </label>
              <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Recent Events</div>
                <div className="card-copy">Most recent 100 by default. Click a row to see the raw payload.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Received</th><th>Event Type</th><th>Razorpay Event ID</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={3} className="empty-state">{permissionDenied ? <PermissionDenied message={error} /> : <span style={{ color: '#DC2626' }}>{error}</span>}</td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan={3} className="empty-state">No webhook events recorded yet.</td></tr>
                ) : events.map(ev => (
                  <Fragment key={ev.id}>
                    <tr onClick={() => setExpanded(expanded === ev.id ? null : ev.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ev.received_at)}</td>
                      <td><span className="badge badge-yellow">{ev.event_type}</span></td>
                      <td><code style={{ fontSize: 11 }}>{ev.razorpay_event_id}</code></td>
                    </tr>
                    {expanded === ev.id && (
                      <tr>
                        <td colSpan={3} style={{ background: '#F9FAFB', padding: 16 }}>
                          <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                            {ev.payload ? JSON.stringify(ev.payload, null, 2) : 'No payload stored for this event (recorded before payload capture was added).'}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
