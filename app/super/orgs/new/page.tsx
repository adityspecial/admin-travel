'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'
import { AppInput } from '@/components/ui/AppInput'
import { Building2, Hash, Plane, Bed, FileText, Mail, Lock, ArrowLeft, Plus, CheckCircle2, ShieldCheck, Eye, EyeOff, Zap, UserCheck } from 'lucide-react'

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
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
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
      setTimeout(() => router.push('/super/orgs'), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.replace('/super/orgs')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Orgs</span>
          </button>
          <h2>New Corporate Organisation</h2>
        </div>
      </div>

      <div className="admin-content">
        <div className="dashboard-grid">
          {/* Main Form Column */}
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}
            {success && (
              <div style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Organisation details card */}
            <div className="explore-admin-section" style={{ marginBottom: 24 }}>
              <div className="dashboard-card-header" style={{ marginBottom: 20 }}>
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                    <Building2 size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Organisation Profile</h3>
                    <p className="dashboard-card-subtitle">Set up company name, join code, and policy caps</p>
                  </div>
                </div>
              </div>

              <AppInput
                label="Company Name"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Acme Corporation"
                icon={<Building2 size={16} />}
              />

              <AppInput
                label="Org Code"
                required
                value={form.orgCode}
                onChange={(e) => setForm((f) => ({ ...f, orgCode: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="ACME2026"
                maxLength={12}
                helperText="Employees use this unique code to join the organisation."
                icon={<Hash size={16} />}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <AppInput
                  label="Flight Cap (₹ per trip)"
                  type="number"
                  min="0"
                  value={form.flightCap}
                  onChange={set('flightCap')}
                  placeholder="10000"
                  icon={<Plane size={15} />}
                />
                <AppInput
                  label="Hotel Cap (₹ per night)"
                  type="number"
                  min="0"
                  value={form.hotelCap}
                  onChange={set('hotelCap')}
                  placeholder="5000"
                  icon={<Bed size={15} />}
                />
              </div>

              <AppInput
                label="GST Number"
                value={form.gstNumber}
                onChange={set('gstNumber')}
                placeholder="22AAAAA0000A1Z5"
                icon={<FileText size={16} />}
              />
            </div>

            {/* Initial Admin credentials card */}
            <div className="explore-admin-section" style={{ marginBottom: 24 }}>
              <div className="dashboard-card-header" style={{ marginBottom: 20 }}>
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                    <Mail size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">First Admin Account</h3>
                    <p className="dashboard-card-subtitle">Credentials for the initial administrator user</p>
                  </div>
                </div>
              </div>

              <AppInput
                label="Admin Work Email"
                type="email"
                required
                value={form.adminEmail}
                onChange={set('adminEmail')}
                placeholder="admin@company.com"
                icon={<Mail size={16} />}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <AppInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.adminPassword}
                  onChange={set('adminPassword')}
                  placeholder="At least 8 characters"
                  icon={<Lock size={16} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#64748b' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <AppInput
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.adminConfirm}
                  onChange={set('adminConfirm')}
                  placeholder="Re-enter password"
                  icon={<Lock size={16} />}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px' }}
              >
                <Plus size={16} />
                <span>{saving ? 'Creating…' : 'Create Organisation'}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => router.replace('/super/orgs')}
                style={{ padding: '11px 20px' }}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Right Summary Info Panel */}
          <div>
            <div className="explore-admin-section" style={{ padding: 24, position: 'sticky', top: 20 }}>
              <div className="dashboard-card-header" style={{ marginBottom: 16 }}>
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                    <Zap size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Quick Highlights</h3>
                    <p className="dashboard-card-subtitle">What happens when you create an org?</p>
                  </div>
                </div>
              </div>

              {[
                {
                  title: 'Instant Account Provisioning',
                  desc: 'Creates both the corporate entity and seeds the initial Super Admin user.',
                  icon: UserCheck,
                  tone: '#2563eb',
                },
                {
                  title: 'Default Booking Caps',
                  desc: 'Flight & Hotel caps default to ₹10,000 and ₹5,000 per policy.',
                  icon: ShieldCheck,
                  tone: '#0d9488',
                },
                {
                  title: 'Unique Join Code',
                  desc: 'Generated code permits employee auto-joining under this organisation.',
                  icon: Hash,
                  tone: '#ea580c',
                },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.tone}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.tone, flexShrink: 0 }}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
