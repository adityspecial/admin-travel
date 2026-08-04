'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch } from '@/lib/api'
import { VisaEditModal } from './VisaEditModal'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { AppImageModal } from '@/components/ui/AppImageModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Pagination } from '@/components/Pagination'
import { Globe, CheckCircle2, Clock, FileText, Search, Plus, Pencil, Trash2, Globe2 } from 'lucide-react'

interface VisaSummary {
  id: string
  slug: string
  country: string
  page_title: string
  hero_image_url: string | null
  processing_time: string | null
  visa_fee_display: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

const PAGE_SIZE = 20

export default function SuperVisaPage() {
  const [visas, setVisas]               = useState<VisaSummary[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [editId, setEditId]             = useState<string | null>(null)
  const [msg, setMsg]                   = useState('')
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; subtitle?: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VisaSummary | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // New visa form state
  const [showCreate, setShowCreate] = useState(false)
  const [newCountry, setNewCountry] = useState('')
  const [newTitle, setNewTitle]     = useState('')
  const [creating, setCreating]     = useState(false)

  const load = useCallback((q: string, p: number) => {
    setLoading(true)
    adminFetch(`/api/admin/super/visa?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`)
      .then((d: { visas: VisaSummary[]; total: number }) => {
        setVisas(d.visas ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(search, page)
  }, [page, load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  async function toggleActive(v: VisaSummary) {
    await adminFetch(`/api/admin/super/visa/${v.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !v.is_active }),
    })
    load(search, page)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/visa/${deleteTarget.id}`, { method: 'DELETE' })
      flash('Visa page deleted successfully.')
      setDeleteTarget(null)
      load(search, page)
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Delete failed'))
    } finally {
      setDeleting(false)
    }
  }

  async function createVisa() {
    if (!newCountry || !newTitle) return
    setCreating(true)
    try {
      const { visa } = await adminFetch('/api/admin/super/visa', {
        method: 'POST',
        body: JSON.stringify({ country: newCountry, page_title: newTitle }),
      })
      setShowCreate(false)
      setNewCountry('')
      setNewTitle('')
      load(search, page)
      setEditId(visa.id)
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Failed'))
    } finally {
      setCreating(false)
    }
  }

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  const activeCount = useMemo(() => visas.filter((v) => v.is_active).length, [visas])
  const draftCount  = useMemo(() => visas.filter((v) => !v.is_active).length, [visas])

  const columns: ColumnDef<VisaSummary>[] = [
    {
      key: 'hero_image_url',
      header: 'Flag / Image',
      render: (v) => (
        <div
          onClick={() =>
            v.hero_image_url &&
            setPreviewImage({
              src: v.hero_image_url,
              title: `${v.country} Visa`,
              subtitle: v.page_title,
            })
          }
          style={{
            width: 56,
            height: 40,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#f1f5f9',
            flexShrink: 0,
            cursor: v.hero_image_url ? 'pointer' : 'default',
          }}
          title={v.hero_image_url ? 'Click to open full desktop preview' : undefined}
        >
          {v.hero_image_url ? (
            <img src={v.hero_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🌍
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: (v) => <span className="data-table-cell-bold">{v.country}</span>,
    },
    {
      key: 'page_title',
      header: 'Page Title',
      render: (v) => (
        <span className="data-table-muted-cell" style={{ maxWidth: 200, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {v.page_title}
        </span>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (v) => <span className="data-table-code-pill">{v.slug}</span>,
    },
    {
      key: 'processing_time',
      header: 'Processing',
      render: (v) => <span className="data-table-muted-cell">{v.processing_time ?? '—'}</span>,
    },
    {
      key: 'visa_fee_display',
      header: 'Fee',
      render: (v) => (
        <span style={{ fontWeight: 800, color: '#0f172a' }}>
          {v.visa_fee_display ?? '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (v) => (
        <button
          type="button"
          onClick={() => toggleActive(v)}
          className={`data-table-status-pill ${v.is_active ? 'active' : 'inactive'}`}
          style={{ border: 'none', cursor: 'pointer' }}
        >
          {v.is_active ? '●Active' : '●Draft'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (v) => (
        <div className="data-table-actions">
          <button
            type="button"
            className="data-table-btn data-table-btn-edit"
            onClick={() => setEditId(v.id)}
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="data-table-btn data-table-btn-danger"
            onClick={() => setDeleteTarget(v)}
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Visa Pages</h2>
        <span className="topbar-meta">{total.toLocaleString('en-IN')} visa pages in database</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards */}
          <div className="stat-grid">
            <StatCard
              Icon={Globe}
              label="Total Visa Pages"
              value={total}
              sub="Configured country pages"
              badge="Global"
            />
            <StatCard
              Icon={CheckCircle2}
              label="Active Pages"
              value={activeCount}
              sub="Published on customer site"
              badge="Live"
            />
            <StatCard
              Icon={Clock}
              label="Draft Pages"
              value={draftCount}
              sub="Unpublished drafts"
              badge="Drafts"
            />
            <StatCard
              Icon={FileText}
              label="Enquiries Portal"
              value="Applications"
              sub="View customer visa leads"
              badge="Leads"
              onClick={() => (window.location.href = '/super/visa/enquiries')}
            />
          </div>

          {/* Alert Message Banner */}
          {msg && (
            <div
              style={{
                background: msg.startsWith('Error') ? '#fef2f2' : '#dcfce7',
                color: msg.startsWith('Error') ? '#991b1b' : '#15803d',
                border: `1px solid ${msg.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {msg.startsWith('Error') ? '❌ ' : '✅ '}
              {msg}
            </div>
          )}

          {/* DataTable Card */}
          <DataTable
            title="Visa Destination Catalog"
            subtitle="Manage country visa requirements, processing times, fee structures, and page content."
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280 }}>
                  <div style={{ flex: 1 }}>
                    <AppInput
                      placeholder="Search country, title, slug..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      icon={<Search size={15} />}
                      wrapperClassName="m-0"
                      style={{ padding: '8px 12px 8px 36px', fontSize: 13 }}
                    />
                  </div>
                  {search && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSearch('')
                        setPage(1)
                        load('', 1)
                      }}
                    >
                      Clear
                    </button>
                  )}
                </form>
                <a
                  href="/super/visa/enquiries"
                  className="btn btn-muted btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FileText size={14} />
                  <span>Enquiries</span>
                </a>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreate(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} />
                  <span>New Visa Page</span>
                </button>
              </div>
            }
            columns={columns}
            data={visas}
            loading={loading}
            emptyMessage="No visa pages found matching your search filter."
            keyExtractor={(v) => v.id}
            footer={
              <Pagination
                total={total}
                page={page}
                perPage={PAGE_SIZE}
                onPage={setPage}
              />
            }
          />
        </div>
      </div>

      {/* Create Visa Page AppPopup */}
      <AppPopup
        isOpen={showCreate}
        title="New Visa Page"
        subtitle="Initialize a new country visa destination page"
        icon={<Globe2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={440}
        onClose={() => setShowCreate(false)}
      >
        <AppInput
          label="Country"
          required
          value={newCountry}
          onChange={(e) => setNewCountry(e.target.value)}
          placeholder="e.g. Dubai"
          icon={<Globe size={16} />}
        />

        <AppInput
          label="Page Title"
          required
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g. Dubai Tourist Visa"
        />

        <div className="app-popup-footer">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={() => setShowCreate(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-success"
            onClick={createVisa}
            disabled={creating || !newCountry || !newTitle}
          >
            {creating ? 'Creating…' : 'Create & Edit'}
          </button>
        </div>
      </AppPopup>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Visa Page"
        message={`Are you sure you want to delete "${deleteTarget?.page_title}"? This action cannot be undone.`}
        confirmLabel="Delete Page"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit Visa Page Modal */}
      {editId && (
        <VisaEditModal
          visaId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => {
            flash('Visa page saved successfully!')
            load(search, page)
          }}
        />
      )}

      {/* Full Desktop Image Preview Modal */}
      <AppImageModal
        isOpen={Boolean(previewImage)}
        src={previewImage?.src ?? null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}
