'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { BookOpen, Clock, CheckCircle2, XCircle, Check, X } from 'lucide-react'

interface Story {
  id: string
  author_name: string
  destination: string
  title: string
  excerpt: string
  image_url: string
  tag: string | null
  rating: number | null
  likes_count: number
  status: string
  rejection_reason: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending:  '● Pending Review',
  approved: '● Approved',
  rejected: '● Rejected',
}

export default function TravellerStoriesPage() {
  const [items, setItems]     = useState<Story[]>([])
  const [filter, setFilter]   = useState('pending')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [approveTarget, setApproveTarget] = useState<Story | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<Story | null>(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [acting, setActing]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/traveller-stories${filter ? `?status=${filter}` : ''}`)
      .then((d: { items: Story[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function doApprove() {
    if (!approveTarget) return
    setActing(true)
    try {
      await adminFetch(`/api/admin/super/traveller-stories/${approveTarget.id}/approve`, { method: 'POST' })
      flash('Approved — now live on the home screen.')
      setApproveTarget(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not approve'))
    } finally {
      setActing(false)
    }
  }

  async function doReject() {
    if (!rejectTarget) return
    setActing(true)
    try {
      await adminFetch(`/api/admin/super/traveller-stories/${rejectTarget.id}/reject`, {
        method: 'POST', body: JSON.stringify({ reason: rejectReason }),
      })
      flash('Rejected.')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Could not reject'))
    } finally {
      setActing(false)
    }
  }

  const pendingCount  = useMemo(() => items.filter(i => i.status === 'pending').length, [items])
  const approvedCount = useMemo(() => items.filter(i => i.status === 'approved').length, [items])
  const rejectedCount = useMemo(() => items.filter(i => i.status === 'rejected').length, [items])

  const columns: ColumnDef<Story>[] = [
    {
      key: 'story',
      header: 'Story',
      render: (it) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div className="data-table-cell-bold">{it.title}</div>
            <div className="data-table-muted-cell">by {it.author_name} · {it.destination}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'excerpt',
      header: 'Excerpt',
      render: (it) => <span className="data-table-muted-cell" style={{ maxWidth: 280, display: 'inline-block' }}>{it.excerpt}</span>,
    },
    {
      key: 'meta',
      header: 'Tag / Rating',
      render: (it) => (
        <div className="data-table-muted-cell">
          {it.tag ?? '—'}{it.rating != null ? ` · ★ ${it.rating.toFixed(1)}` : ''}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (it) => (
        <div>
          <span className={`data-table-status-pill ${it.status === 'approved' ? 'active' : it.status === 'rejected' ? 'inactive' : ''}`}>
            {STATUS_LABEL[it.status] ?? it.status}
          </span>
          {it.status === 'rejected' && it.rejection_reason && (
            <div className="data-table-muted-cell" style={{ marginTop: 4 }}>{it.rejection_reason}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (it) => it.status === 'pending' ? (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => setApproveTarget(it)}>
            <Check size={12} /><span>Approve</span>
          </button>
          <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => setRejectTarget(it)}>
            <X size={12} /><span>Reject</span>
          </button>
        </div>
      ) : <span className="data-table-muted-cell">—</span>,
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Traveller Stories</h2>
        <span className="topbar-meta">{items.length.toLocaleString('en-IN')} stories</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Clock} label="Pending Review" value={pendingCount} sub="Needs a moderation decision" badge="Action needed" />
            <StatCard Icon={CheckCircle2} label="Approved" value={approvedCount} sub="Live on the home screen" badge="Live" />
            <StatCard Icon={XCircle} label="Rejected" value={rejectedCount} sub="Not shown publicly" badge="Hidden" />
            <StatCard Icon={BookOpen} label="Total Stories" value={items.length} sub="In this view" badge="All" />
          </div>

          {msg && (
            <div className={`fc-alert ${msg.startsWith('Error') ? 'fc-alert--error' : 'fc-alert--ok'}`}>
              {msg.startsWith('Error') ? '❌ ' : '✅ '}{msg}
            </div>
          )}

          <div className="fc-filter-pills">
            {[
              { value: 'pending', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: '', label: 'All' },
            ].map(o => (
              <button key={o.value} className={`btn btn-sm ${filter === o.value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(o.value)}>
                {o.label}
              </button>
            ))}
          </div>

          <DataTable
            title="Traveller Stories"
            subtitle="User-submitted trip stories shown on the consumer home screen — review before they go live."
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="No stories in this view."
            keyExtractor={(it) => it.id}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(approveTarget)}
        title="Approve Story"
        message={`Approve "${approveTarget?.title}" by ${approveTarget?.author_name}? It will immediately become visible on the consumer home screen.`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        loading={acting}
        onConfirm={doApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        title="Reject Story"
        message={
          <div>
            <p>Reject &quot;{rejectTarget?.title}&quot; by {rejectTarget?.author_name}? It will not be shown publicly.</p>
            <textarea
              className="app-input"
              style={{ marginTop: 10, width: '100%', minHeight: 70 }}
              placeholder="Reason (optional, internal only)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        }
        confirmLabel="Reject Story"
        cancelLabel="Cancel"
        tone="danger"
        loading={acting}
        onConfirm={doReject}
        onCancel={() => { setRejectTarget(null); setRejectReason('') }}
      />
    </div>
  )
}
