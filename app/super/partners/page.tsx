'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface Partner {
  id: string
  adminId: string
  agentName: string
  agentCode: string
  contactName: string
  email: string
  tier: string
  status: string
  createdAt: string
}

interface Agent {
  id: string
  agency_name: string
  agent_code: string
  contact_name: string
  email: string
  tier: string
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', agentId: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/super/partners'),
      adminFetch('/api/admin/super/agents'),
    ])
      .then(([pData, aData]) => {
        setPartners(pData.partners ?? [])
        setAgents(aData.agents ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      const result = await adminFetch('/api/admin/super/partners', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          agentId: form.agentId,
        }),
      })

      setPartners(prev => [...prev, {
        id: result.adminId,
        adminId: result.adminId,
        agentName: result.agentName,
        agentCode: '',
        contactName: '',
        email: result.email,
        tier: '',
        status: 'active',
        createdAt: new Date().toISOString(),
      }])

      setCreateSuccess(`✅ Created admin account for ${result.agentName}`)
      setForm({ email: '', password: '', agentId: '' })
      setTimeout(() => {
        setShowCreateForm(false)
        setCreateSuccess('')
      }, 2000)
    } catch (error: any) {
      setCreateError(error.message)
    }
    setCreating(false)
  }

  const filtered = partners.filter(p =>
    !search ||
    p.agentName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.agentCode?.toLowerCase().includes(search.toLowerCase())
  )

  const { slice: pagePartners, page, setPage, total } = usePagination(filtered, 20)

  // Agents not yet assigned as partners
  const availableAgents = agents.filter(a =>
    !partners.some(p => p.agentName === a.agency_name)
  )

  return (
    <div>
      <div className="admin-topbar">
        <h2>Partner Admins</h2>
        <span className="topbar-meta">{partners.length.toLocaleString('en-IN')} senior agents with admin access</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">

          <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Total Partners',  value: partners.length.toLocaleString('en-IN'), sub: 'Senior agent admins',        icon: 'SA', tone: '' },
              { label: 'Active Partners', value: partners.filter(p => p.status === 'active').length.toLocaleString('en-IN'), sub: 'Currently managing teams', icon: 'AC', tone: 'teal' },
              { label: 'Available Agents',value: availableAgents.length.toLocaleString('en-IN'), sub: 'Can be made partners',    icon: 'AV', tone: 'orange' },
            ].map(card => (
              <div className={`stat-card ${card.tone}`.trim()} key={card.label}>
                <div className="stat-head">
                  <div className="stat-num">{card.value}</div>
                  <span className="stat-icon">{card.icon}</span>
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            ))}
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Senior Agent Partners</div>
                <div className="card-copy">Manage which agents have admin access to manage their sub-agents.</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
                disabled={availableAgents.length === 0}
              >
                + Add Partner
              </button>
            </div>

            {loading ? (
              <p style={{ padding: 20, color: 'var(--muted)' }}>Loading…</p>
            ) : (
              <>
                <div style={{ padding: '12px 20px', background: 'var(--surface-tint)', borderBottom: '1px solid var(--border)' }}>
                  <input
                    className="form-input"
                    style={{ width: '100%', maxWidth: 340 }}
                    placeholder="Search by agent name, email, or code…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Agent Code</th>
                      <th>Contact</th>
                      <th>Admin Email</th>
                      <th>Tier</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="empty-state">No partners found.</td></tr>
                    ) : pagePartners.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.agentName}</td>
                        <td><code style={{ fontSize: 12, background: 'var(--surface-tint)', padding: '2px 6px', borderRadius: 6 }}>{p.agentCode || '--'}</code></td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>{p.contactName || '--'}</td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>{p.email}</td>
                        <td><span className={`badge ${p.tier === 'platinum' ? 'badge-yellow' : p.tier === 'gold' ? 'badge-blue' : 'badge-gray'}`}>{p.tier || '--'}</span></td>
                        <td><span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination total={total} page={page} perPage={20} onPage={setPage} />
              </>
            )}
          </div>

        </div>
      </div>

      {/* Create Partner Modal */}
      {showCreateForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="form-card" style={{ width: 480, maxWidth: '90vw' }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <h3 className="card-title">Create Partner Admin Account</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>

            {createSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {createSuccess}</div>}
            {createError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{createError}</div>}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Select Agent</label>
                <select
                  className="form-input"
                  value={form.agentId}
                  onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}
                  required
                >
                  <option value="">Choose a senior agent…</option>
                  {availableAgents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agency_name} ({a.agent_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@agency.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Strong password"
                  required
                  minLength={8}
                />
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Min 8 characters. Share securely with the agent.</div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateForm(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                  {creating ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
