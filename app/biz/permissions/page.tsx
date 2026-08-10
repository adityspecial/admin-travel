'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { BIZ_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'
import { AppPopup } from '@/components/ui/AppPopup'
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
  Plus,
  Pencil,
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
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', label: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameLabel, setRenameLabel] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  const activeRole = roles.find((r) => r.id === activeRoleId) ?? null

  function fetchRoles() {
    return adminFetch('/api/admin/biz/permissions/roles').then((d) => {
      setRoles(d.roles ?? [])
      return d.roles ?? []
    })
  }

  useEffect(() => {
    setLoading(true)
    fetchRoles()
      .then((loaded) => {
        if (loaded.length) {
          setActiveRoleId(loaded[0].id)
          setLocalMatrix(loaded[0].matrix ?? {})
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setCreateError('')
    try {
      const result = await adminFetch('/api/admin/biz/permissions/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name, label: createForm.label,
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
      await adminFetch(`/api/admin/biz/permissions/roles/${activeRole.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: renameLabel.trim() }),
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
          <div className="bp-roles-group-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            CORPORATE ROLES ({roles.length})
            <button onClick={() => setShowCreate(true)} title="Create custom role" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
              <Plus size={14} />
            </button>
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
                  {renaming ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        autoFocus
                        value={renameLabel}
                        onChange={e => setRenameLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveRename()}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 14 }}
                      />
                      <button className="btn-primary" disabled={renameSaving} onClick={saveRename}>
                        {renameSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button className="btn-secondary" onClick={() => setRenaming(false)}>Cancel</button>
                    </div>
                  ) : (
                    <h2 className="bp-schema-title">
                      ROLE SCHEMA: <span className="bp-schema-accent">{activeRole.label.toUpperCase()}</span>
                      <button onClick={startRename} title="Rename role" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, verticalAlign: 'middle', color: 'inherit', opacity: 0.6 }}>
                        <Pencil size={14} />
                      </button>
                    </h2>
                  )}
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
                    saving={saving?.startsWith(mod.key + '.') ? saving.split('.')[1] : null}
                    onChange={(perm, enabled) => handleToggle(mod.key, perm, enabled)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </main>
      </div>

      <AppPopup
        isOpen={showCreate}
        title="Create Custom Role"
        subtitle="Define a new role for your organisation."
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
              placeholder="e.g. travel_coordinator"
            />
          </div>
          <div className="app-input-group">
            <label className="app-input-label">Display Label *</label>
            <input
              className="app-input" required
              value={createForm.label}
              onChange={e => setCreateForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Travel Coordinator"
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
