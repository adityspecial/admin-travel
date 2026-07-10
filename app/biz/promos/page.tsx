'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PromoModal } from '../_components/PromoModal'

interface Promo {
  id: string; code: string; description: string | null
  discount_type: 'percentage' | 'fixed'; discount_value: number
  min_booking_amount: number | null; max_discount_amount: number | null
  max_uses: number | null; uses_per_user: number; current_uses: number
  applicable_to: string | null; valid_from: string; valid_until: string
  is_active: boolean; created_at: string
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }

export default function BizPromosPage() {
  const [promos, setPromos]         = useState<Promo[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toggling, setToggling]     = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const PER = 20

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/promos')
      .then((d: { promos: Promo[] }) => setPromos(d.promos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function toggle(p: Promo) {
    setToggling(p.id)
    try {
      await adminFetch('/api/admin/biz/promos', { method: 'PATCH', body: JSON.stringify({ promoId: p.id, is_active: !p.is_active }) })
      setPromos(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    } catch { }
    setToggling(null)
  }

  const filtered = promos.filter(p =>
    !search ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const pages  = Math.ceil(filtered.length / PER)
  const slice  = filtered.slice((page - 1) * PER, page * PER)
  const active = promos.filter(p => p.is_active).length

  function badge(on: boolean) {
    return { background: on ? '#DCFCE7' : '#FEE2E2', color: on ? '#16A34A' : '#DC2626', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }
  }

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>Promo Codes</h1>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{promos.length} codes · {active} active</span>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + New Promo
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <input
            placeholder="Search by code or description..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', width: 300 }}
          />
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Code', 'Discount', 'Min Amt', 'Uses', 'Applies To', 'Valid Until', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No promo codes found.</td></tr>
              ) : slice.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px' }}><code style={{ fontWeight: 700, fontSize: 13 }}>{p.code}</code></td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13 }}>
                    {p.discount_type === 'percentage' ? `${p.discount_value}%` : `₹${p.discount_value.toLocaleString('en-IN')}`}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                    {p.min_booking_amount ? `₹${p.min_booking_amount.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    {p.current_uses}<span style={{ color: '#9CA3AF' }}>{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#F3F4F6', color: '#374151', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{p.applicable_to ?? 'all'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>{fmtDate(p.valid_until)}</td>
                  <td style={{ padding: '14px 16px' }}><span style={badge(p.is_active)}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => toggle(p)} disabled={toggling === p.id} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      {toggling === p.id ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'center' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 32, height: 32, borderRadius: 6, border: '1.5px solid #E5E7EB',
                background: page === p ? '#E31E24' : 'none', color: page === p ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {showCreate && <PromoModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
