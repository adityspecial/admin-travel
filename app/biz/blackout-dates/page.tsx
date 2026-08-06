'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import './blackout.css'
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
    <div className="bo-page">
      <div className="blackout-container">
        {/* Breadcrumb Navigation */}
        <div className="bo-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="bo-breadcrumb-active">Corporate Travel Blackout Periods</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="bo-hero-glow" />

          <div className="bo-hero-content">
            <div className="bo-hero-left">
              <div className="bo-hero-icon">
                <CalendarOff size={28} />
              </div>
              <div>
                <h1 className="bo-hero-title">
                  Blackout Dates & Travel Restrictions <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="bo-hero-subtitle">
                  Enforce strict blackout dates to restrict employee travel bookings during audit windows or holiday freezes.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="bo-hero-metrics">
            <div>
              <div className="bo-metric-label">Active Blackout Periods</div>
              <div className="bo-metric-value bo-metric-value--white">
                {activeBlackoutsCount} Active
              </div>
            </div>
            <div>
              <div className="bo-metric-label">Total Rules Configured</div>
              <div className="bo-metric-value bo-metric-value--rules">
                {items.length} Rules
              </div>
            </div>
            <div>
              <div className="bo-metric-label">Enforcement Engine</div>
              <div className="bo-metric-value bo-metric-value--engine">
                Strict Block
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert Callout */}
        <div className="bo-callout">
          <AlertTriangle size={18} color="#D97706" className="bo-callout-icon" />
          <span>
            <strong>Corporate Restriction Notice:</strong> Employees cannot submit or request travel bookings for dates falling inside an active blackout period.
          </span>
        </div>

        {/* Add Blackout Period Form Card */}
        <div className="card-shell">
          <div className="bo-form-header">
            <Plus size={20} color="var(--accent, #E31E24)" />
            <h3 className="bo-card-title">Add Blackout Period</h3>
          </div>

          <form onSubmit={handleAdd} className="bo-form">
            <div className="bo-form-grid">
              {/* Start Date using DatePicker */}
              <div className="bo-field">
                <label className="bo-field-label">Start Date *</label>
                <DatePicker
                  value={form.startDate}
                  onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
                  placeholder="Select Start Date"
                  required
                />
              </div>

              {/* End Date using DatePicker */}
              <div className="bo-field">
                <label className="bo-field-label">End Date *</label>
                <DatePicker
                  value={form.endDate}
                  onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
                  minDate={form.startDate}
                  placeholder="Select End Date"
                  required
                />
              </div>

              {/* Applies To */}
              <div className="bo-field">
                <label className="bo-field-label">Booking Category</label>
                <select
                  value={form.bookingType}
                  onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}
                  className="input-field bo-select-bold"
                >
                  {BOOKING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)} Bookings
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="bo-field">
                <label className="bo-field-label">Reason / Event Label</label>
                <input
                  placeholder="e.g. FY End Audit Freeze"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {error && <div className="bo-form-error">{error}</div>}

            <div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Adding Period…' : '+ Add Blackout Period'}
              </button>
            </div>
          </form>
        </div>

        {/* Blackout Periods Table Card */}
        <div className="card-shell bo-table-card">
          <div className="bo-table-header">
            <h3 className="bo-card-title">Configured Blackout Periods</h3>

            {/* Search Box */}
            <div className="bo-search-wrap">
              <Search size={15} color="#9CA3AF" className="bo-search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category or reason..."
                className="input-field bo-search-input"
              />
            </div>
          </div>

          <div className="bo-table-scroll">
            <table className="bo-table">
              <thead>
                <tr className="bo-thead-row">
                  {['BLACKOUT PERIOD', 'DURATION', 'CATEGORY', 'REASON', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} className="bo-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="bo-loading-cell">
                      Loading blackout periods…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bo-empty-cell">
                      <CalendarOff size={36} color="#9CA3AF" className="bo-empty-icon" />
                      <div className="bo-empty-title">No Blackout Periods Defined</div>
                      <div className="bo-empty-sub">Create a blackout range above to restrict travel during key dates.</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((b) => {
                    const days = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000) + 1
                    const past = isPast(b.end_date)
                    const statusText = past ? 'Past' : b.is_active ? 'Active' : 'Paused'
                    const statusActive = !past && b.is_active

                    return (
                      <tr key={b.id} className="bo-tr">
                        {/* Period */}
                        <td className="bo-td bo-td-period">
                          {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                        </td>

                        {/* Duration */}
                        <td className="bo-td bo-td-duration">
                          {days} day{days !== 1 ? 's' : ''}
                        </td>

                        {/* Category */}
                        <td className="bo-td">
                          <span className="bo-category-badge">
                            {b.booking_type}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="bo-td bo-td-reason">
                          {b.reason ?? '—'}
                        </td>

                        {/* Status */}
                        <td className="bo-td">
                          <span className={`bo-status-badge ${statusActive ? 'bo-status-badge--active' : 'bo-status-badge--inactive'}`}>
                            {statusText}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="bo-td">
                          <div className="bo-actions-row">
                            {!past && (
                              <button
                                onClick={() => toggleActive(b.id, b.is_active)}
                                className="btn-secondary bo-btn-toggle"
                              >
                                {b.is_active ? <Pause size={12} /> : <Play size={12} />}
                                {b.is_active ? 'Pause' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="bo-btn-delete"
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
