'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Rule { id: string; booking_type: string; max_amount: number; allowed_roles: string[]; dept: string | null; is_active: boolean }

const BOOKING_TYPES = ['all', 'flight', 'hotel', 'bus']
const ROLES = ['employee', 'manager', 'admin']
const INP = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' as const, width: '100%' }
const SEL = { ...INP, background: '#fff' }

function fmtAmt(paise: number) { return `₹${(paise / 100).toLocaleString('en-IN')}` }

export default function AutoApprovalPage() {
  const [rules, setRules]     = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')
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
        body: JSON.stringify({ bookingType: form.bookingType, maxAmount: Math.round(Number(form.maxAmount) * 100), allowedRoles: form.roles, dept: form.dept || null }),
      })
      setForm({ bookingType: 'all', maxAmount: '', dept: '', roles: ['employee'] })
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await adminFetch('/api/admin/biz/auto-approval', { method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this rule?')) return
    await adminFetch('/api/admin/biz/auto-approval', { method: 'DELETE', body: JSON.stringify({ id }) })
    setRules(prev => prev.filter(r => r.id !== id))
  }

  function toggleRole(role: string) {
    setForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role] }))
  }

  function badge(active: boolean) {
    return { background: active ? '#DCFCE7' : '#F3F4F6', color: active ? '#16A34A' : '#6B7280', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }
  }

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 6 }}>Auto-Approval Rules</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Bookings under these limits approve automatically — no manager action needed.</p>

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1D4ED8', marginBottom: 20 }}>
        Rules are checked in order; most specific rule wins (by type + amount + role + dept).
      </div>

      {/* Add form */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>Add Rule</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Auto-approve bookings under a set amount for specific roles.</p>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Booking Type</label>
              <select value={form.bookingType} onChange={e => setForm(f => ({ ...f, bookingType: e.target.value }))} style={SEL}>
                {BOOKING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Max Amount (₹) *</label>
              <input type="number" min="1" placeholder="5000" value={form.maxAmount} onChange={e => setForm(f => ({ ...f, maxAmount: e.target.value }))} style={INP} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Department (optional)</label>
              <input placeholder="Leave blank for all" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} style={INP} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Applies to roles</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {ROLES.map(role => (
                <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} style={{ accentColor: '#E31E24' }} />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </label>
              ))}
            </div>
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {saving ? 'Adding…' : 'Add Rule'}
          </button>
        </form>
      </div>

      {/* Rules table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Active Rules</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{rules.filter(r => r.is_active).length} active</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Booking Type', 'Max Amount', 'Roles', 'Dept', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No auto-approval rules yet.</td></tr>
              ) : rules.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{r.booking_type}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 13 }}>≤ {fmtAmt(r.max_amount)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{r.allowed_roles.join(', ')}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>{r.dept ?? 'All depts'}</td>
                  <td style={{ padding: '14px 20px' }}><span style={badge(r.is_active)}>{r.is_active ? 'Active' : 'Paused'}</span></td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActive(r.id, r.is_active)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        {r.is_active ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(r.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#EF4444' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
