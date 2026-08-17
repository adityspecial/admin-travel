'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PermissionDenied } from '@/components/ui/PermissionDenied'

interface Failure {
  id: string; bookingType: string; profileId: string | null
  amount: number | null; errorMessage: string; errorCode: string | null
  context: Record<string, unknown> | null; createdAt: string
  paymentStatus: string | null; razorpayPaymentId: string | null
  resolvedAt: string | null; resolutionPnr: string | null; resolutionNotes: string | null
}
interface Stats { total: number; today: number; capturedNoBooking: number; moneyAtRisk: number }

const TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', cab: 'Cab', bus: 'Bus', insurance: 'Insurance',
  multicity: 'Multicity', flightseva: 'FlightSeva', nexus: 'Nexus', kafila: 'Kafila',
  airiq: 'AirIQ', fareguide: 'FareGuide',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BookingFailuresPage() {
  const [failures, setFailures] = useState<Failure[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [type, setType] = useState('')
  const [days, setDays] = useState('30')

  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvePnr, setResolvePnr] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  function load() {
    setLoading(true); setError(''); setPermissionDenied(false)
    const qs = new URLSearchParams({ days })
    if (type) qs.set('type', type)
    adminFetch(`/api/admin/super/booking-failures?${qs.toString()}`)
      .then(d => { setFailures(d.failures ?? []); setStats(d.stats ?? null) })
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function openResolve(id: string) {
    setResolvingId(id); setResolvePnr(''); setResolveNotes('')
  }

  async function submitResolve() {
    if (!resolvingId) return
    setResolving(true)
    try {
      await adminFetch(`/api/admin/super/booking-failures/${resolvingId}/resolve`, {
        method: 'POST', body: JSON.stringify({ pnr: resolvePnr, notes: resolveNotes }),
      })
      setResolvingId(null)
      load()
    } catch (e: any) {
      setError(e.message ?? 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Failed Bookings</h2>
        <span className="topbar-meta">Bookings that failed at the provider after payment — includes payment reconciliation</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Stat tiles */}
          <section className="stat-grid">
            {[
              { label: 'Failures (period)', value: String(stats?.total ?? 0), sub: `Last ${days} days`, icon: 'ERR', tone: 'rose' },
              { label: 'Today', value: String(stats?.today ?? 0), sub: 'Needs daily review', icon: 'DAY', tone: 'orange' },
              { label: 'Money Captured, No Booking', value: String(stats?.capturedNoBooking ?? 0), sub: 'Most urgent — payment succeeded, nothing booked', icon: '!', tone: 'rose' },
              { label: 'Money at Risk', value: `₹${Number(stats?.moneyAtRisk ?? 0).toLocaleString('en-IN')}`, sub: 'Captured payments with no successful booking', icon: '₹', tone: 'rose' },
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

          {/* Filters */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Filters</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px 20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Type
                <select value={type} onChange={e => setType(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="">All</option>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Period
                <select value={days} onChange={e => setDays(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </label>
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
              </div>
            </div>
          </section>

          {/* Failures table */}
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Failed Attempts</div>
                <div className="card-copy">Most recent first. "Payment" shows whether money was actually captured.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Error</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="empty-state">{permissionDenied ? <PermissionDenied message={error} /> : <span style={{ color: '#DC2626' }}>{error}</span>}</td></tr>
                ) : failures.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No booking failures in this period.</td></tr>
                ) : failures.map(f => (
                  <tr key={f.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(f.createdAt)}</td>
                    <td>{TYPE_LABELS[f.bookingType] ?? f.bookingType}</td>
                    <td style={{ fontWeight: 800 }}>{f.amount != null ? `₹${Number(f.amount).toLocaleString('en-IN')}` : '--'}</td>
                    <td>
                      {f.paymentStatus === 'captured' ? (
                        <span className="badge badge-red">Captured — no booking</span>
                      ) : f.paymentStatus ? (
                        <span className="badge badge-yellow">{f.paymentStatus}</span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>--</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 420, color: '#374151' }}>{f.errorMessage}</td>
                    <td>
                      {f.resolvedAt ? (
                        <span className="badge badge-green" title={f.resolutionNotes ?? ''}>
                          Resolved{f.resolutionPnr ? ` · ${f.resolutionPnr}` : ''}
                        </span>
                      ) : resolvingId === f.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                          <input value={resolvePnr} onChange={e => setResolvePnr(e.target.value)} placeholder="PNR (if rebooked)"
                            style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 11 }} />
                          <input value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="Notes"
                            style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 11 }} />
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-primary btn-sm" disabled={resolving} onClick={submitResolve}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setResolvingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => openResolve(f.id)}>Resolve</button>
                      )}
                    </td>
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
