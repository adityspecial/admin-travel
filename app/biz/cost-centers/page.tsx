'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import './cost-center.css'
import {
  Layers,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Power,
  Sparkles,
  ChevronRight,
  Code2,
  Tag,
  AlertCircle,
  Filter,
} from 'lucide-react'

interface CostCenter {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
}

export default function CostCentersPage() {
  const [items, setItems] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/cost-centers')
      .then((d) => setItems(d.costCenters ?? []))
      .finally(() => setLoading(false))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      await adminFetch('/api/admin/biz/cost-centers', { method: 'POST', body: JSON.stringify(form) })
      setForm({ name: '', code: '', description: '' })
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to add cost center')
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await adminFetch('/api/admin/biz/cost-centers', {
        method: 'PATCH',
        body: JSON.stringify({ id, isActive: !current }),
      })
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)))
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cost center code?')) return
    try {
      await adminFetch('/api/admin/biz/cost-centers', { method: 'DELETE', body: JSON.stringify({ id }) })
      setItems((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete cost center')
    }
  }

  const filteredItems = items.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      const matchName = c.name.toLowerCase().includes(q)
      const matchCode = c.code.toLowerCase().includes(q)
      const matchDesc = c.description?.toLowerCase().includes(q) ?? false
      if (!matchName && !matchCode && !matchDesc) return false
    }
    if (statusFilter === 'active' && !c.is_active) return false
    if (statusFilter === 'inactive' && c.is_active) return false
    return true
  })

  const activeCount = items.filter((c) => c.is_active).length
  const inactiveCount = items.filter((c) => !c.is_active).length

  return (
    <div className="cc-page">
      <div className="cc-container">
        {/* Breadcrumb Navigation */}
        <div className="cc-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="cc-breadcrumb-active">Cost Centers & Accounting</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="cc-hero-glow" />

          <div className="cc-hero-content">
            <div className="cc-hero-left">
              <div className="cc-hero-icon">
                <Layers size={28} />
              </div>
              <div>
                <h1 className="cc-hero-title">
                  Cost Centers & Accounting <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="cc-hero-subtitle">
                  Tag travel bookings to specific departments, client projects, and subsidiary billing units for financial audits.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Inside Hero */}
          <div className="cc-hero-metrics">
            <div>
              <div className="cc-metric-label">Total Cost Centers</div>
              <div className="cc-metric-value cc-metric-value--white">{items.length}</div>
            </div>
            <div>
              <div className="cc-metric-label">Active Allocations</div>
              <div className="cc-metric-value cc-metric-value--active">{activeCount}</div>
            </div>
            <div>
              <div className="cc-metric-label">Archived / Inactive</div>
              <div className="cc-metric-value cc-metric-value--inactive">{inactiveCount}</div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="cc-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Add Cost Center Form Card */}
        <section className="card-shell">
          <div className="cc-form-header">
            <div className="cc-form-icon">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="cc-card-title">Add New Cost Center</h2>
              <span className="cc-card-subtitle">Create unique department or project identification codes</span>
            </div>
          </div>

          <form onSubmit={handleAdd}>
            <div className="cc-form-grid">
              <div>
                <label className="cc-field-label">
                  Cost Center Code *
                </label>
                <input
                  placeholder="e.g. MKTG-2026"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  className="input-field cc-code-input"
                  required
                />
              </div>

              <div>
                <label className="cc-field-label">
                  Cost Center Name *
                </label>
                <input
                  placeholder="e.g. Digital Marketing & Growth"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="cc-field-label">
                  Description (Optional)
                </label>
                <input
                  placeholder="e.g. Q1 Marketing campaigns and travel spend"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="cc-submit-row">
              <button type="submit" disabled={saving} className="btn-primary">
                <Plus size={15} /> {saving ? 'Creating…' : 'Create Cost Center'}
              </button>
            </div>
          </form>
        </section>

        {/* Cost Centers Data Table Card */}
        <section className="card-shell cc-table-card">
          {/* Header Bar */}
          <div className="cc-table-header">
            <div className="cc-table-header-left">
              <h3 className="cc-card-title">
                {loading ? 'Cost Centers' : `Cost Centers (${filteredItems.length})`}
              </h3>

              {/* Status Filter Segmented Pills */}
              <div className="cc-filter-pills">
                {(['all', 'active', 'inactive'] as const).map((st) => {
                  const isActive = statusFilter === st
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`cc-filter-pill ${isActive ? 'cc-filter-pill--active' : ''}`}
                    >
                      {st}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="cc-search-wrap">
              <Search size={15} color="#9CA3AF" className="cc-search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, name, or details..."
                className="input-field cc-search-input"
              />
            </div>
          </div>

          {/* Table */}
          <div className="cc-table-scroll">
            <table className="cc-table">
              <thead>
                <tr className="cc-thead-row">
                  {['CODE', 'COST CENTER NAME', 'DESCRIPTION', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} className="cc-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="cc-loading-cell">
                      Loading cost centers…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cc-empty-cell">
                      <Layers size={32} color="#9CA3AF" className="cc-empty-icon" />
                      <div className="cc-empty-title">No Cost Center Found</div>
                      <div className="cc-empty-sub">Create your first cost center using the form above.</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((c) => (
                    <tr key={c.id} className="cc-tr">
                      <td className="cc-td">
                        <span className="cc-code-badge">
                          {c.code}
                        </span>
                      </td>
                      <td className="cc-td">
                        <div className="cc-name-cell">{c.name}</div>
                      </td>
                      <td className="cc-td cc-desc-cell">{c.description ?? '—'}</td>
                      <td className="cc-td">
                        <span className={`cc-status-badge ${c.is_active ? 'cc-status-badge--active' : 'cc-status-badge--inactive'}`}>
                          <span className={`cc-status-dot ${c.is_active ? 'cc-status-dot--active' : 'cc-status-dot--inactive'}`} />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="cc-td">
                        <div className="cc-actions-row">
                          <button onClick={() => toggleActive(c.id, c.is_active)} className="btn-secondary">
                            <Power size={13} color={c.is_active ? '#DC2626' : '#10B981'} />
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="cc-btn-delete-icon"
                            title="Delete Cost Center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
