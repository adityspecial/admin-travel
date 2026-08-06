'use client'

interface Props {
  enabled:   boolean
  dangerous?: boolean
  onChange:  (v: boolean) => void
  disabled?: boolean
}

export function PermissionToggle({ enabled, dangerous, onChange, disabled }: Props) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      title={enabled ? 'Enabled — click to revoke' : 'Disabled — click to grant'}
      className={`perm-toggle ${enabled ? 'perm-toggle--on' : ''} ${dangerous ? 'perm-toggle--dangerous' : ''}`}
    >
      <span className={`perm-toggle-knob ${enabled ? 'perm-toggle-knob--on' : ''}`} />
    </button>
  )
}
