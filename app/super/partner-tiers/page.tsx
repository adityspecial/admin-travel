'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'

interface Tier {
  id: string
  name: string
  label: string
  rank: number
  gmv_threshold: number
  credit_limit_ceiling: number
  commission_pct_default: number
  sub_agent_limit: number | null
  color: string
}

type EditForm = { gmvThreshold: string; creditLimitCeiling: string; commissionPctDefault: string; subAgentLimit: string }

export default function PartnerTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>({ gmvThreshold: '', creditLimitCeiling: '', commissionPctDefault: '', subAgentLimit: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch('/api/admin/super/partner-tiers')
      .then(d => setTiers(d.tiers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function startEdit(t: Tier) {
    setEditingId(t.id)
    setForm({
      gmvThreshold: String(t.gmv_threshold),
      creditLimitCeiling: String(t.credit_limit_ceiling),
      commissionPctDefault: String(t.commission_pct_default),
      subAgentLimit: t.sub_agent_limit === null ? '' : String(t.sub_agent_limit),
    })
  }

  async function save(t: Tier) {
    setSaving(true)
    try {
      const result = await adminFetch('/api/admin/super/partner-tiers', {
        method: 'PATCH',
        body: JSON.stringify({
          name: t.name,
          gmvThreshold: Number(form.gmvThreshold),
          creditLimitCeiling: Number(form.creditLimitCeiling),
          commissionPctDefault: Number(form.commissionPctDefault),
          subAgentLimit: form.subAgentLimit.trim() === '' ? null : Number(form.subAgentLimit),
        }),
      })
      setTiers(prev => prev.map(x => x.id === t.id ? result.tier : x))
      setEditingId(null)
    } catch (e: any) {
      alert(e.message ?? 'Failed to save')
    }
    setSaving(false)
  }

  const columns: ColumnDef<Tier>[] = [
    {
      key: 'label', header: 'Tier',
      render: (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
          {t.label}
        </span>
      ),
    },
    {
      key: 'gmv_threshold', header: 'GMV Threshold',
      render: (t) => editingId === t.id ? (
        <input className="app-input" type="number" min="0" value={form.gmvThreshold}
          onChange={e => setForm(f => ({ ...f, gmvThreshold: e.target.value }))} style={{ width: 140 }} />
      ) : <span>₹{t.gmv_threshold.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'credit_limit_ceiling', header: 'Credit Limit Ceiling',
      render: (t) => editingId === t.id ? (
        <input className="app-input" type="number" min="0" value={form.creditLimitCeiling}
          onChange={e => setForm(f => ({ ...f, creditLimitCeiling: e.target.value }))} style={{ width: 140 }} />
      ) : <span>₹{t.credit_limit_ceiling.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'commission_pct_default', header: 'Commission % Default',
      render: (t) => editingId === t.id ? (
        <input className="app-input" type="number" min="0" step="0.1" value={form.commissionPctDefault}
          onChange={e => setForm(f => ({ ...f, commissionPctDefault: e.target.value }))} style={{ width: 100 }} />
      ) : <span>{t.commission_pct_default}%</span>,
    },
    {
      key: 'sub_agent_limit', header: 'Sub-Agent Limit',
      render: (t) => editingId === t.id ? (
        <input className="app-input" type="number" min="0" placeholder="Unlimited" value={form.subAgentLimit}
          onChange={e => setForm(f => ({ ...f, subAgentLimit: e.target.value }))} style={{ width: 100 }} />
      ) : <span>{t.sub_agent_limit ?? 'Unlimited'}</span>,
    },
    {
      key: 'actions', header: 'Action',
      render: (t) => editingId === t.id ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => save(t)}>{saving ? 'Saving…' : 'Save'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>Edit</button>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Partner Tiers</h2>
        <span className="topbar-meta">Bronze / Silver / Gold / Platinum — every number here is editable</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <DataTable
            title="Tier Configuration"
            subtitle="GMV threshold decides eligibility for promotion (approved manually in Tier Promotions). Credit limit is a ceiling — agents can be set to anything up to it, never forced. Commission % is only a default applied to newly created agents."
            columns={columns}
            data={tiers}
            loading={loading}
            emptyMessage="No tiers configured."
            keyExtractor={(t) => t.id}
          />
        </div>
      </div>
    </div>
  )
}
