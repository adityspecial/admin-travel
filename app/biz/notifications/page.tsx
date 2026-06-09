'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface Notification { id: string; type: string; title: string; body: string; read_at: string | null; created_at: string; metadata: any }

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  approval_request:  { icon: '⏳', color: 'badge-yellow' },
  approval_decision: { icon: '✅', color: 'badge-green'  },
  policy_violation:  { icon: '⚠️', color: 'badge-red'    },
  wallet_low:        { icon: '💰', color: 'badge-yellow' },
  blackout_warning:  { icon: '🚫', color: 'badge-gray'   },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread'>('all')

  useEffect(() => { load() }, [filter])

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/biz/notifications?unread=${filter === 'unread'}`)
      .then(d => setItems(d.notifications ?? []))
      .finally(() => setLoading(false))
  }

  async function markRead(id: string) {
    await adminFetch('/api/admin/biz/notifications', {
      method: 'PATCH', body: JSON.stringify({ id }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  async function markAllRead() {
    await adminFetch('/api/admin/biz/notifications', {
      method: 'PATCH', body: JSON.stringify({ markAllRead: true }),
    })
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const unreadCount = items.filter(n => !n.read_at).length
  const visible    = filter === 'unread' ? items.filter(n => !n.read_at) : items
  const { slice: pageNotifs, page, setPage, total } = usePagination(visible, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read ({unreadCount})</button>
        )}
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Filter */}
          <div className="segmented-row">
            <button className={`segment-btn ${filter === 'all'    ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`segment-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* List */}
          <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="empty-state">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet.'}
              </div>
            ) : pageNotifs.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? { icon: '🔔', color: 'badge-blue' }
              return (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.read_at ? 'transparent' : 'var(--accent-lt)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                      <span className={`badge ${cfg.color}`} style={{ fontSize: 10 }}>{n.type.replace(/_/g, ' ')}</span>
                      {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{n.body}</p>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read_at && (
                    <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => markRead(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              )
            })}
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>

        </div>
      </div>
    </div>
  )
}
