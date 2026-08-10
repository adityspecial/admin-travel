'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Booking {
  id: string; bookingType: string; bookingRef: string | null; status: string
  amount: number; customerName: string | null; source: string; createdAt: string
  resolvedAt?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', cab: 'Cab', bus: 'Bus',
  insurance: 'Insurance', multicity: 'Multicity', package: 'Package',
  kafila: 'Kafila', airiq: 'AirIQ', fareguide: 'FareGuide', nexus: 'Nexus',
}
const SOURCE_LABELS: Record<string, string> = { consumer: 'Consumer', mybiz: 'myBiz', mypartner: 'myPartner' }
const STATUS_BADGE: Record<string, string> = {
  confirmed: 'badge-green', pending: 'badge-yellow', cancelled: 'badge-red', failed: 'badge-red',
}
// Flight has a real provider-integrated cancel route already; hotel/cab/bus
// only get the manual DB-only override (see cancel-override route) — no
// provider cancel flow was scoped for those.
const OVERRIDE_TYPES = new Set(['hotel', 'cab', 'bus'])

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [type, setType] = useState('flight')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [remarks, setRemarks] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const [resolveTarget, setResolveTarget] = useState<Booking | null>(null)
  const [resolvePnr, setResolvePnr] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')

  function load() {
    setLoading(true); setError('')
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    if (source) qs.set('source', source)
    if (q.trim()) qs.set('q', q.trim())
    adminFetch(`/api/admin/super/bookings?${qs.toString()}`)
      .then(d => setBookings(d.bookings ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Reload whenever the type filter changes, so switching from Flight to
  // Hotel queries only the hotel table instead of loading every type.
  useEffect(() => { load() }, [type]) // eslint-disable-line

  const { slice: pageBookings, page, setPage, total } = usePagination(bookings, 20)

  function openCancel(b: Booking) {
    setCancelTarget(b); setRemarks(''); setCancelError('')
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setCancelling(true); setCancelError('')
    try {
      const path = cancelTarget.bookingType === 'flight'
        ? `/api/admin/super/bookings/flight/${cancelTarget.id}/cancel`
        : `/api/admin/super/bookings/${cancelTarget.bookingType}/${cancelTarget.id}/cancel-override`
      await adminFetch(path, { method: 'POST', body: JSON.stringify({ remarks }) })
      setCancelTarget(null)
      load()
    } catch (e: any) {
      setCancelError(e.message ?? 'Cancellation failed')
    } finally {
      setCancelling(false)
    }
  }

  function openResolve(b: Booking) {
    setResolveTarget(b); setResolvePnr(''); setResolveNotes(''); setResolveError('')
  }

  async function confirmResolve() {
    if (!resolveTarget) return
    setResolving(true); setResolveError('')
    try {
      await adminFetch(`/api/admin/super/bookings/flight/${resolveTarget.id}/resolve-failed`, {
        method: 'POST', body: JSON.stringify({ pnr: resolvePnr, notes: resolveNotes }),
      })
      setResolveTarget(null)
      load()
    } catch (e: any) {
      setResolveError(e.message ?? 'Failed to save resolution')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>All Bookings</h2>
        <span className="topbar-meta">Platform-wide bookings across every product and portal</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Filters */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Filters</div>
                <div className="card-copy">Narrow by booking type, origin portal, or search a reference/name.</div>
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
                Source
                <select value={source} onChange={e => setSource(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                  <option value="">All</option>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Search
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                  placeholder="Booking ref or name"
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 200 }} />
              </label>
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
              </div>
            </div>
          </section>

          {/* Bookings table */}
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Bookings</div>
                <div className="card-copy">Most recent bookings matching the current filters.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="empty-state">Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="empty-state" style={{ color: '#DC2626' }}>{error}</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No bookings match these filters.</td></tr>
                ) : pageBookings.map(b => (
                  <tr key={`${b.bookingType}-${b.id}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.createdAt)}</td>
                    <td>{TYPE_LABELS[b.bookingType] ?? b.bookingType}</td>
                    <td><code style={{ fontSize: 11 }}>{b.bookingRef ?? '--'}</code></td>
                    <td>{b.customerName ?? '--'}</td>
                    <td style={{ fontWeight: 800 }}>₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[b.status] ?? ''}`}>{b.status}</span>
                      {b.status === 'failed' && b.resolvedAt && (
                        <span className="badge badge-green" style={{ marginLeft: 6 }}>Resolved</span>
                      )}
                    </td>
                    <td style={{ color: '#6B7280' }}>{SOURCE_LABELS[b.source] ?? b.source}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {b.status !== 'cancelled' && (b.bookingType === 'flight' || OVERRIDE_TYPES.has(b.bookingType)) && (
                        <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }} onClick={() => openCancel(b)}>
                          Cancel
                        </button>
                      )}
                      {b.bookingType === 'flight' && b.status === 'failed' && !b.resolvedAt && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openResolve(b)}>
                          Resolve
                        </button>
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

      <ConfirmModal
        isOpen={!!cancelTarget}
        title={`Cancel ${cancelTarget ? TYPE_LABELS[cancelTarget.bookingType] : ''} Booking`}
        tone="danger"
        loading={cancelling}
        confirmLabel="Cancel Booking"
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        message={
          <div>
            <p style={{ margin: '0 0 10px' }}>
              {cancelTarget && OVERRIDE_TYPES.has(cancelTarget.bookingType)
                ? 'This marks the booking cancelled in our database only — it does NOT call the provider. Use this when the provider API is unreachable and support needs the record marked cancelled.'
                : 'This submits a real cancellation request to the airline via TekTravels.'}
              {' '}Reference: <strong>{cancelTarget?.bookingRef}</strong>
            </p>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Remarks (optional)"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' as const }}
            />
            {cancelError && <div style={{ marginTop: 8, color: '#DC2626', fontSize: 13 }}>{cancelError}</div>}
          </div>
        }
      />

      <ConfirmModal
        isOpen={!!resolveTarget}
        title="Mark Failed Booking Resolved"
        tone="success"
        loading={resolving}
        confirmLabel="Save Resolution"
        onCancel={() => setResolveTarget(null)}
        onConfirm={confirmResolve}
        message={
          <div>
            <p style={{ margin: '0 0 10px' }}>
              Payment for this booking was already captured — TekTravels booking/ticketing failed afterward.
              This does not trigger a new booking; it just records how it was resolved (e.g. rebooked
              through the normal flow using the existing payment, or refunded).
              {' '}Reference: <strong>{resolveTarget?.bookingRef}</strong>
            </p>
            <input
              value={resolvePnr}
              onChange={e => setResolvePnr(e.target.value)}
              placeholder="Resulting PNR (if rebooked)"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, marginBottom: 8 }}
            />
            <textarea
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              placeholder="Notes (how it was resolved)"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' as const }}
            />
            {resolveError && <div style={{ marginTop: 8, color: '#DC2626', fontSize: 13 }}>{resolveError}</div>}
          </div>
        }
      />
    </div>
  )
}
