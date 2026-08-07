'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import './auto-approval.css'
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
    <div className="auto-page">
      <div className="auto-container">
        {/* Breadcrumb Navigation */}
        <div className="auto-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="auto-breadcrumb-active">Auto-Approval Rules Engine</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="auto-hero-glow" />

          <div className="auto-hero-content">
            <div className="auto-hero-left">
              <div className="auto-hero-icon">
                <Zap size={28} />
              </div>
              <div>
                <h1 className="auto-hero-title">
                  Auto-Approval Engine <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="auto-hero-subtitle">
                  Automate instant booking clearances for expenses within specified policy thresholds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="auto-hero-metrics">
            <div>
              <div className="auto-metric-label">Active Rule Engines</div>
              <div className="auto-metric-value auto-metric-value--white">
                {activeRulesCount} Active Rules
              </div>
            </div>
            <div>
              <div className="auto-metric-label">Processing Speed</div>
              <div className="auto-metric-value auto-metric-value--speed">
                &lt; 2s Instant
              </div>
            </div>
            <div>
              <div className="auto-metric-label">Conflict Resolution</div>
              <div className="auto-metric-value auto-metric-value--conflict">
                Strict Priority Order
              </div>
            </div>
          </div>
        </div>

        {/* Rule Priority Callout Banner */}
        <div className="auto-callout">
          <AlertCircle size={18} color="#2563EB" className="auto-callout-icon" />
          <span>
            <strong>Hierarchy Rule:</strong> Rules are evaluated sequentially by specificity (Booking Type + Max Amount Limit + Governance Role + Department).
          </span>
        </div>

        {/* Add Rule Form Card */}
        <div className="card-shell">
          <div className="auto-form-header">
            <Plus size={20} color="var(--accent, #E31E24)" />
            <h3 className="auto-card-title">Create Auto-Approval Rule</h3>
          </div>

          <form onSubmit={handleAdd} className="auto-form">
            <div className="auto-form-grid">
              {/* Booking Type */}
              <div className="auto-field">
                <label className="auto-field-label">Booking Type</label>
                <select
                  value={form.bookingType}
                  onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}
                  className="input-field auto-select-bold"
                >
                  {BOOKING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)} Bookings
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Amount */}
              <div className="auto-field">
                <label className="auto-field-label">Max Spend Threshold (₹) *</label>
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
              <div className="auto-field">
                <label className="auto-field-label">Target Department (Optional)</label>
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
              <label className="auto-roles-label">
                Eligible Governance Roles
              </label>
              <div className="auto-roles-wrap">
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
                        className="auto-role-checkbox"
                      />
                      <span className="auto-role-name">{role}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <div className="auto-form-error">{error}</div>}

            <div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating Rule…' : '+ Add Auto-Approval Rule'}
              </button>
            </div>
          </form>
        </div>

        {/* Active Rules Data Table Card */}
        <div className="card-shell auto-table-card">
          <div className="auto-table-header">
            <h3 className="auto-card-title">Active Rule Configuration Ledger</h3>
            <span className="auto-active-badge">
              {activeRulesCount} Active
            </span>
          </div>

          <div className="auto-table-scroll">
            <table className="auto-table">
              <thead>
                <tr className="auto-thead-row">
                  {['BOOKING TYPE', 'MAX SPEND LIMIT', 'ELIGIBLE ROLES', 'DEPARTMENT', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} className="auto-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="auto-loading-cell">
                      Loading auto-approval rules…
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="auto-empty-cell">
                      <Zap size={36} color="#9CA3AF" className="auto-empty-icon" />
                      <div className="auto-empty-title">No Auto-Approval Rules</div>
                      <div className="auto-empty-sub">Create your first automated clearance rule using the form above.</div>
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id} className="auto-tr">
                      {/* Booking Type */}
                      <td className="auto-td">
                        <span className="auto-type-badge">
                          {r.booking_type}
                        </span>
                      </td>

                      {/* Max Amount */}
                      <td className="auto-td auto-td-amount">
                        ≤ {fmtAmt(r.max_amount)}
                      </td>

                      {/* Roles */}
                      <td className="auto-td auto-td-roles">
                        {r.allowed_roles.join(', ')}
                      </td>

                      {/* Dept */}
                      <td className="auto-td auto-td-dept">
                        {r.dept ?? 'All Departments'}
                      </td>

                      {/* Status */}
                      <td className="auto-td">
                        <span className={`auto-status-badge ${r.is_active ? 'auto-status-badge--active' : 'auto-status-badge--paused'}`}>
                          {r.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="auto-td">
                        <div className="auto-actions-row">
                          <button
                            onClick={() => toggleActive(r.id, r.is_active)}
                            className="btn-secondary auto-btn-toggle"
                          >
                            {r.is_active ? <Pause size={12} /> : <Play size={12} />}
                            {r.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="auto-btn-delete"
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
