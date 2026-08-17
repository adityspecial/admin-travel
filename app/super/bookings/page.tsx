'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PermissionDenied } from '@/components/ui/PermissionDenied'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Booking {
  id: string; bookingType: string; bookingRef: string | null; status: string
  amount: number; customerName: string | null; source: string; createdAt: string
  resolvedAt?: string | null; rawDate: string | null
}

interface Org { id: string; name: string }

function pad2(n: number) { return String(n).padStart(2, '0') }

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
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [type, setType] = useState('flight')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const [orgId, setOrgId] = useState('')
  const [orgs, setOrgs] = useState<Org[]>([])

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
    setLoading(true); setError(''); setPermissionDenied(false)
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    if (source) qs.set('source', source)
    if (q.trim()) qs.set('q', q.trim())
    if (orgId) qs.set('orgId', orgId)
    adminFetch(`/api/admin/super/bookings?${qs.toString()}`)
      .then(d => setBookings(d.bookings ?? []))
      .catch(e => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }

  // Reload whenever the type or org filter changes, so switching from Flight
  // to Hotel (or picking a different org) queries fresh instead of stale data.
  useEffect(() => { load() }, [type, orgId]) // eslint-disable-line

  useEffect(() => {
    adminFetch('/api/admin/super/orgs').then(d => setOrgs(d.orgs ?? [])).catch(() => {})
  }, [])

  const tripsByDate = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (!b.rawDate) continue
    const arr = tripsByDate.get(b.rawDate) ?? []
    arr.push(b)
    tripsByDate.set(b.rawDate, arr)
  }
  const selectedDayBookings = selectedDate ? (tripsByDate.get(selectedDate) ?? []) : []

  const calYear = calendarMonth.getFullYear()
  const calMonthIdx = calendarMonth.getMonth()
  const firstWeekday = new Date(calYear, calMonthIdx, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate()
  const calendarCells: Array<{ day: number; key: string } | null> = []
  for (let i = 0; i < firstWeekday; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push({ day: d, key: `${calYear}-${pad2(calMonthIdx + 1)}-${pad2(d)}` })
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)
  const todayKey = (() => { const t = new Date(); return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}` })()

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
                Organisation
                <select value={orgId} onChange={e => setOrgId(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 160 }}>
                  <option value="">All orgs</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                Search
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                  placeholder="Booking ref or name"
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 200 }} />
              </label>
              <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-primary btn-sm" onClick={load}>Apply</button>
                <div className="segmented-row">
                  <button type="button" className={`segment-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
                  <button type="button" className={`segment-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
                </div>
              </div>
            </div>
          </section>

          {permissionDenied ? (
            <section className="table-card"><PermissionDenied message={error} /></section>
          ) : viewMode === 'calendar' ? (
            <section className="table-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setCalendarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d }); setSelectedDate(null) }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setCalendarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d }); setSelectedDate(null) }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={i} />
                  const isSelected = selectedDate === cell.key
                  const isToday = cell.key === todayKey
                  const dayBookings = tripsByDate.get(cell.key) ?? []
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(isSelected ? null : cell.key)}
                      disabled={!dayBookings.length}
                      style={{
                        minHeight: 64, borderRadius: 10, padding: '8px 6px',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--accent-lt)' : 'var(--border)'}`,
                        backgroundColor: isSelected ? 'var(--accent-lt)' : 'var(--surface)',
                        cursor: dayBookings.length ? 'pointer' : 'default',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        opacity: dayBookings.length ? 1 : 0.55,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? 'var(--accent)' : 'var(--ink)' }}>{cell.day}</span>
                      {dayBookings.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--accent)', color: '#fff' }}>
                          {dayBookings.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}> · {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedDayBookings.map(b => (
                      <div key={`${b.bookingType}-${b.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{TYPE_LABELS[b.bookingType] ?? b.bookingType} · {b.customerName ?? '--'}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}><code>{b.bookingRef ?? '--'}</code> · {SOURCE_LABELS[b.source] ?? b.source}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className={`badge ${STATUS_BADGE[b.status] ?? ''}`}>{b.status}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
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
          )}
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
