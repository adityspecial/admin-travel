'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
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
    <div style={{ minHeight: 'calc(100vh - 54px)', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .cc-container {
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
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 13.5px;
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
          padding: 10px 22px;
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
        @media (max-width: 1024px) {
          .cc-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .cc-container {
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

      <div className="cc-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Cost Centers & Accounting</span>
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
                <Layers size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Cost Centers & Accounting <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                  Tag travel bookings to specific departments, client projects, and subsidiary billing units for financial audits.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Inside Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Cost Centers</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{items.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Active Allocations</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>{activeCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Archived / Inactive</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#9CA3AF', marginTop: '2px' }}>{inactiveCount}</div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Add Cost Center Form Card */}
        <section className="card-shell">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Add New Cost Center</h2>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Create unique department or project identification codes</span>
            </div>
          </div>

          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Cost Center Code *
                </label>
                <input
                  placeholder="e.g. MKTG-2026"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  className="input-field"
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                <Plus size={15} /> {saving ? 'Creating…' : 'Create Cost Center'}
              </button>
            </div>
          </form>
        </section>

        {/* Cost Centers Data Table Card */}
        <section className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header Bar */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {loading ? 'Cost Centers' : `Cost Centers (${filteredItems.length})`}
              </h3>

              {/* Status Filter Segmented Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', padding: '3px', borderRadius: '10px' }}>
                {(['all', 'active', 'inactive'] as const).map((st) => {
                  const isActive = statusFilter === st
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        background: isActive ? 'var(--accent, #E31E24)' : 'transparent',
                        color: isActive ? '#ffffff' : '#6B7280',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, name, or details..."
                className="input-field"
                style={{ paddingLeft: '36px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['CODE', 'COST CENTER NAME', 'DESCRIPTION', 'STATUS', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                      Loading cost centers…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Layers size={32} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Cost Center Found</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Create your first cost center using the form above.</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            background: '#F3F4F6',
                            color: '#111827',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{c.description ?? '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '99px',
                            background: c.is_active ? '#ECFDF5' : '#F3F4F6',
                            color: c.is_active ? '#047857' : '#6B7280',
                            border: c.is_active ? '1px solid #6EE7B7' : '1px solid #E5E7EB',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.is_active ? '#10B981' : '#9CA3AF' }} />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => toggleActive(c.id, c.is_active)} className="btn-secondary">
                            <Power size={13} color={c.is_active ? '#DC2626' : '#10B981'} />
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#DC2626',
                              cursor: 'pointer',
                              padding: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
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
