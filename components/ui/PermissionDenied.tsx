import { ShieldAlert } from 'lucide-react'

// Shown wherever a page's data fetch comes back 403 — replaces the raw
// '{"error":"Permission denied: module.permission"}' JSON string that used
// to get dumped straight into the table/page body.
export function PermissionDenied({ message }: { message: string }) {
  const permKey = message.match(/Permission denied:\s*(.+)/)?.[1]?.trim()
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--danger-lt)', color: 'var(--danger)',
      }}>
        <ShieldAlert size={22} strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>You don't have access to this section</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 380 }}>
        Ask a super admin to grant {permKey ? <code style={{ fontSize: 12 }}>{permKey}</code> : 'access to this section'} on your role.
      </div>
    </div>
  )
}
