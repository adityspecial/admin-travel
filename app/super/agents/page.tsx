'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ShieldCheck, Users, CheckCircle2, Clock, Wallet, Search, Pencil, Key, Copy, ExternalLink, Sparkles, Building2, Mail, Lock, Send, Gift } from 'lucide-react'

interface Agent {
  id: string
  agent_code: string
  agency_name: string
  contact_name: string
  email: string
  phone?: string
  city?: string
  state?: string
  gst_number?: string | null
  pan_number?: string
  pan_card_url?: string | null
  tier: string
  status: string
  commission_pct: number
  credit_limit: number
  balance?: number
  promo_rate_type?: string
  promo_rate_value?: number
  promo_validity_days?: number
}

interface Creds {
  agentCode: string
  email: string
  tempPassword: string
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'
const PARTNER = process.env.NEXT_PUBLIC_MYPARTNER_URL ?? 'http://localhost:3002'
const TIERS = ['silver', 'gold', 'platinum']

function formatCurrency(value: number) {
  return typeof value === 'number' ? `Rs ${value.toLocaleString('en-IN')}` : 'Rs 0'
}

export default function AgentsPage() {
  const [agents,      setAgents]      = useState<Agent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [creds,       setCreds]       = useState<Creds | null>(null)
  const [busy,        setBusy]        = useState<string | null>(null)
  const [editAgent,   setEditAgent]   = useState<Agent | null>(null)
  const [editForm,    setEditForm]    = useState({ tier: '', commission_pct: '', credit_limit: '', status: '', promo_rate_type: 'percentage', promo_rate_value: '', promo_validity_days: '' })
  const [editSaving,  setEditSaving]  = useState(false)
  const [editError,   setEditError]   = useState('')
  const [walletAgent, setWalletAgent] = useState<Agent | null>(null)
  const [walletAmount,setWalletAmount]= useState('')
  const [walletNote,  setWalletNote]  = useState('')
  const [walletBusy,  setWalletBusy]  = useState(false)
  const [walletError, setWalletError] = useState('')
  const [walletDone,  setWalletDone]  = useState('')
  const [noticeBusy,  setNoticeBusy]  = useState<string | null>(null)
  const [promoAgent,  setPromoAgent]  = useState<Agent | null>(null)
  const [promoBalance, setPromoBalance] = useState(0)
  const [promoTxns,   setPromoTxns]   = useState<any[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoAmount, setPromoAmount] = useState('')
  const [promoDesc,   setPromoDesc]   = useState('')
  const [promoBusy,   setPromoBusy]   = useState(false)
  const [promoError,  setPromoError]  = useState('')
  const [promoDone,   setPromoDone]   = useState('')

  useEffect(() => {
    adminFetch('/api/admin/super/agents')
      .then((data: { agents: Agent[] }) => setAgents(data.agents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function getTestCreds(agent: Agent) {
    setBusy(agent.agent_code)
    try {
      const res = await fetch(`${BACKEND}/api/mypartner/auth/code-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentCode: agent.agent_code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setCreds({ agentCode: agent.agent_code, email: data.email, tempPassword: data.tempPassword })
    } catch (error: any) {
      alert(error.message)
    }
    setBusy(null)
  }

  function openEdit(agent: Agent) {
    setEditAgent(agent)
    setEditForm({
      tier: agent.tier ?? 'silver',
      commission_pct: String(agent.commission_pct ?? 0),
      credit_limit: String(agent.credit_limit ?? 0),
      status: agent.status ?? 'active',
      promo_rate_type: agent.promo_rate_type ?? 'percentage',
      promo_rate_value: String(agent.promo_rate_value ?? 0),
      promo_validity_days: String(agent.promo_validity_days ?? 90),
    })
    setEditError('')
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editAgent) return
    setEditSaving(true)
    setEditError('')
    try {
      const data = await adminFetch(`/api/admin/super/agents/${editAgent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tier: editForm.tier,
          commission_pct: Number(editForm.commission_pct),
          credit_limit: Number(editForm.credit_limit),
          status: editForm.status,
          promo_rate_type: editForm.promo_rate_type,
          promo_rate_value: Number(editForm.promo_rate_value),
          promo_validity_days: Number(editForm.promo_validity_days),
        }),
      })
      setAgents((prev) => prev.map((agent) => (agent.id === editAgent.id ? { ...agent, ...data.agent } : agent)))
      setEditAgent(null)
    } catch (error: any) {
      setEditError(error.message)
    }
    setEditSaving(false)
  }

  async function sendCreditNotice(agent: Agent) {
    setNoticeBusy(agent.id)
    try {
      await adminFetch(`/api/admin/super/agents/${agent.id}/credit-notice`, { method: 'POST' })
      alert(`Credit notice sent to ${agent.email}`)
    } catch (error: any) {
      alert(error.message)
    }
    setNoticeBusy(null)
  }

  function openPromo(agent: Agent) {
    setPromoAgent(agent)
    setPromoAmount('')
    setPromoDesc('')
    setPromoError('')
    setPromoDone('')
    setPromoLoading(true)
    adminFetch(`/api/admin/super/agents/${agent.id}/promo-cash`)
      .then((data: { balance: number; transactions: any[] }) => {
        setPromoBalance(data.balance ?? 0)
        setPromoTxns(data.transactions ?? [])
      })
      .catch(() => {})
      .finally(() => setPromoLoading(false))
  }

  async function submitPromoCredit(e: React.FormEvent) {
    e.preventDefault()
    if (!promoAgent) return
    setPromoBusy(true)
    setPromoError('')
    try {
      const data = await adminFetch(`/api/admin/super/agents/${promoAgent.id}/promo-cash`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(promoAmount), description: promoDesc }),
      })
      setPromoDone(`Credited ${formatCurrency(Number(promoAmount))}. New balance: ${formatCurrency(data.newBalance)}`)
      setPromoBalance(data.newBalance)
      setPromoAmount('')
      setPromoDesc('')
    } catch (error: any) {
      setPromoError(error.message)
    }
    setPromoBusy(false)
  }

  function openWallet(agent: Agent) {
    setWalletAgent(agent)
    setWalletAmount('')
    setWalletNote('')
    setWalletError('')
    setWalletDone('')
  }

  async function submitWalletCredit(e: React.FormEvent) {
    e.preventDefault()
    if (!walletAgent) return
    setWalletBusy(true)
    setWalletError('')
    try {
      const data = await adminFetch(`/api/admin/super/agents/${walletAgent.id}/wallet`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(walletAmount), note: walletNote }),
      })
      setWalletDone(`Credited ${formatCurrency(Number(walletAmount))}. New balance: ${formatCurrency(data.newBalance)}`)
      setWalletAmount('')
      setWalletNote('')
    } catch (error: any) {
      setWalletError(error.message)
    }
    setWalletBusy(false)
  }

  const filtered = agents.filter((agent) =>
    search === '' ||
    agent.agent_code.toLowerCase().includes(search.toLowerCase()) ||
    (agent.agency_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (agent.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const activeCount   = agents.filter(a => a.status === 'active').length
  const pendingCount  = agents.filter(a => a.status === 'pending').length
  const totalCredit   = agents.reduce((acc, a) => acc + (a.credit_limit ?? 0), 0)

  const { slice: pageAgents, page, setPage, total } = usePagination(filtered, 20)

  const columns: ColumnDef<Agent>[] = [
    {
      key: 'agent_code',
      header: 'Agent Code',
      render: (agent) => <span className="data-table-code-pill">{agent.agent_code}</span>,
    },
    {
      key: 'agency_name',
      header: 'Agency & Contact',
      render: (agent) => (
        <div>
          <div className="data-table-cell-bold">{agent.agency_name || '--'}</div>
          <div className="data-table-muted-cell agents-contact-name">{agent.contact_name || '--'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (agent) => <span className="data-table-muted-cell">{agent.email || '--'}</span>,
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (agent) => {
        const tier = (agent.tier ?? 'silver').toLowerCase()
        return (
          <span className={`agents-tier-badge agents-tier-badge--${tier}`}>
            {tier}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (agent) => {
        const isAct = agent.status === 'active'
        const isPend = agent.status === 'pending'
        return (
          <span className={`data-table-status-pill ${isAct ? 'active' : 'inactive'} ${isPend ? 'agents-status-pill-pending' : ''}`}>
            {isAct ? '●Active' : isPend ? '●Pending' : '●Suspended'}
          </span>
        )
      },
    },
    {
      key: 'commission_pct',
      header: 'Commission',
      render: (agent) => (
        <span className="agents-commission-value">
          {agent.commission_pct != null ? `${agent.commission_pct}%` : '--'}
        </span>
      ),
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      render: (agent) => (
        <span className="agents-credit-value">
          {formatCurrency(agent.credit_limit ?? 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (agent) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => openEdit(agent)}>
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button type="button" className="data-table-btn data-table-btn-success" onClick={() => openWallet(agent)}>
            <Wallet size={12} />
            <span>Wallet</span>
          </button>
          <button
            type="button"
            className="data-table-btn data-table-btn-edit"
            disabled={noticeBusy === agent.id}
            onClick={() => sendCreditNotice(agent)}
          >
            <Send size={12} />
            <span>{noticeBusy === agent.id ? 'Sending…' : 'Notice'}</span>
          </button>
          <button type="button" className="data-table-btn data-table-btn-success" onClick={() => openPromo(agent)}>
            <Gift size={12} />
            <span>Promo Cash</span>
          </button>
          <button
            type="button"
            className="data-table-btn data-table-btn-edit"
            disabled={busy === agent.agent_code}
            onClick={() => getTestCreds(agent)}
          >
            <Key size={12} />
            <span>{busy === agent.agent_code ? 'Getting…' : 'Test Login'}</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>myPartner Agents</h2>
        <span className="topbar-meta">{agents.length.toLocaleString('en-IN')} agents total</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards Row */}
          <div className="stat-grid">
            <StatCard
              Icon={Users}
              label="Total Agents"
              value={agents.length}
              sub="Registered partner agencies"
              badge="Network"
            />
            <StatCard
              Icon={CheckCircle2}
              label="Active Agents"
              value={activeCount}
              sub="Verified & transacting"
              badge="Live"
            />
            <StatCard
              Icon={Clock}
              label="Pending KYC"
              value={pendingCount}
              sub="Awaiting admin approval"
              badge="Action Required"
            />
            <StatCard
              Icon={Wallet}
              label="Total Credit Line"
              value={formatCurrency(totalCredit)}
              sub="Allocated agent credit"
              badge="Financials"
            />
          </div>

          {/* Table Card */}
          <DataTable
            title="Partner Agency Network"
            subtitle="Search, verify KYC details, update credit limits, and issue wallet top-ups"
            headerAction={
              <div className="agents-search-wrapper">
                <AppInput
                  placeholder="Search code, agency, email..."
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
            emptyMessage="No agents matching your search filter."
            keyExtractor={(agent) => agent.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      {/* Test Credentials AppPopup */}
      <AppPopup
        isOpen={Boolean(creds)}
        title="Test Credentials Generated"
        subtitle={`Agency Code: ${creds?.agentCode}`}
        icon={<Sparkles size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={500}
        onClose={() => setCreds(null)}
      >
        <div className="agents-creds-form">
          <AppInput
            label="Work Email"
            value={creds?.email ?? ''}
            readOnly
            icon={<Mail size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => creds && navigator.clipboard.writeText(creds.email)}
                title="Copy Email"
                className="agents-copy-icon-btn"
              >
                <Copy size={15} />
              </button>
            }
          />

          <AppInput
            label="Temporary Password"
            value={creds?.tempPassword ?? ''}
            readOnly
            icon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => creds && navigator.clipboard.writeText(creds.tempPassword)}
                title="Copy Password"
                className="agents-copy-icon-btn"
              >
                <Copy size={15} />
              </button>
            }
          />
        </div>

        <div className="app-popup-footer">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={() => setCreds(null)}
          >
            Close
          </button>
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel agents-btn-icon-gap"
            onClick={() => creds && navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.tempPassword}`)}
          >
            <Copy size={14} />
            <span>Copy All</span>
          </button>
          <a
            href={`${PARTNER}/login`}
            target="_blank"
            rel="noreferrer"
            className="confirm-modal-btn confirm-modal-btn-success agents-btn-icon-gap agents-no-underline"
          >
            <span>Open Portal</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </AppPopup>

      {/* Edit Agent AppPopup */}
      <AppPopup
        isOpen={Boolean(editAgent)}
        title={`Edit Agent | ${editAgent?.agent_code}`}
        subtitle={editAgent?.agency_name}
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={540}
        onClose={() => setEditAgent(null)}
      >
        {editError && <div className="login-error">{editError}</div>}

        {editAgent?.status === 'pending' && (
          <div className="agents-kyc-box">
            <div className="agents-kyc-box-title">KYC Details Submitted</div>
            <div className="agents-kyc-grid">
              <span>Phone:</span><strong>{editAgent.phone || '--'}</strong>
              <span>Location:</span><strong>{[editAgent.city, editAgent.state].filter(Boolean).join(', ') || '--'}</strong>
              <span>GST:</span><strong>{editAgent.gst_number || '--'}</strong>
              <span>PAN:</span><strong>{editAgent.pan_number || '--'}</strong>
            </div>
            {editAgent.pan_card_url && (
              <a href={editAgent.pan_card_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm agents-pan-link">
                View PAN Document
              </a>
            )}
          </div>
        )}

        <form onSubmit={saveEdit}>
          <div className="agents-edit-grid">
            <div className="app-input-group">
              <label className="app-input-label">Tier</label>
              <select
                value={editForm.tier}
                onChange={(e) => setEditForm((f) => ({ ...f, tier: e.target.value }))}
                className="app-input"
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-input-group">
              <label className="app-input-label">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                className="app-input"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <AppInput
              label="Commission %"
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={editForm.commission_pct}
              onChange={(e) => setEditForm((f) => ({ ...f, commission_pct: e.target.value }))}
            />

            <AppInput
              label="Credit Limit (Rs)"
              type="number"
              min="0"
              step="1000"
              value={editForm.credit_limit}
              onChange={(e) => setEditForm((f) => ({ ...f, credit_limit: e.target.value }))}
            />

            <div className="app-input-group">
              <label className="app-input-label">Promo Cash Rate Type</label>
              <select
                value={editForm.promo_rate_type}
                onChange={(e) => setEditForm((f) => ({ ...f, promo_rate_type: e.target.value }))}
                className="app-input"
              >
                <option value="percentage">% of booking value</option>
                <option value="flat">Flat Rs per booking</option>
              </select>
            </div>

            <AppInput
              label={editForm.promo_rate_type === 'flat' ? 'Promo Cash (Rs per booking)' : 'Promo Cash (% of booking)'}
              type="number"
              min="0"
              step="0.5"
              value={editForm.promo_rate_value}
              onChange={(e) => setEditForm((f) => ({ ...f, promo_rate_value: e.target.value }))}
              helperText="0 disables promo cash for this agent"
            />

            <AppInput
              label="Promo Cash Validity (days)"
              type="number"
              min="1"
              value={editForm.promo_validity_days}
              onChange={(e) => setEditForm((f) => ({ ...f, promo_validity_days: e.target.value }))}
              helperText="Each credited amount expires this many days after being awarded"
            />
          </div>

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setEditAgent(null)}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </AppPopup>

      {/* Credit Wallet AppPopup */}
      <AppPopup
        isOpen={Boolean(walletAgent)}
        title={`Credit Wallet | ${walletAgent?.agent_code}`}
        subtitle={walletAgent?.agency_name}
        icon={<Wallet size={22} strokeWidth={2.2} />}
        iconTone="teal"
        maxWidth={480}
        onClose={() => setWalletAgent(null)}
      >
        {walletAgent && (
          <div className="agents-kyc-box">
            <div className="agents-kyc-grid">
              <span>Wallet Balance:</span><strong>{formatCurrency(walletAgent.balance ?? 0)}</strong>
              <span>Credit Limit:</span><strong>{formatCurrency(walletAgent.credit_limit ?? 0)}</strong>
              <span>Available to Spend:</span><strong>{formatCurrency((walletAgent.balance ?? 0) + (walletAgent.credit_limit ?? 0))}</strong>
            </div>
          </div>
        )}

        {walletError && <div className="login-error">{walletError}</div>}
        {walletDone && (
          <div className="agents-wallet-success">
            {walletDone}
          </div>
        )}

        <form onSubmit={submitWalletCredit}>
          <AppInput
            label="Amount to Credit (Rs)"
            type="number"
            min="1"
            required
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            placeholder="e.g. 10000"
            icon={<Wallet size={16} />}
          />

          <AppInput
            label="Note (optional)"
            value={walletNote}
            onChange={(e) => setWalletNote(e.target.value)}
            placeholder="Top-up approval for UTR123..."
          />

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setWalletAgent(null)}>
              Close
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={walletBusy}>
              {walletBusy ? 'Crediting…' : 'Credit Wallet'}
            </button>
          </div>
        </form>
      </AppPopup>

      {/* Promo Cash AppPopup */}
      <AppPopup
        isOpen={Boolean(promoAgent)}
        title={`Promo Cash | ${promoAgent?.agent_code}`}
        subtitle={promoAgent?.agency_name}
        icon={<Gift size={22} strokeWidth={2.2} />}
        iconTone="teal"
        maxWidth={520}
        onClose={() => setPromoAgent(null)}
      >
        <div className="agents-kyc-box">
          <div className="agents-kyc-grid">
            <span>Promo Cash Balance:</span><strong>{promoLoading ? '…' : formatCurrency(promoBalance)}</strong>
            <span>Award Rate:</span>
            <strong>
              {promoAgent?.promo_rate_value
                ? (promoAgent.promo_rate_type === 'flat' ? formatCurrency(promoAgent.promo_rate_value) + ' / booking' : `${promoAgent.promo_rate_value}% / booking`)
                : 'Not configured'}
            </strong>
          </div>
        </div>

        {promoError && <div className="login-error">{promoError}</div>}
        {promoDone && <div className="agents-wallet-success">{promoDone}</div>}

        <form onSubmit={submitPromoCredit}>
          <AppInput
            label="Amount to Credit (Rs)"
            type="number"
            min="1"
            required
            value={promoAmount}
            onChange={(e) => setPromoAmount(e.target.value)}
            placeholder="e.g. 500"
            icon={<Gift size={16} />}
          />
          <AppInput
            label="Note (optional)"
            value={promoDesc}
            onChange={(e) => setPromoDesc(e.target.value)}
            placeholder="Manual promo bonus..."
          />
          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setPromoAgent(null)}>
              Close
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={promoBusy}>
              {promoBusy ? 'Crediting…' : 'Credit Promo Cash'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 8 }}>
            Recent Transactions
          </div>
          {promoLoading ? (
            <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading…</div>
          ) : promoTxns.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94A3B8' }}>No promo cash transactions yet.</div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {promoTxns.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>
                    {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    {' · '}{t.type}{t.description ? ` — ${t.description}` : ''}
                  </span>
                  <strong style={{ color: t.type === 'credit' ? '#15803D' : '#DC2626' }}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppPopup>
    </div>
  )
}
