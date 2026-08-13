'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ShieldCheck, UserCheck, UserPlus, Search, Plus, Mail, Lock, Building2 } from 'lucide-react'

interface Partner {
  id: string
  adminId: string
  roleId: string | null
  isActive: boolean
  agentId: string
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
  const [roles, setRoles] = useState<{ id: string; name: string; label: string }[]>([])
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [savingActive, setSavingActive] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/super/partners'),
      adminFetch('/api/admin/super/agents'),
      adminFetch('/api/admin/super/permissions/roles?portal=partner&targetType=admin_staff'),
    ])
      .then(([pData, aData, rData]) => {
        setPartners(pData.partners ?? [])
        setAgents(aData.agents ?? [])
        setRoles(rData.roles ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function changeRole(partnerId: string, roleId: string) {
    setSavingRole(partnerId)
    const prev = partners.find(p => p.id === partnerId)?.roleId ?? null
    setPartners(prevList => prevList.map(p => p.id === partnerId ? { ...p, roleId: roleId || null } : p))
    try {
      await adminFetch('/api/admin/super/partners', {
        method: 'PATCH',
        body: JSON.stringify({ id: partnerId, roleId: roleId || null }),
      })
    } catch {
      setPartners(prevList => prevList.map(p => p.id === partnerId ? { ...p, roleId: prev } : p))
    }
    setSavingRole(null)
  }

  async function toggleActive(partnerId: string, next: boolean) {
    setSavingActive(partnerId)
    const prev = partners.find(p => p.id === partnerId)?.isActive ?? true
    setPartners(prevList => prevList.map(p => p.id === partnerId ? { ...p, isActive: next } : p))
    try {
      await adminFetch('/api/admin/super/partners', {
        method: 'PATCH',
        body: JSON.stringify({ id: partnerId, isActive: next }),
      })
    } catch {
      setPartners(prevList => prevList.map(p => p.id === partnerId ? { ...p, isActive: prev } : p))
    }
    setSavingActive(null)
  }

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

      setPartners((prev) => [
        ...prev,
        {
          id: result.adminId,
          adminId: result.adminId,
          roleId: null,
          isActive: true,
          agentId: form.agentId,
          agentName: result.agentName,
          agentCode: '',
          contactName: '',
          email: result.email,
          tier: '',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ])

      setCreateSuccess(`Created admin account for ${result.agentName}`)
      setForm({ email: '', password: '', agentId: '' })
      setTimeout(() => {
        setShowCreateForm(false)
        setCreateSuccess('')
      }, 1500)
    } catch (error: any) {
      try {
        setCreateError(JSON.parse(error.message).error ?? error.message)
      } catch {
        setCreateError(error.message)
      }
    }
    setCreating(false)
  }

  const filtered = partners.filter(
    (p) =>
      !search ||
      p.agentName?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.agentCode?.toLowerCase().includes(search.toLowerCase())
  )

  const { slice: pagePartners, page, setPage, total } = usePagination(filtered, 20)

  // Agents not yet assigned a partner admin — compare by ID to avoid name-mismatch false positives
  const assignedAgentIds = new Set(partners.map((p) => p.agentId).filter(Boolean))
  const availableAgents = agents.filter((a) => !assignedAgentIds.has(a.id))

  const statCards = useMemo(
    () => [
      {
        label: 'Total Partners',
        value: partners.length.toLocaleString('en-IN'),
        sub: 'Senior agent admins configured',
        badge: 'Admins',
        Icon: ShieldCheck,
      },
      {
        label: 'Active Partners',
        value: partners.filter((p) => p.status === 'active').length.toLocaleString('en-IN'),
        sub: 'Currently managing sub-agent teams',
        badge: 'Active',
        Icon: UserCheck,
      },
      {
        label: 'Available Agents',
        value: availableAgents.length.toLocaleString('en-IN'),
        sub: 'Eligible for partner admin access',
        badge: `${availableAgents.length} Eligible`,
        Icon: UserPlus,
      },
    ],
    [availableAgents.length, partners]
  )

  const columns: ColumnDef<Partner>[] = [
    {
      key: 'agentName',
      header: 'Agent Name',
      render: (p) => <span className="data-table-cell-bold">{p.agentName}</span>,
    },
    {
      key: 'agentCode',
      header: 'Agent Code',
      render: (p) => <span className="data-table-code-pill">{p.agentCode || '--'}</span>,
    },
    {
      key: 'contactName',
      header: 'Contact',
      render: (p) => <span className="data-table-muted-cell">{p.contactName || '--'}</span>,
    },
    {
      key: 'email',
      header: 'Admin Email',
      render: (p) => <span className="data-table-muted-cell">{p.email}</span>,
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (p) => {
        const tier = (p.tier || 'silver').toLowerCase()
        return (
          <span className={`agents-tier-badge agents-tier-badge--${tier}`}>
            {tier}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Agency Status',
      render: (p) => (
        <span className={`data-table-status-pill ${p.status === 'active' ? 'active' : 'inactive'}`}>
          {p.status === 'active' ? '● Active' : '● Inactive'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Login Access',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`data-table-status-pill ${p.isActive ? 'active' : 'inactive'}`}>
            {p.isActive ? '● Active' : '● Inactive'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => toggleActive(p.id, !p.isActive)}
            disabled={savingActive === p.id}
          >
            {savingActive === p.id ? 'Updating…' : p.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Access Level',
      render: (p) => (
        <select
          className="app-input"
          value={p.roleId ?? ''}
          disabled={savingRole === p.id}
          onChange={(e) => changeRole(p.id, e.target.value)}
        >
          <option value="">Default (Agent Admin)</option>
          {roles.filter(r => r.name !== 'agent').map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (p) => (
        <span className="data-table-muted-cell partners-created-cell">
          {new Date(p.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Partner Admins</h2>
        <span className="topbar-meta">{partners.length.toLocaleString('en-IN')} senior agents with admin access</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards */}
          <section className="stat-grid partners-stat-grid">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          {/* DataTable Card */}
          <DataTable
            title="Senior Agent Partners"
            subtitle="Manage which agents have admin access to manage their sub-agents."
            headerAction={
              <div className="partners-header-actions">
                <div className="partners-search-wrapper">
                  <AppInput
                    placeholder="Search name, email, code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                    className="partners-search-input"
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm partners-btn-icon-gap"
                  onClick={() => setShowCreateForm(true)}
                  disabled={availableAgents.length === 0}
                >
                  <Plus size={14} />
                  <span>Add Partner</span>
                </button>
              </div>
            }
            columns={columns}
            data={pagePartners}
            loading={loading}
            emptyMessage="No partner admins found matching your filter."
            keyExtractor={(p) => p.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      {/* Create Partner AppPopup Modal */}
      <AppPopup
        isOpen={showCreateForm}
        title="Create Partner Admin Account"
        subtitle="Assign administrative credentials to an eligible senior agent"
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={480}
        onClose={() => setShowCreateForm(false)}
      >
        {createSuccess && (
          <div className="partners-success-banner">
            ✅ {createSuccess}
          </div>
        )}
        {createError && <div className="login-error">{createError}</div>}

        <form onSubmit={handleCreate}>
          <div className="app-input-group">
            <label className="app-input-label">Select Agent *</label>
            <select
              className="app-input"
              value={form.agentId}
              onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))}
              required
            >
              <option value="">Choose an eligible senior agent…</option>
              {availableAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.agency_name} ({a.agent_code})
                </option>
              ))}
            </select>
          </div>

          <AppInput
            label="Admin Work Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="admin@agency.com"
            icon={<Mail size={16} />}
          />

          <AppInput
            label="Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min 8 characters"
            helperText="Share securely with the agent administrator."
            icon={<Lock size={16} />}
          />

          <div className="app-popup-footer">
            <button
              type="button"
              className="confirm-modal-btn confirm-modal-btn-cancel"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-modal-btn confirm-modal-btn-success"
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
