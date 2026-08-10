'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import '@/components/ui/ConfirmModal.css'
import { Network, Users, CheckCircle2, Clock, Wallet, Search, Pencil, Plus } from 'lucide-react'
import './sub-agent.css'

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
  role_id: string | null
  wallet?: { balance: number }
}

const TIERS = ['bronze', 'silver', 'gold', 'platinum']
const STATUSES = ['active', 'suspended', 'pending']
const TIER_TONE: Record<string, string> = { bronze: 'bronze', silver: 'silver', gold: 'gold', platinum: 'platinum' }

function formatCurrency(value: number) {
  return `Rs ${(value ?? 0).toLocaleString('en-IN')}`
}

export default function SubAgentsPage() {
  const [agents,  setAgents]  = useState<SubAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [edit,    setEdit]    = useState<SubAgent | null>(null)
  const [form,    setForm]    = useState({ tier: '', commission_pct: '', credit_limit: '', status: '', role_id: '' })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [commissionHistory, setCommissionHistory] = useState<{ id: string; old_value: number | null; new_value: number; changed_by_type: string; changed_by_label: string | null; created_at: string }[]>([])
  // Assignable roles for partner agents — the built-in 'agent' template plus
  // any custom roles created on the Permissions page. agent_admin is a
  // different targetType (staff managing an agency, not the agent itself)
  // and is filtered out.
  const [roles, setRoles] = useState<{ id: string; name: string; label: string }[]>([])

  const [showAdd,   setShowAdd]   = useState(false)
  const [addForm,   setAddForm]   = useState({ agencyName: '', contactName: '', email: '', phone: '', password: '' })
  const [addError,  setAddError]  = useState('')
  const [adding,    setAdding]    = useState(false)

  function load() {
    const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
    if (!agentId) return
    adminFetch('/api/admin/partner/sub-agents', { agentId })
      .then((d: any) => setAgents(d.agents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    adminFetch('/api/admin/super/permissions/roles?portal=partner')
      .then((d: any) => setRoles((d.roles ?? []).filter((r: any) => r.name !== 'agent_admin')))
      .catch(() => {})
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true); setAddError('')
    const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
    try {
      await adminFetch('/api/admin/partner/sub-agents', {
        method: 'POST', agentId,
        body: JSON.stringify(addForm),
      })
      setShowAdd(false)
      setAddForm({ agencyName: '', contactName: '', email: '', phone: '', password: '' })
      load()
    } catch (e: any) {
      setAddError(e.message ?? 'Failed to add sub-agent')
    }
    setAdding(false)
  }

  function openEdit(a: SubAgent) {
    setEdit(a)
    setForm({ tier: a.tier, commission_pct: String(a.commission_pct), credit_limit: String(a.credit_limit), status: a.status, role_id: a.role_id ?? '' })
    setError('')
    setCommissionHistory([])
    const agentId = typeof window !== 'undefined' ? (sessionStorage.getItem('partner_agent_id') ?? undefined) : undefined
    adminFetch(`/api/admin/partner/sub-agents/${a.id}/commission-history`, { agentId })
      .then((d: any) => setCommissionHistory(d.history ?? []))
      .catch(() => {})
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    setSaving(true); setError('')
    try {
      const updated = await adminFetch(`/api/admin/partner/sub-agents/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tier: form.tier, commissionPct: Number(form.commission_pct), creditLimit: Number(form.credit_limit), status: form.status, roleId: form.role_id || null }),
      })
      setAgents(prev => prev.map(a => a.id === edit.id ? { ...a, ...updated.agent } : a))
      setEdit(null)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const filtered = agents.filter(a =>
    !search || a.agency_name.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_code.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )
  const { slice: pageAgents, page, setPage, total } = usePagination(filtered, 20)

  const activeCount  = agents.filter(a => a.status === 'active').length
  const pendingCount = agents.filter(a => a.status === 'pending').length
  const totalWallet  = agents.reduce((acc, a) => acc + (a.wallet?.balance ?? 0), 0)

  const columns: ColumnDef<SubAgent>[] = [
    {
      key: 'agent_code',
      header: 'Code',
      render: (a) => <span className="data-table-code-pill">{a.agent_code}</span>,
    },
    {
      key: 'agency_name',
      header: 'Agent',
      render: (a) => (
        <div>
          <div className="data-table-cell-bold">{a.agency_name}</div>
          <div className="data-table-muted-cell">{a.contact_name} · {a.email}</div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (a) => (
        <span className={`agents-tier-badge agents-tier-badge--${TIER_TONE[a.tier] ?? 'silver'}`}>
          {a.tier}
        </span>
      ),
    },
    {
      key: 'commission_pct',
      header: 'Commission',
      render: (a) => <span className="agents-commission-value">{a.commission_pct}%</span>,
    },
    {
      key: 'wallet',
      header: 'Wallet',
      render: (a) => <span className="agents-credit-value">{formatCurrency(a.wallet?.balance ?? 0)}</span>,
    },
    {
      key: 'kyc',
      header: 'KYC',
      render: (a) => (
        <span
          className={`badge ${a.kyc_verified ? 'badge-green' : 'badge-yellow'}`}
          title={[a.pan_number ? `PAN: ${a.pan_number}` : '', a.gst_number ? `GST: ${a.gst_number}` : ''].filter(Boolean).join(' · ') || 'No PAN/GST on file'}
        >
          {a.kyc_verified ? 'Verified' : 'Unverified'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => {
        const isActive  = a.status === 'active'
        const isPending = a.status === 'pending'
        return (
          <span className={`data-table-status-pill ${isActive ? 'active' : 'inactive'} ${isPending ? 'agents-status-pill-pending' : ''}`}>
            {isActive ? '●Active' : isPending ? '●Pending' : '●Suspended'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => openEdit(a)}>
            <Pencil size={12} />
            <span>Edit</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Sub-Agents</h2>
        <span className="topbar-meta">{agents.length.toLocaleString('en-IN')} total in your network</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Sub-Agent
        </button>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Network} label="Sub-Agents" value={agents.length} sub="In your network" badge="Team" />
            <StatCard Icon={CheckCircle2} label="Active" value={activeCount} sub="Currently transacting" badge="Live" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={Clock} label="Pending" value={pendingCount} sub="Awaiting activation" badge="Review" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
            <StatCard Icon={Wallet} label="Team Wallet Balance" value={formatCurrency(totalWallet)} sub="Combined sub-agent balances" badge="Financials" iconBg="#fdf2f8" iconColor="#db2777" badgeBg="#fce7f3" badgeColor="#be185d" />
          </div>

          <DataTable
            title="Your Sub-Agent Network"
            subtitle="View, edit commission and manage access for agents under your account."
            headerAction={
              <div className="agents-search-wrapper">
                <AppInput
                  placeholder="Search by name, code or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search size={15} />}
                  wrapperClassName="m-0"
                  className="agents-search-input"
                />
              </div>
            }
            columns={columns}
            data={pageAgents}
            loading={loading}
            emptyMessage="No sub-agents found."
            keyExtractor={(a) => a.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      {/* Edit Sub-Agent AppPopup */}
      <AppPopup
        isOpen={Boolean(edit)}
        title={`Edit — ${edit?.agency_name}`}
        subtitle={edit?.agent_code}
        icon={<Users size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={480}
        onClose={() => setEdit(null)}
      >
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={saveEdit}>
          <div className="agents-edit-grid">
            <div className="app-input-group">
              <label className="app-input-label">Tier</label>
              <select className="app-input" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            <div className="app-input-group">
              <label className="app-input-label">Status</label>
              <select className="app-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div className="app-input-group">
              <label className="app-input-label">Permission Role</label>
              <select className="app-input" value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
                <option value="">Default (Agent)</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>

            <div className="app-input-group">
              <AppInput
                label="Commission %"
                type="number" step="0.1" min="0" max="20"
                value={form.commission_pct}
                onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
              />
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

            <AppInput
              label="Credit Limit (Rs)"
              type="number" min="0"
              value={form.credit_limit}
              onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
            />
          </div>

          {form.status === 'suspended' && (
            <p className="subagent-suspend-warning">
              ⚠ Suspending will block this agent from making new bookings.
            </p>
          )}

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </AppPopup>

      {/* Add Sub-Agent AppPopup */}
      <AppPopup
        isOpen={showAdd}
        title="Add Sub-Agent"
        subtitle="Create an account for a sub-agent under this agency"
        icon={<Plus size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={480}
        onClose={() => setShowAdd(false)}
      >
        {addError && <div className="login-error">{addError}</div>}

        <form onSubmit={handleAdd}>
          <div className="agents-edit-grid">
            <AppInput label="Agency Name" value={addForm.agencyName} onChange={e => setAddForm(f => ({ ...f, agencyName: e.target.value }))} required />
            <AppInput label="Contact Name" value={addForm.contactName} onChange={e => setAddForm(f => ({ ...f, contactName: e.target.value }))} required />
            <AppInput label="Email" type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
            <AppInput label="Phone" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
            <AppInput
              label="Initial Password" type="password" minLength={8}
              value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} required
            />
          </div>

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={adding}>
              {adding ? 'Creating…' : 'Create Sub-Agent'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
