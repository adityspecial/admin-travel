'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface CompanySettings {
  name: string; address: string; gstin: string; pan: string; cin: string
  hsn_sac_flight: string; hsn_sac_hotel: string
}

const EMPTY: CompanySettings = { name: '', address: '', gstin: '', pan: '', cin: '', hsn_sac_flight: '998551', hsn_sac_hotel: '998552' }

export default function CompanySettingsPage() {
  const [form, setForm] = useState<CompanySettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminFetch('/api/admin/super/company-settings')
      .then(d => { if (d.settings) setForm({ ...EMPTY, ...d.settings }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const d = await adminFetch('/api/admin/super/company-settings', { method: 'PATCH', body: JSON.stringify(form) })
      setForm({ ...EMPTY, ...d.settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      alert(e.message ?? 'Failed to save')
    }
    setSaving(false)
  }

  const set = (k: keyof CompanySettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="admin-topbar">
        <h2>Company Settings</h2>
        <span className="topbar-meta">AirDunia's own registration details — used as the issuer block on every generated tax invoice</span>
      </div>
      <div className="admin-content">
        {loading ? <p>Loading…</p> : (
          <div className="page-stack" style={{ maxWidth: 640 }}>
            <div className="card" style={{ padding: 20, display: 'grid', gap: 14 }}>
              <div>
                <label className="form-label">Company Name</label>
                <input className="app-input" style={{ width: '100%' }} value={form.name} onChange={set('name')} placeholder="e.g. AirDunia Travels Pvt Ltd" />
              </div>
              <div>
                <label className="form-label">Registered Address</label>
                <input className="app-input" style={{ width: '100%' }} value={form.address} onChange={set('address')} placeholder="Full registered office address" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">GSTIN</label>
                  <input className="app-input" style={{ width: '100%' }} value={form.gstin} onChange={set('gstin')} placeholder="e.g. 06AADCM5146R1ZZ" />
                </div>
                <div>
                  <label className="form-label">PAN</label>
                  <input className="app-input" style={{ width: '100%' }} value={form.pan} onChange={set('pan')} placeholder="e.g. AADCM5146R" />
                </div>
              </div>
              <div>
                <label className="form-label">CIN</label>
                <input className="app-input" style={{ width: '100%' }} value={form.cin} onChange={set('cin')} placeholder="e.g. U63040HR2000PTC090846" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">HSN/SAC — Flight</label>
                  <input className="app-input" style={{ width: '100%' }} value={form.hsn_sac_flight} onChange={set('hsn_sac_flight')} />
                </div>
                <div>
                  <label className="form-label">HSN/SAC — Hotel</label>
                  <input className="app-input" style={{ width: '100%' }} value={form.hsn_sac_hotel} onChange={set('hsn_sac_hotel')} />
                </div>
              </div>
              <div>
                <button className="btn btn-primary" disabled={saving} onClick={save}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
                </button>
              </div>
              <p className="topbar-meta">Invoice generation refuses to run until GSTIN is set here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
