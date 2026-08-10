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

// A staged, not-yet-saved edit — 'set' stages a toggle to a new value,
// 'clear' stages removing an existing override back to the role default.
type PendingChange =
  | { action: 'set'; module: string; permission: string; enabled: boolean }
  | { action: 'clear'; module: string; permission: string }

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
  const [pending,    setPending]    = useState<Record<string, PendingChange>>({})
  const [committing, setCommitting] = useState(false)
  const [commitError, setCommitError] = useState('')

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
    setPending({}); setCommitError('')
    const d = await adminFetch(`${overridesUrl}?targetType=${u._type}&targetId=${u.id}&portal=${portal}`)
    setOverrides(d.overrides ?? [])
  }

  function switchTab(t: TargetType) {
    setTargetType(t); setSelected(null); setQuery(''); setResults([]); setOverrides([])
    setPending({}); setCommitError('')
  }

  function getOverride(module: string, perm: string): Override | undefined {
    return overrides.find(o => o.module === module && o.permission === perm)
  }

  // Stage a toggle — no network call yet, just marks it pending until Commit.
  function stageSet(module: string, perm: string, enabled: boolean) {
    const key = `${module}.${perm}`
    setPending(prev => ({ ...prev, [key]: { action: 'set', module, permission: perm, enabled } }))
  }

  // Stage clearing an existing (already-committed) override.
  function stageClear(module: string, perm: string) {
    const key = `${module}.${perm}`
    setPending(prev => ({ ...prev, [key]: { action: 'clear', module, permission: perm } }))
  }

  // Undo a staged edit that hasn't been committed yet — reverts the row to
  // whatever was last actually saved.
  function unstage(module: string, perm: string) {
    const key = `${module}.${perm}`
    setPending(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const pendingCount = Object.keys(pending).length

  async function commitAll() {
    if (!selected || !pendingCount) return
    setCommitting(true); setCommitError('')
    const entries = Object.values(pending)
    try {
      await Promise.all(entries.map(change =>
        change.action === 'set'
          ? adminFetch(overridesUrl, {
              method: 'PATCH',
              body: JSON.stringify({
                portal, targetType: selected._type, targetId: selected.id,
                module: change.module, permission: change.permission, enabled: change.enabled,
              }),
            })
          : adminFetch(overridesUrl, {
              method: 'DELETE',
              body: JSON.stringify({ targetType: selected._type, targetId: selected.id, module: change.module, permission: change.permission }),
            })
      ))
      setOverrides(prev => {
        let next = prev
        for (const change of entries) {
          next = next.filter(o => !(o.module === change.module && o.permission === change.permission))
          if (change.action === 'set') next = [...next, { module: change.module, permission: change.permission, enabled: change.enabled }]
        }
        return next
      })
      setPending({})
    } catch (e: any) {
      setCommitError(e.message ?? 'Failed to save changes')
    }
    setCommitting(false)
  }

  function discardAll() {
    setPending({}); setCommitError('')
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
            onClick={() => switchTab(t.type)}
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
                    const change = pending[key]
                    const isPending = !!change
                    // What the toggle should show right now: the staged value
                    // if there's a pending 'set', off if pending 'clear',
                    // otherwise the last-committed override (if any).
                    const displayEnabled = change
                      ? (change.action === 'set' ? change.enabled : false)
                      : (ov?.enabled ?? false)
                    const showClearBtn = isPending || !!ov
                    const rowClass = isPending
                      ? 'perm-oe-row--pending'
                      : ov ? (ov.enabled ? 'perm-oe-row--enabled' : 'perm-oe-row--disabled') : ''
                    return (
                      <div key={perm.key} className={`perm-oe-row ${rowClass}`}>
                        <span className="perm-oe-key">{perm.key}</span>
                        <div className="perm-oe-row-right">
                          {showClearBtn && (
                            <button
                              onClick={() => isPending ? unstage(mod.key, perm.key) : stageClear(mod.key, perm.key)}
                              title={isPending ? 'Undo staged change' : 'Clear override — revert to role default'}
                              className="perm-oe-clear-btn"
                            >✕</button>
                          )}
                          <PermissionToggle
                            enabled={displayEnabled}
                            dangerous={perm.dangerous}
                            onChange={v => stageSet(mod.key, perm.key, v)}
                            disabled={committing || (change?.action === 'clear')}
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

      {/* Commit bar — only appears once something is staged */}
      {selected && pendingCount > 0 && (
        <div className="perm-oe-commit-bar">
          <span className="perm-oe-commit-count">{pendingCount} unsaved change{pendingCount > 1 ? 's' : ''}</span>
          {commitError && <span className="perm-oe-commit-error">{commitError}</span>}
          <div className="perm-oe-commit-actions">
            <button className="btn btn-ghost btn-sm" onClick={discardAll} disabled={committing}>Discard</button>
            <button className="btn btn-primary btn-sm" onClick={commitAll} disabled={committing}>
              {committing ? 'Saving…' : 'Commit Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
