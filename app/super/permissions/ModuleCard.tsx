'use client'
import { PermissionToggle } from './PermissionToggle'
import type { ModuleDef } from '@/lib/permissions/definitions'

interface Props {
  module:    ModuleDef
  matrix:    Record<string, boolean>   // permission key → enabled
  highlight?: boolean                  // orange border for system-critical modules
  onChange:  (permission: string, enabled: boolean) => void
  saving?:   string | null             // permission key currently saving
}

export function ModuleCard({ module: mod, matrix, highlight, onChange, saving }: Props) {
  return (
    <div className={`perm-card ${highlight ? 'perm-card--highlight' : ''}`}>
      {/* Module header */}
      <div className="perm-card-header">
        <span className={`perm-card-icon ${highlight ? 'perm-card-icon--highlight' : ''}`}>
          {mod.icon}
        </span>
        <span className="perm-card-label">
          {mod.label}
        </span>
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
