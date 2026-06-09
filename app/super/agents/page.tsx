'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface Agent {
  id: string
  agent_code: string
  agency_name: string
  contact_name: string
  email: string
  tier: string
  status: string
  commission_pct: number
  credit_limit: number
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
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creds, setCreds] = useState<Creds | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [editForm, setEditForm] = useState({ tier: '', commission_pct: '', credit_limit: '', status: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [walletAgent, setWalletAgent] = useState<Agent | null>(null)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletNote, setWalletNote] = useState('')
  const [walletBusy, setWalletBusy] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [walletDone, setWalletDone] = useState('')

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
      tier: agent.tier,
      commission_pct: String(agent.commission_pct),
      credit_limit: String(agent.credit_limit),
      status: agent.status,
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
        }),
      })
      setAgents((prev) => prev.map((agent) => (agent.id === editAgent.id ? { ...agent, ...data.agent } : agent)))
      setEditAgent(null)
    } catch (error: any) {
      setEditError(error.message)
    }
    setEditSaving(false)
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

  const { slice: pageAgents, page, setPage, total } = usePagination(filtered, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>myPartner Agents</h2>
        <span className="topbar-meta">{agents.length.toLocaleString('en-IN')} agents total</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="surface-card">
            <div className="table-toolbar">
              <input
                className="toolbar-search"
                style={{ maxWidth: 340 }}
                placeholder="Search by code, agency, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {creds && (
            <div className="banner-soft">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 12 }}>Test credentials for {creds.agentCode}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                    <span style={{ color: '#64748B' }}>Email</span>
                    <code>{creds.email}</code>
                    <span style={{ color: '#64748B' }}>Password</span>
                    <code>{creds.tempPassword}</code>
                  </div>
                  <div className="page-actions" style={{ marginTop: 14 }}>
                    <a href={`${PARTNER}/login`} target="_blank" rel="noreferrer" className="btn btn-primary">Open myPartner</a>
                    <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.tempPassword}`)}>Copy</button>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setCreds(null)}>Close</button>
              </div>
            </div>
          )}

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Agent Code</th>
                  <th>Agency</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Commission</th>
                  <th>Credit Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="empty-state">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="empty-state">No agents found.</td></tr>
                ) : pageAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td><code>{agent.agent_code}</code></td>
                    <td style={{ fontWeight: 700 }}>{agent.agency_name || '--'}</td>
                    <td>{agent.contact_name || '--'}</td>
                    <td style={{ color: '#64748B' }}>{agent.email || '--'}</td>
                    <td><span className={`badge ${agent.tier === 'platinum' ? 'badge-yellow' : agent.tier === 'gold' ? 'badge-blue' : 'badge-gray'}`}>{agent.tier ?? 'silver'}</span></td>
                    <td><span className={`badge ${agent.status === 'active' ? 'badge-green' : 'badge-red'}`}>{agent.status ?? 'active'}</span></td>
                    <td>{agent.commission_pct != null ? `${agent.commission_pct}%` : '--'}</td>
                    <td>{formatCurrency(agent.credit_limit ?? 0)}</td>
                    <td>
                      <div className="page-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(agent)}>Edit</button>
                        <button className="btn btn-muted btn-sm" onClick={() => openWallet(agent)}>Wallet</button>
                        <button className="btn btn-ghost btn-sm" disabled={busy === agent.agent_code} onClick={() => getTestCreds(agent)}>
                          {busy === agent.agent_code ? 'Getting...' : 'Test Login'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>
        </div>
      </div>

      {editAgent && (
        <div className="modal-overlay">
          <div className="form-card modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800 }}>Edit Agent | {editAgent.agent_code}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditAgent(null)}>Close</button>
            </div>
            {editError && <div className="login-error" style={{ marginBottom: 12 }}>{editError}</div>}
            <form onSubmit={saveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Tier</label>
                  <select value={editForm.tier} onChange={(e) => setEditForm((form) => ({ ...form, tier: e.target.value }))}>
                    {TIERS.map((tier) => <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm((form) => ({ ...form, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Commission %</label>
                  <input type="number" min="0" max="30" step="0.5" value={editForm.commission_pct} onChange={(e) => setEditForm((form) => ({ ...form, commission_pct: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Credit Limit (Rs)</label>
                  <input type="number" min="0" step="1000" value={editForm.credit_limit} onChange={(e) => setEditForm((form) => ({ ...form, credit_limit: e.target.value }))} />
                </div>
              </div>
              <div className="page-actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditAgent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {walletAgent && (
        <div className="modal-overlay">
          <div className="form-card modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800 }}>Credit Wallet | {walletAgent.agent_code}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setWalletAgent(null)}>Close</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>{walletAgent.agency_name}</div>
            {walletError && <div className="login-error" style={{ marginBottom: 12 }}>{walletError}</div>}
            {walletDone && <div className="banner-success" style={{ marginBottom: 16 }}>{walletDone}</div>}
            <form onSubmit={submitWalletCredit}>
              <div className="form-group">
                <label>Amount to Credit (Rs)</label>
                <input type="number" min="1" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="10000" required />
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input value={walletNote} onChange={(e) => setWalletNote(e.target.value)} placeholder="Top-up approval for UTR123..." />
              </div>
              <div className="page-actions">
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setWalletAgent(null)}>Close</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={walletBusy}>
                  {walletBusy ? 'Crediting...' : 'Credit Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
