'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppPopup } from '@/components/ui/AppPopup'
import { AppInput } from '@/components/ui/AppInput'
import { Layers, CheckCircle2, PauseCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import './markup.css'

interface Markup {
  id: string
  segment: string
  component: 'markup' | 'gateway_fee'
  airline_code: string | null
  markup_type: 'fixed' | 'percentage'
  markup_value: number
  is_active: boolean
}

// Products with a real search→booking flow that actually calls
// resolveFeeQuote() today are Flight and Hotel — every other product's
// markup row can be configured here but has no live pricing effect yet
// (mypartner has no booking route at all for Bus/Cab/Package, and
// Insurance's route doesn't call the fee engine). Flagged in the table
// rather than silently pretended to work. Cab's segment keys
// (cab_outstation/cab_airport) match what /api/cabs/quote's resolveFeeQuote
// call actually uses — that route is scope:'global' only though, so a
// partner_agent-scoped row here still has nowhere to apply until mypartner
// gets its own cab booking route.
const PRODUCTS: Record<string, { label: string; segments: { key: string; label: string }[]; hasAirline: boolean; live: boolean }> = {
  flight:    { label: 'Flight',    segments: [{ key: 'flight_domestic', label: 'Domestic' }, { key: 'flight_international', label: 'International' }], hasAirline: true,  live: true },
  hotel:     { label: 'Hotel',     segments: [{ key: 'hotel_domestic',  label: 'Domestic' }, { key: 'hotel_international',  label: 'International' }], hasAirline: false, live: true },
  bus:       { label: 'Bus',       segments: [{ key: 'bus',       label: 'All' }], hasAirline: false, live: false },
  cab:       { label: 'Cab',       segments: [{ key: 'cab_outstation', label: 'Outstation' }, { key: 'cab_airport', label: 'Airport Transfer' }], hasAirline: false, live: false },
  insurance: { label: 'Insurance', segments: [{ key: 'insurance', label: 'All' }], hasAirline: false, live: false },
  package:   { label: 'Package',   segments: [{ key: 'package',   label: 'All' }], hasAirline: false, live: false },
  visa:      { label: 'Visa',      segments: [{ key: 'visa',      label: 'All' }], hasAirline: false, live: false },
}

const SEGMENT_TO_PRODUCT = new Map<string, string>()
for (const [productKey, p] of Object.entries(PRODUCTS)) {
  for (const s of p.segments) SEGMENT_TO_PRODUCT.set(s.key, productKey)
}

function productLabel(segment: string) {
  const key = SEGMENT_TO_PRODUCT.get(segment)
  return key ? PRODUCTS[key].label : segment
}
function subProductLabel(segment: string) {
  const key = SEGMENT_TO_PRODUCT.get(segment)
  if (!key) return '—'
  const seg = PRODUCTS[key].segments.find(s => s.key === segment)
  return seg?.label ?? '—'
}
function isLiveSegment(segment: string) {
  const key = SEGMENT_TO_PRODUCT.get(segment)
  return key ? PRODUCTS[key].live : false
}

const EMPTY_FORM = { productKey: 'flight', segment: 'flight_domestic', component: 'markup' as 'markup' | 'gateway_fee', airlineCode: '', markupType: 'fixed' as 'fixed' | 'percentage', value: '' }

export default function PartnerMarkupsPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
  const [markups, setMarkups]   = useState<Markup[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Markup | null>(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [formSaving, setFormSaving] = useState(false)
  const [formError,  setFormError]  = useState('')

  function load() {
    if (!agentId) return
    setLoading(true)
    adminFetch('/api/admin/partner/markups', { agentId })
      .then(d => setMarkups(d.markups ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [agentId])

  async function toggleActive(id: string, current: boolean) {
    setSaving(id)
    await adminFetch('/api/admin/partner/markups', { agentId, method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setMarkups(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m))
    setSaving(null)
  }

  async function handleDelete(m: Markup) {
    if (!window.confirm(`Delete this ${productLabel(m.segment)} markup?`)) return
    await adminFetch('/api/admin/partner/markups', { agentId, method: 'DELETE', body: JSON.stringify({ id: m.id }) })
    setMarkups(prev => prev.filter(x => x.id !== m.id))
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(m: Markup) {
    const productKey = SEGMENT_TO_PRODUCT.get(m.segment) ?? 'flight'
    setEditing(m)
    setForm({ productKey, segment: m.segment, component: m.component, airlineCode: m.airline_code ?? '', markupType: m.markup_type, value: String(m.markup_value) })
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormSaving(true); setFormError('')
    try {
      if (editing) {
        const res = await adminFetch('/api/admin/partner/markups', {
          agentId, method: 'PATCH',
          body: JSON.stringify({ id: editing.id, markupType: form.markupType, value: Number(form.value) }),
        })
        setMarkups(prev => prev.map(m => m.id === editing.id ? res.markup : m))
      } else {
        const res = await adminFetch('/api/admin/partner/markups', {
          agentId, method: 'POST',
          body: JSON.stringify({
            segment: form.segment, component: form.component,
            airlineCode: PRODUCTS[form.productKey].hasAirline ? (form.airlineCode.trim().toUpperCase() || undefined) : undefined,
            markupType: form.markupType, value: Number(form.value),
          }),
        })
        setMarkups(prev => [...prev, res.markup])
      }
      setShowForm(false)
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to save markup')
    }
    setFormSaving(false)
  }

  const activeCount = markups.filter(m => m.is_active).length
  const pausedCount = markups.length - activeCount

  const columns: ColumnDef<Markup>[] = [
    {
      key: 'segment',
      header: 'Product',
      render: (m) => (
        <div>
          <span className="badge badge-blue">{productLabel(m.segment)}</span>
          {!isLiveSegment(m.segment) && <span className="badge badge-yellow markup-live-flag" style={{ display: 'flex', width: 'fit-content' }}>Not yet applied to live pricing</span>}
        </div>
      ),
    },
    {
      key: 'sub_product',
      header: 'Sub Product',
      render: (m) => m.airline_code
        ? <span className="data-table-code-pill">{m.airline_code}</span>
        : <span className="data-table-muted-cell">{subProductLabel(m.segment)}</span>,
    },
    {
      key: 'component',
      header: 'Fee Type',
      render: (m) => <span className="badge badge-blue">{m.component === 'gateway_fee' ? 'Gateway Fee' : 'Markup'}</span>,
    },
    {
      key: 'markup_type',
      header: 'Markup Type',
      render: (m) => <span className="badge badge-gray">{m.markup_type === 'percentage' ? 'Percentage' : 'Fixed'}</span>,
    },
    {
      key: 'markup_value',
      header: 'Markup Rate',
      render: (m) => <span className="data-table-cell-bold">{m.markup_type === 'percentage' ? `${m.markup_value}%` : `₹${m.markup_value}`}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (m) => <span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'Active' : 'Paused'}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (m) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => openEdit(m)}>
            <Pencil size={12} />
          </button>
          <button
            type="button" className="data-table-btn data-table-btn-edit"
            disabled={saving === m.id}
            onClick={() => toggleActive(m.id, m.is_active)}
          >
            {saving === m.id ? '…' : m.is_active ? 'Pause' : 'Activate'}
          </button>
          <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => handleDelete(m)}>
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Markups</h2>
        <span className="topbar-meta">{activeCount} active rules</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> Add New Markup
        </button>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid markup-stat-grid">
            <StatCard Icon={Layers} label="Total Rules" value={markups.length} sub="Configured markup rules" badge="All" />
            <StatCard Icon={CheckCircle2} label="Active Rules" value={activeCount} sub="Currently applied to fares" badge="Live" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={PauseCircle} label="Paused Rules" value={pausedCount} sub="Not applied to fares" badge="Inactive" iconBg="#f8fafc" iconColor="#64748b" badgeBg="#f1f5f9" badgeColor="#475569" />
          </div>

          <DataTable
            title="Markup Rules"
            subtitle="Markup and gateway fee, set on top of the base fare from Super Admin. Flight/Hotel affect real prices immediately; other products are configuration-only until their booking flow is wired up."
            columns={columns}
            data={markups}
            loading={loading}
            emptyMessage="No markup rules set."
            keyExtractor={(m) => m.id}
          />
        </div>
      </div>

      <AppPopup
        isOpen={showForm}
        title={editing ? 'Edit Markup' : 'Add New Markup'}
        subtitle={editing ? `${productLabel(editing.segment)} · ${editing.airline_code ?? subProductLabel(editing.segment)}` : undefined}
        icon={<Layers size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={440}
        onClose={() => setShowForm(false)}
      >
        {formError && <div className="login-error">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="agents-edit-grid">
            {!editing && (
              <>
                <div className="app-input-group">
                  <label className="app-input-label">Product</label>
                  <select
                    className="app-input"
                    value={form.productKey}
                    onChange={e => {
                      const productKey = e.target.value
                      setForm(f => ({ ...f, productKey, segment: PRODUCTS[productKey].segments[0].key, airlineCode: '' }))
                    }}
                  >
                    {Object.entries(PRODUCTS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
                  </select>
                </div>

                <div className="app-input-group">
                  <label className="app-input-label">Sub Product</label>
                  <select className="app-input" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                    {PRODUCTS[form.productKey].segments.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>

                {PRODUCTS[form.productKey].hasAirline && (
                  <AppInput
                    label="Airline Code (optional — blank applies to all)"
                    placeholder="e.g. 6E"
                    value={form.airlineCode}
                    onChange={e => setForm(f => ({ ...f, airlineCode: e.target.value.toUpperCase() }))}
                  />
                )}

                <div className="app-input-group">
                  <label className="app-input-label">Fee Type</label>
                  <div className="markup-type-group" role="radiogroup" aria-label="Fee type">
                    <label className={`markup-type-option ${form.component === 'markup' ? 'is-selected' : ''}`}>
                      <input type="radio" name="component" checked={form.component === 'markup'} onChange={() => setForm(f => ({ ...f, component: 'markup' }))} />
                      Markup
                    </label>
                    <label className={`markup-type-option ${form.component === 'gateway_fee' ? 'is-selected' : ''}`}>
                      <input type="radio" name="component" checked={form.component === 'gateway_fee'} onChange={() => setForm(f => ({ ...f, component: 'gateway_fee' }))} />
                      Gateway Fee
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="app-input-group">
              <label className="app-input-label">Markup Type</label>
              <div className="markup-type-group" role="radiogroup" aria-label="Markup type">
                <label className={`markup-type-option ${form.markupType === 'fixed' ? 'is-selected' : ''}`}>
                  <input type="radio" name="markupType" checked={form.markupType === 'fixed'} onChange={() => setForm(f => ({ ...f, markupType: 'fixed' }))} />
                  Fixed (₹)
                </label>
                <label className={`markup-type-option ${form.markupType === 'percentage' ? 'is-selected' : ''}`}>
                  <input type="radio" name="markupType" checked={form.markupType === 'percentage'} onChange={() => setForm(f => ({ ...f, markupType: 'percentage' }))} />
                  Percentage (%)
                </label>
              </div>
            </div>

            <AppInput
              label="Markup Rate"
              type="number" min="0" step="0.01" required
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            />
          </div>

          {!isLiveSegment(form.segment) && (
            <p className="subagent-suspend-warning">
              ⚠ This product isn't wired to live pricing yet — this rule will be saved but won't affect any real fare until it is.
            </p>
          )}

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={formSaving}>
              {formSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Markup'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
