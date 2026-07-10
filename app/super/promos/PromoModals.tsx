'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
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
    <div className="modal-overlay">
      <div className="form-card modal-card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800 }}>Create Promo Code</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Coupon Code *</label>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Summer sale — 20% off all flights"
              />
            </div>
            <div className="form-group">
              <label>Discount Type *</label>
              <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Discount Value *</label>
              <input
                type="number" min="0.01" step="any"
                value={form.discount_value}
                onChange={e => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? '20' : '500'}
                required
              />
            </div>
            <div className="form-group">
              <label>Min Booking Amount (Rs)</label>
              <input
                type="number" min="0"
                value={form.min_booking_amount}
                onChange={e => set('min_booking_amount', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Max Discount Cap (Rs)</label>
              <input
                type="number" min="0"
                value={form.max_discount_amount}
                onChange={e => set('max_discount_amount', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Total Uses Limit</label>
              <input
                type="number" min="1"
                value={form.max_uses}
                onChange={e => set('max_uses', e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="form-group">
              <label>Uses Per User</label>
              <input
                type="number" min="1"
                value={form.uses_per_user}
                onChange={e => set('uses_per_user', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Applicable To</label>
              <select value={form.applicable_to} onChange={e => set('applicable_to', e.target.value)}>
                <option value="all">All bookings</option>
                <option value="flights">Flights only</option>
                <option value="hotels">Hotels only</option>
              </select>
            </div>
            <div className="form-group" />
            <div className="form-group">
              <label>Valid From *</label>
              <input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Valid Until *</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} required />
            </div>
          </div>
          <div className="page-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? 'Creating...' : 'Create Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="modal-overlay">
      <div className="form-card modal-card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800 }}>Edit Promo | <code>{promo.code}</code></h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Discount Value ({promo.discount_type === 'percentage' ? '%' : 'Rs'})</label>
              <input
                type="number" min="0.01" step="any"
                value={form.discount_value}
                onChange={e => set('discount_value', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Max Discount Cap (Rs)</label>
              <input
                type="number" min="0"
                value={form.max_discount_amount}
                onChange={e => set('max_discount_amount', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="form-group">
              <label>Min Booking Amount (Rs)</label>
              <input
                type="number" min="0"
                value={form.min_booking_amount}
                onChange={e => set('min_booking_amount', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="form-group">
              <label>Total Uses Limit</label>
              <input
                type="number" min="1"
                value={form.max_uses}
                onChange={e => set('max_uses', e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="form-group">
              <label>Uses Per User</label>
              <input
                type="number" min="1"
                value={form.uses_per_user}
                onChange={e => set('uses_per_user', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Applicable To</label>
              <select value={form.applicable_to} onChange={e => set('applicable_to', e.target.value)}>
                <option value="all">All bookings</option>
                <option value="flights">Flights only</option>
                <option value="hotels">Hotels only</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.is_active ? 'active' : 'inactive'}
                onChange={e => set('is_active', e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Valid From</label>
              <input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} required />
            </div>
          </div>
          <div className="page-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

  return (
    <div className="modal-overlay">
      <div className="form-card modal-card" style={{ maxWidth: 660 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 800 }}>Usage — <code>{promo.code}</code></h3>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              {promo.current_uses} redemptions · Rs {totalDiscount.toLocaleString('en-IN')} total discount given
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        {loading ? (
          <div className="empty-state">Loading usage records...</div>
        ) : usage.length === 0 ? (
          <div className="empty-state">No usage records yet for this promo.</div>
        ) : (
          <div className="table-card" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Booking Type</th>
                  <th>Booking ID</th>
                  <th>Discount</th>
                  <th>Used At</th>
                </tr>
              </thead>
              <tbody>
                {usage.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize: 12 }}><code>{u.profile_id.slice(0, 14)}…</code></td>
                    <td><span className="badge badge-blue">{u.booking_type}</span></td>
                    <td style={{ fontSize: 12 }}><code>{u.booking_id?.slice(0, 12) ?? '—'}…</code></td>
                    <td style={{ fontWeight: 700 }}>Rs {u.discount_amount.toLocaleString('en-IN')}</td>
                    <td style={{ color: '#64748B', fontSize: 12 }}>
                      {new Date(u.used_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
