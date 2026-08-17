'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { AppPopup } from '@/components/ui/AppPopup'
import { Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Booking {
  id: string; bookingType: string; bookingRef: string | null; status: string
  amount: number; customerName: string | null; createdAt: string; rawDate: string | null
}

const TYPE_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', cab: 'Cab', insurance: 'Insurance', multicity: 'Multi-city',
  kafila: 'Flight (Kafila)', airiq: 'Flight (AirIQ)', fareguide: 'Flight (FareGuide)', nexus: 'Flight (Nexus)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function pad2(n: number) { return String(n).padStart(2, '0') }

export default function BizBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [disputeTarget, setDisputeTarget] = useState<Booking | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    adminFetch('/api/admin/biz/bookings')
      .then(d => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (b.bookingRef ?? '').toLowerCase().includes(q) || (b.customerName ?? '').toLowerCase().includes(q)
  })

  const tripsByDate = new Map<string, Booking[]>()
  for (const b of filtered) {
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

  async function submitDispute() {
    if (!disputeTarget || !reason.trim()) return
    setSubmitting(true); setError('')
    try {
      await adminFetch('/api/admin/biz/disputes', {
        method: 'POST',
        body: JSON.stringify({ bookingType: disputeTarget.bookingType, bookingId: disputeTarget.id, reason: reason.trim() }),
      })
      setDisputedIds(prev => new Set(prev).add(disputeTarget.id))
      setDisputeTarget(null)
      setReason('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to raise dispute')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Bookings</h2>
        <span className="topbar-meta">Every confirmed flight, hotel, cab, insurance, multi-city, and partner flight booking for your organisation</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="table-card">
            <div className="table-header"><div><div className="card-title">Search</div></div></div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search booking ref or traveller name..."
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, minWidth: 280 }} />
              <div className="segmented-row">
                <button type="button" className={`segment-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
                <button type="button" className={`segment-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
              </div>
            </div>
          </section>

          {viewMode === 'calendar' ? (
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
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}><code>{b.bookingRef ?? '--'}</code></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="badge badge-gray">{b.status}</span>
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
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Reference</th><th>Traveller</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No bookings found.</td></tr>
                ) : filtered.map(b => (
                  <tr key={`${b.bookingType}-${b.id}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.createdAt)}</td>
                    <td>{TYPE_LABELS[b.bookingType] ?? b.bookingType}</td>
                    <td><code style={{ fontSize: 11 }}>{b.bookingRef ?? '--'}</code></td>
                    <td>{b.customerName ?? '--'}</td>
                    <td style={{ fontWeight: 800 }}>₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-gray">{b.status}</span></td>
                    <td>
                      {disputedIds.has(b.id) ? (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Dispute raised</span>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }}
                          onClick={() => { setDisputeTarget(b); setReason(''); setError('') }}>
                          <AlertTriangle size={12} /> Raise Dispute
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      <AppPopup
        isOpen={!!disputeTarget}
        title="Raise a Dispute"
        subtitle={disputeTarget ? `${TYPE_LABELS[disputeTarget.bookingType] ?? disputeTarget.bookingType} · ${disputeTarget.bookingRef ?? disputeTarget.id}` : undefined}
        icon={<AlertTriangle size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={440}
        onClose={() => setDisputeTarget(null)}
      >
        {error && <div className="login-error">{error}</div>}
        <div className="app-input-group">
          <label className="app-input-label">Reason *</label>
          <textarea
            className="app-input"
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe the issue with this booking — e.g. wrong PNR, no-show handling, refund not received…"
          />
        </div>
        <div className="app-popup-footer">
          <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setDisputeTarget(null)}>Cancel</button>
          <button type="button" className="confirm-modal-btn confirm-modal-btn-success" disabled={submitting || !reason.trim()} onClick={submitDispute}>
            {submitting ? 'Submitting…' : 'Raise Dispute'}
          </button>
        </div>
      </AppPopup>
    </div>
  )
}
