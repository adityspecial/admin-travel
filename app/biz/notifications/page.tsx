'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Notification { id: string; type: string; title: string; body: string; read_at: string | null; created_at: string; metadata: any }

const TYPE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  approval_request:  { icon: '⏳', bg: '#FEF9C3', color: '#92400E' },
  approval_decision: { icon: '✅', bg: '#DCFCE7', color: '#16A34A' },
  policy_violation:  { icon: '⚠️', bg: '#FEE2E2', color: '#DC2626' },
  wallet_low:        { icon: '💰', bg: '#FEF9C3', color: '#92400E' },
  blackout_warning:  { icon: '🚫', bg: '#F3F4F6', color: '#6B7280' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread'>('all')
  const [page, setPage]       = useState(1)
  const PER = 20

  useEffect(() => { load() }, [filter])

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/biz/notifications?unread=${filter === 'unread'}`)
      .then(d => setItems(d.notifications ?? []))
      .finally(() => setLoading(false))
  }

  async function markRead(id: string) {
    await adminFetch('/api/admin/biz/notifications', { method: 'PATCH', body: JSON.stringify({ id }) })
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  async function markAllRead() {
    await adminFetch('/api/admin/biz/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) })
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const unread  = items.filter(n => !n.read_at).length
  const visible = filter === 'unread' ? items.filter(n => !n.read_at) : items
  const slice   = visible.slice((page - 1) * PER, page * PER)
  const pages   = Math.ceil(visible.length / PER)

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>Notifications</h1>
          {unread > 0 && <span style={{ fontSize: 13, color: '#6B7280' }}>{unread} unread</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ padding: '8px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
        {([['all', 'All'], ['unread', `Unread${unread > 0 ? ` (${unread})` : ''}`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setFilter(key); setPage(1) }} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: filter === key ? 700 : 500,
            color: filter === key ? '#E31E24' : '#6B7280',
            borderBottom: filter === key ? '2px solid #E31E24' : '2px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet.'}
          </div>
        ) : (
          <>
            {slice.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? { icon: '🔔', bg: '#DBEAFE', color: '#1D4ED8' }
              return (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                  borderBottom: i < slice.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: n.read_at ? 'transparent' : '#FFF7F7',
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {!n.read_at && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E31E24', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{n.body}</p>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, display: 'block' }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read_at && (
                    <button onClick={() => markRead(n.id)} style={{ padding: '6px 12px', border: '1.5px solid #E5E7EB', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
                      Mark read
                    </button>
                  )}
                </div>
              )
            })}
            {pages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'center' }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 6, border: '1.5px solid #E5E7EB',
                    background: page === p ? '#E31E24' : 'none', color: page === p ? '#fff' : '#374151',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
