'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface SubAgent {
  id: string
  agent_code: string
  agency_name: string
  contact_name: string
  email: string
  phone: string
  tier: string
  status: string
  commission_pct: number
  credit_limit: number
  created_at: string
  kyc_verified: boolean
  pan_number: string | null
  gst_number: string | null
  wallet?: { balance: number }
}

const TIERS    = ['standard', 'premium', 'elite']
const STATUSES = ['active', 'suspended', 'pending']

export default function SubAgentsPage() {
  const [agents,  setAgents]  = useState<SubAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [edit,    setEdit]    = useState<SubAgent | null>(null)
  const [form,    setForm]    = useState({ tier: '', commission_pct: '', credit_limit: '', status: '' })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [commissionHistory, setCommissionHistory] = useState<{ id: string; old_value: number | null; new_value: number; changed_by_type: string; changed_by_label: string | null; created_at: string }[]>([])

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
    if (!agentId) return
    adminFetch('/api/admin/partner/sub-agents', { agentId })
      .then((d: any) => setAgents(d.agents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openEdit(a: SubAgent) {
    setEdit(a)
    setForm({ tier: a.tier, commission_pct: String(a.commission_pct), credit_limit: String(a.credit_limit), status: a.status })
    setError(''); setSuccess('')
    setCommissionHistory([])
    const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
    adminFetch(`/api/admin/partner/sub-agents/${a.id}/commission-history`, { agentId })
      .then((d: any) => setCommissionHistory(d.history ?? []))
      .catch(() => {})
  }

  async function saveEdit() {
    if (!edit) return
    setSaving(true); setError('')
    try {
      const updated = await adminFetch(`/api/admin/partner/sub-agents/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tier: form.tier, commissionPct: Number(form.commission_pct), creditLimit: Number(form.credit_limit), status: form.status }),
      })
      setAgents(prev => prev.map(a => a.id === edit.id ? { ...a, ...updated.agent } : a))
      setSuccess('Saved successfully')
      const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
      adminFetch(`/api/admin/partner/sub-agents/${edit.id}/commission-history`, { agentId })
        .then((d: any) => setCommissionHistory(d.history ?? []))
        .catch(() => {})
      setTimeout(() => { setEdit(null); setSuccess('') }, 1500)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const filtered = agents.filter(a =>
    !search || a.agency_name.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_code.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )
  const { slice: pageAgents, page, setPage, total } = usePagination(filtered, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Sub-Agents</h2>
        <span className="topbar-meta">{agents.length} total in your network</span>
      </div>

      <div className="admin-content">
        <div className="table-card">
          <div className="table-header">
            <div>
              <div className="card-title">Your Sub-Agent Network</div>
              <div className="card-copy">View, edit commission and manage access for agents under your account.</div>
            </div>
            <input
              className="form-input"
              style={{ width: 240 }}
              placeholder="Search by name, code or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading…</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Code</th>
                    <th>Tier</th>
                    <th>Commission</th>
                    <th>Wallet</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="empty-state">No sub-agents found.</td></tr>
                  ) : pageAgents.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{a.agency_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.contact_name} · {a.email}</div>
                      </td>
                      <td><code style={{ fontSize: 12, background: 'var(--surface-tint)', padding: '2px 6px', borderRadius: 6 }}>{a.agent_code}</code></td>
                      <td><span className={`badge ${a.tier === 'elite' ? 'badge-violet' : a.tier === 'premium' ? 'badge-yellow' : 'badge-gray'}`}>{a.tier}</span></td>
                      <td style={{ fontWeight: 700 }}>{a.commission_pct}%</td>
                      <td>₹{(a.wallet?.balance ?? 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${a.kyc_verified ? 'badge-green' : 'badge-yellow'}`} title={[a.pan_number ? `PAN: ${a.pan_number}` : '', a.gst_number ? `GST: ${a.gst_number}` : ''].filter(Boolean).join(' · ') || 'No PAN/GST on file'}>
                          {a.kyc_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'active' ? 'badge-green' : a.status === 'suspended' ? 'badge-red' : 'badge-gray'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={total} page={page} perPage={20} onPage={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {edit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="form-card" style={{ width: 460, maxWidth: '90vw' }}>
            <div className="card-header">
              <h3 className="card-title">Edit — {edit.agency_name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>✕</button>
            </div>

            {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

            <div className="form-group">
              <label className="form-label">Tier</label>
              <select className="form-input" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commission %</label>
              <input className="form-input" type="number" step="0.1" min="0" max="20"
                value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))} />
              {commissionHistory.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>Change History</div>
                  {commissionHistory.map(h => (
                    <div key={h.id} style={{ fontSize: 12, color: 'var(--text)', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                      {h.old_value ?? '--'}% → {h.new_value}% by {h.changed_by_label ?? h.changed_by_type} · {new Date(h.created_at).toLocaleDateString('en-IN')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Credit Limit (₹)</label>
              <input className="form-input" type="number" min="0"
                value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.status === 'suspended' && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>
                  ⚠ Suspending will block this agent from making new bookings.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
