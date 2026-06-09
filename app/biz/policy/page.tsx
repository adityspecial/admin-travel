'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

export default function PolicyPage() {
  const [form, setForm] = useState({ flightCap: '', hotelCap: '', gstNumber: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/biz/policy').then((data) => {
      setForm({
        flightCap: String(data.policy.flight_cap ?? 10000),
        hotelCap: String(data.policy.hotel_cap ?? 5000),
        gstNumber: data.policy.gst_number ?? '',
      })
    }).catch(() => {})
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await adminFetch('/api/admin/biz/policy', {
        method: 'PATCH',
        body: JSON.stringify({
          flightCap: Number(form.flightCap),
          hotelCap: Number(form.hotelCap),
          gstNumber: form.gstNumber || null,
        }),
      })
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Travel Policy</h2>
      </div>
      <div className="admin-content">
        <form className="form-card" onSubmit={handleSave}>
          <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 800 }}>Policy Caps</h3>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
            Bookings above these limits will require manager approval before they can proceed.
          </p>

          {error && <div className="login-error">{error}</div>}
          {saved && <div className="banner-success" style={{ marginBottom: 16 }}>Policy saved successfully.</div>}

          <div className="form-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Flight Cap (Rs per trip)</label>
                <input type="number" min="0" value={form.flightCap} onChange={(e) => setForm((state) => ({ ...state, flightCap: e.target.value }))} />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Flights above this threshold need approval.</p>
              </div>
              <div className="form-group">
                <label>Hotel Cap (Rs per night)</label>
                <input type="number" min="0" value={form.hotelCap} onChange={(e) => setForm((state) => ({ ...state, hotelCap: e.target.value }))} />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Hotels above this threshold need approval.</p>
              </div>
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input value={form.gstNumber} onChange={(e) => setForm((state) => ({ ...state, gstNumber: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
