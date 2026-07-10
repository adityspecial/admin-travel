'use client'
import { useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionToggle } from './PermissionToggle'
import type { ModuleDef } from '@/lib/permissions/definitions'

type TargetType = 'admin_staff' | 'biz_member' | 'partner_agent'

interface User {
  id: string; _type: TargetType
  email?: string; full_name?: string; work_email?: string
  name?: string; agent_code?: string
  role?: string; dept?: string
}

interface Override { module: string; permission: string; enabled: boolean; reason?: string }

interface Props {
  portal:       string
  modules:      ModuleDef[]
  overridesUrl?: string
}

export function OverrideEngine({ portal, modules, overridesUrl = '/api/admin/super/permissions/overrides' }: Props) {
  const defaultType: TargetType = portal === 'biz' ? 'biz_member' : portal === 'partner' ? 'partner_agent' : 'admin_staff'
  const [targetType, setTargetType] = useState<TargetType>(defaultType)
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<User[]>([])
  const [selected,   setSelected]   = useState<User | null>(null)
  const [overrides,  setOverrides]  = useState<Override[]>([])
  const [searching,  setSearching]  = useState(false)
  const [saving,     setSaving]     = useState<string | null>(null)

  async function search(q: string) {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const d = await adminFetch(overridesUrl, {
        method: 'POST',
        body: JSON.stringify({ portal, q, type: targetType }),
      })
      setResults(d.users ?? [])
    } catch {}
    setSearching(false)
  }

  async function selectUser(u: User) {
    setSelected(u); setResults([]); setQuery(userName(u))
    const d = await adminFetch(`${overridesUrl}?targetType=${u._type}&targetId=${u.id}&portal=${portal}`)
    setOverrides(d.overrides ?? [])
  }

  function getOverride(module: string, perm: string): Override | undefined {
    return overrides.find(o => o.module === module && o.permission === perm)
  }

  async function toggleOverride(module: string, perm: string, enabled: boolean) {
    if (!selected) return
    const key = `${module}.${perm}`
    setSaving(key)
    await adminFetch(overridesUrl, {
      method: 'PATCH',
      body: JSON.stringify({
        portal, targetType: selected._type, targetId: selected.id,
        module, permission: perm, enabled,
      }),
    })
    setOverrides(prev => {
      const filtered = prev.filter(o => !(o.module === module && o.permission === perm))
      return [...filtered, { module, permission: perm, enabled }]
    })
    setSaving(null)
  }

  async function clearOverride(module: string, perm: string) {
    if (!selected) return
    await adminFetch(overridesUrl, {
      method: 'DELETE',
      body: JSON.stringify({ targetType: selected._type, targetId: selected.id, module, permission: perm }),
    })
    setOverrides(prev => prev.filter(o => !(o.module === module && o.permission === perm)))
  }

  function userName(u: User) {
    return u.full_name ?? u.name ?? u.work_email ?? u.email ?? u.agent_code ?? u.id
  }

  // Scope tabs by portal — biz admins only see their own members
  const allTabs: { type: TargetType; label: string; portals: string[] }[] = [
    { type: 'admin_staff',   label: 'Admins',            portals: ['super_admin'] },
    { type: 'biz_member',    label: 'Corporate Members', portals: ['super_admin', 'biz'] },
    { type: 'partner_agent', label: 'Partner Agents',    portals: ['super_admin', 'partner'] },
  ]
  const tabs = allTabs.filter(t => t.portals.includes(portal))

  return (
    <div>
      {/* Fingerprint header */}
      <div style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🫆</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Individual Override Engine</h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          {portal === 'biz'
            ? 'Grant or revoke specific permissions for members in your organisation.'
            : portal === 'partner'
            ? 'Grant or revoke specific permissions for agents in your network.'
            : 'Search any user to grant or revoke specific permissions on top of their role.'}
        </p>
      </div>

      {/* Target type tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.type}
            onClick={() => { setTargetType(t.type); setSelected(null); setQuery(''); setResults([]); setOverrides([]) }}
            style={{
              padding: '9px 24px', borderRadius: 100, border: '1.5px solid #E5E7EB',
              background: targetType === t.type ? '#111827' : '#fff',
              color: targetType === t.type ? '#fff' : '#374151',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1.5px solid #E5E7EB', borderRadius: 100,
          padding: '12px 20px', background: '#F9FAFB',
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#111827' }}
            placeholder="Search by name, email, ID or agent code…"
            value={query}
            onChange={e => search(e.target.value)}
          />
          {searching && <span style={{ fontSize: 12, color: '#9CA3AF' }}>…</span>}
        </div>

        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
            boxShadow: '0 16px 40px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50,
          }}>
            {results.map(u => (
              <div
                key={u.id}
                onClick={() => selectUser(u)}
                style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#2563EB' }}>
                  {(userName(u)[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{userName(u)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u._type.replace('_', ' ')} {u.role ? `· ${u.role}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override matrix for selected user */}
      {selected && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '14px 20px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #BBF7D0' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
              {(userName(selected)[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{userName(selected)}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{selected._type.replace(/_/g, ' ')} {selected.role ? `· ${selected.role}` : ''} {overrides.length > 0 ? `· ${overrides.length} override${overrides.length > 1 ? 's' : ''} active` : '· No overrides'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {modules.map(mod => (
              <div key={mod.key} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 16 }}>{mod.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' }}>{mod.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mod.permissions.map(perm => {
                    const ov = getOverride(mod.key, perm.key)
                    const key = `${mod.key}.${perm.key}`
                    return (
                      <div key={perm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '5px 8px', borderRadius: 8, background: ov ? (ov.enabled ? '#EFF6FF' : '#FEF2F2') : 'transparent' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', fontFamily: 'monospace', flex: 1 }}>{perm.key}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {ov && (
                            <button
                              onClick={() => clearOverride(mod.key, perm.key)}
                              title="Clear override — revert to role default"
                              style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                            >✕</button>
                          )}
                          <PermissionToggle
                            enabled={ov?.enabled ?? false}
                            dangerous={perm.dangerous}
                            onChange={v => toggleOverride(mod.key, perm.key, v)}
                            disabled={saving === key}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
