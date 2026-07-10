'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface Booking {
  id: string
  booking_ref: string
  booking_type: string
  amount: number
  commission: number
  status: string
  customer_name: string
  travel_date: string
  created_at: string
  agent?: { agency_name: string; agent_code: string }
}

const TYPE_COLORS: Record<string, string> = {
  flight: 'badge-blue', hotel: 'badge-teal', bus: 'badge-gray',
  fixed_flight: 'badge-violet', package: 'badge-yellow',
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    adminFetch('/api/admin/partner/bookings', { agentId })
      .then((d: any) => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.agent?.agency_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalAmount     = bookings.reduce((s, b) => s + b.amount,     0)
  const totalCommission = bookings.reduce((s, b) => s + b.commission, 0)
  const { slice: pageBookings, page, setPage, total } = usePagination(filtered, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Team Bookings</h2>
        <span className="topbar-meta">{bookings.length} total bookings</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">

          <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Total Bookings',  value: bookings.length.toLocaleString('en-IN'), sub: 'Across your team',       icon: 'BK', tone: '' },
              { label: 'Total Amount',    value: `₹${totalAmount.toLocaleString('en-IN')}`, sub: 'Combined booking value', icon: 'AM', tone: 'teal' },
              { label: 'Total Commission',value: `₹${totalCommission.toLocaleString('en-IN')}`, sub: 'Earned by your team', icon: 'CM', tone: 'orange' },
            ].map(card => (
              <div className={`stat-card ${card.tone}`.trim()} key={card.label}>
                <div className="stat-head">
                  <div className="stat-num">{card.value}</div>
                  <span className="stat-icon">{card.icon}</span>
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            ))}
          </section>

          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">All Team Bookings</div>
                <div className="card-copy">Bookings made by you and all your sub-agents.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="form-input" style={{ width: 140 }} value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
                <input className="form-input" style={{ width: 220 }} placeholder="Search ref, customer, agent…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <p style={{ padding: 20, color: 'var(--muted)' }}>Loading…</p>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Agent</th>
                      <th>Amount</th>
                      <th>Commission</th>
                      <th>Travel Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="empty-state">No bookings found.</td></tr>
                    ) : pageBookings.map(b => (
                      <tr key={b.id}>
                        <td><code style={{ fontSize: 12 }}>{b.booking_ref}</code></td>
                        <td><span className={`badge ${TYPE_COLORS[b.booking_type] ?? 'badge-gray'}`}>{b.booking_type.replace('_', ' ')}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.customer_name ?? '--'}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {b.agent?.agency_name ?? 'Self'}
                          {b.agent?.agent_code && <span style={{ marginLeft: 4, opacity: 0.7 }}>({b.agent.agent_code})</span>}
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{b.amount.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>+₹{b.commission.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--muted)' }}>{b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-IN') : '--'}</td>
                        <td>
                          <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : b.status === 'cancelled' ? 'badge-red' : 'badge-gray'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination total={total} page={page} perPage={20} onPage={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
