'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { generateInvoicePDF } from '@/lib/invoicePDF'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import './invoices.css'
import {
  Receipt,
  FileText,
  Download,
  Sparkles,
  ChevronRight,
  Filter,
  RotateCcw,
  FolderCheck,
  Mail,
  Building2,
  Search,
  CheckCircle2,
  Zap,
  Tag,
  X,
  FileCheck,
} from 'lucide-react'

const MONTHS_NOW = (() => {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(y, m - i, 1)
    return { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
  })
})()

const QTR_LABEL = (() => {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const qm = Math.floor(m / 3) * 3
  return `QTR ${Math.floor(m / 3) + 1} (${MONTHS[qm]}-${MONTHS[qm + 2 < 12 ? qm + 2 : 11]})`
})()

const INVOICE_TYPES = ['MakeMyTrip Invoice', 'Vendor (GST) Invoice', 'E-ticket/Voucher']
const TRIP_TYPES = ['Flights', 'Hotels', 'Cabs', 'Bus', 'Train', 'Meals']

export default function InvoicesPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gstin, setGstin] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgLogo, setOrgLogo] = useState('')
  const [search, setSearch] = useState('')
  const [automailer, setAutomailer] = useState(false)
  const [datePreset, setDatePreset] = useState('qtr')
  const [mmtPreset, setMmtPreset] = useState('')
  const [invoiceType, setInvoiceType] = useState<string[]>([])
  const [tripType, setTripType] = useState<string[]>([])
  const [folders, setFolders] = useState([{ id: 'qtr', label: `BDR: ${QTR_LABEL}` }])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/approvals?status=approved'),
      adminFetch('/api/admin/biz/identifiers'),
      adminFetch('/api/admin/biz/policy'),
    ])
      .then(([appData, idData, policyData]) => {
        setApprovals(appData.approvals ?? [])
        const ids: any[] = idData.identifiers ?? []
        const hq = ids.find((x: any) => x.is_hq) ?? ids[0] ?? null
        setGstin(hq?.number ?? '')
        setOrgName(policyData.policy?.name ?? '')
        setOrgLogo(policyData.policy?.logo_url ?? '')
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const filtered = approvals.filter((a) => {
    if (!a.booking_ref && !search) return true
    if (search) return (a.booking_ref ?? '').toLowerCase().includes(search.toLowerCase()) || (a.id ?? '').toLowerCase().includes(search.toLowerCase())
    if (tripType.length > 0) return tripType.map((t) => t.toLowerCase()).includes(a.booking_type?.toLowerCase())
    return true
  })

  function resetFilters() {
    setDatePreset('qtr')
    setMmtPreset('')
    setInvoiceType([])
    setTripType([])
    setSearch('')
  }

  const activeFiltersCount =
    (datePreset !== 'qtr' ? 1 : 0) + (mmtPreset ? 1 : 0) + invoiceType.length + tripType.length

  return (
    <div className="inv-page">
      <div className="invoices-wrapper">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          title="Invoice Filters"
          icon={<Filter size={16} />}
          activeCount={activeFiltersCount}
          onReset={resetFilters}
          showMobile={showMobileFilters}
          activeTags={[
            ...(datePreset !== 'qtr' ? [{ id: 'bdr', label: `BDR: ${datePreset}`, onRemove: () => setDatePreset('qtr') }] : []),
            ...(mmtPreset ? [{ id: 'mmt', label: `MMT: ${mmtPreset}`, onRemove: () => setMmtPreset('') }] : []),
            ...invoiceType.map((t) => ({ id: `inv-${t}`, label: `Type: ${t}`, onRemove: () => setInvoiceType((prev) => prev.filter((x) => x !== t)) })),
            ...tripType.map((t) => ({ id: `trip-${t}`, label: `Cat: ${t}`, onRemove: () => setTripType((prev) => prev.filter((x) => x !== t)) })),
          ]}
        >
          {/* Booking Date Range */}
          <FilterSidebarBlock title="Booking Date Range">
            {MONTHS_NOW.map((p) => (
              <label key={p.from} className="inv-radio-row">
                <input
                  type="radio"
                  name="bdr"
                  checked={datePreset === p.label}
                  onChange={() => setDatePreset(p.label)}
                  className="inv-radio"
                />
                <span className={`inv-radio-label ${datePreset === p.label ? 'inv-radio-label--selected' : ''}`}>{p.label}</span>
              </label>
            ))}
            <label className="inv-radio-row">
              <input
                type="radio"
                name="bdr"
                checked={datePreset === 'qtr'}
                onChange={() => setDatePreset('qtr')}
                className="inv-radio"
              />
              <span className={`inv-radio-label ${datePreset === 'qtr' ? 'inv-radio-label--selected' : ''}`}>{QTR_LABEL}</span>
            </label>
            <label className="inv-radio-row inv-radio-row--last">
              <input
                type="radio"
                name="bdr"
                checked={datePreset === 'custom'}
                onChange={() => setDatePreset('custom')}
                className="inv-radio"
              />
              <span className={`inv-radio-label ${datePreset === 'custom' ? 'inv-radio-label--selected' : ''}`}>Enter Custom Dates</span>
            </label>
          </FilterSidebarBlock>

          {/* MMT Invoice Date Range */}
          <FilterSidebarBlock title="MMT Invoice Date Range">
            {MONTHS_NOW.map((p) => (
              <label key={p.from} className="inv-radio-row">
                <input
                  type="radio"
                  name="mmt"
                  checked={mmtPreset === p.label}
                  onChange={() => setMmtPreset(p.label)}
                  className="inv-radio"
                />
                <span className={`inv-radio-label ${mmtPreset === p.label ? 'inv-radio-label--selected' : ''}`}>{p.label}</span>
              </label>
            ))}
            <label className="inv-radio-row">
              <input
                type="radio"
                name="mmt"
                checked={mmtPreset === 'qtr'}
                onChange={() => setMmtPreset('qtr')}
                className="inv-radio"
              />
              <span className={`inv-radio-label ${mmtPreset === 'qtr' ? 'inv-radio-label--selected' : ''}`}>{QTR_LABEL}</span>
            </label>
          </FilterSidebarBlock>

          {/* Invoice Type */}
          <FilterSidebarBlock title="Invoice Type">
            {INVOICE_TYPES.map((t) => (
              <label key={t} className="inv-radio-row">
                <input
                  type="checkbox"
                  checked={invoiceType.includes(t)}
                  onChange={(e) => setInvoiceType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  className="inv-radio"
                />
                <span className="inv-radio-label">{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Trip Type */}
          <FilterSidebarBlock title="Trip Type Category">
            {TRIP_TYPES.map((t) => (
              <label key={t} className="inv-radio-row">
                <input
                  type="checkbox"
                  checked={tripType.includes(t)}
                  onChange={(e) => setTripType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  className="inv-radio"
                />
                <span className="inv-radio-label">{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Workspace */}
        <main className="invoices-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div className="inv-breadcrumb-row">
            <div className="inv-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="inv-breadcrumb-active">Corporate Invoices & GST Reconciliation</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="inv-hero-glow" />

            <div className="inv-hero-content">
              <div className="inv-hero-left">
                <div className="inv-hero-icon">
                  <Receipt size={28} />
                </div>
                <div>
                  <h1 className="inv-hero-title">
                    Corporate GST Invoices & Billing <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="inv-hero-subtitle">
                    Download official tax invoices, air ticket vouchers, and consolidated quarterly billing statements.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div className="inv-hero-metrics">
              <div>
                <div className="inv-metric-label">Approved Invoices</div>
                <div className="inv-metric-value-lg">
                  {loading ? '…' : `${approvals.length} Invoices`}
                </div>
              </div>
              <div>
                <div className="inv-metric-label">Primary GSTIN</div>
                <div className="inv-metric-value-sm inv-metric-value-sm--gstin">
                  {gstin || '27AAACA0000A1Z5'}
                </div>
              </div>
              <div>
                <div className="inv-metric-label">Tax Entity</div>
                <div className="inv-metric-value-sm inv-metric-value-sm--org">
                  {orgName || 'AirDunia Corporate Ltd'}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Folders & Automailer Grid */}
          <div className="inv-grid-2col">
            {/* Invoice Folders */}
            <div className="card-shell">
              <div className="inv-card-header-row">
                <FolderCheck size={20} color="var(--accent, #E31E24)" />
                <h3 className="inv-card-title">Invoice Folders</h3>
              </div>
              <p className="inv-card-desc">Download a zip bundle of related invoices in a single click.</p>
              <div className="inv-folder-chips">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    className="inv-folder-chip"
                  >
                    {f.label}
                    <button
                      onClick={() => setFolders((prev) => prev.filter((x) => x.id !== f.id))}
                      className="inv-chip-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Automailer Toggle */}
            <div className="card-shell inv-automailer-card">
              <div className="inv-automailer-row">
                <div className="inv-automailer-left">
                  <button
                    onClick={() => setAutomailer((a) => !a)}
                    className={`inv-toggle ${automailer ? 'inv-toggle--on' : ''}`}
                  >
                    <div
                      className={`inv-toggle-knob ${automailer ? 'inv-toggle-knob--on' : ''}`}
                    />
                  </button>
                  <div>
                    <span className="inv-automailer-label">Enable Automailer</span>
                    <p className="inv-automailer-desc">Automatically receive monthly tax invoice bundles via email.</p>
                  </div>
                </div>
                <button className="inv-mailer-settings-btn">
                  Mailer Settings
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table Card */}
          <div className="card-shell inv-table-card">
            <div className="inv-table-header">
              <div>
                <h3 className="inv-card-title">GST Invoices Ledger</h3>
              </div>

              <div className="inv-table-header-actions">
                {/* Search Bar */}
                <div className="inv-search-wrap">
                  <Search size={15} color="#9CA3AF" className="inv-search-icon" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Booking ID / Ref..."
                    className="input-field inv-search-input"
                  />
                </div>

                <button disabled className="btn-primary inv-btn-download">
                  <Download size={15} /> Download Selected
                </button>
              </div>
            </div>

            <div className="inv-table-scroll">
              <table className="inv-table">
                <thead>
                  <tr className="inv-thead-row">
                    <th className="inv-th-checkbox">
                      <input type="checkbox" className="inv-checkbox" />
                    </th>
                    {['BOOKING ID', 'EMPLOYEE / ISSUER', 'INVOICE ACTION', 'AMOUNT (₹)', 'TRAVEL DATE', 'COMPANY GSTIN'].map((h) => (
                      <th key={h} className="inv-th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="inv-loading-cell">
                        Loading GST invoices…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="inv-empty-cell">
                        <Receipt size={36} color="#9CA3AF" className="inv-empty-icon" />
                        <div className="inv-empty-title">No Invoices Found</div>
                        <div className="inv-empty-sub">Try adjusting your date range or invoice type filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const fd = a.flight_data
                      const hd = a.hotel_data
                      const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                      const amount = a.amount ?? 0

                      return (
                        <tr key={a.id} className="inv-tr">
                          <td className="inv-td-checkbox">
                            <input type="checkbox" className="inv-checkbox" />
                          </td>

                          {/* Booking ID */}
                          <td className="inv-td-bookingid">
                            {a.booking_ref ?? a.id.slice(0, 14) + '…'}
                          </td>

                          {/* Issuer */}
                          <td className="inv-td-issuer">
                            {a.requester?.work_email ?? '—'}
                          </td>

                          {/* Invoice Create PDF Action */}
                          <td className="inv-td">
                            <button
                              onClick={() => generateInvoicePDF(a, gstin, orgName, orgLogo)}
                              className="inv-btn-createpdf"
                            >
                              <FileText size={13} /> Create PDF
                            </button>
                          </td>

                          {/* Amount */}
                          <td className="inv-td-amount">
                            {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                          </td>

                          {/* Travel Date */}
                          <td className="inv-td-date">
                            {travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* GSTIN */}
                          <td className="inv-td">
                            <span
                              className="inv-gstin-badge"
                            >
                              {gstin || '—'}
                            </span>
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
