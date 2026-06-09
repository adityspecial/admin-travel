'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'

export default function NewOrgPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name:          '',
    orgCode:       '',
    flightCap:     '10000',
    hotelCap:      '5000',
    gstNumber:     '',
    adminEmail:    '',
    adminPassword: '',
    adminConfirm:  '',
  })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (form.adminPassword !== form.adminConfirm) {
      setError('Passwords do not match'); return
    }
    if (form.adminPassword.length < 8) {
      setError('Password must be at least 8 characters'); return
    }

    setSaving(true)
    try {
      const data = await adminFetch('/api/admin/super/orgs', {
        method: 'POST',
        body: JSON.stringify({
          name:          form.name,
          orgCode:       form.orgCode,
          flightCap:     Number(form.flightCap),
          hotelCap:      Number(form.hotelCap),
          gstNumber:     form.gstNumber || null,
          adminEmail:    form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })
      setSuccess(data.message ?? 'Organisation created successfully')
      setTimeout(() => router.push('/super/orgs'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>New MyBiz Organisation</h2>
        <a href="/super/orgs" className="btn btn-ghost btn-sm">← Back to Orgs</a>
      </div>

      <div className="admin-content">
        <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

          {error   && <div className="alert alert-error"   style={{ marginBottom: 20 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ {success}</div>}

          {/* ── Organisation details ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">🏢 Organisation Details</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Acme Corporation" required />
            </div>

            <div className="form-group">
              <label className="form-label">
                Org Code *
                <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 6, fontSize: 12 }}>
                  Employees use this code to join the org
                </span>
              </label>
              <input
                className="form-input"
                value={form.orgCode}
                onChange={e => setForm(f => ({ ...f, orgCode: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="ACME2024"
                maxLength={12}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Flight Cap (₹ per trip)</label>
                <input className="form-input" type="number" value={form.flightCap} onChange={set('flightCap')} min={0} />
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>Trips above this need approval</span>
              </div>
              <div className="form-group">
                <label className="form-label">Hotel Cap (₹ per night)</label>
                <input className="form-input" type="number" value={form.hotelCap} onChange={set('hotelCap')} min={0} />
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>Hotel rate limit per night</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                GST Number
                <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 6, fontSize: 12 }}>optional</span>
              </label>
              <input className="form-input" value={form.gstNumber} onChange={set('gstNumber')} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>

          {/* ── Biz Admin account ── */}
          <div className="card" style={{ marginBottom: 24, borderColor: '#BFDBFE' }}>
            <div className="card-header">
              <h3 className="card-title">🔑 Biz Admin Account</h3>
              <span style={{ fontSize: 12, color: '#6B7280' }}>This person can log in at /login and manage the org</span>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email *</label>
              <input
                className="form-input"
                type="email"
                value={form.adminEmail}
                onChange={set('adminEmail')}
                placeholder="admin@acmecorp.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    value={form.adminPassword}
                    onChange={set('adminPassword')}
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14 }}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={form.adminConfirm}
                  onChange={set('adminConfirm')}
                  placeholder="Re-enter password"
                  required
                  style={{ borderColor: form.adminConfirm && form.adminConfirm !== form.adminPassword ? '#DC2626' : undefined }}
                />
                {form.adminConfirm && form.adminConfirm !== form.adminPassword && (
                  <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>Passwords do not match</span>
                )}
              </div>
            </div>

            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1D4ED8' }}>
              ℹ️ After creation, the admin can log in at <strong>/login</strong> and will see only their organisation's data. They cannot access Super Admin.
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || (!!form.adminConfirm && form.adminConfirm !== form.adminPassword)}
            style={{ width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 15 }}
          >
            {saving ? 'Creating organisation…' : '🏢 Create Organisation & Admin Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
