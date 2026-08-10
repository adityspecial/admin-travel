'use client'
import { useState } from 'react'
import { adminFetch } from '@/lib/api'

const INP = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, width: '100%' }
const BLANK = {
  code: '', description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '', min_booking_amount: '', max_discount_amount: '',
  max_uses: '', uses_per_user: '1', applicable_to: 'all',
  valid_from: '', valid_until: '',
}

export function PromoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const body: Record<string, any> = {
        code: form.code, discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        valid_from: form.valid_from, valid_until: form.valid_until,
        uses_per_user: Number(form.uses_per_user),
        applicable_to: form.applicable_to === 'all' ? null : form.applicable_to,
      }
      if (form.description)         body.description         = form.description
      if (form.min_booking_amount)  body.min_booking_amount  = Number(form.min_booking_amount)
      if (form.max_discount_amount) body.max_discount_amount = Number(form.max_discount_amount)
      if (form.max_uses)            body.max_uses            = Number(form.max_uses)
      await adminFetch('/api/admin/biz/promos', { method: 'POST', body: JSON.stringify(body) })
      onCreated()
      onClose()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px', width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e' }}>Create Promo Code</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1D4ED8', marginBottom: 16 }}>
          This promo will be scoped to your organisation's members only.
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Coupon Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="CORP25" style={INP} required />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Corporate travel discount" style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Discount Type *</label>
              <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} style={{ ...INP, background: '#fff' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Discount Value *</label>
              <input type="number" min="0.01" step="any" value={form.discount_value}
                onChange={e => set('discount_value', e.target.value)} placeholder={form.discount_type === 'percentage' ? '10' : '300'} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Min Booking Amount (₹)</label>
              <input type="number" min="0" value={form.min_booking_amount} onChange={e => set('min_booking_amount', e.target.value)} placeholder="Optional" style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Max Discount Cap (₹)</label>
              <input type="number" min="0" value={form.max_discount_amount} onChange={e => set('max_discount_amount', e.target.value)} placeholder="Optional" style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Total Uses Limit</label>
              <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Unlimited" style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Uses Per User</label>
              <input type="number" min="1" value={form.uses_per_user} onChange={e => set('uses_per_user', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Applicable To</label>
              <select value={form.applicable_to} onChange={e => set('applicable_to', e.target.value)} style={{ ...INP, background: '#fff' }}>
                <option value="all">All bookings</option>
                <option value="flight">Flights only</option>
                <option value="hotel">Hotels only</option>
              </select>
            </div>
            <div />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Valid From *</label>
              <input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Valid Until *</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} style={INP} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Creating…' : 'Create Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
