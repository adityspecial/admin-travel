'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PromoModal } from '../_components/PromoModal'
import {
  Ticket,
  Tag,
  Plus,
  Search,
  Sparkles,
  ChevronRight,
  Percent,
  CheckCircle2,
  Clock,
  Zap,
  ShieldAlert,
} from 'lucide-react'

interface Promo {
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BizPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PER = 20

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/promos')
      .then((d: { promos: Promo[] }) => setPromos(d.promos ?? []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(p: Promo) {
    setToggling(p.id)
    try {
      await adminFetch('/api/admin/biz/promos', {
        method: 'PATCH',
        body: JSON.stringify({ promoId: p.id, is_active: !p.is_active }),
      })
      setPromos((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)))
    } catch { }
    setToggling(null)
  }

  const filtered = promos.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const pages = Math.ceil(filtered.length / PER)
  const slice = filtered.slice((page - 1) * PER, page * PER)
  const activeCount = promos.filter((p) => p.is_active).length

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .promos-container {
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
        @media (max-width: 1024px) {
          .promos-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .promos-container {
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

      <div className="promos-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Vouchers & Promo Engine</span>
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
                <Ticket size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Promo Codes & Discount Vouchers <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Create and manage employee discount vouchers, promotional campaigns, and minimum booking threshold rules.
                </p>
              </div>
            </div>

            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> New Promo Code
            </button>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Promo Codes</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {promos.length} Codes
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Campaigns</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                {activeCount} Active
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Engine Clearance</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                Realtime Auto-Apply
              </div>
            </div>
          </div>
        </div>

        {/* Promo Table Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Corporate Voucher Directory</h3>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder="Search code or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="input-field"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['PROMO CODE', 'DISCOUNT VALUE', 'MIN BOOKING', 'REDEMPTION USES', 'APPLIES TO', 'VALID UNTIL', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                      Loading corporate promo vouchers…
                    </td>
                  </tr>
                ) : slice.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Ticket size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Promo Codes Found</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Create your first promo campaign using the "+ New Promo Code" button.</div>
                    </td>
                  </tr>
                ) : (
                  slice.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      {/* Code */}
                      <td style={{ padding: '16px 18px' }}>
                        <code
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            fontWeight: 900,
                            background: '#F3F4F6',
                            color: '#111827',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {p.code}
                        </code>
                      </td>

                      {/* Discount Value */}
                      <td style={{ padding: '16px 18px', fontSize: '14px', fontWeight: 900, color: '#111827' }}>
                        {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `₹${p.discount_value.toLocaleString('en-IN')} OFF`}
                      </td>

                      {/* Min Booking */}
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
                        {p.min_booking_amount ? `≥ ₹${p.min_booking_amount.toLocaleString('en-IN')}` : 'No Min'}
                      </td>

                      {/* Uses */}
                      <td style={{ padding: '16px 18px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {p.current_uses}
                        <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{p.max_uses ? ` / ${p.max_uses}` : ' uses'}</span>
                      </td>

                      {/* Applies To */}
                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            borderRadius: '99px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            border: '1px solid #93C5FD',
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.applicable_to ?? 'All'}
                        </span>
                      </td>

                      {/* Valid Until */}
                      <td style={{ padding: '16px 18px', fontSize: '12.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {fmtDate(p.valid_until)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: p.is_active ? '#ECFDF5' : '#FEF2F2',
                            color: p.is_active ? '#047857' : '#DC2626',
                            border: `1px solid ${p.is_active ? '#6EE7B7' : '#FCA5A5'}`,
                          }}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px' }}>
                        <button
                          onClick={() => toggle(p)}
                          disabled={toggling === p.id}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {toggling === p.id ? 'Updating…' : p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {pages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB',
                    background: page === p ? 'var(--accent, #E31E24)' : '#ffffff',
                    color: page === p ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 800,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <PromoModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
