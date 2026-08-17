'use client'
import { PermissionToggle } from './PermissionToggle'
import type { ModuleDef } from '@/lib/permissions/definitions'

interface Props {
  module:    ModuleDef
  matrix:    Record<string, boolean>   // permission key → enabled
  highlight?: boolean                  // orange border for system-critical modules
  onChange:  (permission: string, enabled: boolean) => void
  onBulkChange?: (permissions: string[], enabled: boolean) => void  // grant/revoke every permission in this module at once
  saving?:   string | null             // permission key currently saving
}

export function ModuleCard({ module: mod, matrix, highlight, onChange, onBulkChange, saving }: Props) {
  const allKeys = mod.permissions.map(p => p.key)
  const allOn  = allKeys.every(k => matrix[k])
  const allOff = allKeys.every(k => !matrix[k])

  return (
    <div className={`perm-card ${highlight ? 'perm-card--highlight' : ''}`}>
      {/* Module header */}
      <div className="perm-card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`perm-card-icon ${highlight ? 'perm-card-icon--highlight' : ''}`}>
            {mod.icon}
          </span>
          <span className="perm-card-label">
            {mod.label}
          </span>
        </div>
        {onBulkChange && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              disabled={allOn}
              onClick={() => onBulkChange(allKeys, true)}
              title="Grant every permission in this module"
              style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: allOn ? 'var(--ink-4)' : 'var(--accent)', cursor: allOn ? 'default' : 'pointer' }}
            >
              All
            </button>
            <button
              type="button"
              disabled={allOff}
              onClick={() => onBulkChange(allKeys, false)}
              title="Revoke every permission in this module"
              style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: allOff ? 'var(--ink-4)' : 'var(--danger)', cursor: allOff ? 'default' : 'pointer' }}
            >
              None
            </button>
          </div>
        )}
      </div>

      {/* Permissions list */}
      <div className="perm-list">
        {mod.permissions.map(perm => {
          const enabled   = matrix[perm.key] ?? false
          const isSaving  = saving === perm.key
          return (
            <div
              key={perm.key}
              title={perm.description}
              className={`perm-row ${enabled ? 'perm-row--enabled' : ''} ${perm.dangerous ? 'perm-row--dangerous' : ''}`}
            >
              <div className="perm-row-left">
                {perm.dangerous && enabled && (
                  <span className="perm-warn-icon">⚠</span>
                )}
                <span className={`perm-key ${enabled ? 'perm-key--enabled' : ''}`}>
                  {perm.key}
                </span>
              </div>
              {isSaving ? (
                <span className="perm-saving-dots">…</span>
              ) : (
                <PermissionToggle
                  enabled={enabled}
                  dangerous={perm.dangerous}
                  onChange={v => onChange(perm.key, v)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
