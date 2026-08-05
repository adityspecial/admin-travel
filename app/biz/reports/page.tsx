'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { downloadExcel } from '@/lib/excel'
import { ReportTabs } from './ReportTabs'
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Plus,
  HelpCircle,
  Mail,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  RotateCcw,
  Plane,
  Ticket,
  Hotel,
  Car,
  Bus,
  FileText,
} from 'lucide-react'

interface ReportData {
  summary: { totalSpend: number; totalBookings: number; pendingCount: number; rejectedCount: number; avgBookingValue: number }
  gst: { totalWithGst: number; baseAmount: number; gstAmount: number; gstRate: string }
  byDept: { dept: string; count: number; spend: number }[]
  byType: { booking_type: string; count: number; spend: number }[]
  byEmployee: { email: string; count: number; spend: number }[]
  byCostCenter: { name: string; code: string; count: number; spend: number }[]
  monthly: { month: string; count: number; spend: number }[]
  dateRange: { from: string; to: string }
}

function fmt(n: number) {
  if (n === 0) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} Lakhs`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${n.toLocaleString('en-IN')}`
}

const now = new Date()
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getPresets() {
  const y = now.getFullYear()
  const m = now.getMonth()
  const presets: { label: string; from: string; to: string; id: string }[] = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(y, m - i, 1)
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`
    presets.push({ label, from, to, id: label })
  }
  const qm = Math.floor(m / 3) * 3
  const qLabel = `QTR ${Math.floor(m / 3) + 1} (${MONTHS[qm]}-${MONTHS[qm + 2 < 12 ? qm + 2 : 11]})`
  presets.push({ label: qLabel, from: `${y}-${String(qm + 1).padStart(2, '0')}-01`, to: now.toISOString().slice(0, 10), id: 'qtr' })
  return presets
}

const REPORT_TYPES = [
  { key: 'flight', label: 'Flight Bookings', Icon: Plane, color: '#2563EB', bg: '#EFF6FF' },
  { key: 'flightpnr', label: 'Flight PNR Log', Icon: Ticket, color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'hotel', label: 'Hotel Stays', Icon: Hotel, color: '#047857', bg: '#ECFDF5' },
  { key: 'cab', label: 'Cab Services', Icon: Car, color: '#D97706', bg: '#FFFBEB' },
  { key: 'bus', label: 'Bus Tickets', Icon: Bus, color: '#DC2626', bg: '#FEF2F2' },
]

export default function ReportsPage() {
  const presets = getPresets()
  const defaultPreset = presets.find((p) => p.id === 'qtr') ?? presets[0]

  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [from, setFrom] = useState(defaultPreset.from)
  const [to, setTo] = useState(defaultPreset.to)
  const [preset, setPreset] = useState(defaultPreset.id)
  const [customDate, setCustomDate] = useState(false)
  const [tab, setTab] = useState<'overview' | 'dept' | 'employee' | 'gst' | 'cost-center'>('overview')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    load()
  }, [from, to])

  function load() {
    setLoading(true)
    setLoadErr('')
    adminFetch(`/api/admin/biz/reports?from=${from}&to=${to}`)
      .then(setData)
      .catch((e: any) => setLoadErr(e.message ?? 'Failed to load report'))
      .finally(() => setLoading(false))
  }

  function selectPreset(p: { label: string; from: string; to: string; id: string }) {
    setPreset(p.id)
    setFrom(p.from)
    setTo(p.to)
    setCustomDate(false)
  }

  function getTypeCount(key: string) {
    if (key === 'flightpnr') key = 'flight'
    return data?.byType.find((t) => t.booking_type === key)?.count ?? 0
  }

  function getTypeSpend(key: string) {
    if (key === 'flightpnr') key = 'flight'
    return data?.byType.find((t) => t.booking_type === key)?.spend ?? 0
  }

  function handleExcelDownload() {
    if (!data) return
    const s = data.summary
    downloadExcel(`AirDunia-BizReport-${from}-to-${to}`, [
      {
        name: 'Summary',
        headers: ['Metric', 'Value'],
        rows: [
          ['Period', `${from} to ${to}`],
          ['Total Spend (₹)', s.totalSpend],
          ['Total Bookings', s.totalBookings],
          ['Avg Booking Value (₹)', s.avgBookingValue],
          ['Pending Approvals', s.pendingCount],
          ['Rejected', s.rejectedCount],
        ],
      },
      { name: 'By Type', headers: ['Type', 'Bookings', 'Spend (₹)'], rows: data.byType.map((t) => [t.booking_type, t.count, t.spend]) },
      { name: 'By Department', headers: ['Dept', 'Bookings', 'Spend (₹)'], rows: data.byDept.map((d) => [d.dept ?? 'Unassigned', d.count, d.spend]) },
      { name: 'By Employee', headers: ['Email', 'Bookings', 'Spend (₹)'], rows: data.byEmployee.map((e) => [e.email, e.count, e.spend]) },
    ])
  }

  const currentLabel = presets.find((p) => p.id === preset)?.label ?? 'Custom Date Range'

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .reports-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .reports-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
          padding: 24px 20px;
          overflow-y: auto;
          position: sticky;
          top: 54px;
          height: calc(100vh - 54px);
        }
        .reports-main {
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
        .input-field {
          padding: 8px 12px;
          border-radius: 8px;
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
        .create-dashed-card {
          border: 2px dashed #D1D5DB;
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: #FAFAFA;
        }
        .create-dashed-card:hover {
          border-color: var(--accent, #E31E24);
          background: #FEF2F2;
        }
        .mobile-sidebar-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .reports-wrapper {
            flex-direction: column;
          }
          .reports-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #E5E7EB;
            display: ${showMobileSidebar ? 'block' : 'none'};
          }
          .mobile-sidebar-toggle {
            display: inline-flex;
          }
          .reports-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .reports-main {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="reports-wrapper">
        {/* Left Date Filter Sidebar */}
        <aside className="reports-sidebar">
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', letterSpacing: '0.06em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--accent, #E31E24)" /> REPORTING PERIOD
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {presets.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="period"
                  checked={preset === p.id && !customDate}
                  onChange={() => selectPreset(p)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: preset === p.id && !customDate ? 700 : 500 }}>{p.label}</span>
              </label>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
              <input
                type="radio"
                name="period"
                checked={customDate}
                onChange={() => setCustomDate(true)}
                style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: customDate ? 700 : 500 }}>Custom Date Range</span>
            </label>

            {customDate && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>From Date:</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>To Date:</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="reports-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Reports & Travel Analytics</span>
            </div>

            <button onClick={() => setShowMobileSidebar((v) => !v)} className="btn-secondary mobile-sidebar-toggle">
              <Filter size={14} /> {showMobileSidebar ? 'Hide Periods' : 'Show Periods'}
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
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Financial Travel Reports <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Generate scheduled spend exports, GST tax statements, department allocations, and employee travel ledgers.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Period Spend</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                  {loading ? '…' : fmt(data?.summary?.totalSpend ?? 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Bookings</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  {loading ? '…' : `${data?.summary?.totalBookings ?? 0} Bookings`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Avg Booking Value</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                  {loading ? '…' : `₹${Math.round(data?.summary?.avgBookingValue ?? 0).toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>
          </div>

          {/* Create & Schedule Custom Reports Box */}
          <div className="card-shell">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <FileSpreadsheet size={20} color="var(--accent, #E31E24)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Create & Schedule Custom Reports</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Card 1: Create New */}
              <div className="create-dashed-card">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#FEF2F2',
                    color: 'var(--accent, #E31E24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <Plus size={22} />
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--accent, #E31E24)' }}>CREATE NEW REPORT</div>
                <span style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>Build custom data field export</span>
              </div>

              {/* Card 2: What is custom report */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '14px', padding: '18px', background: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <HelpCircle size={18} color="#2563EB" />
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>What is a custom report?</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
                  <li>Export comprehensive travel booking ledgers.</li>
                  <li>Select specific data columns for effective corporate auditing.</li>
                </ul>
              </div>

              {/* Card 3: How to schedule */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '14px', padding: '18px', background: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Mail size={18} color="#10B981" />
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>Scheduled Email Reports</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
                  <li>Specify daily, weekly, or monthly delivery schedules.</li>
                  <li>We will automatically email your finance team Excel ledgers!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Report Summary & Category Breakdown Table */}
          <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Report Summary <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>({currentLabel})</span>
                </h3>
              </div>

              <button onClick={handleExcelDownload} disabled={!data} className="btn-primary">
                <Download size={15} /> Download All Excel Report
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      BOOKING CATEGORY
                    </th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      TOTAL BOOKINGS
                    </th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      TOTAL SPEND (₹)
                    </th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      OUT OF POLICY (%)
                    </th>
                    <th style={{ width: 48, padding: '14px 20px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                        Loading summary metrics…
                      </td>
                    </tr>
                  ) : (
                    REPORT_TYPES.map((rt) => {
                      const count = getTypeCount(rt.key)
                      const spend = getTypeSpend(rt.key)
                      const IconComp = rt.Icon

                      return (
                        <tr key={rt.key} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: rt.bg, color: rt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconComp size={18} />
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{rt.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 800, color: '#111827' }}>{count}</td>
                          <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 900, color: '#111827' }}>{fmt(spend)}</td>
                          <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>0.0%</td>
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <button
                              onClick={handleExcelDownload}
                              disabled={!data}
                              style={{ border: 'none', background: 'transparent', color: 'var(--accent, #E31E24)', cursor: 'pointer', padding: '4px' }}
                              title="Download Category Report"
                            >
                              <Download size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Breakdown Tabs */}
          <ReportTabs data={data} tab={tab} setTab={setTab} loading={loading} />
        </main>
      </div>
    </div>
  )
}
