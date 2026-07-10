'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface S {
  max_price: string
  require_approval: string   // 'none' | 'always' | 'above_cap'
  addon_flights: boolean
  addon_hotels: boolean
  addon_cabs: boolean
  addon_standalone: boolean
  auto_include: boolean
}

const DFLT: S = {
  max_price:        '3000',
  require_approval: 'above_cap',
  addon_flights:    true,
  addon_hotels:     true,
  addon_cabs:       false,
  addon_standalone: true,
  auto_include:     false,
}

const SEL = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, background: '#fff' }

function Tog({ v, set }: { v: boolean; set: (x: boolean) => void }) {
  return (
    <button onClick={() => set(!v)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: v ? '#E31E24' : '#D1D5DB', position: 'relative', flexShrink: 0 as const }}>
      <span style={{ position: 'absolute', top: 3, left: v ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
    </button>
  )
}

function Sec({ t }: { t: string }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: '0.08em', padding: '12px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>{t}</div>
}

function TRow({ label, desc, v, set }: { label: string; desc?: string; v: boolean; set: (x: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #F9FAFB', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{desc}</div>}
      </div>
      <Tog v={v} set={set} />
    </div>
  )
}

function RadioRow({ k, val, label, s, setS }: { k: keyof S; val: string; label: string; s: S; setS: (s: S) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
      <input type="radio" checked={s[k] === val} onChange={() => setS({ ...s, [k]: val })} style={{ accentColor: '#E31E24' }} />
      {label}
    </label>
  )
}

export function InsurancePolicy() {
  const [s, setS]         = useState<S>(DFLT)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [loading, setLoading] = useState(true)
  const upd = (k: keyof S) => (v: any) => setS(p => ({ ...p, [k]: v }))

  useEffect(() => {
    setLoading(true)
    adminFetch('/api/admin/biz/policy/travel?type=insurance')
      .then(d => {
        const r = d.settings ?? {}
        setS({ ...DFLT, ...r, max_price: String(r.max_price ?? DFLT.max_price) })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    await adminFetch('/api/admin/biz/policy/travel', {
      method: 'PATCH',
      body: JSON.stringify({
        type: 'insurance',
        settings: { ...s, max_price: Number(s.max_price) || null },
      }),
    }).catch(() => {})

    // Also sync insurance_cap to biz_organizations so the mobile approval gate picks it up
    if (s.max_price) {
      await adminFetch('/api/admin/biz/policy', {
        method: 'PATCH',
        body: JSON.stringify({ insuranceCap: Number(s.max_price) || null }),
      }).catch(() => {})
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding: 40, fontSize: 14, color: '#9CA3AF' }}>Loading…</div>

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' as const, marginBottom: 20 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>Insurance Policy</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Rules for travel insurance across all booking types.</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: '10px 26px', background: saved ? '#16A34A' : '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      {/* BUDGET */}
      <div style={card}>
        <Sec t="BUDGET AND APPROVAL" />
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Insurance Cap (₹ per policy)</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Policies above this amount require manager approval. Leave blank for no cap.</div>
          <input type="number" value={s.max_price} onChange={e => setS(p => ({ ...p, max_price: e.target.value }))} placeholder="e.g. 3000" style={{ ...SEL, width: 200 }} />
        </div>
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Approval Requirement</div>
          <RadioRow k="require_approval" val="none"      label="No approval needed — employees can self-book"           s={s} setS={setS} />
          <RadioRow k="require_approval" val="above_cap" label="Approval required when premium exceeds the cap above"   s={s} setS={setS} />
          <RadioRow k="require_approval" val="always"    label="Always require manager approval for any insurance purchase" s={s} setS={setS} />
        </div>
      </div>

      {/* WHERE IT APPEARS */}
      <div style={card}>
        <Sec t="WHERE INSURANCE IS OFFERED" />
        <TRow label="During Flight Bookings"  desc="Show insurance add-on on the flight review screen."     v={s.addon_flights}    set={upd('addon_flights')} />
        <TRow label="During Hotel Bookings"   desc="Show insurance add-on on the hotel review screen."      v={s.addon_hotels}     set={upd('addon_hotels')} />
        <TRow label="During Cab Bookings"     desc="Show insurance add-on on the cab review screen."        v={s.addon_cabs}       set={upd('addon_cabs')} />
        <TRow label="Standalone Insurance"    desc="Allow employees to buy insurance without a booking."    v={s.addon_standalone} set={upd('addon_standalone')} />
        <TRow label="Auto-include by default" desc="Pre-select insurance add-on on all review screens."     v={s.auto_include}     set={upd('auto_include')} />
      </div>
    </div>
  )
}
