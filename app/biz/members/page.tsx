'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  Filter,
  Trash2,
  Shield,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  X,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  UserCheck,
  Crown,
  Tag,
} from 'lucide-react'

const ROLES = ['employee', 'manager', 'admin']
const STATUS_OPTIONS = ['Invited', 'Pending Verification', 'Disabled', 'Verified']

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterReporting, setFilterReporting] = useState('')
  const [filterDesignation, setFilterDesignation] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [csvPreview, setCsvPreview] = useState<string[]>([])
  const [csvUploading, setCsvUploading] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const csvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminFetch('/api/admin/biz/members')
      .then((d) => setMembers(d.members ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function changeRole(id: string, role: string) {
    try {
      await adminFetch(`/api/admin/biz/members/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    } catch (e: any) {
      alert(e.message || 'Failed to update role')
    }
  }

  async function removeMember(id: string, email: string) {
    if (!confirm(`Remove ${email} from the organisation?`)) return
    try {
      await adminFetch(`/api/admin/biz/members/${id}`, { method: 'DELETE' })
      setMembers((prev) => prev.filter((m) => m.id !== id))
      setSelected((prev) => {
        const s = new Set(prev)
        s.delete(id)
        return s
      })
    } catch (e: any) {
      alert(e.message || 'Failed to remove member')
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg('')
    try {
      await adminFetch('/api/admin/biz/members', {
        method: 'POST',
        body: JSON.stringify({ work_email: inviteEmail.trim(), role: 'employee' }),
      })
      setInviteMsg(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      adminFetch('/api/admin/biz/members').then((d) => setMembers(d.members ?? []))
    } catch (e: any) {
      setInviteMsg(e.message ?? 'Failed to send invitation')
    }
    setInviting(false)
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const emails: string[] = []
      for (const line of lines) {
        const first = line.split(',')[0].replace(/["']/g, '').trim().toLowerCase()
        if (first.includes('@') && first !== 'work_email' && first !== 'email') emails.push(first)
      }
      setCsvPreview(emails)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function confirmCsvUpload() {
    if (!csvPreview.length) return
    setCsvUploading(true)
    setInviteMsg('')
    try {
      const { added, total } = await adminFetch('/api/admin/biz/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ emails: csvPreview }),
      })
      setInviteMsg(`${added} of ${total} employees invited successfully.`)
      setCsvPreview([])
      adminFetch('/api/admin/biz/members').then((d) => setMembers(d.members ?? []))
    } catch (err: any) {
      setInviteMsg(err.message ?? 'Bulk invite failed')
    }
    setCsvUploading(false)
  }

  function resetAllFilters() {
    setSearch('')
    setFilterRole('')
    setFilterGroup('')
    setFilterReporting('')
    setFilterDesignation('')
    setFilterStatus([])
  }

  const groups = [...new Set(members.map((m) => m.dept).filter(Boolean))]
  const reportingTos = [...new Set(members.map((m) => m.reporting_to).filter(Boolean))]
  const designations = [...new Set(members.map((m) => m.designation).filter(Boolean))]

  const activeFiltersCount =
    (filterGroup ? 1 : 0) +
    (filterReporting ? 1 : 0) +
    (filterDesignation ? 1 : 0) +
    (filterRole ? 1 : 0) +
    filterStatus.length

  const filtered = members.filter((m) => {
    if (search && !m.work_email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole && m.role !== filterRole) return false
    if (filterGroup && m.dept !== filterGroup) return false
    if (filterReporting && m.reporting_to !== filterReporting) return false
    if (filterDesignation && m.designation !== filterDesignation) return false
    return true
  })

  const { slice: pageMembers, page, setPage, total } = usePagination(filtered, 25)

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })

  const toggleAll = () =>
    setSelected((prev) => (prev.size === pageMembers.length ? new Set() : new Set(pageMembers.map((m) => m.id))))

  const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    admin: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
    manager: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
    employee: { bg: '#ECFDF5', color: '#047857', border: '#6EE7B7' },
  }

  const verifiedCount = members.filter((m) => m.status !== 'invited').length
  const invitedCount = members.filter((m) => m.status === 'invited').length
  const adminCount = members.filter((m) => m.role === 'admin' || m.role === 'manager').length

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .members-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .filter-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.02);
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
        .filter-card-block {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .filter-card-block:hover {
          border-color: #D1D5DB;
          box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }
        .filter-label {
          fontSize: 12px;
          fontWeight: 800;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .filter-icon-badge {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .role-chip {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          color: #4B5563;
          transition: all 0.2s ease;
          text-align: center;
          user-select: none;
        }
        .role-chip.active {
          background: var(--accent, #E31E24);
          color: #ffffff;
          border-color: var(--accent, #E31E24);
          box-shadow: 0 4px 12px var(--accent, rgba(227, 30, 36, 0.25));
        }
        .main-content {
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
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
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
          padding: 10px 18px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .mobile-filter-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .members-wrapper {
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
          .main-content {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .main-content {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="members-wrapper">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          title="Directory Filters"
          icon={<SlidersHorizontal size={16} />}
          activeCount={activeFiltersCount}
          onReset={resetAllFilters}
          showMobile={showMobileFilters}
          activeTags={[
            ...(filterGroup ? [{ id: 'dept', label: `Dept: ${filterGroup}`, onRemove: () => setFilterGroup('') }] : []),
            ...(filterReporting ? [{ id: 'mgr', label: `Mgr: ${filterReporting}`, onRemove: () => setFilterReporting('') }] : []),
            ...(filterDesignation ? [{ id: 'desig', label: `Desig: ${filterDesignation}`, onRemove: () => setFilterDesignation('') }] : []),
            ...(filterRole ? [{ id: 'role', label: `Role: ${filterRole}`, onRemove: () => setFilterRole('') }] : []),
            ...filterStatus.map((st) => ({ id: `st-${st}`, label: `Status: ${st}`, onRemove: () => setFilterStatus((prev) => prev.filter((x) => x !== st)) })),
          ]}
        >
          {/* Filter Block 1: Group / Department */}
          <FilterSidebarBlock title="Department / Group" icon={<Building2 size={14} color="#2563EB" />}>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '12px', fontWeight: 600, color: '#111827' }}
            >
              <option value="">All Departments…</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FilterSidebarBlock>

          {/* Filter Block 2: Reporting Manager */}
          <FilterSidebarBlock title="Reporting Manager" icon={<UserCheck size={14} color="#16A34A" />}>
            <select
              value={filterReporting}
              onChange={(e) => setFilterReporting(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '12px', fontWeight: 600, color: '#111827' }}
            >
              <option value="">All Managers…</option>
              {reportingTos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FilterSidebarBlock>

          {/* Filter Block 3: Designation */}
          <FilterSidebarBlock title="Designation" icon={<Briefcase size={14} color="#EA580C" />}>
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '12px', fontWeight: 600, color: '#111827' }}
            >
              <option value="">All Designations…</option>
              {designations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FilterSidebarBlock>

          {/* Filter Block 4: Governance Role */}
          <FilterSidebarBlock title="Governance Role" icon={<Crown size={14} color="var(--accent, #E31E24)" />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div
                className={`role-chip ${filterRole === '' ? 'active' : ''}`}
                onClick={() => setFilterRole('')}
              >
                All Roles
              </div>
              {ROLES.map((r) => (
                <div
                  key={r}
                  className={`role-chip ${filterRole === r ? 'active' : ''}`}
                  onClick={() => setFilterRole(filterRole === r ? '' : r)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {r}
                </div>
              ))}
            </div>
          </FilterSidebarBlock>

          {/* Filter Block 5: Employee Status */}
          <FilterSidebarBlock title="Onboarding Status" icon={<CheckCircle2 size={14} color="#7C3AED" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STATUS_OPTIONS.map((s) => {
                const count = s === 'Verified' ? verifiedCount : s === 'Invited' ? invitedCount : 0
                const isChecked = filterStatus.includes(s)
                return (
                  <label
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isChecked ? '#FEF2F2' : '#F9FAFB',
                      border: isChecked ? '1px solid #FCA5A5' : '1px solid #F3F4F6',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setFilterStatus((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))
                        }
                        style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{s}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isChecked ? 'var(--accent, #E31E24)' : '#9CA3AF' }}>
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Area */}
        <main className="main-content">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Workforce & Directory</span>
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
                  <Users size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Workforce Management <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Invite employees, assign corporate travel roles, and structure departmental policy groups.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Employees</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{members.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Verified Team</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>{verifiedCount}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Pending Invites</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>{invitedCount}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Managers & Admins</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>{adminCount}</div>
              </div>
            </div>
          </div>

          {/* Add Employees / Invite Box */}
          <div className="card-shell">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserPlus size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Onboard & Invite Employees</h3>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Add individual work emails or upload bulk CSV employee directories</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Single Invite Form */}
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. employee@company.com"
                  type="email"
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button type="submit" disabled={inviting} className="btn-primary">
                  <UserPlus size={14} /> {inviting ? 'Inviting…' : 'Invite via EMAIL'}
                </button>
              </form>

              {/* Bulk CSV Upload */}
              <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvFile} />
              <button onClick={() => csvInputRef.current?.click()} className="btn-secondary">
                <FileSpreadsheet size={15} color="#10B981" /> Bulk Upload (CSV)
              </button>
            </div>

            {inviteMsg && (
              <div style={{ fontSize: '12.5px', color: '#047857', marginTop: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> {inviteMsg}
              </div>
            )}

            {/* CSV Preview Box */}
            {csvPreview.length > 0 && (
              <div style={{ marginTop: '14px', padding: '14px 16px', background: '#EFF6FF', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileSpreadsheet size={15} /> Found {csvPreview.length} employee email{csvPreview.length !== 1 ? 's' : ''} in CSV
                </div>
                <div style={{ maxHeight: '90px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {csvPreview.map((e) => (
                    <div key={e} style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                      • {e}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={confirmCsvUpload} disabled={csvUploading} className="btn-primary">
                    {csvUploading ? 'Inviting…' : `Confirm & Invite ${csvPreview.length} Employees`}
                  </button>
                  <button onClick={() => setCsvPreview([])} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Employee Directory Table Container */}
          <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Table Top Header Bar */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {loading ? 'Employees' : `Employees Directory (${filtered.length})`}
                </h3>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: '#7C3AED', color: '#ffffff', letterSpacing: '0.04em' }}>
                  LIVE
                </span>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, department..."
                  className="input-field"
                  style={{ paddingLeft: '36px', width: '100%', fontSize: '12.5px' }}
                />
              </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selected.size > 0 && (
              <div style={{ padding: '12px 24px', background: '#FFF7ED', borderBottom: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{selected.size} employee(s) selected</span>
                <button
                  style={{
                    fontSize: '12px',
                    color: '#DC2626',
                    fontWeight: 800,
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => {
                    if (confirm(`Remove ${selected.size} member(s) from your organisation?`))
                      selected.forEach((id) => {
                        const m = members.find((x) => x.id === id)
                        if (m) removeMember(id, m.work_email)
                      })
                  }}
                >
                  <Trash2 size={14} /> Remove Selected
                </button>
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ width: 40, padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selected.size === pageMembers.length && pageMembers.length > 0}
                        onChange={toggleAll}
                        style={{ accentColor: 'var(--accent, #E31E24)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </th>
                    {['EMPLOYEE', 'EMAIL', 'ROLE', 'GROUP / DEPT', 'JOINED DATE', 'ACTIONS'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                        Loading employees directory…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Users size={32} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Employee(s) found</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Try clearing filters or searching another keyword.</div>
                      </td>
                    </tr>
                  ) : (
                    pageMembers.map((m) => {
                      const rc = ROLE_COLORS[m.role] ?? { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' }
                      const initials = (m.work_email ?? '?')[0].toUpperCase()
                      const isSelected = selected.has(m.id)

                      return (
                        <tr
                          key={m.id}
                          style={{
                            borderTop: '1px solid #F3F4F6',
                            background: isSelected ? '#FEF2F2' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(m.id)}
                              style={{ accentColor: 'var(--accent, #E31E24)', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13.5px',
                                  fontWeight: 900,
                                  flexShrink: 0,
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>
                                  {m.work_email?.split('@')[0] ?? '—'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                  {m.status === 'invited' ? 'Pending Acceptance' : 'Active Employee'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', color: '#4B5563', fontWeight: 500 }}>{m.work_email}</td>
                          <td style={{ padding: '14px' }}>
                            <select
                              value={m.role}
                              onChange={(e) => changeRole(m.id, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${rc.border}`,
                                fontSize: '12px',
                                fontWeight: 800,
                                color: rc.color,
                                background: rc.bg,
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>{m.dept || 'Unassigned'}</td>
                          <td style={{ padding: '14px', fontSize: '12.5px', color: '#6B7280' }}>
                            {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <button
                              onClick={() => removeMember(m.id, m.work_email)}
                              style={{
                                fontSize: '12.5px',
                                color: '#DC2626',
                                fontWeight: 700,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <Pagination total={total} page={page} perPage={25} onPage={setPage} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
