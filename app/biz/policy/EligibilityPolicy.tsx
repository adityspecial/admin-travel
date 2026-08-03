'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { ApprovalTiersEditor, type ApprovalTier } from './ApprovalTiers'

interface S {
  colleague_booking: string
  // Kept in sync from approval_tiers[0]/[last] on save for any old reader
  // still checking these two fields directly.
  in_policy_approval: string
  out_policy_approval: string
  approval_tiers?: ApprovalTier[]
}

const DFLT: S = { colleague_booking: 'all', in_policy_approval: 'none', out_policy_approval: 'manager' }

function Sec({ t }: { t: string }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: '0.08em', padding: '12px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>{t}</div>
}

export function EligibilityPolicy({ type, title }: { type: string; title: string }) {
  const [s, setS] = useState<S>(DFLT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminFetch(`/api/admin/biz/policy/travel?type=${type}`),
      adminFetch('/api/admin/biz/policy'),
    ])
      .then(([d, p]) => {
        const r = d.settings ?? {}
        const cap = Number(type === 'hotel' ? p.policy?.hotel_cap : p.policy?.cab_cap) || 0
        const tiers: ApprovalTier[] = Array.isArray(r.approval_tiers) && r.approval_tiers.length
          ? r.approval_tiers
          : [
              { maxAmount: cap, approval: r.in_policy_approval  ?? DFLT.in_policy_approval },
              { maxAmount: null, approval: r.out_policy_approval ?? DFLT.out_policy_approval },
            ]
        setS({ ...DFLT, ...r, approval_tiers: tiers })
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
          approval_tiers: tiers,
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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>Edit {title} Policy</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Default Policy · General rules applicable to all employees.</div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: '10px 26px', background: saved ? '#16A34A' : '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Policy'}
        </button>
      </div>

      <div style={card}>
        <Sec t="BOOKING ELIGIBILITY" />
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Colleague / Guest Booking Eligibility</div>
          {RadioRow('colleague_booking', 'all', 'Employee can book for Colleagues and Guests')}
          {RadioRow('colleague_booking', 'colleagues_only', 'Employee can book for Colleagues but not Guests')}
          {RadioRow('colleague_booking', 'self_only', 'Employee can only book for self')}
        </div>
      </div>

      <div style={card}>
        <Sec t="APPROVAL POLICY" />
        <div style={{ padding: '14px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Route approval by total booking amount</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Add tiers for auto-approve, manager, and HOD thresholds.</div>
          <ApprovalTiersEditor tiers={s.approval_tiers ?? []} onChange={tiers => setS(p => ({ ...p, approval_tiers: tiers }))} />
        </div>
      </div>
    </div>
  )
}
