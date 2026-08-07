'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

// Visa and package caps have no approval-tiers/eligibility system behind them
// (unlike flight/hotel/cab/insurance) — just a flat spend cap + buffer,
// written straight to biz_organizations via /api/admin/biz/policy.
const SEL = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, background: '#fff' }

interface Props { capField: 'visaCap' | 'packageCap'; bufferField: 'visaCapBuffer' | 'packageCapBuffer'; title: string; unit: string }

export function SimpleCapPolicy({ capField, bufferField, title, unit }: Props) {
  const [cap, setCap] = useState('0')
  const [buffer, setBuffer] = useState('0')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminFetch('/api/admin/biz/policy')
      .then(d => {
        setCap(String(d.policy?.[capField === 'visaCap' ? 'visa_cap' : 'package_cap'] ?? 0))
        setBuffer(String(d.policy?.[bufferField === 'visaCapBuffer' ? 'visa_cap_buffer' : 'package_cap_buffer'] ?? 0))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capField, bufferField])

  async function save() {
    setSaving(true)
    await adminFetch('/api/admin/biz/policy', {
      method: 'PATCH',
      body: JSON.stringify({ [capField]: Number(cap) || 0, [bufferField]: Number(buffer) || 0 }),
    }).catch(() => {})
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding: 40, fontSize: 14, color: '#9CA3AF' }}>Loading…</div>

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' as const, marginBottom: 20 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>{title} Policy</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Spend cap for {title.toLowerCase()} bookings.</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: '10px 26px', background: saved ? '#16A34A' : '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: '0.08em', padding: '12px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>BUDGET</div>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{title} Cap ({unit})</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Bookings above this amount require manager approval.</div>
          <input type="number" value={cap} onChange={e => setCap(e.target.value)} placeholder="0" style={{ ...SEL, width: 200 }} />
        </div>
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Approval Buffer</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>A booking exceeding the cap above by up to this amount still books without approval.</div>
          <input type="number" value={buffer} onChange={e => setBuffer(e.target.value)} placeholder="0" style={{ ...SEL, width: 200 }} />
        </div>
      </div>
    </div>
  )
}
