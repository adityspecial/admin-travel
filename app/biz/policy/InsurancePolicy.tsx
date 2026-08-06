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

function Tog({ v, set }: { v: boolean; set: (x: boolean) => void }) {
  return (
    <button onClick={() => set(!v)} className={`pol-toggle ${v ? 'pol-toggle--on' : ''}`}>
      <span className={`pol-toggle-knob ${v ? 'pol-toggle-knob--on' : ''}`} />
    </button>
  )
}

function Sec({ t }: { t: string }) {
  return <div className="pol-sec">{t}</div>
}

function TRow({ label, desc, v, set }: { label: string; desc?: string; v: boolean; set: (x: boolean) => void }) {
  return (
    <div className="pol-trow">
      <div>
        <div className="pol-trow-label">{label}</div>
        {desc && <div className="pol-trow-desc">{desc}</div>}
      </div>
      <Tog v={v} set={set} />
    </div>
  )
}

function RadioRow({ k, val, label, s, setS }: { k: keyof S; val: string; label: string; s: S; setS: (s: S) => void }) {
  return (
    <label className="pol-radio-row">
      <input type="radio" checked={s[k] === val} onChange={() => setS({ ...s, [k]: val })} className="pol-radio-input" />
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

  if (loading) return <div className="pol-loading">Loading…</div>

  return (
    <div>
      <div className="pol-header-row">
        <div>
          <h1 className="pol-header-title">Insurance Policy</h1>
          <div className="pol-header-sub">Rules for travel insurance across all booking types.</div>
        </div>
        <button onClick={save} disabled={saving} className={`pol-save-btn ${saved ? 'pol-save-btn--saved' : ''}`}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      {/* BUDGET */}
      <div className="pol-card">
        <Sec t="BUDGET AND APPROVAL" />
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-4">Insurance Cap (₹ per policy)</div>
          <div className="pol-desc-12 pol-mb-10">Policies above this amount require manager approval. Leave blank for no cap.</div>
          <input type="number" value={s.max_price} onChange={e => setS(p => ({ ...p, max_price: e.target.value }))} placeholder="e.g. 3000" className="pol-select pol-input-w200" />
        </div>
        <div className="pol-block--plain">
          <div className="pol-label-13 pol-mb-10">Approval Requirement</div>
          <RadioRow k="require_approval" val="none"      label="No approval needed — employees can self-book"           s={s} setS={setS} />
          <RadioRow k="require_approval" val="above_cap" label="Approval required when premium exceeds the cap above"   s={s} setS={setS} />
          <RadioRow k="require_approval" val="always"    label="Always require manager approval for any insurance purchase" s={s} setS={setS} />
        </div>
      </div>

      {/* WHERE IT APPEARS */}
      <div className="pol-card">
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
