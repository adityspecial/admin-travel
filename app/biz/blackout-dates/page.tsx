'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface BlackoutDate { id: string; start_date: string; end_date: string; reason?: string; booking_type: string; is_active: boolean }

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isPast(end: string) {
  return new Date(end) < new Date()
}

export default function BlackoutDatesPage() {
  const [items, setItems]     = useState<BlackoutDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ startDate: '', endDate: '', reason: '', bookingType: 'all' })

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/blackout-dates')
      .then(d => setItems(d.blackoutDates ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await adminFetch('/api/admin/biz/blackout-dates', {
        method: 'POST',
        body: JSON.stringify({
          startDate:   form.startDate,
          endDate:     form.endDate,
          reason:      form.reason || null,
          bookingType: form.bookingType,
        }),
      })
      setForm({ startDate: '', endDate: '', reason: '', bookingType: 'all' })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/blackout-dates', {
      method: 'PATCH',
      body: JSON.stringify({ id, isActive: !current }),
    })
    setItems(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blackout period?')) return
    await adminFetch('/api/admin/biz/blackout-dates', { method: 'DELETE', body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Blackout Dates</h2>
        <span className="topbar-meta">Restrict travel bookings during specific periods</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Info */}
          <div className="surface-card" style={{ borderLeft: '4px solid var(--warning)', background: 'var(--warning-lt)' }}>
            <p style={{ fontSize: 13, color: 'var(--warning)' }}>
              <strong>How it works:</strong> Employees cannot submit travel requests for dates that fall within an active blackout period. This helps enforce quarter-end freezes, peak seasons, or company events.
            </p>
          </div>

          {/* Add form */}
          <div className="form-card">
            <div className="card-title" style={{ marginBottom: 4 }}>Add Blackout Period</div>
            <form onSubmit={handleAdd}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Applies to</label>
                  <select value={form.bookingType} onChange={e => setForm(f => ({ ...f, bookingType: e.target.value }))}>
                    {BOOKING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} bookings</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <input placeholder="e.g. Quarter end freeze" value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Blackout Period'}</button>
            </form>
          </div>

          {/* Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="card-title">Blackout Periods</div>
            </div>
            <table>
              <thead>
                <tr><th>Period</th><th>Duration</th><th>Applies To</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No blackout periods defined.</td></tr>
                ) : items.map(b => {
                  const start  = new Date(b.start_date)
                  const end    = new Date(b.end_date)
                  const days   = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
                  const past   = isPast(b.end_date)
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{fmtDate(b.start_date)} – {fmtDate(b.end_date)}</td>
                      <td>{days} day{days !== 1 ? 's' : ''}</td>
                      <td><span className="badge badge-yellow">{b.booking_type}</span></td>
                      <td style={{ color: 'var(--ink-3)' }}>{b.reason ?? '--'}</td>
                      <td>
                        <span className={`badge ${past ? 'badge-gray' : b.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {past ? 'Past' : b.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td>
                        <div className="page-actions">
                          {!past && (
                            <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(b.id, b.is_active)}>
                              {b.is_active ? 'Pause' : 'Activate'}
                            </button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                        </div>
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
