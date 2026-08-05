'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { generateInvoicePDF } from '@/lib/invoicePDF'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
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
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .invoices-wrapper {
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
        .invoices-main {
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
          padding: 24px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .input-field {
          padding: 9px 14px;
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
        .mobile-filter-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .invoices-wrapper {
            flex-direction: column;
          }
          .mobile-filter-toggle {
            display: inline-flex;
          }
          .invoices-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .invoices-main {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

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
              <label key={p.from} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="bdr"
                  checked={datePreset === p.label}
                  onChange={() => setDatePreset(p.label)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: datePreset === p.label ? 700 : 500 }}>{p.label}</span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="bdr"
                checked={datePreset === 'qtr'}
                onChange={() => setDatePreset('qtr')}
                style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: datePreset === 'qtr' ? 700 : 500 }}>{QTR_LABEL}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="bdr"
                checked={datePreset === 'custom'}
                onChange={() => setDatePreset('custom')}
                style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: datePreset === 'custom' ? 700 : 500 }}>Enter Custom Dates</span>
            </label>
          </FilterSidebarBlock>

          {/* MMT Invoice Date Range */}
          <FilterSidebarBlock title="MMT Invoice Date Range">
            {MONTHS_NOW.map((p) => (
              <label key={p.from} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mmt"
                  checked={mmtPreset === p.label}
                  onChange={() => setMmtPreset(p.label)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: mmtPreset === p.label ? 700 : 500 }}>{p.label}</span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="mmt"
                checked={mmtPreset === 'qtr'}
                onChange={() => setMmtPreset('qtr')}
                style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: mmtPreset === 'qtr' ? 700 : 500 }}>{QTR_LABEL}</span>
            </label>
          </FilterSidebarBlock>

          {/* Invoice Type */}
          <FilterSidebarBlock title="Invoice Type">
            {INVOICE_TYPES.map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={invoiceType.includes(t)}
                  onChange={(e) => setInvoiceType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Trip Type */}
          <FilterSidebarBlock title="Trip Type Category">
            {TRIP_TYPES.map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tripType.includes(t)}
                  onChange={(e) => setTripType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Workspace */}
        <main className="invoices-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Invoices & GST Reconciliation</span>
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
                  <Receipt size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Corporate GST Invoices & Billing <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Download official tax invoices, air ticket vouchers, and consolidated quarterly billing statements.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Approved Invoices</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                  {loading ? '…' : `${approvals.length} Invoices`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Primary GSTIN</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34D399', marginTop: '2px', fontFamily: 'monospace' }}>
                  {gstin || '27AAACA0000A1Z5'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Tax Entity</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                  {orgName || 'AirDunia Corporate Ltd'}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Folders & Automailer Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Invoice Folders */}
            <div className="card-shell">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FolderCheck size={20} color="var(--accent, #E31E24)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>Invoice Folders</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 14px' }}>Download a zip bundle of related invoices in a single click.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {folders.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--accent, #E31E24)',
                    }}
                  >
                    {f.label}
                    <button
                      onClick={() => setFolders((prev) => prev.filter((x) => x.id !== f.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '14px', padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Automailer Toggle */}
            <div className="card-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setAutomailer((a) => !a)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '99px',
                      border: 'none',
                      cursor: 'pointer',
                      background: automailer ? 'var(--accent, #E31E24)' : '#D1D5DB',
                      position: 'relative',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: automailer ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Enable Automailer</span>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Automatically receive monthly tax invoice bundles via email.</p>
                  </div>
                </div>
                <button style={{ fontSize: '12.5px', color: '#2563EB', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mailer Settings
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table Card */}
          <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>GST Invoices Ledger</h3>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Booking ID / Ref..."
                    className="input-field"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>

                <button disabled className="btn-primary" style={{ opacity: 0.8 }}>
                  <Download size={15} /> Download Selected
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ width: 40, padding: '14px 16px' }}>
                      <input type="checkbox" style={{ accentColor: 'var(--accent, #E31E24)' }} />
                    </th>
                    {['BOOKING ID', 'EMPLOYEE / ISSUER', 'INVOICE ACTION', 'AMOUNT (₹)', 'TRAVEL DATE', 'COMPANY GSTIN'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '14px 14px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                        Loading GST invoices…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Receipt size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Invoices Found</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Try adjusting your date range or invoice type filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const fd = a.flight_data
                      const hd = a.hotel_data
                      const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                      const amount = a.amount ?? 0

                      return (
                        <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--accent, #E31E24)' }} />
                          </td>

                          {/* Booking ID */}
                          <td style={{ padding: '14px 14px', fontSize: '13px', fontWeight: 800, color: '#2563EB' }}>
                            {a.booking_ref ?? a.id.slice(0, 14) + '…'}
                          </td>

                          {/* Issuer */}
                          <td style={{ padding: '14px 14px', fontSize: '13px', color: '#374151' }}>
                            {a.requester?.work_email ?? '—'}
                          </td>

                          {/* Invoice Create PDF Action */}
                          <td style={{ padding: '14px 14px' }}>
                            <button
                              onClick={() => generateInvoicePDF(a, gstin, orgName, orgLogo)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                borderRadius: '8px',
                                background: '#FEF2F2',
                                color: 'var(--accent, #E31E24)',
                                border: '1px solid #FCA5A5',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <FileText size={13} /> Create PDF
                            </button>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '14px 14px', fontSize: '13.5px', fontWeight: 900, color: '#111827' }}>
                            {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                          </td>

                          {/* Travel Date */}
                          <td style={{ padding: '14px 14px', fontSize: '12.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                            {travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* GSTIN */}
                          <td style={{ padding: '14px 14px' }}>
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
