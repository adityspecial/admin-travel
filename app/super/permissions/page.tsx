'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { SUPER_ADMIN_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from './ModuleCard'
import { OverrideEngine } from './OverrideEngine'

const PORTAL = 'super_admin'

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

  const activeRole = roles.find(r => r.id === activeRoleId) ?? null

  useEffect(() => {
    setLoading(true)
    adminFetch(`/api/admin/super/permissions/roles?portal=${PORTAL}`)
      .then(d => {
        setRoles(d.roles ?? [])
        if (d.roles?.length) {
          setActiveRoleId(d.roles[0].id)
          setLocalMatrix(d.roles[0].matrix ?? {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
        <div className="perm-section-label">
          System Roles
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
                  <h1 className="perm-panel-title">
                    ROLE SCHEMA: <span className="perm-title-accent">{activeRole.label.toUpperCase()}</span>
                  </h1>
                  {activeRole.is_custom && (
                    <span className="perm-custom-badge">CUSTOM ROLE</span>
                  )}
                </div>
              </div>

              <button
                onClick={commitArchitecture}
                disabled={committing}
                className={`perm-commit-btn ${committed ? 'perm-commit-btn--committed' : ''}`}
              >
                {committing ? 'Saving…' : committed ? '✓ Committed' : 'COMMIT ARCHITECTURE'}
              </button>
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
    </div>
  )
}
