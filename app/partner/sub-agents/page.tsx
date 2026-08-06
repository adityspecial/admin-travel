'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import '@/components/ui/ConfirmModal.css'
import { Network, Users, CheckCircle2, Clock, Wallet, Search, Pencil } from 'lucide-react'
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
  wallet?: { balance: number }
}

const TIERS = ['standard', 'premium', 'elite']
const STATUSES = ['active', 'suspended', 'pending']

// agents-tier-badge only ships silver/gold/platinum modifiers (built for
// super/agents' tier vocabulary) — map partner's tier values onto the same
// visual tones rather than inventing new CSS for an equivalent 3-tier scale.
const TIER_TONE: Record<string, string> = { standard: 'silver', premium: 'gold', elite: 'platinum' }

function formatCurrency(value: number) {
  return `Rs ${(value ?? 0).toLocaleString('en-IN')}`
}

export default function SubAgentsPage() {
  const [agents,  setAgents]  = useState<SubAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [edit,    setEdit]    = useState<SubAgent | null>(null)
  const [form,    setForm]    = useState({ tier: '', commission_pct: '', credit_limit: '', status: '' })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    adminFetch('/api/admin/partner/sub-agents', { agentId })
      .then((d: any) => setAgents(d.agents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openEdit(a: SubAgent) {
    setEdit(a)
    setForm({ tier: a.tier, commission_pct: String(a.commission_pct), credit_limit: String(a.credit_limit), status: a.status })
    setError('')
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    setSaving(true); setError('')
    try {
      const updated = await adminFetch(`/api/admin/partner/sub-agents/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tier: form.tier, commissionPct: Number(form.commission_pct), creditLimit: Number(form.credit_limit), status: form.status }),
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

            <AppInput
              label="Commission %"
              type="number" step="0.1" min="0" max="20"
              value={form.commission_pct}
              onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
            />

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
    </div>
  )
}
