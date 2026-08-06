'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Layers, CheckCircle2, PauseCircle } from 'lucide-react'
import './markup.css'

interface Markup { id: string; booking_type: string; markup_type: string; markup_value: number; airline_code?: string; is_active: boolean }

export default function PartnerMarkupsPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
  const [markups, setMarkups]   = useState<Markup[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    adminFetch('/api/admin/partner/markups', { agentId })
      .then(d => setMarkups(d.markups ?? []))
      .finally(() => setLoading(false))
  }, [agentId])

  async function toggleActive(id: string, current: boolean) {
    setSaving(id)
    await adminFetch('/api/admin/partner/markups', { agentId, method: 'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    setMarkups(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m))
    setSaving(null)
  }

  const activeCount = markups.filter(m => m.is_active).length
  const pausedCount = markups.length - activeCount

  const columns: ColumnDef<Markup>[] = [
    {
      key: 'booking_type',
      header: 'Booking Type',
      render: (m) => <span className="badge badge-blue">{m.booking_type}</span>,
    },
    {
      key: 'markup_value',
      header: 'Markup',
      render: (m) => <span className="data-table-cell-bold">{m.markup_type === 'percentage' ? `${m.markup_value}%` : `₹${m.markup_value}`}</span>,
    },
    {
      key: 'airline_code',
      header: 'Airline',
      render: (m) => m.airline_code ? <span className="data-table-code-pill">{m.airline_code}</span> : <span className="data-table-muted-cell">All</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (m) => <span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'Active' : 'Paused'}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (m) => (
        <button
          type="button"
          className="data-table-btn data-table-btn-edit"
          disabled={saving === m.id}
          onClick={() => toggleActive(m.id, m.is_active)}
        >
          {saving === m.id ? '…' : m.is_active ? 'Pause' : 'Activate'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Markups</h2>
        <span className="topbar-meta">{activeCount} active rules</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid markup-stat-grid">
            <StatCard Icon={Layers} label="Total Rules" value={markups.length} sub="Configured markup rules" badge="All" />
            <StatCard Icon={CheckCircle2} label="Active Rules" value={activeCount} sub="Currently applied to fares" badge="Live" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={PauseCircle} label="Paused Rules" value={pausedCount} sub="Not applied to fares" badge="Inactive" iconBg="#f8fafc" iconColor="#64748b" badgeBg="#f1f5f9" badgeColor="#475569" />
          </div>

          <DataTable
            title="Markup Rules"
            subtitle="Set by the agent on top of base fares."
            columns={columns}
            data={markups}
            loading={loading}
            emptyMessage="No markup rules set."
            keyExtractor={(m) => m.id}
          />
        </div>
      </div>
    </div>
  )
}
