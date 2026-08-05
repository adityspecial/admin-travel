'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import {
  Zap,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Pause,
  Play,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Building2,
  Users,
  AlertCircle,
} from 'lucide-react'

interface Rule {
  id: string
  booking_type: string
  max_amount: number
  allowed_roles: string[]
  dept: string | null
  is_active: boolean
}

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']
const ROLES = ['employee', 'manager', 'admin']

function fmtAmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function AutoApprovalPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ bookingType: 'all', maxAmount: '', dept: '', roles: ['employee'] })

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/auto-approval')
      .then((d) => setRules(d.rules ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminFetch('/api/admin/biz/auto-approval', {
        method: 'POST',
        body: JSON.stringify({
          bookingType: form.bookingType,
          maxAmount: Math.round(Number(form.maxAmount) * 100),
          allowedRoles: form.roles,
          dept: form.dept || null,
        }),
      })
      setForm({ bookingType: 'all', maxAmount: '', dept: '', roles: ['employee'] })
      load()
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/auto-approval', { method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this auto-approval rule?')) return
    await adminFetch('/api/admin/biz/auto-approval', { method: 'DELETE', body: JSON.stringify({ id }) })
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleRole(role: string) {
    setForm((f) => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role] }))
  }

  const activeRulesCount = rules.filter((r) => r.is_active).length

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .auto-container {
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
        .role-check-chip {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          background: #F9FAFB;
          color: #374151;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        .role-check-chip.active {
          background: #FEF2F2;
          border-color: #FCA5A5;
          color: var(--accent, #E31E24);
        }
        @media (max-width: 1024px) {
          .auto-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .auto-container {
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

      <div className="auto-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Auto-Approval Rules Engine</span>
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
                <Zap size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Auto-Approval Engine <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Automate instant booking clearances for expenses within specified policy thresholds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Rule Engines</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {activeRulesCount} Active Rules
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Processing Speed</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                &lt; 2s Instant
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Conflict Resolution</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                Strict Priority Order
              </div>
            </div>
          </div>
        </div>

        {/* Rule Priority Callout Banner */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>
            <strong>Hierarchy Rule:</strong> Rules are evaluated sequentially by specificity (Booking Type + Max Amount Limit + Governance Role + Department).
          </span>
        </div>

        {/* Add Rule Form Card */}
        <div className="card-shell">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Plus size={20} color="var(--accent, #E31E24)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Create Auto-Approval Rule</h3>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Booking Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Booking Type</label>
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

              {/* Max Amount */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Max Spend Threshold (₹) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 5000"
                  value={form.maxAmount}
                  onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              {/* Department */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>Target Department (Optional)</label>
                <input
                  placeholder="Leave blank for all departments"
                  value={form.dept}
                  onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Applicable Roles */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Eligible Governance Roles
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {ROLES.map((role) => {
                  const isSelected = form.roles.includes(role)
                  return (
                    <div
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`role-check-chip ${isSelected ? 'active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{role}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: 700 }}>{error}</div>}

            <div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating Rule…' : '+ Add Auto-Approval Rule'}
              </button>
            </div>
          </form>
        </div>

        {/* Active Rules Data Table Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Active Rule Configuration Ledger</h3>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent, #E31E24)', background: '#FEF2F2', padding: '3px 10px', borderRadius: '99px', border: '1px solid #FCA5A5' }}>
              {activeRulesCount} Active
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['BOOKING TYPE', 'MAX SPEND LIMIT', 'ELIGIBLE ROLES', 'DEPARTMENT', 'STATUS', 'ACTIONS'].map((h) => (
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
                      Loading auto-approval rules…
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Zap size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Auto-Approval Rules</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Create your first automated clearance rule using the form above.</div>
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      {/* Booking Type */}
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #93C5FD',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.booking_type}
                        </span>
                      </td>

                      {/* Max Amount */}
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 900, color: '#111827' }}>
                        ≤ {fmtAmt(r.max_amount)}
                      </td>

                      {/* Roles */}
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>
                        {r.allowed_roles.join(', ')}
                      </td>

                      {/* Dept */}
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
                        {r.dept ?? 'All Departments'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: r.is_active ? '#ECFDF5' : '#F3F4F6',
                            color: r.is_active ? '#047857' : '#6B7280',
                            border: `1px solid ${r.is_active ? '#6EE7B7' : '#E5E7EB'}`,
                          }}
                        >
                          {r.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => toggleActive(r.id, r.is_active)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            {r.is_active ? <Pause size={12} /> : <Play size={12} />}
                            {r.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
