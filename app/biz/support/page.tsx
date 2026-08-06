'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
import './support.css'
import {
  LifeBuoy,
  Headphones,
  MessageSquare,
  Search,
  Sparkles,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react'

export default function SupportPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/biz/approvals?status=all')
      .then((d) => setApprovals(d.approvals ?? []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const openTickets = approvals.filter((a) => a.status === 'rejected')
  const resolvedTickets = approvals.filter((a) => a.status === 'approved')

  const baseList = tab === 'open' ? openTickets : resolvedTickets

  const filteredList = baseList.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (a.requester?.work_email ?? '').toLowerCase().includes(q) ||
      (a.booking_type ?? '').toLowerCase().includes(q) ||
      (a.comment ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="sup-page">
      <div className="support-container">
        {/* Breadcrumb Navigation */}
        <div className="sup-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="sup-breadcrumb-active">Employee Support & Ticket Helpdesk</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="sup-hero-glow" />

          <div className="sup-hero-content">
            <div className="sup-hero-left">
              <div className="sup-hero-icon">
                <LifeBuoy size={28} />
              </div>
              <div>
                <h1 className="sup-hero-title">
                  Support & Ticket Desk <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="sup-hero-subtitle">
                  Track employee booking disputes, refund requests, SLA escalations, and travel manager assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="sup-hero-metrics">
            <div>
              <div className="sup-metric-label">Open Disputes</div>
              <div className="sup-metric-value sup-metric-value--open">
                {openTickets.length} Open
              </div>
            </div>
            <div>
              <div className="sup-metric-label">Resolved Tickets</div>
              <div className="sup-metric-value sup-metric-value--resolved">
                {resolvedTickets.length} Resolved
              </div>
            </div>
            <div>
              <div className="sup-metric-label">Helpdesk SLA</div>
              <div className="sup-metric-value sup-metric-value--sla">
                &lt; 15m Response
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Controls Bar */}
        <div className="sup-controls-row">
          <div className="sup-tabs-wrap">
            <button onClick={() => setTab('open')} className={`tab-btn ${tab === 'open' ? 'active' : ''}`}>
              Open Disputes & Tickets ({openTickets.length})
            </button>
            <button onClick={() => setTab('resolved')} className={`tab-btn ${tab === 'resolved' ? 'active' : ''}`}>
              Resolved Tickets ({resolvedTickets.length})
            </button>
          </div>
        </div>

        {/* Support Tickets Data Table Card */}
        <div className="card-shell sup-table-card">
          <div className="sup-table-header">
            <h3 className="sup-card-title">
              {tab === 'open' ? 'Open Support Disputes' : 'Resolved Support Ledgers'}
            </h3>

            {/* Search Box */}
            <div className="sup-search-wrap">
              <Search size={15} color="#9CA3AF" className="sup-search-icon" />
              <input
                placeholder="Search email, type, comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field sup-search-input"
              />
            </div>
          </div>

          <div className="sup-table-scroll">
            <table className="sup-table">
              <thead>
                <tr className="sup-thead-row">
                  {['EMPLOYEE', 'BOOKING CATEGORY', 'AMOUNT (₹)', tab === 'open' ? 'REJECTED DATE' : 'APPROVED DATE', 'REVIEWER COMMENT', 'GOVERNANCE LINK'].map((h) => (
                    <th key={h} className="sup-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="sup-loading-cell">
                      Loading support requests…
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sup-empty-cell">
                      <Headphones size={36} color="#9CA3AF" className="sup-empty-icon" />
                      <div className="sup-empty-title">
                        {tab === 'open' ? 'No Open Support Tickets' : 'No Resolved Tickets'}
                      </div>
                      <div className="sup-empty-sub">
                        {tab === 'open' ? 'Rejected travel booking disputes will appear here.' : 'Approved bookings will appear here.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((a) => (
                    <tr key={a.id} className="sup-tr">
                      {/* Employee */}
                      <td className="sup-td">
                        <div className="sup-employee-row">
                          <div className="sup-avatar">
                            <User size={14} />
                          </div>
                          <span className="sup-employee-email">
                            {a.requester?.work_email ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="sup-td">
                        <span
                          className="sup-category-pill"
                        >
                          {a.booking_type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="sup-td-amount">
                        {a.amount ? `₹${a.amount.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Review Date */}
                      <td className="sup-td-date">
                        {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Comment */}
                      <td className="sup-td-comment">
                        {a.comment ?? '—'}
                      </td>

                      {/* Action */}
                      <td className="sup-td">
                        <Link
                          href="/biz/approvals"
                          className="sup-view-link"
                        >
                          View Request <ExternalLink size={12} />
                        </Link>
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
