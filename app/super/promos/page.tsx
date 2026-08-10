'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { Tag, CheckCircle2, Repeat, Search, Plus } from 'lucide-react'
import { CreatePromoModal, EditPromoModal, UsageModal } from './PromoModals'

export interface Promo {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_booking_amount: number | null
  max_discount_amount: number | null
  max_uses: number | null
  uses_per_user: number
  current_uses: number
  applicable_to: string | null
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  scope: 'global' | 'biz_org' | 'partner_agent'
  scope_id: string | null
  created_by_role: 'super' | 'biz_admin' | 'partner_agent'
}

export interface ScopeOption { id: string; label: string }

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDiscount(p: Promo) {
  return p.discount_type === 'percentage'
    ? `${p.discount_value}%`
    : `Rs ${p.discount_value.toLocaleString('en-IN')}`
}

const FILTERS = ['all', 'active', 'inactive'] as const

export default function SuperPromosPage() {
  const [promos, setPromos]         = useState<Promo[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<typeof FILTERS[number]>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editPromo, setEditPromo]   = useState<Promo | null>(null)
  const [usagePromo, setUsagePromo] = useState<Promo | null>(null)
  const [orgs, setOrgs]   = useState<ScopeOption[]>([])
  const [agents, setAgents] = useState<ScopeOption[]>([])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/super/promos')
      .then((d: { promos: Promo[] }) => setPromos(d.promos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    adminFetch('/api/admin/super/orgs')
      .then((d: { orgs: Array<{ id: string; name: string }> }) => setOrgs((d.orgs ?? []).map(o => ({ id: o.id, label: o.name }))))
      .catch(() => {})
    adminFetch('/api/admin/super/agents')
      .then((d: { agents: Array<{ id: string; agency_name: string }> }) => setAgents((d.agents ?? []).map(a => ({ id: a.id, label: a.agency_name }))))
      .catch(() => {})
  }, [])

  function scopeLabel(p: Promo): string {
    if (p.scope === 'global') return 'Global'
    if (p.scope === 'biz_org') return `Org: ${orgs.find(o => o.id === p.scope_id)?.label ?? p.scope_id?.slice(0, 8)}`
    return `Agent: ${agents.find(a => a.id === p.scope_id)?.label ?? p.scope_id?.slice(0, 8)}`
  }

  const filtered = promos.filter(p => {
    if (filter === 'active'   && !p.is_active) return false
    if (filter === 'inactive' &&  p.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      return p.code.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const { slice, page, setPage, total } = usePagination(filtered, 20)
  const active     = promos.filter(p => p.is_active).length
  const totalUses  = promos.reduce((s, p) => s + (p.current_uses ?? 0), 0)

  async function deactivate(p: Promo) {
    if (!confirm(`Deactivate "${p.code}"? This is a soft delete.`)) return
    await adminFetch(`/api/admin/super/promos/${p.id}`, { method: 'DELETE' }).catch(() => {})
    setPromos(prev => prev.map(x => x.id === p.id ? { ...x, is_active: false } : x))
  }

  const columns: ColumnDef<Promo>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (p) => <span className="data-table-code-pill">{p.code}</span>,
    },
    {
      key: 'discount_type',
      header: 'Type',
      render: (p) => (
        <span className={`badge ${p.discount_type === 'percentage' ? 'badge-blue' : 'badge-yellow'}`}>
          {p.discount_type === 'percentage' ? '%' : 'Rs'}
        </span>
      ),
    },
    {
      key: 'discount_value',
      header: 'Discount',
      render: (p) => <span className="data-table-cell-bold">{fmtDiscount(p)}</span>,
    },
    {
      key: 'min_booking_amount',
      header: 'Min Amt',
      render: (p) => <span className="data-table-muted-cell">{p.min_booking_amount ? `Rs ${p.min_booking_amount.toLocaleString('en-IN')}` : '--'}</span>,
    },
    {
      key: 'max_discount_amount',
      header: 'Max Cap',
      render: (p) => <span className="data-table-muted-cell">{p.max_discount_amount ? `Rs ${p.max_discount_amount.toLocaleString('en-IN')}` : '--'}</span>,
    },
    {
      key: 'current_uses',
      header: 'Uses',
      render: (p) => (
        <span>
          {p.current_uses}
          <span className="data-table-muted-cell">{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
        </span>
      ),
    },
    {
      key: 'applicable_to',
      header: 'Applies To',
      render: (p) => <span className="badge badge-gray">{p.applicable_to ?? 'all'}</span>,
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (p) => <span className={`badge ${p.scope === 'global' ? 'badge-gray' : 'badge-blue'}`}>{scopeLabel(p)}</span>,
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      render: (p) => <span className="data-table-muted-cell">{fmtDate(p.valid_until)}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (p) => <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-btn data-table-btn-edit" onClick={() => setEditPromo(p)}>Edit</button>
          <button type="button" className="data-table-btn data-table-btn-success" onClick={() => setUsagePromo(p)}>Usage</button>
          {p.is_active && (
            <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => deactivate(p)}>Off</button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Promo Codes</h2>
        <span className="topbar-meta">{promos.length} codes total</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Tag} label="Total Codes" value={promos.length} sub="All promo codes ever created" badge="All" />
            <StatCard Icon={CheckCircle2} label="Active Now" value={active} sub={`${promos.length - active} inactive`} badge="Live" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={Repeat} label="Total Uses" value={totalUses.toLocaleString('en-IN')} sub="Cumulative redemptions" badge="Redemptions" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
          </div>

          <DataTable
            title="Promo Codes"
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 260 }}>
                  <AppInput
                    placeholder="Search by code or description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                  />
                </div>
                <div className="segmented-row">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`segment-btn ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <button type="button" className="quick-action-btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={14} strokeWidth={2.5} />
                  New Promo
                </button>
              </div>
            }
            columns={columns}
            data={slice}
            loading={loading}
            emptyMessage="No promo codes found."
            keyExtractor={(p) => p.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      {showCreate && (
        <CreatePromoModal
          orgs={orgs}
          agents={agents}
          onClose={() => setShowCreate(false)}
          onCreated={p => { setPromos(prev => [p, ...prev]); setShowCreate(false) }}
        />
      )}
      {editPromo && (
        <EditPromoModal
          promo={editPromo}
          orgs={orgs}
          agents={agents}
          onClose={() => setEditPromo(null)}
          onSaved={patch => {
            setPromos(prev => prev.map(x => x.id === editPromo.id ? { ...x, ...patch } : x))
            setEditPromo(null)
          }}
        />
      )}
      {usagePromo && (
        <UsageModal promo={usagePromo} onClose={() => setUsagePromo(null)} />
      )}
    </div>
  )
}
