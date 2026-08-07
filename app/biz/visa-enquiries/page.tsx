'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import './visa-enquiries.css'
import {
  Globe,
  Compass,
  FileText,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Filter,
  Check,
  X,
  Plane,
} from 'lucide-react'

interface Enquiry {
  id: string
  slug: string
  country: string
  full_name: string
  email: string
  phone: string
  passport_number: string
  travel_date: string
  return_date: string | null
  num_travellers: number
  notes: string | null
  status: string
  created_at: string
}

const PAGE_SIZE = 20

export default function BizVisaEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback((s: string, p: number) => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(p) })
    if (s) qs.set('status', s)
    adminFetch(`/api/admin/biz/visa/enquiries?${qs}`)
      .then((d: { enquiries: Enquiry[]; total: number }) => {
        setEnquiries(d.enquiries ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(status, page)
  }, [page, status, load])

  async function updateStatus(id: string, newStatus: string) {
    try {
      await adminFetch(`/api/admin/biz/visa/enquiries?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      flash('Visa enquiry status updated successfully.')
      load(status, page)
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3500)
  }

  const filteredEnquiries = enquiries.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.country.toLowerCase().includes(q) ||
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.passport_number.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const pendingCount = enquiries.filter((e) => e.status === 'pending').length
  const contactedCount = enquiries.filter((e) => e.status === 'contacted').length
  const completedCount = enquiries.filter((e) => e.status === 'completed').length

  return (
    <div className="bve-page">
      <div className="visa-container">
        {/* Breadcrumb Navigation */}
        <div className="bve-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="bve-breadcrumb-active">Global Visa & Immigration Concierge</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="bve-hero-glow" />

          <div className="bve-hero-content">
            <div className="bve-hero-left">
              <div className="bve-hero-icon">
                <Globe size={28} />
              </div>
              <div>
                <h1 className="bve-hero-title">
                  Visa & Immigration Desk <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="bve-hero-subtitle">
                  Manage employee international visa enquiries, passport documentation, and travel clearances.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="bve-hero-metrics">
            <div>
              <div className="bve-metric-label">Total Enquiries</div>
              <div className="bve-metric-value bve-metric-value--total">{total}</div>
            </div>
            <div>
              <div className="bve-metric-label">Pending Review</div>
              <div className="bve-metric-value bve-metric-value--pending">{pendingCount} Pending</div>
            </div>
            <div>
              <div className="bve-metric-label">Contacted / Processing</div>
              <div className="bve-metric-value bve-metric-value--active">{contactedCount} Active</div>
            </div>
            <div>
              <div className="bve-metric-label">Approved & Completed</div>
              <div className="bve-metric-value bve-metric-value--issued">{completedCount} Issued</div>
            </div>
          </div>
        </div>

        {/* Global Success Notification */}
        {msg && (
          <div
            className="bve-success-banner"
          >
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        {/* Controls Bar: Status Filter Tabs & Search */}
        <div className="bve-controls-row">
          {/* Status Segmented Buttons */}
          <div className="bve-status-tabs">
            {[
              ['', 'All Enquiries'],
              ['pending', 'Pending'],
              ['contacted', 'Contacted'],
              ['completed', 'Completed'],
              ['cancelled', 'Cancelled'],
            ].map(([val, label]) => {
              const isActive = status === val
              return (
                <button
                  key={val}
                  onClick={() => {
                    setStatus(val)
                    setPage(1)
                    load(val, 1)
                  }}
                  className={`status-tab ${isActive ? 'active' : ''}`}
                >
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="bve-search-wrap">
            <Search size={15} color="#9CA3AF" className="bve-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, name, passport..."
              className="input-field bve-search-input"
            />
          </div>
        </div>

        {/* Enquiries Data Table Card */}
        <div className="card-shell bve-table-card">
          <div className="bve-table-scroll">
            <table className="bve-table">
              <thead>
                <tr className="bve-thead-row">
                  {['REQUEST DATE', 'DESTINATION COUNTRY', 'APPLICANT NAME', 'CONTACT DETAILS', 'PASSPORT NO.', 'TRAVEL DATES', 'PAX', 'STATUS', 'UPDATE ACTION'].map((h) => (
                    <th key={h} className="bve-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="bve-loading-cell">
                      Loading visa enquiries…
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="bve-empty-cell">
                      <Globe size={36} color="#9CA3AF" className="bve-empty-icon" />
                      <div className="bve-empty-title">No Visa Enquiries Found</div>
                      <div className="bve-empty-sub">No employee visa applications match the selected status or search filter.</div>
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((e) => {
                    const statusClass = ['pending', 'contacted', 'completed', 'cancelled'].includes(e.status) ? `bve-status-pill--${e.status}` : ''

                    return (
                      <tr key={e.id} className="bve-tr">
                        {/* Request Date */}
                        <td className="bve-td-date">
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Country */}
                        <td className="bve-td">
                          <div className="bve-country-row">
                            <div className="bve-country-icon">
                              <Globe size={14} />
                            </div>
                            <span className="bve-country-label">{e.country}</span>
                          </div>
                        </td>

                        {/* Name */}
                        <td className="bve-td-name">{e.full_name}</td>

                        {/* Contact Details */}
                        <td className="bve-td-contact">
                          <div className="bve-contact-email">{e.email}</div>
                          <div className="bve-contact-phone">{e.phone}</div>
                        </td>

                        {/* Passport */}
                        <td className="bve-td">
                          <span
                            className="bve-passport-badge"
                          >
                            {e.passport_number}
                          </span>
                        </td>

                        {/* Travel Dates */}
                        <td className="bve-td-dates">
                          <div>Departure: {e.travel_date}</div>
                          {e.return_date && <div className="bve-return-sub">Return: {e.return_date}</div>}
                        </td>

                        {/* Pax */}
                        <td className="bve-td-pax">
                          {e.num_travellers}
                        </td>

                        {/* Status */}
                        <td className="bve-td">
                          <span
                            className={`bve-status-pill ${statusClass}`}
                          >
                            {e.status}
                          </span>
                        </td>

                        {/* Status Update Action Dropdown */}
                        <td className="bve-td">
                          <select
                            value={e.status}
                            onChange={(ev) => updateStatus(e.id, ev.target.value)}
                            className="bve-status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="bve-pagination-bar">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={`btn-secondary bve-prev-btn ${page <= 1 ? 'bve-prev-btn--disabled' : ''}`}
              >
                ← Previous Page
              </button>
              <span className="bve-page-label">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`btn-primary bve-next-btn ${page >= totalPages ? 'bve-next-btn--disabled' : ''}`}
              >
                Next Page →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
