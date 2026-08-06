'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { ApprovalTiersEditor, type ApprovalTier } from './ApprovalTiers'

interface S {
  require_request_form: boolean; colleague_booking: string
  allow_personal: boolean; show_personal_reports: boolean
  max_price: string; dynamic_pricing: string; dynamic_range: string
  cabin_economy: boolean; cabin_premium: boolean; cabin_business: boolean; cabin_first: boolean
  addon_meals: boolean; addon_seats: boolean; addon_baggage: boolean
  addon_fast_forward: boolean; addon_cabs: boolean; addon_insurance: boolean
  date_change: boolean; date_change_approval: boolean; date_change_skip: boolean
  // in_policy_approval/out_policy_approval are kept in sync from approval_tiers[0]
  // and approval_tiers[last] on save, purely so any old reader still checking
  // those two fields directly gets a sensible value.
  in_policy_approval: string; out_policy_approval: string
  approval_tiers?: ApprovalTier[]
  wallet_for: string; auto_booking: boolean
}

const DFLT: S = {
  require_request_form: false, colleague_booking: 'all',
  allow_personal: false, show_personal_reports: false,
  max_price: '500000', dynamic_pricing: 'no_restriction', dynamic_range: '10',
  cabin_economy: true, cabin_premium: false, cabin_business: false, cabin_first: false,
  addon_meals: true, addon_seats: true, addon_baggage: true,
  addon_fast_forward: false, addon_cabs: false, addon_insurance: false,
  date_change: true, date_change_approval: false, date_change_skip: false,
  in_policy_approval: 'none', out_policy_approval: 'none',
  wallet_for: 'none', auto_booking: false,
}

const TITLES: Record<string, string> = { domestic_flight: 'Flight' }

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

export function FlightPolicy({ type }: { type: string }) {
  const [s, setS] = useState<S>(DFLT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const upd = (k: keyof S) => (v: any) => setS(p => ({ ...p, [k]: v }))

  useEffect(() => {
    setLoading(true)
    adminFetch(`/api/admin/biz/policy/travel?type=${type}`)
      .then(d => {
        const r = d.settings ?? {}
        const maxPrice = Number(r.max_price ?? DFLT.max_price) || 0
        // No tiers saved yet — seed 2 tiers from the existing flat in/out-of-policy
        // settings so nothing changes behaviourally until an admin edits the tiers.
        const tiers: ApprovalTier[] = Array.isArray(r.approval_tiers) && r.approval_tiers.length
          ? r.approval_tiers
          : [
              { maxAmount: maxPrice, approval: r.in_policy_approval  ?? DFLT.in_policy_approval },
              { maxAmount: null,     approval: r.out_policy_approval ?? DFLT.out_policy_approval },
            ]
        setS({ ...DFLT, ...r, max_price: String(r.max_price ?? DFLT.max_price), dynamic_range: String(r.dynamic_range ?? DFLT.dynamic_range), approval_tiers: tiers })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  async function save() {
    setSaving(true)
    const tiers = s.approval_tiers ?? []
    await adminFetch('/api/admin/biz/policy/travel', {
      method: 'PATCH',
      body: JSON.stringify({
        type,
        settings: {
          ...s,
          max_price: Number(s.max_price) || null,
          dynamic_range: Number(s.dynamic_range),
          approval_tiers: tiers,
          // Kept in sync for any reader still checking the old flat fields directly.
          in_policy_approval:  tiers[0]?.approval ?? s.in_policy_approval,
          out_policy_approval: tiers[tiers.length - 1]?.approval ?? s.out_policy_approval,
        },
      }),
    }).catch(() => {})
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="pol-loading">Loading…</div>

  const RadioRow = (k: keyof S, val: string, label: string) => (
    <label key={val} className="pol-radio-row">
      <input type="radio" checked={s[k] === val} onChange={() => setS(p => ({ ...p, [k]: val }))} className="pol-radio-input" />
      {label}
    </label>
  )

  return (
    <div>
      <div className="pol-header-row">
        <div>
          <h1 className="pol-header-title">Edit {TITLES[type]} Policy</h1>
          <div className="pol-header-sub">Default Policy · General rules applicable to all employees.</div>
        </div>
        <button onClick={save} disabled={saving} className={`pol-save-btn ${saved ? 'pol-save-btn--saved' : ''}`}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      {/* BOOKING AND ELIGIBILITY */}
      <div className="pol-card">
        <Sec t="BOOKING AND ELIGIBILITY" />
        <TRow label="Require Travel Request Form" desc="Employees must submit a request form before making official bookings." v={s.require_request_form} set={upd('require_request_form')} />
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-10">Colleague / Guest Booking Eligibility</div>
          {RadioRow('colleague_booking', 'all', 'Employee can book for Colleagues and Guests')}
          {RadioRow('colleague_booking', 'colleagues_only', 'Employee can book for Colleagues but not Guests')}
          {RadioRow('colleague_booking', 'self_only', 'Employee can only book for self')}
        </div>
        <TRow label="Allow Personal (Non-Official) Bookings" desc="Employees can use corporate portal for leisure travel." v={s.allow_personal} set={upd('allow_personal')} />
        {s.allow_personal && <TRow label="Show Personal Bookings in Reports" v={s.show_personal_reports} set={upd('show_personal_reports')} />}
      </div>

      {/* BUDGET AND PAYMENT */}
      <div className="pol-card">
        <Sec t="BUDGET AND PAYMENT" />
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-4">Maximum Price per Person per Segment</div>
          <div className="pol-desc-12 pol-mb-10">Amount beyond this limit will be out of policy. Leave blank for no limit.</div>
          <input type="number" value={s.max_price} onChange={e => setS(p => ({ ...p, max_price: e.target.value }))} placeholder="e.g. 10000" className="pol-select pol-input-w200" />
        </div>
        <div className="pol-block--plain">
          <div className="pol-label-13 pol-mb-10">Policy Basis Dynamic Pricing</div>
          {RadioRow('dynamic_pricing', 'no_restriction', 'No restriction based on cheapest fare')}
          {RadioRow('dynamic_pricing', 'cheapest_only', 'Only cheapest flight is in policy')}
          {RadioRow('dynamic_pricing', 'within_range', 'Flights within a % range of cheapest flight are in policy')}
          {s.dynamic_pricing === 'within_range' && (
            <div className="pol-subrow">
              <input type="number" min="1" max="100" value={s.dynamic_range} onChange={e => setS(p => ({ ...p, dynamic_range: e.target.value }))} className="pol-select pol-input-w72" />
              <span className="pol-desc-12">% above cheapest fare</span>
            </div>
          )}
        </div>
      </div>

      {/* COMFORT AND CONVENIENCE */}
      <div className="pol-card">
        <Sec t="COMFORT AND CONVENIENCE" />
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-10">Cabin Type</div>
          <div className="pol-checkbox-wrap">
            {([['cabin_economy', 'Economy'], ['cabin_premium', 'Premium Economy'], ['cabin_business', 'Business Class'], ['cabin_first', 'First Class']] as [keyof S, string][]).map(([k, l]) => (
              <label key={k} className="pol-checkbox-label">
                <input type="checkbox" checked={s[k] as boolean} onChange={e => setS(p => ({ ...p, [k]: e.target.checked }))} className="pol-checkbox-input" />
                {l}
              </label>
            ))}
          </div>
          <div className="pol-desc-12 pol-mt-8">Flights of selected classes will only be bookable.</div>
        </div>
        <div className="pol-block">
          <div className="pol-subsection-title">Airline Add-ons</div>
          {([['addon_meals', 'Meals on Flight', 'Allow paid meal selection on regular fares.'],
             ['addon_seats', 'Seats', 'Allow selection of paid seats and Priority Check-in.'],
             ['addon_baggage', 'Extra Baggage', 'Over and above the baggage provided by airline.']] as [keyof S, string, string][]).map(([k, l, d]) => (
            <div key={k} className="pol-addon-row">
              <div><div className="pol-trow-label">{l}</div><div className="pol-desc-12">{d}</div></div>
              <Tog v={s[k] as boolean} set={upd(k)} />
            </div>
          ))}
        </div>
        <div className="pol-block--plain">
          <div className="pol-subsection-title">Corporate Value Add-ons</div>
          {([['addon_fast_forward', '6E Fast Forward', 'Priority Checkin, Baggage Drop and Pickup.'],
             ['addon_cabs', 'Cabs', 'Pre-book airport cabs at great prices.'],
             ['addon_insurance', 'Travel Insurance', 'Comprehensive travel protection.']] as [keyof S, string, string][]).map(([k, l, d]) => (
            <div key={k} className="pol-addon-row">
              <div><div className="pol-trow-label">{l}</div><div className="pol-desc-12">{d}</div></div>
              <Tog v={s[k] as boolean} set={upd(k)} />
            </div>
          ))}
        </div>
      </div>

      {/* DATE CHANGE */}
      <div className="pol-card">
        <Sec t="DATE CHANGE" />
        <TRow label="Date Change Allowed" desc="Allow employees to change flight dates post-booking." v={s.date_change} set={upd('date_change')} />
        {s.date_change && <>
          <TRow label="Requires Manager Approval" desc="Any date change must be approved first." v={s.date_change_approval} set={upd('date_change_approval')} />
          {s.date_change_approval && <TRow label="Allow Skip Approval" desc="Employee can skip approval for date changes." v={s.date_change_skip} set={upd('date_change_skip')} />}
        </>}
      </div>

      {/* APPROVAL AND WALLET */}
      <div className="pol-card">
        <Sec t="APPROVAL AND WALLET POLICY" />
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-4">Booking and Approval</div>
          <div className="pol-desc-12 pol-mb-12">Route approval by total booking amount — add tiers for auto-approve, manager, and HOD thresholds.</div>
          <ApprovalTiersEditor tiers={s.approval_tiers ?? []} onChange={tiers => setS(p => ({ ...p, approval_tiers: tiers }))} />
        </div>
        <div className="pol-block">
          <div className="pol-label-13 pol-mb-6">Wallet Allowed For</div>
          <select value={s.wallet_for} onChange={e => setS(p => ({ ...p, wallet_for: e.target.value }))} className="pol-select pol-select-w300">
            <option value="none">None of the Bookings</option>
            <option value="in_policy">In-Policy Bookings Only</option>
            <option value="out_policy">Out-of-Policy Bookings Only</option>
            <option value="all">All Bookings</option>
          </select>
        </div>
        <TRow label="Allow Auto-booking Post Approval" desc="Automatically complete booking and pay from wallet after approval." v={s.auto_booking} set={upd('auto_booking')} />
      </div>
    </div>
  )
}
