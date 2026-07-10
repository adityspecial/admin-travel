'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

export default function SupportPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'open' | 'resolved'>('open')

  useEffect(() => {
    adminFetch('/api/admin/biz/approvals?status=all')
      .then(d => setApprovals(d.approvals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const shown = tab === 'open'
    ? approvals.filter(a => a.status === 'rejected')
    : approvals.filter(a => a.status === 'approved')

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Support Requests</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Track employee disputes, refund requests, and booking issues.</p>

      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
        {([['open', 'Open'], ['resolved', 'Resolved']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === key ? 700 : 500,
            color: tab === key ? '#E31E24' : '#6B7280',
            borderBottom: tab === key ? '2px solid #E31E24' : '2px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : shown.length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{tab === 'open' ? '🎉' : '📋'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>
              {tab === 'open' ? 'No open support requests' : 'No resolved requests yet'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {tab === 'open' ? 'Rejected travel requests will appear here.' : 'Approved bookings will appear here.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Employee', 'Type', 'Amount', tab === 'open' ? 'Rejected On' : 'Approved On', 'Comment', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600 }}>{a.requester?.work_email ?? '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>{a.booking_type}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>₹{a.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>
                    {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280', maxWidth: 200 }}>{a.comment ?? '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <a href="/biz/approvals" style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
