'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SUPER_ADMIN_MODULES } from '@/lib/permissions/definitions'
import { ShieldCheck, UserCheck, Search, Plus, Mail, Lock, Building2, Trash2 } from 'lucide-react'

const CUSTOM_SENTINEL = '__custom__'

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

// AirDunia's own internal accounts only (role='super') — biz/partner-role
// admin_users accounts live on their own dedicated pages (Corporate Admins,
// Partner Admins) so this list never mixes a client organisation's assigned
// staffer in with actual AirDunia employees.
export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [formRoles, setFormRoles] = useState<{ id: string; name: string; label: string }[]>([])
  const [rowRoles, setRowRoles] = useState<{ id: string; name: string; label: string }[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', roleId: '' })
  const [customModules, setCustomModules] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [savingActive, setSavingActive] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/super/staff?role=super')
      .then(d => setStaff(d.staff ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showCreateForm) return
    adminFetch('/api/admin/super/permissions/roles?portal=super_admin&targetType=admin_staff')
      // Every "Custom — choose sections…" account spawns its own disposable,
      // single-staffer role (name custom_<emailslug>_<ts>, label "Custom —
      // <email>") — reusing one built for a specific past staffer doesn't
      // make sense for a new account, and left in, this dropdown grows one
      // junk entry per custom staffer forever. Existing staff who already
      // have one assigned still see it (RoleCell's own fetch below isn't
      // filtered), and it's still fully visible/editable on the Permissions
      // page — only hidden from this "pick a role for a NEW account" list.
      .then(d => setFormRoles((d.roles ?? []).filter((r: any) => !(r.name?.startsWith('custom_') && r.label?.startsWith('Custom — ')))))
      .catch(() => setFormRoles([]))
  }, [showCreateForm])

  async function loadRowRoles(): Promise<{ id: string; name: string; label: string }[]> {
    if (rowRoles) return rowRoles
    const d = await adminFetch('/api/admin/super/permissions/roles?portal=super_admin&targetType=admin_staff').catch(() => ({ roles: [] }))
    setRowRoles(d.roles ?? [])
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
    // Tracked so a failure after the custom role is created (e.g. the staff
    // account POST below fails on a duplicate email) doesn't leave an
    // orphaned one-off role behind — previously every failed/retried attempt
    // for the same email left another "Custom — <email>" entry cluttering
    // this list forever, with nothing ever pointing at it.
    let createdRoleId: string | null = null
    try {
      let roleId = form.roleId

      // Custom access: build a one-off role scoped to just the sections
      // checked below, instead of forcing a detour through /super/permissions
      // first. Grants every permission within a checked module (module-wise,
      // not permission-by-permission) — fine-tuning individual actions can
      // still be done later on the Permissions page if ever needed.
      if (roleId === CUSTOM_SENTINEL) {
        if (!customModules.size) throw new Error('Pick at least one section for custom access.')
        const emailSlug = form.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
        const role = await adminFetch('/api/admin/super/permissions/roles', {
          method: 'POST',
          body: JSON.stringify({
            portal: 'super_admin',
            name: `custom_${emailSlug}_${Date.now().toString(36)}`,
            label: `Custom — ${form.email.trim()}`,
          }),
        })
        // Every module must get an explicit row, checked or not — a module
        // left out entirely falls back to "allowed" for super_admin roles
        // (see middleware.ts's missing-row fallback), which silently granted
        // full access regardless of what was checked here.
        const matrix: Record<string, Record<string, boolean>> = {}
        for (const mod of SUPER_ADMIN_MODULES) {
          const enabled = customModules.has(mod.key)
          matrix[mod.key] = Object.fromEntries(mod.permissions.map(p => [p.key, enabled]))
        }
        await adminFetch('/api/admin/super/permissions/matrix', {
          method: 'PUT',
          body: JSON.stringify({ roleId: role.id, portal: 'super_admin', matrix }),
        })
        roleId = role.id
        createdRoleId = role.id
      }

      const result = await adminFetch('/api/admin/super/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, role: 'super',
          roleId: roleId || undefined,
        }),
      })
      setStaff(prev => [result.staff, ...prev])
      setForm({ email: '', password: '', roleId: '' })
      setCustomModules(new Set())
      setShowCreateForm(false)
    } catch (error: any) {
      if (createdRoleId) {
        adminFetch(`/api/admin/super/permissions/roles?id=${createdRoleId}&portal=super_admin`, { method: 'DELETE' }).catch(() => {})
      }
      try { setCreateError(JSON.parse(error.message).error ?? error.message) }
      catch { setCreateError(error.message) }
    }
    setCreating(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true); setDeleteError('')
    try {
      await adminFetch(`/api/admin/super/staff/${deleteTarget.id}`, { method: 'DELETE' })
      setStaff(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error: any) {
      try { setDeleteError(JSON.parse(error.message).error ?? error.message) }
      catch { setDeleteError(error.message) }
    }
    setDeleting(false)
  }

  function toggleCustomModule(key: string) {
    setCustomModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
      key: 'role_id', header: 'Access Level',
      render: (s) => <RoleCell staff={s} savingRole={savingRole} onLoadRoles={loadRowRoles} onChange={changeRole} />,
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
    {
      key: 'actions', header: '', render: (s) => (
        <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }} onClick={() => { setDeleteTarget(s); setDeleteError('') }}>
          <Trash2 size={12} /> Delete
        </button>
      ),
    },
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
            subtitle="Internal AirDunia employees who can access this admin panel directly (super admin level) — not staff assigned to manage a specific client, that's Corporate Admins / Partner Admins."
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
        subtitle="Create an internal AirDunia employee account for this admin panel."
        icon={<Building2 size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={480}
        onClose={() => setShowCreateForm(false)}
      >
        {createError && <div className="login-error">{createError}</div>}

        <form onSubmit={handleCreate}>
          <div className="app-input-group">
            <label className="app-input-label">Access Level</label>
            <select className="app-input" value={form.roleId} onChange={(e) => setForm(f => ({ ...f, roleId: e.target.value }))}>
              <option value="">Standard (Super Admin)</option>
              {formRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              <option value={CUSTOM_SENTINEL}>Custom — choose sections…</option>
            </select>
            <p className="app-input-helper">What this employee can do across the whole admin panel.</p>
          </div>

          {form.roleId === CUSTOM_SENTINEL && (
            <div className="app-input-group">
              <label className="app-input-label">Sections this employee can access</label>
              <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
                {SUPER_ADMIN_MODULES.map(mod => (
                  <label key={mod.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={customModules.has(mod.key)} onChange={() => toggleCustomModule(mod.key)} />
                    <span>{mod.icon} {mod.label}</span>
                  </label>
                ))}
              </div>
              <p className="app-input-helper">Grants everything in each checked section — fine-tune individual actions later on the Permissions page if needed.</p>
            </div>
          )}

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

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Staff Account"
        tone="danger"
        loading={deleting}
        confirmLabel="Delete Account"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        message={
          <div>
            <p style={{ margin: '0 0 10px' }}>
              This permanently deletes <strong>{deleteTarget?.email}</strong>'s access to this admin panel. This cannot be undone.
            </p>
            {deleteError && <div style={{ color: '#DC2626', fontSize: 13 }}>{deleteError}</div>}
          </div>
        }
      />
    </div>
  )
}

// Lazily loads role options the first time any row is rendered — all rows on
// this page share the same portal (super_admin, no org scoping), so one
// shared fetch (via the parent's loadRowRoles cache) covers every row.
function RoleCell({
  staff, savingRole, onLoadRoles, onChange,
}: {
  staff: Staff
  savingRole: string | null
  onLoadRoles: () => Promise<{ id: string; name: string; label: string }[]>
  onChange: (staffId: string, roleId: string) => void
}) {
  const [options, setOptions] = useState<{ id: string; name: string; label: string }[] | null>(null)

  useEffect(() => { onLoadRoles().then(setOptions) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!options) return <span className="data-table-muted-cell">Loading…</span>

  // Same disposable-one-off-role problem as the Add Staff dropdown, but here
  // a role can't just be dropped outright — if it's the one THIS row already
  // holds, it has to stay listed so the current value still displays
  // correctly. Every other row's dropdown still hides it, since assigning
  // someone else another staffer's one-off "Custom — <email>" role never
  // makes sense.
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
      <option value="">Standard (Super Admin)</option>
      {visibleOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  )
}
