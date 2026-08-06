'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import '@/components/ui/ConfirmModal.css'
import { Tag, PencilLine, History } from 'lucide-react'
import type { Promo } from './page'

interface UsageRecord {
  id: string
  profile_id: string
  booking_type: string
  booking_id: string
  discount_amount: number
  used_at: string
}

const BLANK_FORM = {
  code: '', description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_booking_amount: '', max_discount_amount: '',
  max_uses: '', uses_per_user: '1',
  applicable_to: 'all',
  valid_from: '', valid_until: '',
}

// ── Create Modal ──────────────────────────────────────────────────────────────
export function CreatePromoModal({
  onClose, onCreated,
}: {
  onClose: () => void
  onCreated: (p: Promo) => void
}) {
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const body: Record<string, any> = {
        code:           form.code,
        discount_type:  form.discount_type,
        discount_value: Number(form.discount_value),
        valid_from:     form.valid_from,
        valid_until:    form.valid_until,
        uses_per_user:  Number(form.uses_per_user),
        applicable_to:  form.applicable_to === 'all' ? null : form.applicable_to,
      }
      if (form.description)         body.description         = form.description
      if (form.min_booking_amount)  body.min_booking_amount  = Number(form.min_booking_amount)
      if (form.max_discount_amount) body.max_discount_amount = Number(form.max_discount_amount)
      if (form.max_uses)            body.max_uses            = Number(form.max_uses)

      const created = await adminFetch('/api/admin/super/promos', {
        method: 'POST', body: JSON.stringify(body),
      })
      const full = await adminFetch(`/api/admin/super/promos/${created.promo.id}`)
      onCreated(full.promo)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <AppPopup
      isOpen
      title="Create Promo Code"
      icon={<Tag size={22} strokeWidth={2.2} />}
      iconTone="blue"
      maxWidth={560}
      onClose={onClose}
    >
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="agents-edit-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <AppInput label="Coupon Code" required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SUMMER20" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <AppInput label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Summer sale — 20% off all flights" />
          </div>

          <div className="app-input-group">
            <label className="app-input-label">Discount Type</label>
            <select className="app-input" value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs)</option>
            </select>
          </div>
          <AppInput
            label="Discount Value" type="number" min="0.01" step="any" required
            value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
            placeholder={form.discount_type === 'percentage' ? '20' : '500'}
          />

          <AppInput label="Min Booking Amount (Rs)" type="number" min="0" value={form.min_booking_amount} onChange={e => set('min_booking_amount', e.target.value)} placeholder="Optional" />
          <AppInput label="Max Discount Cap (Rs)" type="number" min="0" value={form.max_discount_amount} onChange={e => set('max_discount_amount', e.target.value)} placeholder="Optional" />

          <AppInput label="Total Uses Limit" type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Unlimited" />
          <AppInput label="Uses Per User" type="number" min="1" value={form.uses_per_user} onChange={e => set('uses_per_user', e.target.value)} />

          <div className="app-input-group">
            <label className="app-input-label">Applicable To</label>
            <select className="app-input" value={form.applicable_to} onChange={e => set('applicable_to', e.target.value)}>
              <option value="all">All bookings</option>
              <option value="flights">Flights only</option>
              <option value="hotels">Hotels only</option>
            </select>
          </div>
          <div />

          <AppInput label="Valid From" type="date" required value={form.valid_from} onChange={e => set('valid_from', e.target.value)} />
          <AppInput label="Valid Until" type="date" required value={form.valid_until} onChange={e => set('valid_until', e.target.value)} />
        </div>

        <div className="app-popup-footer">
          <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={saving}>
            {saving ? 'Creating…' : 'Create Promo'}
          </button>
        </div>
      </form>
    </AppPopup>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
export function EditPromoModal({
  promo, onClose, onSaved,
}: {
  promo: Promo
  onClose: () => void
  onSaved: (patch: Partial<Promo>) => void
}) {
  const [form, setForm] = useState({
    description:         promo.description ?? '',
    discount_value:      String(promo.discount_value),
    min_booking_amount:  promo.min_booking_amount  != null ? String(promo.min_booking_amount)  : '',
    max_discount_amount: promo.max_discount_amount != null ? String(promo.max_discount_amount) : '',
    max_uses:            promo.max_uses            != null ? String(promo.max_uses)            : '',
    uses_per_user:       String(promo.uses_per_user),
    applicable_to:       promo.applicable_to ?? 'all',
    valid_from:          promo.valid_from?.slice(0, 10) ?? '',
    valid_until:         promo.valid_until?.slice(0, 10) ?? '',
    is_active:           promo.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(key: string, val: any) { setForm(f => ({ ...f, [key]: val })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const patch: Record<string, any> = {
        description:         form.description || null,
        discount_value:      Number(form.discount_value),
        min_booking_amount:  form.min_booking_amount  ? Number(form.min_booking_amount)  : null,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        max_uses:            form.max_uses            ? Number(form.max_uses)            : null,
        uses_per_user:       Number(form.uses_per_user),
        applicable_to:       form.applicable_to === 'all' ? null : form.applicable_to,
        valid_from:          form.valid_from,
        valid_until:         form.valid_until,
        is_active:           form.is_active,
      }
      await adminFetch(`/api/admin/super/promos/${promo.id}`, {
        method: 'PATCH', body: JSON.stringify(patch),
      })
      onSaved(patch)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <AppPopup
      isOpen
      title="Edit Promo"
      subtitle={promo.code}
      icon={<PencilLine size={22} strokeWidth={2.2} />}
      iconTone="orange"
      maxWidth={560}
      onClose={onClose}
    >
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="agents-edit-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <AppInput label="Description" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <AppInput
            label={`Discount Value (${promo.discount_type === 'percentage' ? '%' : 'Rs'})`}
            type="number" min="0.01" step="any" required
            value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
          />
          <AppInput label="Max Discount Cap (Rs)" type="number" min="0" value={form.max_discount_amount} onChange={e => set('max_discount_amount', e.target.value)} placeholder="None" />

          <AppInput label="Min Booking Amount (Rs)" type="number" min="0" value={form.min_booking_amount} onChange={e => set('min_booking_amount', e.target.value)} placeholder="None" />
          <AppInput label="Total Uses Limit" type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Unlimited" />

          <AppInput label="Uses Per User" type="number" min="1" value={form.uses_per_user} onChange={e => set('uses_per_user', e.target.value)} />
          <div className="app-input-group">
            <label className="app-input-label">Applicable To</label>
            <select className="app-input" value={form.applicable_to} onChange={e => set('applicable_to', e.target.value)}>
              <option value="all">All bookings</option>
              <option value="flights">Flights only</option>
              <option value="hotels">Hotels only</option>
            </select>
          </div>

          <div className="app-input-group">
            <label className="app-input-label">Status</label>
            <select className="app-input" value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div />

          <AppInput label="Valid From" type="date" required value={form.valid_from} onChange={e => set('valid_from', e.target.value)} />
          <AppInput label="Valid Until" type="date" required value={form.valid_until} onChange={e => set('valid_until', e.target.value)} />
        </div>

        <div className="app-popup-footer">
          <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AppPopup>
  )
}

// ── Usage Modal ───────────────────────────────────────────────────────────────
export function UsageModal({ promo, onClose }: { promo: Promo; onClose: () => void }) {
  const [usage, setUsage]     = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch(`/api/admin/super/promos/${promo.id}`)
      .then((d: { usage: UsageRecord[] }) => setUsage(d.usage ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [promo.id])

  const totalDiscount = usage.reduce((s, u) => s + (u.discount_amount ?? 0), 0)

  const columns: ColumnDef<UsageRecord>[] = [
    { key: 'profile_id', header: 'User', render: (u) => <span className="data-table-code-pill">{u.profile_id.slice(0, 14)}…</span> },
    { key: 'booking_type', header: 'Booking Type', render: (u) => <span className="badge badge-blue">{u.booking_type}</span> },
    { key: 'booking_id', header: 'Booking ID', render: (u) => <span className="data-table-muted-cell">{u.booking_id ? `${u.booking_id.slice(0, 12)}…` : '--'}</span> },
    { key: 'discount_amount', header: 'Discount', render: (u) => <span className="data-table-cell-bold">Rs {u.discount_amount.toLocaleString('en-IN')}</span> },
    {
      key: 'used_at',
      header: 'Used At',
      render: (u) => <span className="data-table-muted-cell">{new Date(u.used_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>,
    },
  ]

  return (
    <AppPopup
      isOpen
      title="Usage"
      subtitle={`${promo.code} — ${promo.current_uses} redemptions · Rs ${totalDiscount.toLocaleString('en-IN')} total discount given`}
      icon={<History size={22} strokeWidth={2.2} />}
      iconTone="teal"
      maxWidth={760}
      onClose={onClose}
    >
      <DataTable
        columns={columns}
        data={usage}
        loading={loading}
        emptyMessage="No usage records yet for this promo."
        keyExtractor={(u) => u.id}
      />
    </AppPopup>
  )
}
