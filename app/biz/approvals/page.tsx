'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/admin/biz/approvals?status=all')
      .then((data) => setApprovals(data.approvals ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function action(id: string, act: 'approve' | 'reject') {
    await adminFetch(`/api/admin/biz/approvals/${id}`, { method: 'PATCH', body: JSON.stringify({ action: act }) })
    setApprovals((prev) => prev.map((approval) => (approval.id === id ? { ...approval, status: act === 'approve' ? 'approved' : 'rejected' } : approval)))
  }

  const filtered = filter === 'all' ? approvals : approvals.filter((approval) => approval.status === filter)
  const { slice: pageApprovals, page, setPage, total } = usePagination(filtered, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Approvals</h2>
        <div className="segmented-row">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
            <button key={item} className={`segment-btn ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
              {item !== 'all' && ` (${approvals.filter((approval) => approval.status === item).length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-content">
        <div className="table-card">
          <table>
            <thead>
              <tr><th>Requester</th><th>Type</th><th>Trip</th><th>Amount</th><th>Dept</th><th>Purpose</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="empty-state">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="empty-state">No approvals.</td></tr>
              ) : pageApprovals.map((approval) => (
                <tr key={approval.id}>
                  <td style={{ fontSize: 12, fontWeight: 700 }}>{approval.requester?.work_email ?? '--'}</td>
                  <td><span className={`badge ${approval.booking_type === 'hotel' ? 'badge-green' : 'badge-blue'}`}>{approval.booking_type}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {approval.booking_type !== 'hotel' && approval.flight_data ? (
                      <div>
                        <div style={{ fontWeight: 800 }}>{approval.flight_data.from} to {approval.flight_data.to}</div>
                        {approval.flight_data.date && <div style={{ color: '#94A3B8' }}>{new Date(approval.flight_data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                        {approval.flight_data.airline && <div style={{ color: '#94A3B8' }}>{approval.flight_data.airline} {approval.flight_data.flightNum}</div>}
                      </div>
                    ) : approval.booking_type === 'hotel' && approval.hotel_data ? (
                      <div>
                        <div style={{ fontWeight: 800 }}>{approval.hotel_data.hotelName}</div>
                        {approval.hotel_data.checkIn && (
                          <div style={{ color: '#94A3B8' }}>
                            {new Date(approval.hotel_data.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {approval.hotel_data.checkOut ? ` - ${new Date(approval.hotel_data.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                            {approval.hotel_data.nights ? ` | ${approval.hotel_data.nights}N` : ''}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: '#CBD5E1' }}>--</span>}
                  </td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(approval.amount)}</td>
                  <td style={{ color: '#64748B' }}>{approval.dept ?? '--'}</td>
                  <td>{approval.purpose}</td>
                  <td>
                    <span className={`badge ${approval.status === 'approved' ? 'badge-green' : approval.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748B', fontSize: 12 }}>{new Date(approval.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    {approval.status === 'pending' && (
                      <div className="page-actions">
                        <button className="btn btn-muted btn-sm" onClick={() => action(approval.id, 'approve')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => action(approval.id, 'reject')}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination total={total} page={page} perPage={20} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
