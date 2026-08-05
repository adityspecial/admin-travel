'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import {
  CalendarOff,
  AlertTriangle,
  Plus,
  Trash2,
  Pause,
  Play,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Search,
  Clock,
  Calendar,
} from 'lucide-react'

interface BlackoutDate {
  id: string
  start_date: string
  end_date: string
  reason?: string
  booking_type: string
  is_active: boolean
}

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isPast(end: string) {
  return new Date(end) < new Date()
}

export default function BlackoutDatesPage() {
  const [items, setItems] = useState<BlackoutDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', bookingType: 'all' })

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/blackout-dates')
      .then((d) => setItems(d.blackoutDates ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.startDate || !form.endDate) {
      setError('Please select both Start Date and End Date')
      return
    }
    setSaving(true)
    setError('')
    try {
      await adminFetch('/api/admin/biz/blackout-dates', {
        method: 'POST',
        body: JSON.stringify({
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason || null,
          bookingType: form.bookingType,
        }),
      })
      setForm({ startDate: '', endDate: '', reason: '', bookingType: 'all' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/blackout-dates', {
      method: 'PATCH',
      body: JSON.stringify({ id, isActive: !current }),
    })
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b)))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blackout period?')) return
    await adminFetch('/api/admin/biz/blackout-dates', { method: 'DELETE', body: JSON.stringify({ id }) })
    setItems((prev) => prev.filter((b) => b.id !== id))
  }

  const filteredItems = items.filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.booking_type.toLowerCase().includes(q) ||
      (b.reason ?? '').toLowerCase().includes(q) ||
      b.start_date.includes(q) ||
      b.end_date.includes(q)
    )
  })

  const activeBlackoutsCount = items.filter((b) => b.is_active && !isPast(b.end_date)).length

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .blackout-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .hero-banner-box {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
          border-radius: 24px;
          padding: 32px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px -10px rgba(49, 46, 129, 0.25);
        }
        .card-shell {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .input-field {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
          width: 100%;
        }
        .input-field:focus {
          border-color: var(--accent, #E31E24);
          box-shadow: 0 0 0 3px rgba(227, 30, 36, 0.1);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px var(--accent, rgba(227, 30, 36, 0.25));
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px var(--accent, rgba(227, 30, 36, 0.35));
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        @media (max-width: 1024px) {
          .blackout-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .blackout-container {
            padding: 16px 12px 28px;
          }
          .hero-banner-box {
            padding: 20px;
            border-radius: 18px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="blackout-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Travel Blackout Periods</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(227, 30, 36, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <CalendarOff size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Blackout Dates & Travel Restrictions <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Enforce strict blackout dates to restrict employee travel bookings during audit windows or holiday freezes.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Blackout Periods</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {activeBlackoutsCount} Active
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Rules Configured</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                {items.length} Rules
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Enforcement Engine</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                Strict Block
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert Callout */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#B45309',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Corporate Restriction Notice:</strong> Employees cannot submit or request travel bookings for dates falling inside an active blackout period.
          </span>
        </div>

        {/* Add Blackout Period Form Card */}
        <div className="card-shell">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Plus size={20} color="var(--accent, #E31E24)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Add Blackout Period</h3>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {/* Start Date using DatePicker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Start Date *</label>
                <DatePicker
                  value={form.startDate}
                  onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
                  placeholder="Select Start Date"
                  required
                />
              </div>

              {/* End Date using DatePicker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>End Date *</label>
                <DatePicker
                  value={form.endDate}
                  onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
                  minDate={form.startDate}
                  placeholder="Select End Date"
                  required
                />
              </div>

              {/* Applies To */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Booking Category</label>
                <select
                  value={form.bookingType}
                  onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}
                  className="input-field"
                  style={{ background: '#ffffff', fontWeight: 700 }}
                >
                  {BOOKING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)} Bookings
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Reason / Event Label</label>
                <input
                  placeholder="e.g. FY End Audit Freeze"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {error && <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: 700 }}>{error}</div>}

            <div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Adding Period…' : '+ Add Blackout Period'}
              </button>
            </div>
          </form>
        </div>

        {/* Blackout Periods Table Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Configured Blackout Periods</h3>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category or reason..."
                className="input-field"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['BLACKOUT PERIOD', 'DURATION', 'CATEGORY', 'REASON', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                      Loading blackout periods…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <CalendarOff size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Blackout Periods Defined</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Create a blackout range above to restrict travel during key dates.</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((b) => {
                    const days = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000) + 1
                    const past = isPast(b.end_date)
                    const statusText = past ? 'Past' : b.is_active ? 'Active' : 'Paused'
                    const statusBg = past ? '#F3F4F6' : b.is_active ? '#ECFDF5' : '#F3F4F6'
                    const statusColor = past ? '#6B7280' : b.is_active ? '#047857' : '#6B7280'
                    const statusBorder = past ? '#E5E7EB' : b.is_active ? '#6EE7B7' : '#E5E7EB'

                    return (
                      <tr key={b.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                        {/* Period */}
                        <td style={{ padding: '16px 20px', fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>
                          {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                        </td>

                        {/* Duration */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                          {days} day{days !== 1 ? 's' : ''}
                        </td>

                        {/* Category */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: '#FFFBEB',
                              color: '#B45309',
                              border: '1px solid #FDE68A',
                              textTransform: 'uppercase',
                            }}
                          >
                            {b.booking_type}
                          </span>
                        </td>

                        {/* Reason */}
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                          {b.reason ?? '—'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusBorder}`,
                            }}
                          >
                            {statusText}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!past && (
                              <button
                                onClick={() => toggleActive(b.id, b.is_active)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                {b.is_active ? <Pause size={12} /> : <Play size={12} />}
                                {b.is_active ? 'Pause' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(b.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: '1px solid #FCA5A5',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
