'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { BIZ_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'
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
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .perm-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .perm-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
          padding: 24px 20px;
          overflow-y: auto;
          position: sticky;
          top: 54px;
          height: calc(100vh - 54px);
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.02);
        }
        .role-nav-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: #ffffff;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          text-align: left;
        }
        .role-nav-btn:hover {
          background: #F3F4F6;
        }
        .role-nav-btn.active {
          background: #FEF2F2;
          color: var(--accent, #E31E24);
          border-color: #FCA5A5;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(227, 30, 36, 0.08);
        }
        .perm-main {
          flex: 1;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
          overflow-y: auto;
        }
        .hero-banner-box {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
          border-radius: 24px;
          padding: 32px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px -10px rgba(49, 46, 129, 0.25);
        }
        .card-shell {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px var(--accent, rgba(227, 30, 36, 0.25));
          white-space: nowrap;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px var(--accent, rgba(227, 30, 36, 0.35));
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .mobile-sidebar-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .perm-wrapper {
            flex-direction: column;
          }
          .perm-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #E5E7EB;
            display: ${showMobileSidebar ? 'block' : 'none'};
          }
          .mobile-sidebar-toggle {
            display: inline-flex;
          }
          .perm-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .perm-main {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="perm-wrapper">
        {/* Left Roles Sidebar */}
        <aside className="perm-sidebar">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--accent, #E31E24)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--accent, rgba(227, 30, 36, 0.25))',
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', margin: 0 }}>Role Matrix</h3>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Access control schemas</span>
            </div>
          </div>

          {/* Member Overrides Option Button */}
          <button
            onClick={() => setView((v) => (v === 'overrides' ? 'roles' : 'overrides'))}
            className={`role-nav-btn ${view === 'overrides' ? 'active' : ''}`}
            style={{ marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={16} />
              <span>User Overrides</span>
            </div>
            <ChevronRight size={14} />
          </button>

          {/* Roles Group Title */}
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: '12px' }}>
            CORPORATE ROLES ({roles.length})
          </div>

          {/* Roles List */}
          {loading ? (
            <div style={{ padding: '16px', color: '#9CA3AF', fontSize: '12.5px', fontWeight: 600, textAlign: 'center' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={15} color={isRoleActive ? 'var(--accent, #E31E24)' : '#6B7280'} />
                    <span style={{ textTransform: 'capitalize' }}>{role.label}</span>
                  </div>
                  {isRoleActive && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent, #E31E24)' }} />
                  )}
                </button>
              )
            })
          )}
        </aside>

        {/* Main Content Workspace */}
        <main className="perm-main">
          {/* Breadcrumb & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Access Governance & Permissions</span>
            </div>

            <button onClick={() => setShowMobileSidebar((v) => !v)} className="btn-secondary mobile-sidebar-toggle">
              <Filter size={14} /> {showMobileSidebar ? 'Hide Roles' : 'Show Roles'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(227, 30, 36, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Lock size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Access Governance Matrix <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Grant module permissions across flight bookings, wallet top-ups, approval rules, and member settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Role Schema</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: '2px', textTransform: 'capitalize' }}>
                  {activeRole ? activeRole.label : 'Overrides'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Configured Modules</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>{BIZ_MODULES.length} Modules</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Governance View</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#60A5FA', marginTop: '2px', textTransform: 'capitalize' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={22} color="var(--accent, #E31E24)" />
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>
                    ROLE SCHEMA: <span style={{ color: 'var(--accent, #E31E24)' }}>{activeRole.label.toUpperCase()}</span>
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
