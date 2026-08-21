'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface Notification {
  id: string; target_type: string; target_label: string | null
  title: string; message: string; recipient_count: number; sent_count: number; created_at: string
}
interface Org { id: string; name: string }
interface Agent { id: string; agency_name: string }
interface Alert {
  id: string; type: string; title: string; body: string
  read_at: string | null; created_at: string
  org?: { name: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const [history, setHistory] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [agents, setAgents] = useState<Agent[]>([])

  const [targetType, setTargetType] = useState<'org' | 'agent' | 'all_b2c'>('org')
  const [targetId, setTargetId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadError, setLoadError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  function loadAlerts() {
    setAlertsLoading(true)
    adminFetch('/api/admin/super/notifications/inbox')
      .then(d => setAlerts(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setAlertsLoading(false))
  }

  async function markAlertRead(id: string) {
    await adminFetch('/api/admin/super/notifications/inbox', { method: 'PATCH', body: JSON.stringify({ id }) })
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a)))
  }

  async function markAllAlertsRead() {
    await adminFetch('/api/admin/super/notifications/inbox', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) })
    setAlerts(prev => prev.map(a => ({ ...a, read_at: a.read_at ?? new Date().toISOString() })))
  }

  function load() {
    setLoading(true); setLoadError(''); setPermissionDenied(false)
    adminFetch('/api/admin/super/notifications')
      .then(d => setHistory(d.notifications ?? []))
      .catch(e => { setLoadError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    loadAlerts()
    adminFetch('/api/admin/super/orgs').then(d => setOrgs(d.orgs ?? [])).catch(() => {})
    adminFetch('/api/admin/super/agents').then(d => setAgents(d.agents ?? [])).catch(() => {})
  }, [])

  async function send() {
    setError(''); setSuccess('')
    if (!title.trim() || !message.trim()) { setError('Title and message are required'); return }
    if (targetType !== 'all_b2c' && !targetId) { setError('Select a target'); return }
    setSending(true)
    try {
      const d = await adminFetch('/api/admin/super/notifications', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId: targetType === 'all_b2c' ? undefined : targetId, title, message }),
      })
      setSuccess(`Sent to ${d.notification.sent_count}/${d.notification.recipient_count} recipients`)
      setTitle(''); setMessage(''); setTargetId('')
      load()
    } catch (e: any) {
      setError(e.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Notification Center</h2>
        <span className="topbar-meta">Email a targeted message to one org, one agent, or all B2C users</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Alerts {alerts.some(a => !a.read_at) && `(${alerts.filter(a => !a.read_at).length} unread)`}</div>
                <div className="card-copy">Inbound events needing attention — new support tickets, wallet thresholds, and other system alerts.</div>
              </div>
              {alerts.some(a => !a.read_at) && (
                <button className="btn btn-ghost btn-sm" onClick={markAllAlertsRead}>Mark All Read</button>
              )}
            </div>
            <table>
              <thead>
                <tr><th>Received</th><th>Org</th><th>Title</th><th>Details</th><th></th></tr>
              </thead>
              <tbody>
                {alertsLoading ? (
                  <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No alerts yet.</td></tr>
                ) : alerts.map(a => (
                  <tr key={a.id} style={{ fontWeight: a.read_at ? 400 : 700 }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(a.created_at)}</td>
                    <td>{a.org?.name ?? '--'}</td>
                    <td>{a.title}</td>
                    <td style={{ color: '#6B7280', maxWidth: 320, fontWeight: 400 }}>{a.body}</td>
                    <td>
                      {!a.read_at && (
                        <button className="btn btn-ghost btn-sm" onClick={() => markAlertRead(a.id)}>Mark Read</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Compose</div></div></div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                  Target
                  <select value={targetType} onChange={e => { setTargetType(e.target.value as any); setTargetId('') }}
                    style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                    <option value="org">One Org</option>
                    <option value="agent">One Agent</option>
                    <option value="all_b2c">All B2C Users</option>
                  </select>
                </label>
                {targetType === 'org' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600, flex: 1 }}>
                    Org
                    <select value={targetId} onChange={e => setTargetId(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                      <option value="">Select an org…</option>
                      {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </label>
                )}
                {targetType === 'agent' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600, flex: 1 }}>
                    Agent
                    <select value={targetId} onChange={e => setTargetId(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                      <option value="">Select an agent…</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.agency_name}</option>)}
                    </select>
                  </label>
                )}
                {targetType === 'all_b2c' && (
                  <div style={{ alignSelf: 'flex-end', fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                    ⚠ Capped at the first 1,000 users (see notes)
                  </div>
                )}
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Subject"
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" rows={5}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, resize: 'vertical' as const }} />
              {error && <div style={{ color: '#DC2626', fontSize: 13 }}>{error}</div>}
              {success && <div style={{ color: '#16A34A', fontSize: 13, fontWeight: 700 }}>✓ {success}</div>}
              <div>
                <button className="btn btn-primary" onClick={send} disabled={sending}>
                  {sending ? 'Sending…' : 'Send Notification'}
                </button>
              </div>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header"><div><div className="card-title">History</div></div></div>
            <table>
              <thead>
                <tr><th>Sent</th><th>Target</th><th>Title</th><th>Recipients</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="empty-state">Loading…</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={4} className="empty-state">{permissionDenied ? <PermissionDenied message={loadError} /> : <span style={{ color: '#DC2626' }}>{loadError}</span>}</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">No notifications sent yet.</td></tr>
                ) : history.map(n => (
                  <tr key={n.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(n.created_at)}</td>
                    <td>{n.target_label ?? n.target_type}</td>
                    <td>{n.title}</td>
                    <td>{n.sent_count}/{n.recipient_count}</td>
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
