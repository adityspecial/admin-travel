'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface Markup { id: string; booking_type: string; markup_type: string; markup_value: number; airline_code?: string; is_active: boolean }

export default function PartnerMarkupsPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
  const [markups, setMarkups]   = useState<Markup[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    adminFetch('/api/admin/partner/markups', { agentId })
      .then(d => setMarkups(d.markups ?? []))
      .finally(() => setLoading(false))
  }, [agentId])

  async function toggleActive(id: string, current: boolean) {
    setSaving(id)
    await adminFetch('/api/admin/partner/markups', { agentId, method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setMarkups(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m))
    setSaving(null)
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Markups</h2>
        <span className="topbar-meta">{markups.filter(m => m.is_active).length} active rules</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div className="card-title">Markup Rules</div>
              <div className="card-copy">Set by the agent on top of base fares.</div>
            </div>
            <table>
              <thead><tr><th>Booking Type</th><th>Markup</th><th>Airline</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                ) : markups.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No markup rules set.</td></tr>
                ) : markups.map(m => (
                  <tr key={m.id}>
                    <td><span className="badge badge-blue">{m.booking_type}</span></td>
                    <td style={{ fontWeight: 700 }}>{m.markup_type === 'percentage' ? `${m.markup_value}%` : `₹${m.markup_value}`}</td>
                    <td>{m.airline_code ? <code>{m.airline_code}</code> : <span style={{ color: 'var(--ink-3)' }}>All</span>}</td>
                    <td><span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'Active' : 'Paused'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-ghost" disabled={saving === m.id} onClick={() => toggleActive(m.id, m.is_active)}>
                        {saving === m.id ? '…' : m.is_active ? 'Pause' : 'Activate'}
                      </button>
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
