'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { BIZ_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'
import './permission.css'
import {
  Shield,
  ShieldCheck,
  Lock,
  Users,
  Check,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building2,
  Filter,
} from 'lucide-react'

const PORTAL = 'biz'

interface Role {
  id: string
  name: string
  label: string
  is_system: boolean
  matrix: Record<string, Record<string, boolean>>
}

export default function BizPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [view, setView] = useState<'roles' | 'overrides'>('roles')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [localMatrix, setLocalMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const activeRole = roles.find((r) => r.id === activeRoleId) ?? null

  useEffect(() => {
    setLoading(true)
    adminFetch('/api/admin/biz/permissions/roles')
      .then((d) => {
        setRoles(d.roles ?? [])
        if (d.roles?.length) {
          setActiveRoleId(d.roles[0].id)
          setLocalMatrix(d.roles[0].matrix ?? {})
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(module: string, permission: string, enabled: boolean) {
    if (!activeRoleId) return
    setSaving(`${module}.${permission}`)
    setLocalMatrix((prev) => ({ ...prev, [module]: { ...(prev[module] ?? {}), [permission]: enabled } }))
    await adminFetch('/api/admin/biz/permissions/matrix', {
      method: 'PATCH',
      body: JSON.stringify({ roleId: activeRoleId, module, permission, enabled }),
    }).catch(() =>
      setLocalMatrix((prev) => ({ ...prev, [module]: { ...(prev[module] ?? {}), [permission]: !enabled } }))
    )
    setSaving(null)
  }

  async function commit() {
    if (!activeRoleId) return
    setCommitting(true)
    await adminFetch('/api/admin/biz/permissions/matrix', {
      method: 'PUT',
      body: JSON.stringify({ roleId: activeRoleId, matrix: localMatrix }),
    })
    setCommitting(false)
    setCommitted(true)
    setTimeout(() => setCommitted(false), 3000)
  }

  return (
    <div className="bp-page">
      <div className="perm-wrapper">
        {/* Left Roles Sidebar */}
        <aside className={`perm-sidebar ${showMobileSidebar ? 'perm-sidebar--mobile-open' : ''}`}>
          {/* Header */}
          <div className="bp-sidebar-header">
            <div className="bp-sidebar-icon">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="bp-sidebar-title">Role Matrix</h3>
              <span className="bp-sidebar-subtitle">Access control schemas</span>
            </div>
          </div>

          {/* Member Overrides Option Button */}
          <button
            onClick={() => setView((v) => (v === 'overrides' ? 'roles' : 'overrides'))}
            className={`role-nav-btn bp-override-btn ${view === 'overrides' ? 'active' : ''}`}
          >
            <div className="bp-nav-btn-left">
              <UserCheck size={16} />
              <span>User Overrides</span>
            </div>
            <ChevronRight size={14} />
          </button>

          {/* Roles Group Title */}
          <div className="bp-roles-group-title">
            CORPORATE ROLES ({roles.length})
          </div>

          {/* Roles List */}
          {loading ? (
            <div className="bp-sidebar-loading">
              Loading roles…
            </div>
          ) : (
            roles.map((role) => {
              const isRoleActive = activeRoleId === role.id && view === 'roles'
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRoleId(role.id)
                    setLocalMatrix(role.matrix ?? {})
                    setView('roles')
                  }}
                  className={`role-nav-btn ${isRoleActive ? 'active' : ''}`}
                >
                  <div className="bp-nav-btn-left">
                    <ShieldCheck size={15} color={isRoleActive ? 'var(--accent, #E31E24)' : '#6B7280'} />
                    <span className="bp-role-label">{role.label}</span>
                  </div>
                  {isRoleActive && (
                    <span className="bp-role-dot" />
                  )}
                </button>
              )
            })
          )}
        </aside>

        {/* Main Content Workspace */}
        <main className="perm-main">
          {/* Breadcrumb & Mobile Toggle */}
          <div className="bp-breadcrumb-row">
            <div className="bp-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="bp-breadcrumb-active">Access Governance & Permissions</span>
            </div>

            <button onClick={() => setShowMobileSidebar((v) => !v)} className="btn-secondary mobile-sidebar-toggle">
              <Filter size={14} /> {showMobileSidebar ? 'Hide Roles' : 'Show Roles'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="bp-hero-glow" />

            <div className="bp-hero-content">
              <div className="bp-hero-left">
                <div className="bp-hero-icon">
                  <Lock size={28} />
                </div>
                <div>
                  <h1 className="bp-hero-title">
                    Access Governance Matrix <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="bp-hero-subtitle">
                    Grant module permissions across flight bookings, wallet top-ups, approval rules, and member settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div className="bp-hero-metrics">
              <div>
                <div className="bp-metric-label">Active Role Schema</div>
                <div className="bp-metric-value bp-metric-value--schema">
                  {activeRole ? activeRole.label : 'Overrides'}
                </div>
              </div>
              <div>
                <div className="bp-metric-label">Configured Modules</div>
                <div className="bp-metric-value bp-metric-value--modules">{BIZ_MODULES.length} Modules</div>
              </div>
              <div>
                <div className="bp-metric-label">Governance View</div>
                <div className="bp-metric-value bp-metric-value--view">
                  {view === 'roles' ? 'Role Schema' : 'User Overrides'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Body: Override Engine OR Role Module Matrix Grid */}
          {view === 'overrides' ? (
            <div className="card-shell">
              <OverrideEngine portal={PORTAL} modules={BIZ_MODULES} overridesUrl="/api/admin/biz/permissions/overrides" />
            </div>
          ) : activeRole ? (
            <>
              {/* Header with Commit Action Button */}
              <div className="bp-schema-header">
                <div className="bp-schema-header-left">
                  <Building2 size={22} color="var(--accent, #E31E24)" />
                  <h2 className="bp-schema-title">
                    ROLE SCHEMA: <span className="bp-schema-accent">{activeRole.label.toUpperCase()}</span>
                  </h2>
                </div>

                <button onClick={commit} disabled={committing} className="btn-primary">
                  {committing ? (
                    'Saving Matrix…'
                  ) : committed ? (
                    <>
                      <Check size={16} /> Saved Successfully
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Save Permission Matrix
                    </>
                  )}
                </button>
              </div>

              {/* Module Cards Grid */}
              <div className="modules-grid">
                {BIZ_MODULES.map((mod) => (
                  <ModuleCard
                    key={mod.key}
                    module={mod}
                    matrix={localMatrix[mod.key] ?? {}}
                    highlight={mod.key === 'policy'}
                    saving={saving?.startsWith(mod.key + '.') ? saving.split('.')[1] : null}
                    onChange={(perm, enabled) => handleToggle(mod.key, perm, enabled)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
