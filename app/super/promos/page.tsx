'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { CreatePromoModal, EditPromoModal, UsageModal } from './PromoModals'

export interface Promo {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_booking_amount: number | null
  max_discount_amount: number | null
  max_uses: number | null
  uses_per_user: number
  current_uses: number
  applicable_to: string | null
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDiscount(p: Promo) {
  return p.discount_type === 'percentage'
    ? `${p.discount_value}%`
    : `Rs ${p.discount_value.toLocaleString('en-IN')}`
}

export default function SuperPromosPage() {
  const [promos, setPromos]         = useState<Promo[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editPromo, setEditPromo]   = useState<Promo | null>(null)
  const [usagePromo, setUsagePromo] = useState<Promo | null>(null)

  function load() {
    setLoading(true)
    adminFetch('/api/admin/super/promos')
      .then((d: { promos: Promo[] }) => setPromos(d.promos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = promos.filter(p => {
    if (filter === 'active'   && !p.is_active) return false
    if (filter === 'inactive' &&  p.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      return p.code.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const { slice, page, setPage, total } = usePagination(filtered, 20)
  const active     = promos.filter(p => p.is_active).length
  const totalUses  = promos.reduce((s, p) => s + (p.current_uses ?? 0), 0)

  async function deactivate(p: Promo) {
    if (!confirm(`Deactivate "${p.code}"? This is a soft delete.`)) return
    await adminFetch(`/api/admin/super/promos/${p.id}`, { method: 'DELETE' }).catch(() => {})
    setPromos(prev => prev.map(x => x.id === p.id ? { ...x, is_active: false } : x))
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Promo Codes</h2>
        <span className="topbar-meta">{promos.length} codes total</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          <section className="stat-grid">
            {[
              { label: 'Total Codes',  value: promos.length,                           sub: 'All promo codes ever created',       icon: 'CP', tone: ''       },
              { label: 'Active Now',   value: active,                                  sub: `${promos.length - active} inactive`, icon: 'AC', tone: 'teal'   },
              { label: 'Total Uses',   value: totalUses.toLocaleString('en-IN'),        sub: 'Cumulative redemptions',             icon: 'US', tone: 'orange' },
            ].map(c => (
              <div className={`stat-card ${c.tone}`.trim()} key={c.label}>
                <div className="stat-head">
                  <div className="stat-num">{c.value}</div>
                  <span className="stat-icon">{c.icon}</span>
                </div>
                <div className="stat-label">{c.label}</div>
                <div className="stat-sub">{c.sub}</div>
              </div>
            ))}
          </section>

          <div className="surface-card">
            <div className="table-toolbar">
              <input
                className="toolbar-search"
                style={{ maxWidth: 320 }}
                placeholder="Search by code or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="page-actions">
                {(['all', 'active', 'inactive'] as const).map(f => (
                  <button
                    key={f}
                    className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                  + New Promo
                </button>
              </div>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Amt</th>
                  <th>Max Cap</th>
                  <th>Uses</th>
                  <th>Applies To</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="empty-state">Loading...</td></tr>
                ) : slice.length === 0 ? (
                  <tr><td colSpan={10} className="empty-state">No promo codes found.</td></tr>
                ) : slice.map(p => (
                  <tr key={p.id}>
                    <td><code style={{ fontWeight: 700 }}>{p.code}</code></td>
                    <td>
                      <span className={`badge ${p.discount_type === 'percentage' ? 'badge-blue' : 'badge-yellow'}`}>
                        {p.discount_type === 'percentage' ? '%' : 'Rs'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmtDiscount(p)}</td>
                    <td style={{ color: '#64748B' }}>
                      {p.min_booking_amount ? `Rs ${p.min_booking_amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {p.max_discount_amount ? `Rs ${p.max_discount_amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td>
                      {p.current_uses}
                      <span style={{ color: '#94A3B8' }}>{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
                    </td>
                    <td><span className="badge badge-gray">{p.applicable_to ?? 'all'}</span></td>
                    <td style={{ color: '#64748B', fontSize: 12 }}>{fmtDate(p.valid_until)}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="page-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditPromo(p)}>Edit</button>
                        <button className="btn btn-muted btn-sm" onClick={() => setUsagePromo(p)}>Usage</button>
                        {p.is_active && (
                          <button className="btn btn-ghost btn-sm" onClick={() => deactivate(p)}>Off</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>

        </div>
      </div>

      {showCreate && (
        <CreatePromoModal
          onClose={() => setShowCreate(false)}
          onCreated={p => { setPromos(prev => [p, ...prev]); setShowCreate(false) }}
        />
      )}
      {editPromo && (
        <EditPromoModal
          promo={editPromo}
          onClose={() => setEditPromo(null)}
          onSaved={patch => {
            setPromos(prev => prev.map(x => x.id === editPromo.id ? { ...x, ...patch } : x))
            setEditPromo(null)
          }}
        />
      )}
      {usagePromo && (
        <UsageModal promo={usagePromo} onClose={() => setUsagePromo(null)} />
      )}
    </div>
  )
}
