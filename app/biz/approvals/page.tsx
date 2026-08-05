'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import {
  CheckSquare,
  Plane,
  Hotel,
  Search,
  Check,
  X,
  Eye,
  Clock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  User,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'

type Tab = 'pending' | 'expired' | 'all'

function ageLabel(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const h = diff / 3600000
  if (h < 3) return '<3h'
  if (h < 12) return '3-12h'
  return '>12h'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Sidebar filter state
  const [filterPolicy, setFilterPolicy] = useState<string[]>([])
  const [filterApprover, setFilterApprover] = useState('')
  const [filterTraveller, setFilterTraveller] = useState('')
  const [filterDateReq, setFilterDateReq] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterDateTravel, setFilterDateTravel] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/biz/approvals?status=all')
      .then((d) => setApprovals(d.approvals ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function doAction(id: string, act: 'approve' | 'reject') {
    try {
      await adminFetch(`/api/admin/biz/approvals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: act }),
      })
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: act === 'approve' ? 'approved' : 'rejected' } : a))
      )
    } catch (err: any) {
      alert(err.message || 'Failed to update request status')
    }
  }

  const now = new Date()
  function isExpired(a: any) {
    return a.expires_at && new Date(a.expires_at) < now
  }

  function matchesDateReq(a: any) {
    if (!filterDateReq) return true
    const d = new Date(a.created_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (filterDateReq === 'today') return d >= today
    if (filterDateReq === 'yesterday') return d >= yesterday && d < today
    if (filterDateReq === 'last7') {
      const w = new Date(today)
      w.setDate(today.getDate() - 7)
      return d >= w
    }
    return true
  }

  const filtered = useMemo(() => {
    let list = approvals
    if (tab === 'pending') list = list.filter((a) => a.status === 'pending' && !isExpired(a))
    if (tab === 'expired') list = list.filter((a) => isExpired(a))
    if (tab === 'all') list = [...list]
    if (search) list = list.filter((a) => a.id.includes(search) || (a.requester?.work_email ?? '').includes(search))
    if (filterApprover) list = list.filter((a) => (a.reviewer?.work_email ?? '').toLowerCase().includes(filterApprover.toLowerCase()))
    if (filterTraveller) list = list.filter((a) => (a.requester?.work_email ?? '').toLowerCase().includes(filterTraveller.toLowerCase()))
    if (filterAge) list = list.filter((a) => ageLabel(a.created_at) === filterAge)
    list = list.filter(matchesDateReq)
    return list
  }, [approvals, tab, search, filterApprover, filterTraveller, filterAge, filterDateReq])

  const counts = {
    pending: approvals.filter((a) => a.status === 'pending' && !isExpired(a)).length,
    expired: approvals.filter((a) => isExpired(a)).length,
    all: approvals.length,
  }

  function resetFilters() {
    setFilterPolicy([])
    setFilterApprover('')
    setFilterTraveller('')
    setFilterDateReq('')
    setFilterAge('')
    setFilterDateTravel('')
    setSearch('')
  }

  const activeFiltersCount =
    filterPolicy.length +
    (filterApprover ? 1 : 0) +
    (filterTraveller ? 1 : 0) +
    (filterDateReq ? 1 : 0) +
    (filterAge ? 1 : 0) +
    (filterDateTravel ? 1 : 0)

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .approvals-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .filter-sidebar {
          width: 270px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
        }
        .filter-sidebar__scroll::-webkit-scrollbar { width: 5px; }
        .filter-sidebar__scroll::-webkit-scrollbar-track { background: transparent; }
        .filter-sidebar__scroll::-webkit-scrollbar-thumb {
          background: rgba(209,213,219,0.85);
          border-radius: 99px;
        }
        .filter-sidebar__scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(156,163,175,1);
        }
        .approvals-main {
          flex: 1;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
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
        .filter-card-block {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .input-field {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 12.5px;
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
          white-space: nowrap;
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
        .tab-btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn.active {
          background: var(--accent, #E31E24);
          color: #ffffff;
          box-shadow: 0 4px 14px var(--accent, rgba(227, 30, 36, 0.25));
        }
        .mobile-filter-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .approvals-wrapper {
            flex-direction: column;
          }
          .filter-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #E5E7EB;
            display: ${showMobileFilters ? 'block' : 'none'};
          }
          .mobile-filter-toggle {
            display: inline-flex;
          }
          .approvals-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .approvals-main {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="approvals-wrapper">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          title="Approval Filters"
          icon={<SlidersHorizontal size={16} />}
          activeCount={activeFiltersCount}
          onReset={resetFilters}
          showMobile={showMobileFilters}
          activeTags={[
            ...filterPolicy.map((p) => ({ id: `pol-${p}`, label: `Policy: ${p}`, onRemove: () => setFilterPolicy((prev) => prev.filter((x) => x !== p)) })),
            ...(filterApprover ? [{ id: 'appr', label: `Approver: ${filterApprover}`, onRemove: () => setFilterApprover('') }] : []),
            ...(filterTraveller ? [{ id: 'trav', label: `Traveller: ${filterTraveller}`, onRemove: () => setFilterTraveller('') }] : []),
            ...(filterDateReq ? [{ id: 'dateReq', label: `Req: ${filterDateReq}`, onRemove: () => setFilterDateReq('') }] : []),
            ...(filterAge ? [{ id: 'age', label: `SLA: ${filterAge}`, onRemove: () => setFilterAge('') }] : []),
          ]}
        >
          {/* Filter 1: Policy Compliance */}
          <FilterSidebarBlock title="Policy Compliance" icon={<ShieldCheck size={15} color="#2563EB" />}>
            {[
              ['In Policy', 'in'],
              ['Out of Policy (Requires Approval)', 'out'],
            ].map(([lbl, val]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterPolicy.includes(val)}
                  onChange={(e) =>
                    setFilterPolicy((prev) => (e.target.checked ? [...prev, val] : prev.filter((x) => x !== val)))
                  }
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{lbl}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Filter 2: Approver Email */}
          <FilterSidebarBlock title="Approver Email" icon={<UserCheck size={15} color="#16A34A" />}>
            <input
              value={filterApprover}
              onChange={(e) => setFilterApprover(e.target.value)}
              placeholder="Search approver..."
              className="input-field"
            />
          </FilterSidebarBlock>

          {/* Filter 3: Traveller Email */}
          <FilterSidebarBlock title="Traveller Email" icon={<User size={15} color="#EA580C" />}>
            <input
              value={filterTraveller}
              onChange={(e) => setFilterTraveller(e.target.value)}
              placeholder="Search traveller..."
              className="input-field"
            />
          </FilterSidebarBlock>

          {/* Filter 4: Date of Request */}
          <FilterSidebarBlock title="Request Date" icon={<Calendar size={15} color="#7C3AED" />}>
            {[
              ['today', 'Today'],
              ['yesterday', 'Yesterday'],
              ['last7', 'Last 7 Days'],
            ].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dateReq"
                  checked={filterDateReq === v}
                  onChange={() => setFilterDateReq(filterDateReq === v ? '' : v)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{l}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Filter 5: SLA Age */}
          <FilterSidebarBlock title="SLA Request Age" icon={<Clock size={15} color="#DC2626" />}>
            {[
              ['<3h', 'Less than 3 hours (<3h)'],
              ['3-12h', '3 - 12 hours'],
              ['>12h', 'Greater than 12 hours (>12h)'],
            ].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="age"
                  checked={filterAge === v}
                  onChange={() => setFilterAge(filterAge === v ? '' : v)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{l}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Workspace */}
        <main className="approvals-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Travel Approvals & Bookings</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
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
                  <CheckSquare size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Corporate Approvals Governance <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Review employee flight & hotel requests against company policy caps, SLA timelines, and manager sign-offs.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Pending Review</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>{counts.pending} Requests</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Expired / Lapsed</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#F87171', marginTop: '2px' }}>{counts.expired} Lapsed</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Booking Volume</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>{counts.all} Recorded</div>
              </div>
            </div>
          </div>

          {/* Navigation Segmented Tabs & Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              {(
                [
                  ['pending', 'PENDING REQUESTS', counts.pending],
                  ['expired', 'EXPIRED REQUESTS', counts.expired],
                  ['all', 'ALL BOOKINGS', counts.all],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`tab-btn ${tab === key ? 'active' : ''}`}
                >
                  <span>{label}</span>
                  <span style={{ fontSize: '11px', background: tab === key ? 'rgba(255,255,255,0.25)' : '#F3F4F6', padding: '2px 8px', borderRadius: '99px', fontWeight: 800 }}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Request ID or email..."
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['TRIP DETAILS', 'TRAVELLER', 'APPROVER', 'DATE OF TRAVEL', 'SLA AGE', 'EXPENSE (₹)', 'ACTIONS'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                        Loading travel requests…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <CheckSquare size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Travel Requests Found</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Try clearing active filters or searching another keyword.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const fd = a.flight_data
                      const hd = a.hotel_data
                      const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                      const isFlight = a.booking_type === 'flight'

                      return (
                        <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6', transition: 'background 0.15s ease' }}>
                          {/* Trip Details */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '10px',
                                  background: isFlight ? '#EFF6FF' : '#ECFDF5',
                                  color: isFlight ? '#2563EB' : '#047857',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {isFlight ? <Plane size={16} /> : <Hotel size={16} />}
                              </div>
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>
                                  {isFlight && fd
                                    ? `${fd.from || fd.origin || 'Origin'} → ${fd.to || fd.destination || 'Destination'}`
                                    : hd
                                      ? hd.hotelName || hd.hotel_name || 'Hotel Stay'
                                      : 'Corporate Booking'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{a.booking_type}</span>
                                  {fd?.airline && <span>· {fd.airline}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Traveller */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{a.requester?.work_email ?? '—'}</div>
                            {a.dept && <div style={{ fontSize: '11px', color: '#6B7280' }}>{a.dept}</div>}
                          </td>

                          {/* Approver */}
                          <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#4B5563', fontWeight: 500 }}>
                            {a.reviewer?.work_email ? (
                              a.reviewer.work_email
                            ) : (
                              <span style={{ fontSize: '11px', color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>
                                Auto-Approved Rule
                              </span>
                            )}
                          </td>

                          {/* Date of Travel */}
                          <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>
                            {travelDate ? fmtDate(travelDate) : '—'}
                          </td>

                          {/* SLA Age */}
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '99px',
                                background: ageLabel(a.created_at) === '<3h' ? '#ECFDF5' : ageLabel(a.created_at) === '3-12h' ? '#FFFBEB' : '#FEF2F2',
                                color: ageLabel(a.created_at) === '<3h' ? '#047857' : ageLabel(a.created_at) === '3-12h' ? '#B45309' : '#DC2626',
                                border: ageLabel(a.created_at) === '<3h' ? '1px solid #6EE7B7' : ageLabel(a.created_at) === '3-12h' ? '1px solid #FDE68A' : '1px solid #FCA5A5',
                              }}
                            >
                              {ageLabel(a.created_at)}
                            </span>
                          </td>

                          {/* Expense */}
                          <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 900, color: '#111827' }}>
                            ₹{(a.amount ?? 0).toLocaleString('en-IN')}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {a.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => doAction(a.id, 'approve')}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      borderRadius: '8px',
                                      background: '#ECFDF5',
                                      color: '#047857',
                                      border: '1px solid #6EE7B7',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <Check size={13} /> Approve
                                  </button>
                                  <button
                                    onClick={() => doAction(a.id, 'reject')}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      borderRadius: '8px',
                                      background: '#FEF2F2',
                                      color: '#DC2626',
                                      border: '1px solid #FCA5A5',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </>
                              )}

                              <Link
                                href={`/biz/approvals/${a.id}`}
                                style={{
                                  fontSize: '12px',
                                  color: '#2563EB',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Eye size={13} /> View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
