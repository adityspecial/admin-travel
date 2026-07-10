'use client'

export function CheckItem({ label, arr, setArr }: {
  label: string
  arr: string[]
  setArr: (v: string[]) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={arr.includes(label)}
        onChange={e => setArr(e.target.checked ? [...arr, label] : arr.filter(x => x !== label))}
        style={{ accentColor: '#E31E24' }}
      />
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
    </label>
  )
}

export function RadioItem({ label, value, group, current, onChange }: {
  label: string
  value: string
  group: string
  current: string
  onChange: (v: string) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
      <input
        type="radio"
        name={group}
        checked={current === value}
        onChange={() => onChange(value === current ? '' : value)}
        style={{ accentColor: '#E31E24' }}
      />
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
    </label>
  )
}

export function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}
