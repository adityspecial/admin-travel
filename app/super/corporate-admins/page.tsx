'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { BIZ_MODULES } from '@/lib/permissions/definitions'
import { Briefcase, UserCheck, UserPlus, Search, Plus, Mail, Lock, Building2 } from 'lucide-react'

const CUSTOM_SENTINEL = '__custom__'
// The only module admin_staff/portal=biz roles are ever checked against —
// requireOrgAdminPermission hardcodes module='org_admin' — the other BIZ_MODULES
// (Travel, Team, Approval...) govern the org's OWN employees (biz_member), a
// different target type entirely, so they're irrelevant to this account type.
const ORG_ADMIN_MODULE = BIZ_MODULES.find(m => m.key === 'org_admin')!

// Filtered view over the same admin_users data as /super/staff — every
// backend route here (staff list/create/role-assign, orgs, roles) already
// exists; this page just pre-filters to role === 'biz' for faster access,
// with a create form locked to that portal (no separate endpoints).
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

export default function CorporateAdminsPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [formRoles, setFormRoles] = useState<{ id: string; name: string; label: string }[]>([])
  const [rowRoles, setRowRoles] = useState<Record<string, { id: string; name: string; label: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', orgId: '', roleId: '' })
  const [customPerms, setCustomPerms] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [savingActive, setSavingActive] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/super/staff?role=biz'),
      adminFetch('/api/admin/super/orgs'),
    ])
      .then(([sData, oData]) => {
        setStaff(sData.staff ?? [])
        setOrgs((oData.orgs ?? []).map((o: any) => ({ id: o.id, name: o.name })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showCreateForm || !form.orgId) { setFormRoles([]); return }
    adminFetch(`/api/admin/super/permissions/roles?portal=biz&orgId=${form.orgId}&targetType=admin_staff`)
      // Same reasoning as the Staff page's Add Staff dropdown — a disposable
      // one-off "Custom — <email>" role built for a specific past admin
      // shouldn't be offered as a reusable option for a new one.
      .then(d => setFormRoles((d.roles ?? []).filter((r: any) => !(r.name?.startsWith('custom_') && r.label?.startsWith('Custom — ')))))
      .catch(() => setFormRoles([]))
  }, [showCreateForm, form.orgId])

  async function rolesForRow(s: Staff): Promise<{ id: string; name: string; label: string }[]> {
    const cacheKey = `biz:${s.org_id}`
    if (rowRoles[cacheKey]) return rowRoles[cacheKey]
    if (!s.org_id) return []
    const d = await adminFetch(`/api/admin/super/permissions/roles?portal=biz&orgId=${s.org_id}&targetType=admin_staff`).catch(() => ({ roles: [] }))
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

  async function toggleActive(staffId: string, next: boolean) {
    setSavingActive(staffId)
    const prev = staff.find(s => s.id === staffId)?.is_active ?? true
    setStaff(prevList => prevList.map(s => s.id === staffId ? { ...s, is_active: next } : s))
    try {
      await adminFetch(`/api/admin/super/staff/${staffId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      })
    } catch {
      setStaff(prevList => prevList.map(s => s.id === staffId ? { ...s, is_active: prev } : s))
    }
    setSavingActive(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    let createdRoleId: string | null = null
    try {
      let roleId = form.roleId

      if (roleId === CUSTOM_SENTINEL) {
        if (!customPerms.size) throw new Error('Pick at least one permission for custom access.')
        const emailSlug = form.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
        const role = await adminFetch('/api/admin/super/permissions/roles', {
          method: 'POST',
          body: JSON.stringify({
            portal: 'biz', orgId: form.orgId,
            name: `custom_${emailSlug}_${Date.now().toString(36)}`,
            label: `Custom — ${form.email.trim()}`,
          }),
        })
        createdRoleId = role.id
        // Unlike super_admin, a missing row on a biz role already defaults
        // to denied (see middleware.ts) — only the checked permissions need
        // an explicit true row, nothing to write for the unchecked ones.
        const matrix = { org_admin: Object.fromEntries(ORG_ADMIN_MODULE.permissions.map(p => [p.key, customPerms.has(p.key)])) }
        await adminFetch('/api/admin/super/permissions/matrix', {
          method: 'PUT',
          body: JSON.stringify({ roleId: role.id, portal: 'biz', matrix }),
        })
        roleId = role.id
      }

      const result = await adminFetch('/api/admin/super/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, role: 'biz',
          orgId: form.orgId, roleId: roleId || undefined,
        }),
      })
      setStaff(prev => [result.staff, ...prev])
      setForm({ email: '', password: '', orgId: '', roleId: '' })
      setCustomPerms(new Set())
      setShowCreateForm(false)
    } catch (error: any) {
      if (createdRoleId) {
        adminFetch(`/api/admin/super/permissions/roles?id=${createdRoleId}&portal=biz`, { method: 'DELETE' }).catch(() => {})
      }
      try { setCreateError(JSON.parse(error.message).error ?? error.message) }
      catch { setCreateError(error.message) }
    }
    setCreating(false)
  }

  function toggleCustomPerm(key: string) {
    setCustomPerms(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filtered = staff.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()))
  const { slice: pageStaff, page, setPage, total } = usePagination(filtered, 20)

  const statCards = useMemo(() => [
    { label: 'Total Corporate Admins', value: staff.length.toLocaleString('en-IN'), sub: 'Org admin accounts', badge: 'Admins', Icon: Briefcase },
    { label: 'Active', value: staff.filter(s => s.is_active).length.toLocaleString('en-IN'), sub: 'Currently able to log in', badge: 'Active', Icon: UserCheck },
    { label: 'Organisations Covered', value: new Set(staff.filter(s => s.org_id).map(s => s.org_id)).size.toLocaleString('en-IN'), sub: 'Orgs with an assigned admin', badge: 'Coverage', Icon: UserPlus },
  ], [staff])

  const columns: ColumnDef<Staff>[] = [
    { key: 'email', header: 'Email', render: (s) => <span className="data-table-cell-bold">{s.email}</span> },
    { key: 'org', header: 'Organisation', render: (s) => <span className="data-table-muted-cell">{orgs.find(o => o.id === s.org_id)?.name ?? '--'}</span> },
    {
      key: 'role_id', header: 'Permission Role',
      render: (s) => <RoleCell staff={s} savingRole={savingRole} onLoadRoles={rolesForRow} onChange={changeRole} />,
    },
    {
      key: 'is_active', header: 'Status',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`data-table-status-pill ${s.is_active ? 'active' : 'inactive'}`}>
            {s.is_active ? '● Active' : '● Inactive'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => toggleActive(s.id, !s.is_active)}
            disabled={savingActive === s.id}
          >
            {savingActive === s.id ? 'Updating…' : s.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
    { key: 'created_at', header: 'Created', render: (s) => <span className="data-table-muted-cell">{new Date(s.created_at).toLocaleDateString('en-IN')}</span> },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Corporate Admins</h2>
        <span className="topbar-meta">{staff.length.toLocaleString('en-IN')} AirDunia staff accounts for managing client organisations</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <section className="stat-grid partners-stat-grid">
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </section>

          <DataTable
            title="Corporate Admins"
            subtitle="AirDunia staff logins for managing one organisation from this internal admin panel — not the organisation's own employee login (that's a separate system)."
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
                  <Plus size={14} /> <span>Add Corporate Admin</span>
                </button>
              </div>
            }
            columns={columns}
            data={pageStaff}
            loading={loading}
            emptyMessage="No corporate admin accounts found."
            keyExtractor={(s) => s.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      <AppPopup
        isOpen={showCreateForm}
        title="Add Corporate Admin Account"
        subtitle="Creates an AirDunia staff login for managing one organisation here in the internal admin panel."
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={480}
        onClose={() => setShowCreateForm(false)}
      >
        {createError && <div className="login-error">{createError}</div>}

        <form onSubmit={handleCreate}>
          <div className="app-input-group">
            <label className="app-input-label">Organisation *</label>
            <select className="app-input" value={form.orgId} onChange={(e) => setForm(f => ({ ...f, orgId: e.target.value, roleId: '' }))} required>
              <option value="">Choose an organisation…</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="app-input-group">
            <label className="app-input-label">Access Level</label>
            <select className="app-input" value={form.roleId} onChange={(e) => setForm(f => ({ ...f, roleId: e.target.value }))}>
              <option value="">Standard (Org Manager)</option>
              {formRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              <option value={CUSTOM_SENTINEL}>Custom — choose permissions…</option>
            </select>
            <p className="app-input-helper">What this staffer can do when managing this organisation here — separate from the organisation's own internal roles.</p>
          </div>

          {form.roleId === CUSTOM_SENTINEL && (
            <div className="app-input-group">
              <label className="app-input-label">Permissions this staffer can use</label>
              <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
                {ORG_ADMIN_MODULE.permissions.map(perm => (
                  <label key={perm.key} title={perm.description} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={customPerms.has(perm.key)} onChange={() => toggleCustomPerm(perm.key)} />
                    <span>{perm.label}{perm.dangerous ? ' ⚠' : ''}</span>
                  </label>
                ))}
              </div>
              <p className="app-input-helper">Only Org Admin Module permissions apply here — the org's own employee-facing modules (Travel, Team, etc.) don't govern this account type.</p>
            </div>
          )}

          <AppInput
            label="Work Email" type="email" required
            value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="admin@company.com" icon={<Mail size={16} />}
          />

          <AppInput
            label="Password" type="password" required minLength={8}
            value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Min 8 characters" helperText="Share securely with the org admin." icon={<Lock size={16} />}
          />

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowCreateForm(false)}>Cancel</button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={creating || !form.orgId}>
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}

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

  // Same as Staff's row dropdown — hide other admins' disposable one-off
  // custom roles, but keep showing this row's own if it currently holds one.
  const visibleOptions = options.filter(r =>
    r.id === staff.role_id || !(r.name.startsWith('custom_') && r.label.startsWith('Custom — '))
  )

  return (
    <select
      className="app-input"
      value={staff.role_id ?? ''}
      disabled={savingRole === staff.id}
      onChange={(e) => onChange(staff.id, e.target.value)}
    >
      <option value="">Default</option>
      {visibleOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  )
}
