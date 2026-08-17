'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface Group {
  passengerName: string; route: string; date: string
  bookings: { id: string; bookingRef: string; createdAt: string }[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function DuplicateBookingsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('90')
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    adminFetch(`/api/admin/super/duplicate-bookings?days=${days}`)
      .then(d => setGroups(d.groups ?? []))
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div>
      <div className="admin-topbar">
        <h2>Duplicate Booking Detector</h2>
        <span className="topbar-meta">Same passenger, same route, same departure date — booked more than once</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Period</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
              <select value={days} onChange={e => setDays(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
            </div>
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">{groups.length} Flagged Group{groups.length === 1 ? '' : 's'}</div>
                <div className="card-copy">Detection only — review each before acting, a legitimate re-book after cancellation looks identical from this data alone.</div>
              </div>
            </div>
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : error ? (
              permissionDenied ? <PermissionDenied message={error} /> : <div className="empty-state" style={{ color: '#DC2626' }}>{error}</div>
            ) : groups.length === 0 ? (
              <div className="empty-state">No duplicates found in this period.</div>
            ) : (
              <table>
                <thead><tr><th>Passenger</th><th>Route</th><th>Date</th><th>Bookings</th></tr></thead>
                <tbody>
                  {groups.map((g, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{g.passengerName}</td>
                      <td>{g.route}</td>
                      <td>{g.date}</td>
                      <td>
                        {g.bookings.map(b => (
                          <div key={b.id} style={{ fontSize: 12, marginBottom: 2 }}>
                            <code>{b.bookingRef}</code> <span style={{ color: '#9CA3AF' }}>· {formatDate(b.createdAt)}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
