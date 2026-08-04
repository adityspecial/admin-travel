'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Entry {
  id: string
  actor_email: string
  portal: 'super' | 'biz'
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, any> | null
  created_at: string
}

const PER_PAGE = 50

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [actor,   setActor]   = useState('')
  const [action,  setAction]  = useState('')

  function load() {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
    if (actor)  sp.set('actor', actor)
    if (action) sp.set('action', action)
    adminFetch(`/api/admin/super/audit-log?${sp}`)
      .then((d: { entries: Entry[]; total: number }) => { setEntries(d.entries ?? []); setTotal(d.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  function search() {
    setPage(1)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <div className="admin-topbar">
        <h2>Admin Audit Log</h2>
        <span className="topbar-meta">{total.toLocaleString('en-IN')} actions recorded</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <div className="surface-card">
            <div className="table-toolbar">
              <input
                className="toolbar-search"
                style={{ maxWidth: 260 }}
                placeholder="Filter by actor email..."
                value={actor}
                onChange={e => setActor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
              <input
                className="toolbar-search"
                style={{ maxWidth: 220 }}
                placeholder="Filter by action prefix (e.g. payment.)"
                value={action}
                onChange={e => setAction(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
              <button className="btn btn-primary btn-sm" onClick={search}>Filter</button>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Portal</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No audit entries found.</td></tr>
                ) : entries.map(e => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-soft)' }}>{fmtDate(e.created_at)}</td>
                    <td>{e.actor_email}</td>
                    <td><span className="badge">{e.portal}</span></td>
                    <td><code style={{ fontWeight: 700 }}>{e.action}</code></td>
                    <td>{e.target_type ? <span>{e.target_type}{e.target_id ? ` · ${e.target_id.slice(0, 8)}` : ''}</span> : <span style={{ color: 'var(--text-faint)' }}>--</span>}</td>
                    <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-soft)', fontSize: 12 }}>
                      {e.details ? JSON.stringify(e.details) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="page-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ fontSize: 13, color: 'var(--text-soft)', padding: '0 8px' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
