'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import './approvals.css'
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

function slaTone(age: string) {
  if (age === '<3h') return 'appr-sla-badge--fresh'
  if (age === '3-12h') return 'appr-sla-badge--warn'
  return 'appr-sla-badge--stale'
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
    <div className="appr-page">
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
              <label key={val} className="appr-checkbox-row">
                <input
                  type="checkbox"
                  checked={filterPolicy.includes(val)}
                  onChange={(e) =>
                    setFilterPolicy((prev) => (e.target.checked ? [...prev, val] : prev.filter((x) => x !== val)))
                  }
                  className="appr-checkbox"
                />
                <span className="appr-checkbox-label">{lbl}</span>
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
              <label key={v} className="appr-checkbox-row">
                <input
                  type="radio"
                  name="dateReq"
                  checked={filterDateReq === v}
                  onChange={() => setFilterDateReq(filterDateReq === v ? '' : v)}
                  className="appr-checkbox"
                />
                <span className="appr-checkbox-label">{l}</span>
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
              <label key={v} className="appr-checkbox-row">
                <input
                  type="radio"
                  name="age"
                  checked={filterAge === v}
                  onChange={() => setFilterAge(filterAge === v ? '' : v)}
                  className="appr-checkbox"
                />
                <span className="appr-checkbox-label">{l}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Workspace */}
        <main className="approvals-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div className="appr-breadcrumb-row">
            <div className="appr-breadcrumb-left">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="appr-breadcrumb-active">Travel Approvals & Bookings</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="appr-hero-glow" />

            <div className="appr-hero-content">
              <div className="appr-hero-left">
                <div className="appr-hero-icon">
                  <CheckSquare size={28} />
                </div>
                <div>
                  <h1 className="appr-hero-title">
                    Corporate Approvals Governance <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="appr-hero-subtitle">
                    Review employee flight & hotel requests against company policy caps, SLA timelines, and manager sign-offs.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div className="appr-hero-metrics">
              <div>
                <div className="appr-metric-label">Pending Review</div>
                <div className="appr-metric-value appr-metric-value--pending">{counts.pending} Requests</div>
              </div>
              <div>
                <div className="appr-metric-label">Expired / Lapsed</div>
                <div className="appr-metric-value appr-metric-value--expired">{counts.expired} Lapsed</div>
              </div>
              <div>
                <div className="appr-metric-label">Total Booking Volume</div>
                <div className="appr-metric-value appr-metric-value--all">{counts.all} Recorded</div>
              </div>
            </div>
          </div>

          {/* Navigation Segmented Tabs & Search */}
          <div className="appr-tabs-search-row">
            <div className="appr-tab-group">
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
                  <span className={`appr-tab-count ${tab === key ? 'appr-tab-count--active' : ''}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="appr-search-wrapper">
              <Search size={15} color="#9CA3AF" className="appr-search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Request ID or email..."
                className="input-field appr-search-input"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="card-shell appr-table-card">
            <div className="appr-table-scroll">
              <table className="appr-table">
                <thead>
                  <tr className="appr-thead-row">
                    {['TRIP DETAILS', 'TRAVELLER', 'APPROVER', 'DATE OF TRAVEL', 'SLA AGE', 'EXPENSE (₹)', 'ACTIONS'].map((h) => (
                      <th key={h} className="appr-th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="appr-td-loading">
                        Loading travel requests…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="appr-td-empty">
                        <CheckSquare size={36} color="#9CA3AF" className="appr-empty-icon" />
                        <div className="appr-empty-title">No Travel Requests Found</div>
                        <div className="appr-empty-sub">Try clearing active filters or searching another keyword.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const fd = a.flight_data
                      const hd = a.hotel_data
                      const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                      const isFlight = a.booking_type === 'flight'

                      return (
                        <tr key={a.id} className="appr-tr">
                          {/* Trip Details */}
                          <td className="appr-td">
                            <div className="appr-trip-row">
                              <div className={`appr-trip-icon ${isFlight ? 'appr-trip-icon--flight' : 'appr-trip-icon--hotel'}`}>
                                {isFlight ? <Plane size={16} /> : <Hotel size={16} />}
                              </div>
                              <div>
                                <div className="appr-trip-name">
                                  {isFlight && fd
                                    ? `${fd.from || fd.origin || 'Origin'} → ${fd.to || fd.destination || 'Destination'}`
                                    : hd
                                      ? hd.hotelName || hd.hotel_name || 'Hotel Stay'
                                      : 'Corporate Booking'}
                                </div>
                                <div className="appr-trip-meta">
                                  <span className="appr-trip-type">{a.booking_type}</span>
                                  {fd?.airline && <span>· {fd.airline}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Traveller */}
                          <td className="appr-td">
                            <div className="appr-traveller-name">{a.requester?.work_email ?? '—'}</div>
                            {a.dept && <div className="appr-traveller-dept">{a.dept}</div>}
                          </td>

                          {/* Approver */}
                          <td className="appr-td appr-approver-cell">
                            {a.reviewer?.work_email ? (
                              a.reviewer.work_email
                            ) : (
                              <span className="appr-auto-approved-badge">
                                Auto-Approved Rule
                              </span>
                            )}
                          </td>

                          {/* Date of Travel */}
                          <td className="appr-td appr-date-cell">
                            {travelDate ? fmtDate(travelDate) : '—'}
                          </td>

                          {/* SLA Age */}
                          <td className="appr-td">
                            <span className={`appr-sla-badge ${slaTone(ageLabel(a.created_at))}`}>
                              {ageLabel(a.created_at)}
                            </span>
                          </td>

                          {/* Expense */}
                          <td className="appr-td appr-expense-cell">
                            ₹{(a.amount ?? 0).toLocaleString('en-IN')}
                          </td>

                          {/* Actions */}
                          <td className="appr-td">
                            <div className="appr-actions-row">
                              {a.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => doAction(a.id, 'approve')}
                                    className="appr-btn-approve"
                                  >
                                    <Check size={13} /> Approve
                                  </button>
                                  <button
                                    onClick={() => doAction(a.id, 'reject')}
                                    className="appr-btn-reject"
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </>
                              )}

                              <Link
                                href={`/biz/approvals/${a.id}`}
                                className="appr-view-link"
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
