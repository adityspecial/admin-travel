'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import './support.css'
import {
  LifeBuoy,
  Headphones,
  Search,
  Sparkles,
  ChevronRight,
  User,
  Plus,
} from 'lucide-react'

interface Dispute {
  id: string
  booking_id: string
  booking_type: string | null
  reason: string
  status: 'open' | 'resolved'
  admin_response: string | null
  created_at: string
  resolved_at: string | null
  member?: { work_email: string } | null
}

interface OrgBooking {
  id: string; bookingType: string; bookingRef: string | null
  amount: number; customerName: string | null; createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SupportPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<Dispute | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const [raiseOpen, setRaiseOpen] = useState(false)
  const [orgBookings, setOrgBookings] = useState<OrgBooking[]>([])
  const [raiseBookingId, setRaiseBookingId] = useState('')
  const [bookingQuery, setBookingQuery] = useState('')
  const [showBookingSuggestions, setShowBookingSuggestions] = useState(false)
  const [raiseReason, setRaiseReason] = useState('')
  const [raiseErr, setRaiseErr] = useState('')
  const [raising, setRaising] = useState(false)
  const [bookingsLoadErr, setBookingsLoadErr] = useState('')
  const [bookingsLoading, setBookingsLoading] = useState(false)

  function bookingLabel(b: OrgBooking) {
    return `${b.bookingType} · ${b.bookingRef ?? b.id.slice(0, 8)} · ${b.customerName ?? ''} · ₹${Number(b.amount).toLocaleString('en-IN')}`
  }

  function openRaise() {
    setRaiseBookingId(''); setBookingQuery(''); setRaiseReason(''); setRaiseErr(''); setBookingsLoadErr('')
    setRaiseOpen(true)
    if (!orgBookings.length) {
      setBookingsLoading(true)
      adminFetch('/api/admin/biz/bookings')
        .then(d => setOrgBookings(d.bookings ?? []))
        .catch((e: any) => setBookingsLoadErr(e.message ?? 'Failed to load bookings'))
        .finally(() => setBookingsLoading(false))
    }
  }

  async function submitRaise() {
    const selected = orgBookings.find(b => b.id === raiseBookingId)
    if (!raiseBookingId || !raiseReason.trim()) { setRaiseErr('Pick a booking and describe the issue.'); return }
    setRaising(true); setRaiseErr('')
    try {
      await adminFetch('/api/admin/biz/booking-disputes', {
        method: 'POST',
        body: JSON.stringify({ bookingId: raiseBookingId, bookingType: selected?.bookingType, reason: raiseReason.trim() }),
      })
      setRaiseOpen(false)
      load()
    } catch (e: any) {
      setRaiseErr(e.message ?? 'Failed to raise ticket')
    } finally {
      setRaising(false)
    }
  }

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/booking-disputes')
      .then((d) => setDisputes(d.disputes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const baseList = disputes.filter((d) => d.status === tab)
  const openCount = disputes.filter((d) => d.status === 'open').length
  const resolvedCount = disputes.filter((d) => d.status === 'resolved').length

  const filteredList = baseList.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (d.member?.work_email ?? '').toLowerCase().includes(q) ||
      (d.booking_type ?? '').toLowerCase().includes(q) ||
      (d.reason ?? '').toLowerCase().includes(q)
    )
  })

  function openDispute(d: Dispute) {
    setActive(d)
    setNote(d.admin_response ?? '')
  }

  async function resolve() {
    if (!active) return
    setSaving(true)
    try {
      await adminFetch(`/api/admin/biz/booking-disputes/${active.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminResponse: note || undefined }),
      })
      setActive(null)
      load()
    } catch { /* keep modal open, user can retry */ }
    finally { setSaving(false) }
  }

  return (
    <div className="sup-page">
      <div className="support-container">
        <div className="sup-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="sup-breadcrumb-active">Employee Support & Ticket Helpdesk</span>
        </div>

        <div className="hero-banner-box">
          <div className="sup-hero-glow" />
          <div className="sup-hero-content">
            <div className="sup-hero-left">
              <div className="sup-hero-icon">
                <LifeBuoy size={28} />
              </div>
              <div>
                <h1 className="sup-hero-title">
                  Support & Ticket Desk <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="sup-hero-subtitle">
                  Real booking disputes raised by your employees — wrong PNR, refund not received, and other issues.
                </p>
              </div>
            </div>
          </div>

          <div className="sup-hero-metrics">
            <div>
              <div className="sup-metric-label">Open Disputes</div>
              <div className="sup-metric-value sup-metric-value--open">{openCount} Open</div>
            </div>
            <div>
              <div className="sup-metric-label">Resolved Disputes</div>
              <div className="sup-metric-value sup-metric-value--resolved">{resolvedCount} Resolved</div>
            </div>
            <div>
              <div className="sup-metric-label">Helpdesk SLA</div>
              <div className="sup-metric-value sup-metric-value--sla">&lt; 15m Response</div>
            </div>
          </div>
        </div>

        <div className="sup-controls-row">
          <div className="sup-tabs-wrap">
            <button onClick={() => setTab('open')} className={`tab-btn ${tab === 'open' ? 'active' : ''}`}>
              Open Disputes ({openCount})
            </button>
            <button onClick={() => setTab('resolved')} className={`tab-btn ${tab === 'resolved' ? 'active' : ''}`}>
              Resolved Disputes ({resolvedCount})
            </button>
          </div>
        </div>

        <div className="card-shell sup-table-card">
          <div className="sup-table-header">
            <h3 className="sup-card-title">{tab === 'open' ? 'Open Support Disputes' : 'Resolved Disputes'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sup-search-wrap">
                <Search size={15} color="#9CA3AF" className="sup-search-icon" />
                <input
                  placeholder="Search email, booking type, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field sup-search-input"
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openRaise} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Raise a Ticket
              </button>
            </div>
          </div>

          <div className="sup-table-scroll">
            <table className="sup-table">
              <thead>
                <tr className="sup-thead-row">
                  {['EMPLOYEE', 'BOOKING TYPE', 'REASON', 'RAISED', ''].map((h) => (
                    <th key={h} className="sup-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="sup-loading-cell">Loading support disputes…</td></tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="sup-empty-cell">
                      <Headphones size={36} color="#9CA3AF" className="sup-empty-icon" />
                      <div className="sup-empty-title">
                        {tab === 'open' ? 'No Open Support Disputes' : 'No Resolved Disputes'}
                      </div>
                      <div className="sup-empty-sub">
                        {tab === 'open' ? 'Disputes raised by employees will appear here.' : 'Resolved disputes will appear here.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((d) => (
                    <tr key={d.id} className="sup-tr" onClick={() => openDispute(d)} style={{ cursor: 'pointer' }}>
                      <td className="sup-td">
                        <div className="sup-employee-row">
                          <div className="sup-avatar"><User size={14} /></div>
                          <span className="sup-employee-email">{d.member?.work_email ?? '—'}</span>
                        </div>
                      </td>
                      <td className="sup-td"><span className="sup-category-pill">{d.booking_type ?? 'general'}</span></td>
                      <td className="sup-td-comment">{d.reason}</td>
                      <td className="sup-td-date">{formatDate(d.created_at)}</td>
                      <td className="sup-td"><span className="sup-view-link">View →</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <div className="card-shell modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title">{active.booking_type ?? 'Booking'} dispute</div>
                <div className="card-copy">{active.member?.work_email} · {formatDate(active.created_at)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '12px 0' }}>{active.reason}</p>
            <div style={{ fontSize: 13, marginBottom: 12 }}>Booking ID: <code>{active.booking_id}</code></div>
            {active.status === 'open' ? (
              <>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 6 }}>
                  Response (sent to the employee)
                </label>
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  placeholder="e.g. Refund of ₹4,500 processed to original payment method."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' as const, marginBottom: 14 }}
                />
                <div className="filter-row">
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={resolve}>
                    {saving ? 'Saving…' : 'Resolve'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-soft)', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
                <strong style={{ color: 'var(--text)' }}>Response: </strong>{active.admin_response || '—'}
              </div>
            )}
          </div>
        </div>
      )}

      {raiseOpen && (
        <div className="modal-overlay" onClick={() => setRaiseOpen(false)}>
          <div className="card-shell modal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title">Raise a Ticket</div>
                <div className="card-copy">Escalates directly to AirDunia support.</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setRaiseOpen(false)}>✕</button>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-soft)', margin: '12px 0 6px' }}>Booking</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="text"
                value={raiseBookingId ? bookingLabel(orgBookings.find(b => b.id === raiseBookingId)!) : bookingQuery}
                placeholder="Search by booking ref, customer, or type…"
                onChange={(e) => { setRaiseBookingId(''); setBookingQuery(e.target.value) }}
                onFocus={() => { setRaiseBookingId(''); setBookingQuery(''); setShowBookingSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowBookingSuggestions(false), 150)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                autoComplete="off"
              />
              {showBookingSuggestions && (() => {
                const q = bookingQuery.trim().toLowerCase()
                const matches = (q
                  ? orgBookings.filter(b => bookingLabel(b).toLowerCase().includes(q))
                  : orgBookings
                ).slice(0, 8)
                if (!matches.length) return null
                return (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {matches.map(b => (
                      <div
                        key={b.id}
                        onMouseDown={() => { setRaiseBookingId(b.id); setShowBookingSuggestions(false) }}
                        style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12.5, color: '#111827', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title={bookingLabel(b)}
                      >
                        {bookingLabel(b)}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            {bookingsLoading && <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: -8, marginBottom: 12 }}>Loading bookings…</div>}
            {bookingsLoadErr && <div style={{ fontSize: 12, color: '#DC2626', marginTop: -8, marginBottom: 12 }}>{bookingsLoadErr}</div>}
            {!bookingsLoading && !bookingsLoadErr && orgBookings.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: -8, marginBottom: 12 }}>No bookings found for this org.</div>
            )}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 6 }}>Describe the issue</label>
            <textarea
              value={raiseReason} onChange={(e) => setRaiseReason(e.target.value)} rows={4}
              placeholder="e.g. Refund promised on cancellation hasn't landed after 10 days."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' as const, marginBottom: 12 }}
            />
            {raiseErr && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{raiseErr}</div>}
            <div className="filter-row">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRaiseOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={raising} onClick={submitRaise}>
                {raising ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
