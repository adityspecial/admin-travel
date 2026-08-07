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
      <div className="perm-oe-header">
        <div className="perm-oe-emoji">🫆</div>
        <h2 className="perm-oe-title">Individual Override Engine</h2>
        <p className="perm-oe-subtitle">
          {portal === 'biz'
            ? 'Grant or revoke specific permissions for members in your organisation.'
            : portal === 'partner'
            ? 'Grant or revoke specific permissions for agents in your network.'
            : 'Search any user to grant or revoke specific permissions on top of their role.'}
        </p>
      </div>

      {/* Target type tabs */}
      <div className="perm-oe-tabs">
        {tabs.map(t => (
          <button
            key={t.type}
            onClick={() => { setTargetType(t.type); setSelected(null); setQuery(''); setResults([]); setOverrides([]) }}
            className={`perm-oe-tab ${targetType === t.type ? 'perm-oe-tab--active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="perm-oe-search-wrap">
        <div className="perm-oe-search-box">
          <span className="perm-icon-16">🔍</span>
          <input
            className="perm-oe-search-input"
            placeholder="Search by name, email, ID or agent code…"
            value={query}
            onChange={e => search(e.target.value)}
          />
          {searching && <span className="perm-oe-searching">…</span>}
        </div>

        {results.length > 0 && (
          <div className="perm-oe-results">
            {results.map(u => (
              <div
                key={u.id}
                onClick={() => selectUser(u)}
                className="perm-oe-result-row"
              >
                <div className="perm-oe-avatar-sm">
                  {(userName(u)[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <div className="perm-oe-result-name">{userName(u)}</div>
                  <div className="perm-oe-result-meta">{u._type.replace('_', ' ')} {u.role ? `· ${u.role}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override matrix for selected user */}
      {selected && (
        <div>
          <div className="perm-oe-selected-banner">
            <div className="perm-oe-avatar-lg">
              {(userName(selected)[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <div className="perm-oe-selected-name">{userName(selected)}</div>
              <div className="perm-oe-selected-meta">{selected._type.replace(/_/g, ' ')} {selected.role ? `· ${selected.role}` : ''} {overrides.length > 0 ? `· ${overrides.length} override${overrides.length > 1 ? 's' : ''} active` : '· No overrides'}</div>
            </div>
          </div>

          <div className="perm-module-grid">
            {modules.map(mod => (
              <div key={mod.key} className="perm-oe-mod-card">
                <div className="perm-card-header">
                  <span className="perm-icon-16">{mod.icon}</span>
                  <span className="perm-card-label">{mod.label}</span>
                </div>
                <div className="perm-oe-list">
                  {mod.permissions.map(perm => {
                    const ov = getOverride(mod.key, perm.key)
                    const key = `${mod.key}.${perm.key}`
                    return (
                      <div key={perm.key} className={`perm-oe-row ${ov ? (ov.enabled ? 'perm-oe-row--enabled' : 'perm-oe-row--disabled') : ''}`}>
                        <span className="perm-oe-key">{perm.key}</span>
                        <div className="perm-oe-row-right">
                          {ov && (
                            <button
                              onClick={() => clearOverride(mod.key, perm.key)}
                              title="Clear override — revert to role default"
                              className="perm-oe-clear-btn"
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
