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
        <div className="orgs-header-left">
          <button
            className="btn btn-ghost btn-sm orgs-btn-icon-gap"
            onClick={() => router.replace('/super/orgs')}
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
            {error && <div className="login-error orgs-mb-20">{error}</div>}
            {success && (
              <div className="orgs-success-banner orgs-mb-20">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Organisation details card */}
            <div className="explore-admin-section orgs-section-mb24">
              <div className="dashboard-card-header orgs-card-header-mb20">
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

              <div className="orgs-flight-hotel-grid">
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
            <div className="explore-admin-section orgs-section-mb24">
              <div className="dashboard-card-header orgs-card-header-mb20">
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

              <div className="orgs-password-grid">
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
                      className="orgs-eye-btn"
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

            <div className="orgs-btn-row">
              <button
                type="submit"
                className="btn btn-primary orgs-btn-create"
                disabled={saving}
              >
                <Plus size={16} />
                <span>{saving ? 'Creating…' : 'Create Organisation'}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost orgs-btn-cancel-pad-lg"
                onClick={() => router.replace('/super/orgs')}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Right Summary Info Panel */}
          <div>
            <div className="explore-admin-section orgs-sticky-panel">
              <div className="dashboard-card-header orgs-card-header-mb16">
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
              ].map((item, i) => (
                <div key={item.title} className="orgs-highlight-row">
                  <div className={`orgs-highlight-icon orgs-highlight-icon--${i}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div className="orgs-highlight-title">{item.title}</div>
                    <div className="orgs-highlight-desc">{item.desc}</div>
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
