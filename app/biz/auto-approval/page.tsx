'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Rule { id: string; booking_type: string; max_amount: number; allowed_roles: string[]; dept: string | null; is_active: boolean }

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']
const ROLES = ['employee', 'manager', 'admin']

function fmtAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function AutoApprovalPage() {
  const [rules, setRules]     = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ bookingType: 'all', maxAmount: '', dept: '', roles: ['employee'] })

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/auto-approval')
      .then(d => setRules(d.rules ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await adminFetch('/api/admin/biz/auto-approval', {
        method: 'POST',
        body: JSON.stringify({
          bookingType:  form.bookingType,
          maxAmount:    Math.round(Number(form.maxAmount) * 100),
          allowedRoles: form.roles,
          dept:         form.dept || null,
        }),
      })
      setForm({ bookingType: 'all', maxAmount: '', dept: '', roles: ['employee'] })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/auto-approval', {
      method: 'PATCH',
      body: JSON.stringify({ id, isActive: !current }),
    })
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this rule?')) return
    await adminFetch('/api/admin/biz/auto-approval', { method: 'DELETE', body: JSON.stringify({ id }) })
    setRules(prev => prev.filter(r => r.id !== id))
  }

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }))
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Auto-Approval Rules</h2>
        <span className="topbar-meta">Bookings under these limits approve automatically</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Info banner */}
          <div className="surface-card" style={{ borderLeft: '4px solid var(--accent)', background: 'var(--accent-lt)' }}>
            <p style={{ fontSize: 13, color: 'var(--accent-text)' }}>
              <strong>How it works:</strong> When a booking request matches a rule (booking type + amount ≤ limit + role), it is approved automatically — no manager action needed. Rules are checked in order; most specific rule wins.
            </p>
          </div>

          {/* Add form */}
          <div className="form-card">
            <div className="card-title" style={{ marginBottom: 4 }}>Add Rule</div>
            <div className="card-copy" style={{ marginBottom: 18 }}>Auto-approve bookings under a set amount for specific roles.</div>
            <form onSubmit={handleAdd}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Booking Type</label>
                  <select value={form.bookingType} onChange={e => setForm(f => ({ ...f, bookingType: e.target.value }))}>
                    {BOOKING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Amount (₹) *</label>
                  <input type="number" min="1" placeholder="5000" value={form.maxAmount}
                    onChange={e => setForm(f => ({ ...f, maxAmount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Department (optional)</label>
                  <input placeholder="Leave blank for all" value={form.dept}
                    onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Applies to roles</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {ROLES.map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Rule'}</button>
            </form>
          </div>

          {/* Rules table */}
          <div className="table-card">
            <div className="table-header">
              <div className="card-title">Active Rules</div>
              <div className="card-copy">{rules.filter(r => r.is_active).length} active</div>
            </div>
            <table>
              <thead>
                <tr><th>Booking Type</th><th>Max Amount</th><th>Roles</th><th>Dept</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Loading…</td></tr>
                ) : rules.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No auto-approval rules yet.</td></tr>
                ) : rules.map(r => (
                  <tr key={r.id}>
                    <td><span className="badge badge-blue">{r.booking_type}</span></td>
                    <td style={{ fontWeight: 700 }}>≤ {fmtAmount(r.max_amount)}</td>
                    <td>{r.allowed_roles.join(', ')}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{r.dept ?? 'All depts'}</td>
                    <td><span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>{r.is_active ? 'Active' : 'Paused'}</span></td>
                    <td>
                      <div className="page-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(r.id, r.is_active)}>
                          {r.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
