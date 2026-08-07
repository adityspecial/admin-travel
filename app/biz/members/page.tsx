'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import './members.css'
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

  const verifiedCount = members.filter((m) => m.status !== 'invited').length
  const invitedCount = members.filter((m) => m.status === 'invited').length
  const adminCount = members.filter((m) => m.role === 'admin' || m.role === 'manager').length

  return (
    <div className="mem-page">
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
              className="input-field mem-filter-select"
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
              className="input-field mem-filter-select"
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
              className="input-field mem-filter-select"
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
            <div className="mem-role-chip-grid">
              <div
                className={`role-chip ${filterRole === '' ? 'active' : ''}`}
                onClick={() => setFilterRole('')}
              >
                All Roles
              </div>
              {ROLES.map((r) => (
                <div
                  key={r}
                  className={`role-chip mem-role-chip-capitalize ${filterRole === r ? 'active' : ''}`}
                  onClick={() => setFilterRole(filterRole === r ? '' : r)}
                >
                  {r}
                </div>
              ))}
            </div>
          </FilterSidebarBlock>

          {/* Filter Block 5: Employee Status */}
          <FilterSidebarBlock title="Onboarding Status" icon={<CheckCircle2 size={14} color="#7C3AED" />}>
            <div className="mem-status-list">
              {STATUS_OPTIONS.map((s) => {
                const count = s === 'Verified' ? verifiedCount : s === 'Invited' ? invitedCount : 0
                const isChecked = filterStatus.includes(s)
                return (
                  <label
                    key={s}
                    className={`mem-status-option ${isChecked ? 'mem-status-option--checked' : ''}`}
                  >
                    <div className="mem-status-option-left">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setFilterStatus((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))
                        }
                        className="mem-status-checkbox"
                      />
                      <span className="mem-status-label">{s}</span>
                    </div>
                    <span className={`mem-status-count ${isChecked ? 'mem-status-count--checked' : ''}`}>
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
          <div className="mem-breadcrumb-row">
            <div className="mem-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="mem-breadcrumb-active">Workforce & Directory</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="mem-hero-glow" />

            <div className="mem-hero-content">
              <div className="mem-hero-left">
                <div className="mem-hero-icon">
                  <Users size={28} />
                </div>
                <div>
                  <h1 className="mem-hero-title">
                    Workforce Management <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="mem-hero-subtitle">
                    Invite employees, assign corporate travel roles, and structure departmental policy groups.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar Inside Hero */}
            <div className="mem-hero-metrics">
              <div>
                <div className="mem-metric-label">Total Employees</div>
                <div className="mem-metric-value mem-metric-value--total">{members.length}</div>
              </div>
              <div>
                <div className="mem-metric-label">Verified Team</div>
                <div className="mem-metric-value mem-metric-value--verified">{verifiedCount}</div>
              </div>
              <div>
                <div className="mem-metric-label">Pending Invites</div>
                <div className="mem-metric-value mem-metric-value--pending">{invitedCount}</div>
              </div>
              <div>
                <div className="mem-metric-label">Managers & Admins</div>
                <div className="mem-metric-value mem-metric-value--admins">{adminCount}</div>
              </div>
            </div>
          </div>

          {/* Add Employees / Invite Box */}
          <div className="card-shell">
            <div className="mem-form-header">
              <div className="mem-form-icon">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="mem-card-title">Onboard & Invite Employees</h3>
                <span className="mem-card-subtitle">Add individual work emails or upload bulk CSV employee directories</span>
              </div>
            </div>

            <div className="mem-invite-row">
              {/* Single Invite Form */}
              <form onSubmit={handleInvite} className="mem-invite-form">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. employee@company.com"
                  type="email"
                  className="input-field mem-invite-input"
                />
                <button type="submit" disabled={inviting} className="btn-primary">
                  <UserPlus size={14} /> {inviting ? 'Inviting…' : 'Invite via EMAIL'}
                </button>
              </form>

              {/* Bulk CSV Upload */}
              <input ref={csvInputRef} type="file" accept=".csv" className="mem-hidden-input" onChange={handleCsvFile} />
              <button onClick={() => csvInputRef.current?.click()} className="btn-secondary">
                <FileSpreadsheet size={15} color="#10B981" /> Bulk Upload (CSV)
              </button>
            </div>

            {inviteMsg && (
              <div className="mem-invite-msg">
                <CheckCircle2 size={15} /> {inviteMsg}
              </div>
            )}

            {/* CSV Preview Box */}
            {csvPreview.length > 0 && (
              <div className="mem-csv-preview">
                <div className="mem-csv-preview-title">
                  <FileSpreadsheet size={15} /> Found {csvPreview.length} employee email{csvPreview.length !== 1 ? 's' : ''} in CSV
                </div>
                <div className="mem-csv-list">
                  {csvPreview.map((e) => (
                    <div key={e} className="mem-csv-item">
                      • {e}
                    </div>
                  ))}
                </div>
                <div className="mem-csv-actions">
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
          <div className="card-shell mem-table-card">
            {/* Table Top Header Bar */}
            <div className="mem-table-header">
              <div className="mem-table-header-left">
                <h3 className="mem-card-title">
                  {loading ? 'Employees' : `Employees Directory (${filtered.length})`}
                </h3>
                <span className="mem-live-badge">
                  LIVE
                </span>
              </div>

              {/* Search Bar */}
              <div className="mem-search-wrap">
                <Search size={15} color="#9CA3AF" className="mem-search-icon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, department..."
                  className="input-field mem-search-input"
                />
              </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selected.size > 0 && (
              <div className="mem-bulk-bar">
                <span className="mem-bulk-text">{selected.size} employee(s) selected</span>
                <button
                  className="mem-btn-bulk-remove"
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
            <div className="mem-table-scroll">
              <table className="mem-table">
                <thead>
                  <tr className="mem-thead-row">
                    <th className="mem-th-checkbox">
                      <input
                        type="checkbox"
                        checked={selected.size === pageMembers.length && pageMembers.length > 0}
                        onChange={toggleAll}
                        className="mem-checkbox"
                      />
                    </th>
                    {['EMPLOYEE', 'EMAIL', 'ROLE', 'GROUP / DEPT', 'JOINED DATE', 'ACTIONS'].map((h) => (
                      <th key={h} className="mem-th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="mem-loading-cell">
                        Loading employees directory…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="mem-empty-cell">
                        <Users size={32} color="#9CA3AF" className="mem-empty-icon" />
                        <div className="mem-empty-title">No Employee(s) found</div>
                        <div className="mem-empty-sub">Try clearing filters or searching another keyword.</div>
                      </td>
                    </tr>
                  ) : (
                    pageMembers.map((m) => {
                      const initials = (m.work_email ?? '?')[0].toUpperCase()
                      const isSelected = selected.has(m.id)
                      const roleClass = m.role === 'admin' ? 'mem-role-select--admin' : m.role === 'manager' ? 'mem-role-select--manager' : m.role === 'employee' ? 'mem-role-select--employee' : ''

                      return (
                        <tr
                          key={m.id}
                          className={`mem-tr ${isSelected ? 'mem-tr--selected' : ''}`}
                        >
                          <td className="mem-td-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(m.id)}
                              className="mem-checkbox"
                            />
                          </td>
                          <td className="mem-td">
                            <div className="mem-employee-row">
                              <div className="mem-avatar">
                                {initials}
                              </div>
                              <div>
                                <div className="mem-employee-name">
                                  {m.work_email?.split('@')[0] ?? '—'}
                                </div>
                                <div className="mem-employee-status">
                                  {m.status === 'invited' ? 'Pending Acceptance' : 'Active Employee'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="mem-td-email">{m.work_email}</td>
                          <td className="mem-td">
                            <select
                              value={m.role}
                              onChange={(e) => changeRole(m.id, e.target.value)}
                              className={`mem-role-select ${roleClass}`}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="mem-td-dept">{m.dept || 'Unassigned'}</td>
                          <td className="mem-td-joined">
                            {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="mem-td">
                            <button
                              onClick={() => removeMember(m.id, m.work_email)}
                              className="mem-btn-remove"
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
            <div className="mem-pagination-footer">
              <Pagination total={total} page={page} perPage={25} onPage={setPage} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
