'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
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
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .support-container {
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
        .tab-btn {
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
        .tab-btn.active {
          background: var(--accent, #E31E24);
          color: #ffffff;
          border-color: var(--accent, #E31E24);
          box-shadow: 0 4px 12px var(--accent, rgba(227, 30, 36, 0.25));
        }
        @media (max-width: 1024px) {
          .support-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .support-container {
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

      <div className="support-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Employee Support & Ticket Helpdesk</span>
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
                <LifeBuoy size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Support & Ticket Desk <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Track employee booking disputes, refund requests, SLA escalations, and travel manager assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Open Disputes</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                {openTickets.length} Open
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Resolved Tickets</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                {resolvedTickets.length} Resolved
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Helpdesk SLA</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                &lt; 15m Response
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setTab('open')} className={`tab-btn ${tab === 'open' ? 'active' : ''}`}>
              Open Disputes & Tickets ({openTickets.length})
            </button>
            <button onClick={() => setTab('resolved')} className={`tab-btn ${tab === 'resolved' ? 'active' : ''}`}>
              Resolved Tickets ({resolvedTickets.length})
            </button>
          </div>
        </div>

        {/* Support Tickets Data Table Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
              {tab === 'open' ? 'Open Support Disputes' : 'Resolved Support Ledgers'}
            </h3>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder="Search email, type, comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['EMPLOYEE', 'BOOKING CATEGORY', 'AMOUNT (₹)', tab === 'open' ? 'REJECTED DATE' : 'APPROVED DATE', 'REVIEWER COMMENT', 'GOVERNANCE LINK'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                      Loading support requests…
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Headphones size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                        {tab === 'open' ? 'No Open Support Tickets' : 'No Resolved Tickets'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        {tab === 'open' ? 'Rejected travel booking disputes will appear here.' : 'Approved bookings will appear here.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      {/* Employee */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={14} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                            {a.requester?.work_email ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #E5E7EB',
                            textTransform: 'uppercase',
                          }}
                        >
                          {a.booking_type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '16px 18px', fontSize: '14px', fontWeight: 900, color: '#111827' }}>
                        {a.amount ? `₹${a.amount.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Review Date */}
                      <td style={{ padding: '16px 18px', fontSize: '12.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Comment */}
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#4B5563', maxWidth: '240px' }}>
                        {a.comment ?? '—'}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 18px' }}>
                        <Link
                          href="/biz/approvals"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--accent, #E31E24)',
                            textDecoration: 'none',
                            background: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            padding: '4px 10px',
                            borderRadius: '8px',
                          }}
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
