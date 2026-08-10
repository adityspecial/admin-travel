'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { SUPER_ADMIN_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from './ModuleCard'
import { OverrideEngine } from './OverrideEngine'
import { AppPopup } from '@/components/ui/AppPopup'
import { Plus, Pencil } from 'lucide-react'

const PORTAL = 'super_admin'

// Mirrors the keys defined in backend/lib/permissions/customRoleTemplates.ts
// — only used here to decide whether to show the "Apply Default Template"
// button; the actual permission values live server-side.
const TEMPLATED_ROLE_NAMES = new Set([
  'finance_manager', 'risk_officer', 'content_editor', 'partner_manager',
  'biz_manager', 'ops_manager', 'support_agent', 'admin', 'custom_admin',
])

interface Role {
  id:     string
  name:   string
  label:  string
  is_system: boolean
  is_custom: boolean
  matrix: Record<string, Record<string, boolean>>
}

export default function PermissionsPage() {
  const [roles,         setRoles]        = useState<Role[]>([])
  const [activeRoleId,  setActiveRoleId] = useState<string | null>(null)
  const [view,          setView]         = useState<'roles' | 'overrides'>('roles')
  const [loading,       setLoading]      = useState(true)
  const [saving,        setSaving]       = useState<string | null>(null)  // 'module.perm'
  const [committing,    setCommitting]   = useState(false)
  const [committed,     setCommitted]    = useState(false)
  const [localMatrix,   setLocalMatrix]  = useState<Record<string, Record<string, boolean>>>({})
  const [showCreate,    setShowCreate]   = useState(false)
  const [createForm,    setCreateForm]   = useState({ name: '', label: '', description: '' })
  const [creating,      setCreating]     = useState(false)
  const [createError,   setCreateError]  = useState('')
  const [renaming,      setRenaming]     = useState(false)
  const [renameLabel,   setRenameLabel]  = useState('')
  const [renameSaving,  setRenameSaving] = useState(false)

  const activeRole = roles.find(r => r.id === activeRoleId) ?? null

  function fetchRoles() {
    return adminFetch(`/api/admin/super/permissions/roles?portal=${PORTAL}`).then(d => {
      setRoles(d.roles ?? [])
      return d.roles ?? []
    })
  }

  useEffect(() => {
    setLoading(true)
    fetchRoles()
      .then(loaded => {
        if (loaded.length) {
          setActiveRoleId(loaded[0].id)
          setLocalMatrix(loaded[0].matrix ?? {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setCreateError('')
    try {
      const result = await adminFetch('/api/admin/super/permissions/roles', {
        method: 'POST',
        body: JSON.stringify({
          portal: PORTAL, name: createForm.name, label: createForm.label,
          description: createForm.description || undefined,
        }),
      })
      const loaded = await fetchRoles()
      const created = loaded.find((r: Role) => r.id === result.id)
      if (created) { setActiveRoleId(created.id); setLocalMatrix(created.matrix ?? {}); setView('roles') }
      setCreateForm({ name: '', label: '', description: '' })
      setShowCreate(false)
    } catch (err: any) {
      try { setCreateError(JSON.parse(err.message).error ?? err.message) }
      catch { setCreateError(err.message) }
    }
    setCreating(false)
  }

  function startRename() {
    if (!activeRole) return
    setRenameLabel(activeRole.label)
    setRenaming(true)
  }

  async function saveRename() {
    if (!activeRole || !renameLabel.trim()) return
    setRenameSaving(true)
    try {
      await adminFetch(`/api/admin/super/permissions/roles/${activeRole.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ portal: PORTAL, label: renameLabel.trim() }),
      })
      setRoles(prev => prev.map(r => r.id === activeRole.id ? { ...r, label: renameLabel.trim() } : r))
      setRenaming(false)
    } catch (err: any) {
      alert(err.message ?? 'Failed to rename')
    }
    setRenameSaving(false)
  }

  function selectRole(role: Role) {
    setActiveRoleId(role.id)
    setLocalMatrix(role.matrix ?? {})
    setCommitted(false)
  }

  async function handleToggle(module: string, permission: string, enabled: boolean) {
    if (!activeRoleId) return
    const key = `${module}.${permission}`
    setSaving(key)

    // Optimistic update
    setLocalMatrix(prev => ({
      ...prev,
      [module]: { ...(prev[module] ?? {}), [permission]: enabled },
    }))

    await adminFetch('/api/admin/super/permissions/matrix', {
      method: 'PATCH',
      body: JSON.stringify({ roleId: activeRoleId, portal: PORTAL, module, permission, enabled }),
    }).catch(() => {
      // Revert on error
      setLocalMatrix(prev => ({
        ...prev,
        [module]: { ...(prev[module] ?? {}), [permission]: !enabled },
      }))
    })

    setSaving(null)
  }

  async function commitArchitecture() {
    if (!activeRoleId) return
    setCommitting(true)
    await adminFetch('/api/admin/super/permissions/matrix', {
      method: 'PUT',
      body: JSON.stringify({ roleId: activeRoleId, portal: PORTAL, matrix: localMatrix }),
    })
    setCommitting(false)
    setCommitted(true)
    setTimeout(() => setCommitted(false), 3000)
  }

  const [applyingTemplate, setApplyingTemplate] = useState(false)

  async function applyTemplate() {
    if (!activeRoleId) return
    setApplyingTemplate(true)
    try {
      await adminFetch(`/api/admin/super/permissions/roles/${activeRoleId}/apply-template`, { method: 'POST' })
      const d = await adminFetch(`/api/admin/super/permissions/roles?portal=${PORTAL}`)
      setRoles(d.roles ?? [])
      const refreshed = (d.roles ?? []).find((r: Role) => r.id === activeRoleId)
      if (refreshed) setLocalMatrix(refreshed.matrix ?? {})
    } catch (e: any) {
      alert(e.message ?? 'Failed to apply template')
    }
    setApplyingTemplate(false)
  }

  const systemModules = ['system', 'risk']

  return (
    <div className="perm-page">

      {/* ── Left sidebar ── */}
      <div className="perm-sidebar">

        {/* Navigation Hub header */}
        <div className="perm-nav-header">
          NAVIGATION HUB
        </div>

        {/* Custom Access toggle */}
        <button
          onClick={() => setView(v => v === 'overrides' ? 'roles' : 'overrides')}
          className={`perm-custom-toggle ${view === 'overrides' ? 'perm-custom-toggle--active' : ''}`}
        >
          <span className="perm-icon-14">🛡</span>
          <span className={`perm-custom-toggle-label ${view === 'overrides' ? 'perm-custom-toggle-label--active' : ''}`}>
            Custom Access
          </span>
        </button>

        {/* System Roles */}
        <div className="perm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          System Roles
          <button onClick={() => setShowCreate(true)} title="Create custom role" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <Plus size={14} />
          </button>
        </div>

        <div className="perm-roles-list">
          {loading ? (
            <div className="perm-loading">Loading…</div>
          ) : roles.map(role => (
            <button
              key={role.id}
              onClick={() => { selectRole(role); setView('roles') }}
              className={`perm-role-btn ${activeRoleId === role.id && view === 'roles' ? 'perm-role-btn--active' : ''} ${activeRoleId === role.id ? 'perm-role-btn--current' : ''}`}
            >
              <span className="perm-role-label">{role.label}</span>
              {activeRoleId === role.id && view === 'roles' && (
                <span className="perm-active-dot" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="perm-main-panel">

        {view === 'overrides' ? (
          <OverrideEngine portal={PORTAL} modules={SUPER_ADMIN_MODULES} />
        ) : activeRole ? (
          <>
            {/* Header */}
            <div className="perm-panel-header">
              <div className="perm-panel-header-left">
                <span className="perm-icon-18">🛡</span>
                <div>
                  {renaming ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        autoFocus
                        value={renameLabel}
                        onChange={e => setRenameLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveRename()}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 14 }}
                      />
                      <button className="btn btn-primary btn-sm" disabled={renameSaving} onClick={saveRename}>
                        {renameSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(false)}>Cancel</button>
                    </div>
                  ) : (
                    <h1 className="perm-panel-title">
                      ROLE SCHEMA: <span className="perm-title-accent">{activeRole.label.toUpperCase()}</span>
                      <button onClick={startRename} title="Rename role" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, verticalAlign: 'middle', color: 'inherit', opacity: 0.6 }}>
                        <Pencil size={14} />
                      </button>
                    </h1>
                  )}
                  {activeRole.is_custom && (
                    <span className="perm-custom-badge">CUSTOM ROLE</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {activeRole.is_custom && TEMPLATED_ROLE_NAMES.has(activeRole.name) && (
                  <button
                    onClick={applyTemplate}
                    disabled={applyingTemplate}
                    className="perm-commit-btn"
                    title={`Reset to the default ${activeRole.label} permission set`}
                  >
                    {applyingTemplate ? 'Applying…' : 'Apply Default Template'}
                  </button>
                )}
                <button
                  onClick={commitArchitecture}
                  disabled={committing}
                  className={`perm-commit-btn ${committed ? 'perm-commit-btn--committed' : ''}`}
                >
                  {committing ? 'Saving…' : committed ? '✓ Committed' : 'COMMIT ARCHITECTURE'}
                </button>
              </div>
            </div>

            {/* Module grid — 3 columns */}
            <div className="perm-module-grid">
              {SUPER_ADMIN_MODULES.map(mod => (
                <ModuleCard
                  key={mod.key}
                  module={mod}
                  matrix={localMatrix[mod.key] ?? {}}
                  highlight={systemModules.includes(mod.key)}
                  saving={saving?.startsWith(mod.key + '.') ? saving.split('.')[1] : null}
                  onChange={(perm, enabled) => handleToggle(mod.key, perm, enabled)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <AppPopup
        isOpen={showCreate}
        title="Create Custom Role"
        subtitle="Define a new super-admin role — permissions start blank unless the name matches a known template."
        icon={<Plus size={22} strokeWidth={2.2} />}
        iconTone="blue"
        maxWidth={480}
        onClose={() => setShowCreate(false)}
      >
        {createError && <div className="login-error">{createError}</div>}
        <form onSubmit={createRole}>
          <div className="app-input-group">
            <label className="app-input-label">Name (machine key) *</label>
            <input
              className="app-input" required
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. finance_manager"
            />
          </div>
          <div className="app-input-group">
            <label className="app-input-label">Display Label *</label>
            <input
              className="app-input" required
              value={createForm.label}
              onChange={e => setCreateForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Finance Manager"
            />
          </div>
          <div className="app-input-group">
            <label className="app-input-label">Description</label>
            <input
              className="app-input"
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={creating}>
              {creating ? 'Creating…' : 'Create Role'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
