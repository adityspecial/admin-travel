'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { ApprovalTiersEditor, type ApprovalTier } from './ApprovalTiers'

interface S {
  require_request_form: boolean; colleague_booking: string
  dynamic_pricing: string; dynamic_range: string
  allow_personal: boolean; show_personal_reports: boolean
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
  dynamic_pricing: 'no_restriction', dynamic_range: '10',
  cabin_economy: true, cabin_premium: false, cabin_business: false, cabin_first: false,
  addon_meals: true, addon_seats: true, addon_baggage: true,
  addon_fast_forward: false, addon_cabs: false, addon_insurance: false,
  date_change: true, date_change_approval: false, date_change_skip: false,
  in_policy_approval: 'none', out_policy_approval: 'none',
  wallet_for: 'none', auto_booking: false,
}

const TITLES: Record<string, string> = { domestic_flight: 'Flight' }
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

export function FlightPolicy({ type }: { type: string }) {
  const [s, setS] = useState<S>(DFLT)
  const [orgCap, setOrgCap] = useState<number | null>(null)
  const [orgCapBuffer, setOrgCapBuffer] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const upd = (k: keyof S) => (v: any) => setS(p => ({ ...p, [k]: v }))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminFetch(`/api/admin/biz/policy/travel?type=${type}`),
      adminFetch('/api/admin/biz/policy'),
    ])
      .then(([d, p]) => {
        const r = d.settings ?? {}
        // The org's own flight cap+buffer (edited on the Caps page) is the
        // single source of truth for tier[0]'s boundary — this used to be a
        // separately-stored max_price/buffer here that could silently
        // diverge from the real cap (e.g. a superadmin raising the cap via
        // admin/super/orgs never touched this). resolveApproval() already
        // ignores whatever's stored in tier[0].maxAmount in favor of the
        // live cap, so there's no reason to store or edit it here at all.
        const cap = p.policy?.flight_cap != null ? Number(p.policy.flight_cap) : null
        setOrgCap(cap)
        setOrgCapBuffer(Number(p.policy?.flight_cap_buffer ?? 0))
        // No tiers saved yet — seed 2 tiers from the existing flat in/out-of-policy
        // settings so nothing changes behaviourally until an admin edits the tiers.
        const tiers: ApprovalTier[] = Array.isArray(r.approval_tiers) && r.approval_tiers.length
          ? r.approval_tiers
          : [
              { maxAmount: cap, approval: r.in_policy_approval  ?? DFLT.in_policy_approval },
              { maxAmount: null, approval: r.out_policy_approval ?? DFLT.out_policy_approval },
            ]
        setS({ ...DFLT, ...r, dynamic_range: String(r.dynamic_range ?? DFLT.dynamic_range), approval_tiers: tiers })
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

  if (loading) return <div style={{ padding: 40, fontSize: 14, color: '#9CA3AF' }}>Loading…</div>

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' as const, marginBottom: 20 }

  const RadioRow = (k: keyof S, val: string, label: string) => (
    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
      <input type="radio" checked={s[k] === val} onChange={() => setS(p => ({ ...p, [k]: val }))} style={{ accentColor: '#E31E24' }} />
      {label}
    </label>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>Edit {TITLES[type]} Policy</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Default Policy · General rules applicable to all employees.</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: '10px 26px', background: saved ? '#16A34A' : '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      {/* BOOKING AND ELIGIBILITY */}
      <div style={card}>
        <Sec t="BOOKING AND ELIGIBILITY" />
        <TRow label="Require Travel Request Form" desc="Employees must submit a request form before making official bookings." v={s.require_request_form} set={upd('require_request_form')} />
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Colleague / Guest Booking Eligibility</div>
          {RadioRow('colleague_booking', 'all', 'Employee can book for Colleagues and Guests')}
          {RadioRow('colleague_booking', 'colleagues_only', 'Employee can book for Colleagues but not Guests')}
          {RadioRow('colleague_booking', 'self_only', 'Employee can only book for self')}
        </div>
        <TRow label="Allow Personal (Non-Official) Bookings" desc="Employees can use myBiz for leisure travel." v={s.allow_personal} set={upd('allow_personal')} />
        {s.allow_personal && <TRow label="Show Personal Bookings in Reports" v={s.show_personal_reports} set={upd('show_personal_reports')} />}
      </div>

      {/* BUDGET AND PAYMENT */}
      <div style={card}>
        <Sec t="BUDGET AND PAYMENT" />
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Maximum Price per Person per Segment</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Set on the <strong>Caps</strong> page — the same value used for the flat cap and the approval tiers below.</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{orgCap != null ? `₹${orgCap.toLocaleString('en-IN')}` : 'No limit'}</div>
            {orgCapBuffer > 0 && <div style={{ fontSize: 11, color: '#9CA3AF' }}>+ ₹{orgCapBuffer.toLocaleString('en-IN')} buffer</div>}
          </div>
        </div>
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Policy Basis Dynamic Pricing</div>
          {RadioRow('dynamic_pricing', 'no_restriction', 'No restriction based on cheapest fare')}
          {RadioRow('dynamic_pricing', 'cheapest_only', 'Only cheapest flight is in policy')}
          {RadioRow('dynamic_pricing', 'within_range', 'Flights within a % range of cheapest flight are in policy')}
          {s.dynamic_pricing === 'within_range' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginLeft: 22 }}>
              <input type="number" min="1" max="100" value={s.dynamic_range} onChange={e => setS(p => ({ ...p, dynamic_range: e.target.value }))} style={{ ...SEL, width: 72 }} />
              <span style={{ fontSize: 13, color: '#6B7280' }}>% above cheapest fare</span>
            </div>
          )}
        </div>
      </div>

      {/* COMFORT AND CONVENIENCE */}
      <div style={card}>
        <Sec t="COMFORT AND CONVENIENCE" />
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Cabin Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 20 }}>
            {([['cabin_economy', 'Economy'], ['cabin_premium', 'Premium Economy'], ['cabin_business', 'Business Class'], ['cabin_first', 'First Class']] as [keyof S, string][]).map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={s[k] as boolean} onChange={e => setS(p => ({ ...p, [k]: e.target.checked }))} style={{ accentColor: '#E31E24' }} />
                {l}
              </label>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Flights of selected classes will only be bookable.</div>
        </div>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Airline Add-ons</div>
          {([['addon_meals', 'Meals on Flight', 'Allow paid meal selection on regular fares.'],
             ['addon_seats', 'Seats', 'Allow selection of paid seats and Priority Check-in.'],
             ['addon_baggage', 'Extra Baggage', 'Over and above the baggage provided by airline.']] as [keyof S, string, string][]).map(([k, l, d]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{l}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{d}</div></div>
              <Tog v={s[k] as boolean} set={upd(k)} />
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Corporate Value Add-ons</div>
          {([['addon_fast_forward', '6E Fast Forward', 'Priority Checkin, Baggage Drop and Pickup.'],
             ['addon_cabs', 'Cabs', 'Pre-book airport cabs at great prices.'],
             ['addon_insurance', 'Travel Insurance', 'Comprehensive travel protection.']] as [keyof S, string, string][]).map(([k, l, d]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{l}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{d}</div></div>
              <Tog v={s[k] as boolean} set={upd(k)} />
            </div>
          ))}
        </div>
      </div>

      {/* DATE CHANGE */}
      <div style={card}>
        <Sec t="DATE CHANGE" />
        <TRow label="Date Change Allowed" desc="Allow employees to change flight dates post-booking." v={s.date_change} set={upd('date_change')} />
        {s.date_change && <>
          <TRow label="Requires Manager Approval" desc="Any date change must be approved first." v={s.date_change_approval} set={upd('date_change_approval')} />
          {s.date_change_approval && <TRow label="Allow Skip Approval" desc="Employee can skip approval for date changes." v={s.date_change_skip} set={upd('date_change_skip')} />}
        </>}
      </div>

      {/* APPROVAL AND WALLET */}
      <div style={card}>
        <Sec t="APPROVAL AND WALLET POLICY" />
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Booking and Approval</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Route approval by total booking amount — add tiers for auto-approve, manager, and HOD thresholds.</div>
          <ApprovalTiersEditor tiers={s.approval_tiers ?? []} onChange={tiers => setS(p => ({ ...p, approval_tiers: tiers }))} baseCap={orgCap} />
        </div>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Wallet Allowed For</div>
          <select value={s.wallet_for} onChange={e => setS(p => ({ ...p, wallet_for: e.target.value }))} style={{ ...SEL, maxWidth: 300 }}>
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
