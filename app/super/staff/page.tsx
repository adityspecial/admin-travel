'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ShieldCheck, UserCheck, UserPlus, Search, Plus, Mail, Lock, Building2 } from 'lucide-react'

interface Staff {
  id: string
  email: string
  role: 'super' | 'biz' | 'partner'
  org_id: string | null
  role_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface Org { id: string; name: string }

const ROLE_TO_PORTAL: Record<Staff['role'], 'super_admin' | 'biz' | 'partner'> = {
  super: 'super_admin', biz: 'biz', partner: 'partner',
}

// Temporarily restored to cover super/biz/partner again, alongside the
// dedicated Corporate Admins / Partner Admins pages — kept duplicated on
// purpose pending a decision on which to keep.
export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  // Roles for the currently-open create form's selected role/org — refetched
  // whenever either changes, since biz roles are per-org.
  const [formRoles, setFormRoles] = useState<{ id: string; name: string; label: string }[]>([])
  // roleId options already loaded for each staff row's own portal/org, keyed
  // by "portal" for super/partner and "biz:{orgId}" for biz — avoids
  // re-fetching per row when many staffers share the same portal/org.
  const [rowRoles, setRowRoles] = useState<Record<string, { id: string; name: string; label: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'biz' as Staff['role'], orgId: '', roleId: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [savingRole, setSavingRole] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/super/staff'),
      adminFetch('/api/admin/super/orgs'),
    ])
      .then(([sData, oData]) => {
        setStaff(sData.staff ?? [])
        setOrgs((oData.orgs ?? []).map((o: any) => ({ id: o.id, name: o.name })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Roles for the create form — refetch on role/org change.
  useEffect(() => {
    if (!showCreateForm) return
    const portal = ROLE_TO_PORTAL[form.role]
    if (portal === 'biz' && !form.orgId) { setFormRoles([]); return }
    const qs = portal === 'biz' ? `portal=biz&orgId=${form.orgId}` : `portal=${portal}`
    adminFetch(`/api/admin/super/permissions/roles?${qs}`)
      .then(d => setFormRoles(d.roles ?? []))
      .catch(() => setFormRoles([]))
  }, [showCreateForm, form.role, form.orgId])

  async function rolesForRow(s: Staff): Promise<{ id: string; name: string; label: string }[]> {
    const portal = ROLE_TO_PORTAL[s.role]
    const cacheKey = portal === 'biz' ? `biz:${s.org_id}` : portal
    if (rowRoles[cacheKey]) return rowRoles[cacheKey]
    if (portal === 'biz' && !s.org_id) return []
    const qs = portal === 'biz' ? `portal=biz&orgId=${s.org_id}` : `portal=${portal}`
    const d = await adminFetch(`/api/admin/super/permissions/roles?${qs}`).catch(() => ({ roles: [] }))
    setRowRoles(prev => ({ ...prev, [cacheKey]: d.roles ?? [] }))
    return d.roles ?? []
  }

  async function changeRole(staffId: string, roleId: string) {
    setSavingRole(staffId)
    const prev = staff.find(s => s.id === staffId)?.role_id ?? null
    setStaff(prevList => prevList.map(s => s.id === staffId ? { ...s, role_id: roleId || null } : s))
    try {
      await adminFetch(`/api/admin/super/staff/${staffId}`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId: roleId || null }),
      })
    } catch {
      setStaff(prevList => prevList.map(s => s.id === staffId ? { ...s, role_id: prev } : s))
    }
    setSavingRole(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const result = await adminFetch('/api/admin/super/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, role: form.role,
          orgId: form.role === 'biz' ? form.orgId : undefined,
          roleId: form.roleId || undefined,
        }),
      })
      setStaff(prev => [result.staff, ...prev])
      setForm({ email: '', password: '', role: 'biz', orgId: '', roleId: '' })
      setShowCreateForm(false)
    } catch (error: any) {
      try { setCreateError(JSON.parse(error.message).error ?? error.message) }
      catch { setCreateError(error.message) }
    }
    setCreating(false)
  }

  const filtered = staff.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()))
  const { slice: pageStaff, page, setPage, total } = usePagination(filtered, 20)

  const statCards = useMemo(() => [
    { label: 'Total Staff', value: staff.length.toLocaleString('en-IN'), sub: 'AirDunia admin accounts', badge: 'Staff', Icon: ShieldCheck },
    { label: 'Active', value: staff.filter(s => s.is_active).length.toLocaleString('en-IN'), sub: 'Currently able to log in', badge: 'Active', Icon: UserCheck },
  ], [staff])

  const columns: ColumnDef<Staff>[] = [
    { key: 'email', header: 'Email', render: (s) => <span className="data-table-cell-bold">{s.email}</span> },
    {
      key: 'role_id', header: 'Permission Role',
      render: (s) => <RoleCell staff={s} savingRole={savingRole} onLoadRoles={rolesForRow} onChange={changeRole} />,
    },
    {
      key: 'is_active', header: 'Status',
      render: (s) => (
        <span className={`data-table-status-pill ${s.is_active ? 'active' : 'inactive'}`}>
          {s.is_active ? '● Active' : '● Inactive'}
        </span>
      ),
    },
    { key: 'created_at', header: 'Created', render: (s) => <span className="data-table-muted-cell">{new Date(s.created_at).toLocaleDateString('en-IN')}</span> },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Staff</h2>
        <span className="topbar-meta">{staff.length.toLocaleString('en-IN')} AirDunia admin accounts</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <section className="stat-grid partners-stat-grid">
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </section>

          <DataTable
            title="AirDunia Staff"
            subtitle="Manage internal super-admin accounts and which permission role each one has."
            headerAction={
              <div className="partners-header-actions">
                <div className="partners-search-wrapper">
                  <AppInput
                    placeholder="Search email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                    className="partners-search-input"
                  />
                </div>
                <button className="btn btn-primary btn-sm partners-btn-icon-gap" onClick={() => setShowCreateForm(true)}>
                  <Plus size={14} /> <span>Add Staff</span>
                </button>
              </div>
            }
            columns={columns}
            data={pageStaff}
            loading={loading}
            emptyMessage="No staff accounts found."
            keyExtractor={(s) => s.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      <AppPopup
        isOpen={showCreateForm}
        title="Add Staff Account"
        subtitle="Create an internal AirDunia admin account"
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={480}
        onClose={() => setShowCreateForm(false)}
      >
        {createError && <div className="login-error">{createError}</div>}

        <form onSubmit={handleCreate}>
          <div className="app-input-group">
            <label className="app-input-label">Permission Role</label>
            <select className="app-input" value={form.roleId} onChange={(e) => setForm(f => ({ ...f, roleId: e.target.value }))}>
              <option value="">Default</option>
              {formRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <AppInput
            label="Work Email" type="email" required
            value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="staff@airdunia.com" icon={<Mail size={16} />}
          />

          <AppInput
            label="Password" type="password" required minLength={8}
            value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Min 8 characters" helperText="Share securely with the staffer." icon={<Lock size={16} />}
          />

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowCreateForm(false)}>Cancel</button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={creating}>
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}

// Lazily loads this row's role options (portal/org-scoped) the first time
// it's rendered, rather than fetching per-portal/org options for every row
// up front on page load.
function RoleCell({
  staff, savingRole, onLoadRoles, onChange,
}: {
  staff: Staff
  savingRole: string | null
  onLoadRoles: (s: Staff) => Promise<{ id: string; name: string; label: string }[]>
  onChange: (staffId: string, roleId: string) => void
}) {
  const [options, setOptions] = useState<{ id: string; name: string; label: string }[] | null>(null)

  useEffect(() => { onLoadRoles(staff).then(setOptions) }, [staff.id])

  if (!options) return <span className="data-table-muted-cell">Loading…</span>

  return (
    <select
      className="app-input"
      value={staff.role_id ?? ''}
      disabled={savingRole === staff.id}
      onChange={(e) => onChange(staff.id, e.target.value)}
    >
      <option value="">Default</option>
      {options.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  )
}
