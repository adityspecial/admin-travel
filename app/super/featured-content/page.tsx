'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Sparkles, CheckCircle2, Clock, Layers, Plus, Pencil, Trash2, Layout, Tag, Plane } from 'lucide-react'

interface Item {
  id: string
  placement: string
  category: string | null
  title: string
  subtitle: string
  tag: string | null
  image_url: string | null
  bg_color: string
  icon: string
  target_from: string | null
  target_to: string | null
  static_price_label: string | null
  use_live_price: boolean
  pill1_label: string | null
  pill2_label: string | null
  deeplink: string | null
  sort_order: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
}

const PLACEMENTS = [
  { value: 'home_consumer', label: "Home — Consumer (What's New banners)" },
  { value: 'home_collection', label: 'Home — Collections' },
  { value: 'home_biz', label: 'Home — Corporate (mobile)' },
  { value: 'home_biz_web', label: 'Home — Corporate (biz-portal offers rail)' },
  { value: 'home_biz_benefits', label: 'Home — Corporate (biz-portal corporate benefits)' },
  { value: 'destination_suggestion', label: 'Destination Suggestions' },
  { value: 'nearby_getaway', label: 'Nearby Getaways' },
  { value: 'popular_destination', label: 'Popular Destinations' },
  { value: 'hotel_search', label: 'Hotel Search Page' },
  { value: 'cab_search', label: 'Cab Search Page' },
  { value: 'insurance_search', label: 'Insurance Page' },
]

const BLANK = {
  placement: 'home_consumer',
  category: '',
  title: '',
  subtitle: '',
  tag: '',
  image_url: '',
  bg_color: '#1463F3',
  icon: 'airplane',
  target_from: '',
  target_to: '',
  static_price_label: '',
  use_live_price: false,
  pill1_label: '',
  pill2_label: '',
  deeplink: '',
  sort_order: 0,
  valid_from: '',
  valid_until: '',
}

const ICON_OPTIONS = [
  'airplane',
  'bed-outline',
  'notifications-outline',
  'shield-checkmark-outline',
  'cash-outline',
  'document-text-outline',
  'gift-outline',
  'star-outline',
  'umbrella-outline',
  'car-outline',
  'globe-outline',
  'wallet-outline',
]

const COLOR_PRESETS = [
  '#1463F3',
  '#7C3AED',
  '#0891B2',
  '#059669',
  '#D97706',
  '#DC2626',
  '#0D9488',
  '#DB2777',
  '#4F46E5',
  '#92400E',
]

export default function FeaturedContentPage() {
  const [items, setItems]               = useState<Item[]>([])
  const [filter, setFilter]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [msg, setMsg]                   = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<string | null>(null)
  const [form, setForm]                 = useState(BLANK)
  const [saving, setSaving]             = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/featured-content${filter ? `?placement=${filter}` : ''}`)
      .then((d: { items: Item[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  function openCreate() {
    setEditId(null)
    setForm({ ...BLANK, placement: filter || 'home_consumer' })
    setShowForm(true)
  }

  function openEdit(it: Item) {
    setEditId(it.id)
    setForm({
      placement: it.placement,
      category: it.category ?? '',
      title: it.title,
      subtitle: it.subtitle,
      tag: it.tag ?? '',
      image_url: it.image_url ?? '',
      bg_color: it.bg_color,
      icon: it.icon,
      target_from: it.target_from ?? '',
      target_to: it.target_to ?? '',
      static_price_label: it.static_price_label ?? '',
      use_live_price: it.use_live_price,
      pill1_label: it.pill1_label ?? '',
      pill2_label: it.pill2_label ?? '',
      deeplink: it.deeplink ?? '',
      sort_order: it.sort_order,
      valid_from: it.valid_from ?? '',
      valid_until: it.valid_until ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.placement || !form.title) {
      flash('Placement and Title are required.')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        category: form.category || null,
        tag: form.tag || null,
        image_url: form.image_url || null,
        target_from: form.target_from || null,
        target_to: form.target_to || null,
        static_price_label: form.static_price_label || null,
        pill1_label: form.pill1_label || null,
        pill2_label: form.pill2_label || null,
        deeplink: form.deeplink || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        sort_order: Number(form.sort_order),
      }
      if (editId) {
        await adminFetch(`/api/admin/super/featured-content/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        flash('Updated successfully.')
      } else {
        await adminFetch('/api/admin/super/featured-content', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        flash('Created successfully.')
      }
      setShowForm(false)
      setEditId(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Failed'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(it: Item) {
    await adminFetch(`/api/admin/super/featured-content/${it.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !it.is_active }),
    })
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/featured-content/${deleteTarget.id}`, { method: 'DELETE' })
      flash('Deleted successfully.')
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      flash('Error: ' + (e.message ?? 'Delete failed'))
    } finally {
      setDeleting(false)
    }
  }

  function f(key: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((p) => ({ ...p, [key]: v }))
    }
  }

  const placementLabel = (v: string) => PLACEMENTS.find((p) => p.value === v)?.label ?? v

  const activeCount = useMemo(() => items.filter((i) => i.is_active).length, [items])
  const draftCount  = useMemo(() => items.filter((i) => !i.is_active).length, [items])

  const columns: ColumnDef<Item>[] = [
    {
      key: 'sort_order',
      header: '#',
      render: (it) => <span className="data-table-code-pill">{it.sort_order}</span>,
    },
    {
      key: 'placement',
      header: 'Placement',
      render: (it) => (
        <div>
          <span className="fc-placement-pill">
            {placementLabel(it.placement)}
          </span>
          {it.category && <div className="data-table-muted-cell fc-category-sub">{it.category}</div>}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title & Subtitle',
      render: (it) => (
        <div className="fc-title-cell">
          <div className="data-table-cell-bold">{it.title}</div>
          <div className="data-table-muted-cell fc-subtitle-cell">
            {it.subtitle}
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route / Target',
      render: (it) => (
        <span className="fc-route-cell">
          {it.target_from ? `${it.target_from}${it.target_to ? ` → ${it.target_to}` : ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price Type',
      render: (it) => (
        <span className="fc-price-cell">
          {it.use_live_price ? (
            <span className="fc-live-price-pill">● Live Price</span>
          ) : (
            it.static_price_label || '—'
          )}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Validity',
      render: (it) => (
        <span className="data-table-muted-cell fc-validity-cell">
          {it.valid_from ?? '∞'} → {it.valid_until ?? '∞'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (it) => (
        <button
          type="button"
          onClick={() => toggleActive(it)}
          className={`data-table-status-pill fc-status-toggle-btn ${it.is_active ? 'active' : 'inactive'}`}
        >
          {it.is_active ? '● Active' : '● Draft'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (it) => (
        <div className="data-table-actions">
          <button
            type="button"
            className="data-table-btn data-table-btn-edit"
            onClick={() => openEdit(it)}
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="data-table-btn data-table-btn-danger"
            onClick={() => setDeleteTarget(it)}
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
        <h2>Featured Content</h2>
        <span className="topbar-meta">{items.length.toLocaleString('en-IN')} promotional cards configured</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards */}
          <div className="stat-grid">
            <StatCard
              Icon={Sparkles}
              label="Total Promos"
              value={items.length}
              sub="App-wide promotional assets"
              badge="Promotions"
            />
            <StatCard
              Icon={CheckCircle2}
              label="Active Campaigns"
              value={activeCount}
              sub="Live on mobile & web apps"
              badge="Live"
            />
            <StatCard
              Icon={Clock}
              label="Draft Items"
              value={draftCount}
              sub="Pending publishing"
              badge="Drafts"
            />
            <StatCard
              Icon={Layers}
              label="Placements Active"
              value={PLACEMENTS.length}
              sub="Configurable app surfaces"
              badge="Surfaces"
            />
          </div>

          {/* Alert Message Banner */}
          {msg && (
            <div className={`fc-alert ${msg.startsWith('Error') ? 'fc-alert--error' : 'fc-alert--ok'}`}>
              {msg.startsWith('Error') ? '❌ ' : '✅ '}
              {msg}
            </div>
          )}

          {/* Placement Filter Pills */}
          <div className="fc-filter-pills">
            <button
              className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('')}
            >
              All Placements
            </button>
            {PLACEMENTS.map((p) => (
              <button
                key={p.value}
                className={`btn btn-sm ${filter === p.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* DataTable */}
          <DataTable
            title="Featured Promotional Assets"
            subtitle="Manage every promotional banner, collection card, and seasonal campaign across mobile and desktop applications."
            headerAction={
              <button
                className="btn btn-primary btn-sm fc-btn-icon-gap"
                onClick={openCreate}
              >
                <Plus size={14} />
                <span>New Item</span>
              </button>
            }
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="No promotional items found for this placement filter."
            keyExtractor={(it) => it.id}
          />
        </div>
      </div>

      {/* Create / Edit Item AppPopup Modal */}
      <AppPopup
        isOpen={showForm}
        title={editId ? 'Edit Featured Item' : 'New Featured Item'}
        subtitle="Configure card styling, route targeting, and live price bindings"
        icon={<Tag size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={640}
        onClose={() => {
          setShowForm(false)
          setEditId(null)
        }}
      >
        {/* Live Card Preview */}
        <div className="fc-preview-wrap">
          <div className="fc-preview-label">
            Card Live Preview
          </div>
          <div className="fc-preview-card" style={{ backgroundColor: form.bg_color }}>
            <div className="fc-preview-circle" />
            <div>
              {form.tag && (
                <div className="fc-preview-tag">
                  {form.tag}
                </div>
              )}
              <div className="fc-preview-title">
                {form.title || 'Title Here'}
              </div>
              <div className="fc-preview-subtitle">
                {form.use_live_price ? 'Live lowest fare' : form.static_price_label || form.subtitle || 'Subtitle text'}
              </div>
            </div>
            <div className="fc-preview-icon-circle">
              <Plane size={22} />
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div className="fc-form-grid">
            <div className="app-input-group">
              <label className="app-input-label">Placement *</label>
              <select className="app-input" value={form.placement} onChange={f('placement')}>
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <AppInput
              label="Category"
              value={form.category}
              onChange={f('category')}
              placeholder="e.g. flight, hotels"
            />

            <div className="fc-full-col">
              <AppInput
                label="Title *"
                required
                value={form.title}
                onChange={f('title')}
                placeholder="e.g. Goa Weekend Getaway"
              />
            </div>

            <div className="fc-full-col">
              <AppInput
                label="Subtitle"
                value={form.subtitle}
                onChange={f('subtitle')}
                placeholder="e.g. Beaches, nightlife & luxury stays"
              />
            </div>

            <AppInput
              label="Tag / Badge"
              value={form.tag}
              onChange={f('tag')}
              placeholder="e.g. Trending"
            />

            <AppInput
              label="Sort Order"
              type="number"
              value={String(form.sort_order)}
              onChange={f('sort_order')}
            />

            <AppInput
              label="Route From (IATA / City)"
              value={form.target_from}
              onChange={f('target_from')}
              placeholder="e.g. DEL"
            />

            <AppInput
              label="Route To (IATA / City)"
              value={form.target_to}
              onChange={f('target_to')}
              placeholder="e.g. BOM"
            />

            <div className="fc-full-col fc-checkbox-row">
              <input
                type="checkbox"
                checked={form.use_live_price}
                onChange={f('use_live_price')}
                id="ulp"
                className="fc-checkbox"
              />
              <label htmlFor="ulp" className="fc-checkbox-label">
                Use live lowest fare (calendar-fare) instead of a static price label
              </label>
            </div>

            {!form.use_live_price && (
              <div className="fc-full-col">
                <AppInput
                  label="Static Price Label"
                  value={form.static_price_label}
                  onChange={f('static_price_label')}
                  placeholder="e.g. from ₹2,400"
                />
              </div>
            )}

            <div className="fc-full-col">
              <AppInput
                label="Deeplink"
                value={form.deeplink}
                onChange={f('deeplink')}
                placeholder="e.g. /(app)/flights/search?from=DEL&to=BOM"
              />
            </div>

            <div className="fc-full-col">
              <AppInput
                label="Image URL (overrides color)"
                value={form.image_url}
                onChange={f('image_url')}
                placeholder="https://…"
              />
            </div>

            <div className="fc-full-col">
              <label className="app-input-label">Background Preset Color</label>
              <div className="fc-color-presets">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, bg_color: c }))}
                    className={`fc-swatch ${form.bg_color === c ? 'fc-swatch--selected' : ''}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={f('bg_color')}
                  className="fc-color-input"
                />
              </div>
            </div>
          </div>

          <div className="app-popup-footer">
            <button
              type="button"
              className="confirm-modal-btn confirm-modal-btn-cancel"
              onClick={() => {
                setShowForm(false)
                setEditId(null)
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-modal-btn confirm-modal-btn-success"
              disabled={saving}
            >
              {saving ? 'Saving…' : editId ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </AppPopup>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Featured Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
