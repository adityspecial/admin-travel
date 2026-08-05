'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
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

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  contacted: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
  completed: { bg: '#ECFDF5', color: '#047857', border: '#6EE7B7' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
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
    <div style={{ minHeight: 'calc(100vh - 54px)', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .visa-container {
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
          padding: 9px 18px;
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
        .status-tab {
          padding: 8px 18px;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          background: #ffffff;
          color: #4B5563;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-tab.active {
          background: var(--accent, #E31E24);
          color: #ffffff;
          border-color: var(--accent, #E31E24);
          box-shadow: 0 4px 12px var(--accent, rgba(227, 30, 36, 0.25));
        }
        @media (max-width: 1024px) {
          .visa-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .visa-container {
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

      <div className="visa-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Global Visa & Immigration Concierge</span>
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
                <Globe size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Visa & Immigration Desk <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Manage employee international visa enquiries, passport documentation, and travel clearances.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Enquiries</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{total}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Pending Review</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>{pendingCount} Pending</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Contacted / Processing</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>{contactedCount} Active</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Approved & Completed</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>{completedCount} Issued</div>
            </div>
          </div>
        </div>

        {/* Global Success Notification */}
        {msg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#047857',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        {/* Controls Bar: Status Filter Tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status Segmented Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, name, passport..."
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Enquiries Data Table Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['REQUEST DATE', 'DESTINATION COUNTRY', 'APPLICANT NAME', 'CONTACT DETAILS', 'PASSPORT NO.', 'TRAVEL DATES', 'PAX', 'STATUS', 'UPDATE ACTION'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                      Loading visa enquiries…
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Globe size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Visa Enquiries Found</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>No employee visa applications match the selected status or search filter.</div>
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((e) => {
                    const cfg = STATUS_COLORS[e.status] ?? { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' }

                    return (
                      <tr key={e.id} style={{ borderTop: '1px solid #F3F4F6', transition: 'background 0.15s ease' }}>
                        {/* Request Date */}
                        <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Country */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Globe size={14} />
                            </div>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>{e.country}</span>
                          </div>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{e.full_name}</td>

                        {/* Contact Details */}
                        <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#374151' }}>{e.email}</div>
                          <div style={{ color: '#6B7280', marginTop: '2px' }}>{e.phone}</div>
                        </td>

                        {/* Passport */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              fontWeight: 800,
                              background: '#F3F4F6',
                              color: '#111827',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            {e.passport_number}
                          </span>
                        </td>

                        {/* Travel Dates */}
                        <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#374151', whiteSpace: 'nowrap' }}>
                          <div>Departure: {e.travel_date}</div>
                          {e.return_date && <div style={{ fontSize: '11px', color: '#6B7280' }}>Return: {e.return_date}</div>}
                        </td>

                        {/* Pax */}
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                          {e.num_travellers}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {e.status}
                          </span>
                        </td>

                        {/* Status Update Action Dropdown */}
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={e.status}
                            onChange={(ev) => updateStatus(e.id, ev.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #E5E7EB',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#374151',
                              background: '#ffffff',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
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
            <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary"
                style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
              >
                ← Previous Page
              </button>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-primary"
                style={{ opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'default' : 'pointer', padding: '8px 16px' }}
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
