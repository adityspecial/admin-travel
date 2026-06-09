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
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `1.5px solid ${highlight ? '#F59E0B' : '#E5E7EB'}`,
      padding: '20px 24px', minWidth: 0,
    }}>
      {/* Module header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: highlight ? '#FEF3C7' : '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>
          {mod.icon}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' }}>
          {mod.label}
        </span>
      </div>

      {/* Permissions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mod.permissions.map(perm => {
          const enabled   = matrix[perm.key] ?? false
          const isSaving  = saving === perm.key
          return (
            <div
              key={perm.key}
              title={perm.description}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
                padding: '6px 10px', borderRadius: 8,
                background: enabled
                  ? (perm.dangerous ? '#FEF2F2' : '#EFF6FF')
                  : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {perm.dangerous && enabled && (
                  <span style={{ fontSize: 11, color: '#DC2626' }}>⚠</span>
                )}
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: enabled ? '#111827' : '#9CA3AF',
                  fontFamily: 'monospace',
                }}>
                  {perm.key}
                </span>
              </div>
              {isSaving ? (
                <span style={{ fontSize: 11, color: '#6B7280' }}>…</span>
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
