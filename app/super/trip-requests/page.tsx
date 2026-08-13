'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface TripRequest {
  id: string
  mode: 'flight' | 'train' | 'bus' | 'cab'
  from_city: string; to_city: string
  depart_date: string; return_date: string | null
  return_from_city: string | null; return_to_city: string | null
  dept: string | null; purpose: string; notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  org: { id: string; name: string; org_code: string } | null
  requester: { id: string; work_email: string } | null
  reviewer: { id: string; work_email: string } | null
}

const MODE_LABEL: Record<string, string> = { flight: 'Flight', train: 'Train', bus: 'Bus', cab: 'Cab' }
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fff7ed', color: '#d97706', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function SuperTripRequestsPage() {
  const [requests, setRequests] = useState<TripRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  function load(status: typeof statusFilter) {
    setLoading(true)
    adminFetch(`/api/admin/super/trip-requests?status=${status}`)
      .then(d => setRequests(d.requests ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div>
      <div className="admin-topbar">
        <h2>Trip Requests</h2>
        <span className="topbar-meta">Travel intent raised by corporate employees, across every org — reach out and help them book</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div><div className="card-title">Raised Requests</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['pending', 'approved', 'rejected', 'all'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className="btn"
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: statusFilter === st ? '1.5px solid #2563eb' : '1.5px solid #E5E7EB',
                      backgroundColor: statusFilter === st ? '#eff6ff' : '#fff',
                      color: statusFilter === st ? '#2563eb' : '#6B7280',
                    }}
                  >
                    {st === 'all' ? 'All' : STATUS_STYLE[st].label}
                  </button>
                ))}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Raised</th>
                  <th>Org</th>
                  <th>Mode</th>
                  <th>Route</th>
                  <th>Travel Dates</th>
                  <th>Purpose</th>
                  <th>Requester Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="empty-state">Loading…</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No trip requests found.</td></tr>
                ) : requests.map(r => {
                  const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending
                  return (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                      <td style={{ fontWeight: 700 }}>{r.org?.name ?? '—'}</td>
                      <td>{MODE_LABEL[r.mode] ?? 'Flight'}</td>
                      <td>
                        {r.from_city} → {r.to_city}
                        {r.mode === 'train' && r.return_from_city && (
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            Return: {r.return_from_city} → {r.return_to_city}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.depart_date}{r.return_date ? ` – ${r.return_date}` : ''}
                      </td>
                      <td style={{ maxWidth: 220 }}>{r.purpose}</td>
                      <td>{r.requester?.work_email ?? '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          backgroundColor: st.bg, color: st.color, padding: '4px 10px',
                          borderRadius: 999, fontSize: 12, fontWeight: 700,
                        }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
