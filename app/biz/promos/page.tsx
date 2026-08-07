'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { PromoModal } from '../_components/PromoModal'
import './promos.css'
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
    <div className="bprm-page">
      <div className="promos-container">
        {/* Breadcrumb Navigation */}
        <div className="bprm-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="bprm-breadcrumb-active">Corporate Vouchers & Promo Engine</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="bprm-hero-glow" />

          <div className="bprm-hero-content">
            <div className="bprm-hero-left">
              <div className="bprm-hero-icon">
                <Ticket size={28} />
              </div>
              <div>
                <h1 className="bprm-hero-title">
                  Promo Codes & Discount Vouchers <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="bprm-hero-subtitle">
                  Create and manage employee discount vouchers, promotional campaigns, and minimum booking threshold rules.
                </p>
              </div>
            </div>

            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> New Promo Code
            </button>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="bprm-hero-metrics">
            <div>
              <div className="bprm-metric-label">Total Promo Codes</div>
              <div className="bprm-metric-value bprm-metric-value--total">
                {promos.length} Codes
              </div>
            </div>
            <div>
              <div className="bprm-metric-label">Active Campaigns</div>
              <div className="bprm-metric-value bprm-metric-value--active">
                {activeCount} Active
              </div>
            </div>
            <div>
              <div className="bprm-metric-label">Engine Clearance</div>
              <div className="bprm-metric-value bprm-metric-value--engine">
                Realtime Auto-Apply
              </div>
            </div>
          </div>
        </div>

        {/* Promo Table Card */}
        <div className="card-shell bprm-table-card">
          <div className="bprm-table-header">
            <h3 className="bprm-card-title">Corporate Voucher Directory</h3>

            {/* Search Box */}
            <div className="bprm-search-wrap">
              <Search size={15} color="#9CA3AF" className="bprm-search-icon" />
              <input
                placeholder="Search code or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="input-field bprm-search-input"
              />
            </div>
          </div>

          <div className="bprm-table-scroll">
            <table className="bprm-table">
              <thead>
                <tr className="bprm-thead-row">
                  {['PROMO CODE', 'DISCOUNT VALUE', 'MIN BOOKING', 'REDEMPTION USES', 'APPLIES TO', 'VALID UNTIL', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} className="bprm-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="bprm-loading-cell">
                      Loading corporate promo vouchers…
                    </td>
                  </tr>
                ) : slice.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="bprm-empty-cell">
                      <Ticket size={36} color="#9CA3AF" className="bprm-empty-icon" />
                      <div className="bprm-empty-title">No Promo Codes Found</div>
                      <div className="bprm-empty-sub">Create your first promo campaign using the "+ New Promo Code" button.</div>
                    </td>
                  </tr>
                ) : (
                  slice.map((p) => (
                    <tr key={p.id} className="bprm-tr">
                      {/* Code */}
                      <td className="bprm-td">
                        <code
                          className="bprm-code-badge"
                        >
                          {p.code}
                        </code>
                      </td>

                      {/* Discount Value */}
                      <td className="bprm-td-discount">
                        {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `₹${p.discount_value.toLocaleString('en-IN')} OFF`}
                      </td>

                      {/* Min Booking */}
                      <td className="bprm-td-minbooking">
                        {p.min_booking_amount ? `≥ ₹${p.min_booking_amount.toLocaleString('en-IN')}` : 'No Min'}
                      </td>

                      {/* Uses */}
                      <td className="bprm-td-uses">
                        {p.current_uses}
                        <span className="bprm-uses-muted">{p.max_uses ? ` / ${p.max_uses}` : ' uses'}</span>
                      </td>

                      {/* Applies To */}
                      <td className="bprm-td">
                        <span
                          className="bprm-applies-pill"
                        >
                          {p.applicable_to ?? 'All'}
                        </span>
                      </td>

                      {/* Valid Until */}
                      <td className="bprm-td-valid">
                        {fmtDate(p.valid_until)}
                      </td>

                      {/* Status */}
                      <td className="bprm-td">
                        <span
                          className={`bprm-status-pill ${p.is_active ? 'bprm-status-pill--active' : 'bprm-status-pill--inactive'}`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="bprm-td">
                        <button
                          onClick={() => toggle(p)}
                          disabled={toggling === p.id}
                          className="btn-secondary bprm-toggle-btn"
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
            <div className="bprm-pagination-bar">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`bprm-page-btn ${page === p ? 'bprm-page-btn--active' : ''}`}
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
