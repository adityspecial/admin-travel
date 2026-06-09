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
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        background: enabled
          ? (dangerous ? '#DC2626' : '#2563EB')
          : '#D1D5DB',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: enabled ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}
