'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Dispute {
  id: string; booking_type: string; amount: number; comment: string | null
  created_at: string; reviewed_at: string | null
  biz_organizations?: { name: string; org_code: string }
  biz_members?: { work_email: string }
}

function formatDate(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BizApprovalDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/super/biz-approval-disputes')
      .then(d => setDisputes(d.disputes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = disputes.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (d.biz_organizations?.name ?? '').toLowerCase().includes(q)
      || (d.biz_members?.work_email ?? '').toLowerCase().includes(q)
      || (d.booking_type ?? '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="admin-topbar">
        <h2>Corporate Disputes</h2>
        <span className="topbar-meta">Rejected travel requests, by organisation — the same list each org's own admin sees under Support</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Search</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search organisation, employee, or booking type..."
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 280 }} />
            </div>
          </section>

          <div className="table-card">
            <table>
              <thead>
                <tr><th>Organisation</th><th>Employee</th><th>Booking Type</th><th>Amount</th><th>Rejected</th><th>Reviewer Comment</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No rejected requests.</td></tr>
                ) : filtered.map(d => (
                  <tr key={d.id}>
                    <td>{d.biz_organizations?.name ?? '--'} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({d.biz_organizations?.org_code})</span></td>
                    <td>{d.biz_members?.work_email ?? '--'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{d.booking_type}</td>
                    <td style={{ fontWeight: 800 }}>{d.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : '--'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(d.reviewed_at)}</td>
                    <td style={{ color: '#6B7280', maxWidth: 320 }}>{d.comment ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
