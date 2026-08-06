'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { downloadExcel } from '@/lib/excel'
import { ReportTabs } from './ReportTabs'
import './reports.css'
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
  { key: 'flight', label: 'Flight Bookings', Icon: Plane },
  { key: 'flightpnr', label: 'Flight PNR Log', Icon: Ticket },
  { key: 'hotel', label: 'Hotel Stays', Icon: Hotel },
  { key: 'cab', label: 'Cab Services', Icon: Car },
  { key: 'bus', label: 'Bus Tickets', Icon: Bus },
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
    <div className="rp-page">
      <div className="reports-wrapper">
        {/* Left Date Filter Sidebar */}
        <aside className={`reports-sidebar ${showMobileSidebar ? 'reports-sidebar--mobile-open' : ''}`}>
          <div className="rp-sidebar-heading">
            <Calendar size={16} color="var(--accent, #E31E24)" /> REPORTING PERIOD
          </div>

          <div className="rp-presets-list">
            {presets.map((p) => (
              <label key={p.id} className="rp-preset-row">
                <input
                  type="radio"
                  name="period"
                  checked={preset === p.id && !customDate}
                  onChange={() => selectPreset(p)}
                  className="rp-preset-radio"
                />
                <span className={`rp-preset-label ${preset === p.id && !customDate ? 'rp-preset-label--selected' : ''}`}>{p.label}</span>
              </label>
            ))}

            <label className="rp-preset-row rp-preset-row--custom">
              <input
                type="radio"
                name="period"
                checked={customDate}
                onChange={() => setCustomDate(true)}
                className="rp-preset-radio"
              />
              <span className={`rp-preset-label ${customDate ? 'rp-preset-label--selected' : ''}`}>Custom Date Range</span>
            </label>

            {customDate && (
              <div className="rp-custom-box">
                <label className="rp-custom-field-label">From Date:</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
                <label className="rp-custom-field-label">To Date:</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="reports-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div className="rp-breadcrumb-row">
            <div className="rp-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="rp-breadcrumb-active">Reports & Travel Analytics</span>
            </div>

            <button onClick={() => setShowMobileSidebar((v) => !v)} className="btn-secondary mobile-sidebar-toggle">
              <Filter size={14} /> {showMobileSidebar ? 'Hide Periods' : 'Show Periods'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="rp-hero-glow" />

            <div className="rp-hero-content">
              <div className="rp-hero-left">
                <div className="rp-hero-icon">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h1 className="rp-hero-title">
                    Financial Travel Reports <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="rp-hero-subtitle">
                    Generate scheduled spend exports, GST tax statements, department allocations, and employee travel ledgers.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div className="rp-hero-metrics">
              <div>
                <div className="rp-metric-label">Period Spend</div>
                <div className="rp-metric-value-lg">
                  {loading ? '…' : fmt(data?.summary?.totalSpend ?? 0)}
                </div>
              </div>
              <div>
                <div className="rp-metric-label">Total Bookings</div>
                <div className="rp-metric-value-sm rp-metric-value-sm--bookings">
                  {loading ? '…' : `${data?.summary?.totalBookings ?? 0} Bookings`}
                </div>
              </div>
              <div>
                <div className="rp-metric-label">Avg Booking Value</div>
                <div className="rp-metric-value-sm rp-metric-value-sm--avg">
                  {loading ? '…' : `₹${Math.round(data?.summary?.avgBookingValue ?? 0).toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>
          </div>

          {/* Create & Schedule Custom Reports Box */}
          <div className="card-shell">
            <div className="rp-card-header-row">
              <FileSpreadsheet size={20} color="var(--accent, #E31E24)" />
              <h3 className="rp-card-title">Create & Schedule Custom Reports</h3>
            </div>

            <div className="rp-create-grid">
              {/* Card 1: Create New */}
              <div className="create-dashed-card">
                <div className="rp-dashed-icon">
                  <Plus size={22} />
                </div>
                <div className="rp-dashed-title">CREATE NEW REPORT</div>
                <span className="rp-dashed-sub">Build custom data field export</span>
              </div>

              {/* Card 2: What is custom report */}
              <div className="rp-info-card">
                <div className="rp-info-card-header">
                  <HelpCircle size={18} color="#2563EB" />
                  <div className="rp-info-card-title">What is a custom report?</div>
                </div>
                <ul className="rp-info-list">
                  <li>Export comprehensive travel booking ledgers.</li>
                  <li>Select specific data columns for effective corporate auditing.</li>
                </ul>
              </div>

              {/* Card 3: How to schedule */}
              <div className="rp-info-card">
                <div className="rp-info-card-header">
                  <Mail size={18} color="#10B981" />
                  <div className="rp-info-card-title">Scheduled Email Reports</div>
                </div>
                <ul className="rp-info-list">
                  <li>Specify daily, weekly, or monthly delivery schedules.</li>
                  <li>We will automatically email your finance team Excel ledgers!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Report Summary & Category Breakdown Table */}
          <div className="card-shell rp-table-card">
            <div className="rp-table-header">
              <div>
                <h3 className="rp-card-title">
                  Report Summary <span className="rp-period-label">({currentLabel})</span>
                </h3>
              </div>

              <button onClick={handleExcelDownload} disabled={!data} className="btn-primary">
                <Download size={15} /> Download All Excel Report
              </button>
            </div>

            <div className="rp-table-scroll">
              <table className="rp-table">
                <thead>
                  <tr className="rp-thead-row">
                    <th className="rp-th">
                      BOOKING CATEGORY
                    </th>
                    <th className="rp-th">
                      TOTAL BOOKINGS
                    </th>
                    <th className="rp-th">
                      TOTAL SPEND (₹)
                    </th>
                    <th className="rp-th">
                      OUT OF POLICY (%)
                    </th>
                    <th className="rp-th-icon"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="rp-loading-cell">
                        Loading summary metrics…
                      </td>
                    </tr>
                  ) : (
                    REPORT_TYPES.map((rt) => {
                      const count = getTypeCount(rt.key)
                      const spend = getTypeSpend(rt.key)
                      const IconComp = rt.Icon

                      return (
                        <tr key={rt.key} className="rp-tr">
                          <td className="rp-td">
                            <div className="rp-cat-row">
                              <div className={`rp-cat-icon rp-cat-icon--${rt.key}`}>
                                <IconComp size={18} />
                              </div>
                              <span className="rp-cat-label">{rt.label}</span>
                            </div>
                          </td>
                          <td className="rp-td-count">{count}</td>
                          <td className="rp-td-spend">{fmt(spend)}</td>
                          <td className="rp-td-oop">0.0%</td>
                          <td className="rp-td-download">
                            <button
                              onClick={handleExcelDownload}
                              disabled={!data}
                              className="rp-btn-download-icon"
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
