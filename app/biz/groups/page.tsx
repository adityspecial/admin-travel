'use client'

export default function GroupsPage() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Company &amp; Employees &rsaquo; Groups</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Groups</h1>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '60px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Groups — Coming Soon</div>
        <div style={{ fontSize: 14, color: '#6B7280', maxWidth: 400, margin: '0 auto' }}>
          Create employee groups (e.g. Engineering, Sales) to apply different travel policies and budget caps per team.
        </div>
      </div>
    </div>
  )
}
