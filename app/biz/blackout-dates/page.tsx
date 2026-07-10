'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface BlackoutDate { id: string; start_date: string; end_date: string; reason?: string; booking_type: string; is_active: boolean }

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']
const INP = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, width: '100%' }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function isPast(end: string) { return new Date(end) < new Date() }

export default function BlackoutDatesPage() {
  const [items, setItems]     = useState<BlackoutDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')
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
        body: JSON.stringify({ startDate: form.startDate, endDate: form.endDate, reason: form.reason || null, bookingType: form.bookingType }),
      })
      setForm({ startDate: '', endDate: '', reason: '', bookingType: 'all' })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/blackout-dates', { method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setItems(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blackout period?')) return
    await adminFetch('/api/admin/biz/blackout-dates', { method: 'DELETE', body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Blackout Dates</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Restrict travel bookings during specific periods.</p>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 20 }}>
        Employees cannot submit travel requests for dates within an active blackout period.
      </div>

      {/* Add form */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>Add Blackout Period</div>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>End Date *</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Applies To</label>
              <select value={form.bookingType} onChange={e => setForm(f => ({ ...f, bookingType: e.target.value }))} style={{ ...INP, background: '#fff' }}>
                {BOOKING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} bookings</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Reason</label>
              <input placeholder="e.g. Quarter end freeze" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={INP} />
            </div>
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {saving ? 'Adding…' : 'Add Blackout Period'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Blackout Periods</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Period', 'Duration', 'Applies To', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No blackout periods defined.</td></tr>
              ) : items.map(b => {
                const days = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000) + 1
                const past = isPast(b.end_date)
                const statusStyle = past
                  ? { background: '#F3F4F6', color: '#6B7280' }
                  : b.is_active ? { background: '#DCFCE7', color: '#16A34A' } : { background: '#F3F4F6', color: '#6B7280' }
                return (
                  <tr key={b.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 13 }}>{fmtDate(b.start_date)} – {fmtDate(b.end_date)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13 }}>{days} day{days !== 1 ? 's' : ''}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: '#FEF9C3', color: '#92400E', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{b.booking_type}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>{b.reason ?? '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ ...statusStyle, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {past ? 'Past' : b.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!past && (
                          <button onClick={() => toggleActive(b.id, b.is_active)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                            {b.is_active ? 'Pause' : 'Activate'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(b.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#EF4444' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
