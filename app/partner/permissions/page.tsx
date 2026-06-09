'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PARTNER_MODULES } from '@/lib/permissions/definitions'
import { ModuleCard } from '../../super/permissions/ModuleCard'
import { OverrideEngine } from '../../super/permissions/OverrideEngine'

const PORTAL  = 'partner'
const ACCENT  = '#ff7a18'   // orange — partner brand

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#111827', color: '#fff', padding: '16px 20px', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
          NAVIGATION HUB
        </div>

        <button
          onClick={() => setView(v => v === 'overrides' ? 'roles' : 'overrides')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: view === 'overrides' ? '#FFF7ED' : '#fff', border: 'none', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', width: '100%', textAlign: 'left' }}
        >
          <span>🛡</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: view === 'overrides' ? ACCENT : '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sub-Agent Overrides</span>
        </button>

        <div style={{ padding: '12px 20px 6px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>Agent Roles</div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
            : roles.map(role => (
              <button key={role.id} onClick={() => { setActiveRoleId(role.id); setLocalMatrix(role.matrix ?? {}); setView('roles') }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 20px', border: 'none', background: activeRoleId === role.id && view === 'roles' ? '#FFF7ED' : '#fff', color: activeRoleId === role.id && view === 'roles' ? ACCENT : '#374151', fontWeight: activeRoleId === role.id ? 800 : 600, fontSize: 13, textAlign: 'left', cursor: 'pointer', borderLeft: activeRoleId === role.id && view === 'roles' ? `3px solid ${ACCENT}` : '3px solid transparent' }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>{role.label}</span>
                {activeRoleId === role.id && view === 'roles' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />}
              </button>
            ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F9FAFB' }}>
        {view === 'overrides' ? (
          <OverrideEngine portal={PORTAL} modules={PARTNER_MODULES} />
        ) : activeRole ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🛡</span>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
                  ROLE SCHEMA: <span style={{ color: ACCENT }}>{activeRole.label.toUpperCase()}</span>
                </h1>
              </div>
              <button onClick={commit} disabled={committing}
                style={{ padding: '12px 28px', borderRadius: 100, border: 'none', background: committed ? '#16A34A' : ACCENT, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5 }}>
                {committing ? 'Saving…' : committed ? '✓ Committed' : 'COMMIT ARCHITECTURE'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PARTNER_MODULES.map(mod => (
                <ModuleCard key={mod.key} module={mod} matrix={localMatrix[mod.key] ?? {}}
                  highlight={mod.key === 'sub_agent'}
                  saving={saving?.startsWith(mod.key + '.') ? saving.split('.')[1] : null}
                  onChange={(perm, enabled) => handleToggle(mod.key, perm, enabled)} />
              ))}
            </div>
          </>
        ) : !loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No roles configured</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
