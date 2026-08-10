'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PARTNER_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'
import { AppPopup } from '@/components/ui/AppPopup'
import { Plus, Pencil } from 'lucide-react'
import './permission.css'

const PORTAL = 'partner'

interface Role { id: string; name: string; label: string; is_system: boolean; matrix: Record<string, Record<string, boolean>> }

export default function PartnerPermissionsPage() {
  const [roles,        setRoles]       = useState<Role[]>([])
  const [activeRoleId, setActiveRoleId]= useState<string | null>(null)
  const [view,         setView]        = useState<'roles' | 'overrides'>('roles')
  const [loading,      setLoading]     = useState(true)
  const [saving,       setSaving]      = useState<string | null>(null)
  const [committing,   setCommitting]  = useState(false)
  const [committed,    setCommitted]   = useState(false)
  const [localMatrix,  setLocalMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const [showCreate,   setShowCreate]  = useState(false)
  const [createForm,   setCreateForm]  = useState({ name: '', label: '', description: '' })
  const [creating,     setCreating]    = useState(false)
  const [createError,  setCreateError] = useState('')
  const [renaming,     setRenaming]    = useState(false)
  const [renameLabel,  setRenameLabel] = useState('')
  const [renameSaving, setRenameSaving]= useState(false)

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
        if (loaded.length) { setActiveRoleId(loaded[0].id); setLocalMatrix(loaded[0].matrix ?? {}) }
      })
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

  async function handleToggle(module: string, permission: string, enabled: boolean) {
    if (!activeRoleId) return
    setSaving(`${module}.${permission}`)
    setLocalMatrix(prev => ({ ...prev, [module]: { ...(prev[module] ?? {}), [permission]: enabled } }))
    await adminFetch('/api/admin/super/permissions/matrix', {
      method: 'PATCH',
      body: JSON.stringify({ roleId: activeRoleId, portal: PORTAL, module, permission, enabled }),
    }).catch(() => setLocalMatrix(prev => ({ ...prev, [module]: { ...(prev[module] ?? {}), [permission]: !enabled } })))
    setSaving(null)
  }

  async function commit() {
    if (!activeRoleId) return
    setCommitting(true)
    await adminFetch('/api/admin/super/permissions/matrix', {
      method: 'PUT',
      body: JSON.stringify({ roleId: activeRoleId, portal: PORTAL, matrix: localMatrix }),
    }).catch(() => {})
    setCommitting(false); setCommitted(true)
    setTimeout(() => setCommitted(false), 3000)
  }

  return (
    <div className="ppm-page">

      {/* ── Left sidebar ── */}
      <div className="ppm-sidebar">
        <div className="ppm-nav-header">
          NAVIGATION HUB
        </div>

        <button
          onClick={() => setView(v => v === 'overrides' ? 'roles' : 'overrides')}
          className={`ppm-toggle-btn ${view === 'overrides' ? 'ppm-toggle-btn--active' : ''}`}
        >
          <span>🛡</span>
          <span className={`ppm-toggle-label ${view === 'overrides' ? 'ppm-toggle-label--active' : ''}`}>Sub-Agent Overrides</span>
        </button>

        <div className="ppm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Agent Roles
          <button onClick={() => setShowCreate(true)} title="Create custom role" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <Plus size={14} />
          </button>
        </div>

        <div className="ppm-roles-list">
          {loading ? <div className="ppm-loading">Loading…</div>
            : roles.map(role => (
              <button key={role.id} onClick={() => { setActiveRoleId(role.id); setLocalMatrix(role.matrix ?? {}); setView('roles') }}
                className={`ppm-role-btn ${activeRoleId === role.id && view === 'roles' ? 'ppm-role-btn--active' : ''} ${activeRoleId === role.id ? 'ppm-role-btn--current' : ''}`}>
                <span className="ppm-role-label">{role.label}</span>
                {activeRoleId === role.id && view === 'roles' && <span className="ppm-active-dot" />}
              </button>
            ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="ppm-main-panel">
        {view === 'overrides' ? (
          <OverrideEngine portal={PORTAL} modules={PARTNER_MODULES} />
        ) : activeRole ? (
          <>
            <div className="ppm-panel-header">
              <div className="ppm-panel-header-left">
                <span className="ppm-icon-18">🛡</span>
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
                  <h1 className="ppm-panel-title">
                    ROLE SCHEMA: <span className="ppm-title-accent">{activeRole.label.toUpperCase()}</span>
                    <button onClick={startRename} title="Rename role" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, verticalAlign: 'middle', color: 'inherit', opacity: 0.6 }}>
                      <Pencil size={14} />
                    </button>
                  </h1>
                )}
              </div>
              <button onClick={commit} disabled={committing}
                className={`ppm-commit-btn ${committed ? 'ppm-commit-btn--committed' : ''}`}>
                {committing ? 'Saving…' : committed ? '✓ Committed' : 'COMMIT ARCHITECTURE'}
              </button>
            </div>

            <div className="ppm-module-grid">
              {PARTNER_MODULES.map(mod => (
                <ModuleCard key={mod.key} module={mod} matrix={localMatrix[mod.key] ?? {}}
                  highlight={mod.key === 'sub_agent'}
                  saving={saving?.startsWith(mod.key + '.') ? saving.split('.')[1] : null}
                  onChange={(perm, enabled) => handleToggle(mod.key, perm, enabled)} />
              ))}
            </div>
          </>
        ) : !loading ? (
          <div className="ppm-empty-state">
            <div className="ppm-empty-emoji">🔐</div>
            <div className="ppm-empty-label">No roles configured</div>
          </div>
        ) : null}
      </div>

      <AppPopup
        isOpen={showCreate}
        title="Create Custom Role"
        subtitle="Define a new partner-portal role."
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
              placeholder="e.g. senior_agent"
            />
          </div>
          <div className="app-input-group">
            <label className="app-input-label">Display Label *</label>
            <input
              className="app-input" required
              value={createForm.label}
              onChange={e => setCreateForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Senior Agent"
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
