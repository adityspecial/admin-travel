'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PARTNER_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'
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

  const activeRole = roles.find(r => r.id === activeRoleId) ?? null

  useEffect(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/permissions/roles?portal=${PORTAL}`)
      .then(d => {
        setRoles(d.roles ?? [])
        if (d.roles?.length) { setActiveRoleId(d.roles[0].id); setLocalMatrix(d.roles[0].matrix ?? {}) }
      })
      .finally(() => setLoading(false))
  }, [])

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

        <div className="ppm-section-label">Agent Roles</div>

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
                <h1 className="ppm-panel-title">
                  ROLE SCHEMA: <span className="ppm-title-accent">{activeRole.label.toUpperCase()}</span>
                </h1>
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
    </div>
  )
}
