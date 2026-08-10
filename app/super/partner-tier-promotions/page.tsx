'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatCard } from '@/components/ui/StatCard'
import { TrendingUp, CheckCircle2, XCircle } from 'lucide-react'

interface Promotion {
  id: string
  agent_id: string
  from_tier: string
  to_tier: string
  gmv_at_trigger: number
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
  resolved_at: string | null
  partner_agents?: { agency_name: string; agent_code: string; email: string }
}

const TIER_COLORS: Record<string, string> = { bronze: '#CD7F32', silver: '#94A3B8', gold: '#EAB308', platinum: '#8B5CF6' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PartnerTierPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [resolving, setResolving] = useState<string | null>(null)

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/super/partner-tier-promotions?status=${status}`)
      .then(d => setPromotions(d.promotions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [status]) // eslint-disable-line

  async function resolve(id: string, action: 'approve' | 'dismiss') {
    setResolving(id)
    try {
      await adminFetch('/api/admin/super/partner-tier-promotions', {
        method: 'PATCH', body: JSON.stringify({ id, action }),
      })
      setPromotions(prev => prev.filter(p => p.id !== id))
    } catch (e: any) {
      alert(e.message ?? 'Failed to resolve')
    }
    setResolving(null)
  }

  const columns: ColumnDef<Promotion>[] = [
    { key: 'created_at', header: 'Triggered', render: (p) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</span> },
    {
      key: 'agent', header: 'Agent',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700 }}>{p.partner_agents?.agency_name ?? '--'}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.partner_agents?.agent_code} · {p.partner_agents?.email}</div>
        </div>
      ),
    },
    {
      key: 'tier_change', header: 'Tier Change',
      render: (p) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge" style={{ background: `${TIER_COLORS[p.from_tier]}22`, color: TIER_COLORS[p.from_tier] }}>{p.from_tier}</span>
          →
          <span className="badge" style={{ background: `${TIER_COLORS[p.to_tier]}22`, color: TIER_COLORS[p.to_tier] }}>{p.to_tier}</span>
        </span>
      ),
    },
    { key: 'gmv_at_trigger', header: 'GMV at Trigger', render: (p) => <span style={{ fontWeight: 700 }}>₹{Number(p.gmv_at_trigger).toLocaleString('en-IN')}</span> },
    {
      key: 'status', header: 'Status',
      render: (p) => <span className={`badge ${p.status === 'pending' ? 'badge-yellow' : p.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>{p.status}</span>,
    },
    {
      key: 'actions', header: 'Action',
      render: (p) => p.status !== 'pending' ? (
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>{p.resolved_at ? formatDate(p.resolved_at) : '--'}</span>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" disabled={resolving === p.id} onClick={() => resolve(p.id, 'approve')}>
            {resolving === p.id ? '…' : 'Approve'}
          </button>
          <button className="btn btn-ghost btn-sm" disabled={resolving === p.id} onClick={() => resolve(p.id, 'dismiss')}>Dismiss</button>
        </div>
      ),
    },
  ]

  const pendingCount = promotions.filter(p => p.status === 'pending').length

  return (
    <div>
      <div className="admin-topbar">
        <h2>Tier Promotions</h2>
        <span className="topbar-meta">GMV-triggered upgrade requests — nothing changes until approved</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="stat-grid partners-stat-grid">
            <StatCard Icon={TrendingUp} label="Pending" value={status === 'pending' ? promotions.length : pendingCount} sub="Awaiting approval" badge="Queue" />
            <StatCard Icon={CheckCircle2} label="Filter" value={status} sub="Current view" badge="View" />
            <StatCard Icon={XCircle} label="Auto-applied changes" value={0} sub="Approvals are always manual" badge="By design" />
          </section>

          <DataTable
            title="Promotion Queue"
            subtitle="Approving only changes the agent's tier — credit limit and commission stay whatever they were already set to."
            headerAction={
              <select className="app-input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 160 }}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="dismissed">Dismissed</option>
                <option value="">All</option>
              </select>
            }
            columns={columns}
            data={promotions}
            loading={loading}
            emptyMessage="No promotions in this view."
            keyExtractor={(p) => p.id}
          />
        </div>
      </div>
    </div>
  )
}
