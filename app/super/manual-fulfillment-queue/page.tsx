'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ClipboardList, Clock, AlertTriangle, Eye } from 'lucide-react'

interface QueueRow {
  id: string
  provider: string
  booking_ref: string
  org_id: string | null
  agent_id: string | null
  origin: string
  destination: string
  travel_date: string
  airline_code: string
  airline_name: string | null
  adults: number; children: number; infants: number
  total_amount: number
  currency: string
  status: string
  claimed_by: string | null
  claimed_at: string | null
  escalated_at: string | null
  created_at: string
  source: string
}

// Same SLA-age convention as the corporate approvals queue — money is
// already collected on these, so the thresholds are tighter than approvals'
// (3h/12h) since a stale pending item here is a customer waiting on a ticket,
// not just an internal sign-off.
function ageLabel(createdAt: string) {
  const h = (Date.now() - new Date(createdAt).getTime()) / 3600000
  if (h < 1) return '<1h'
  if (h < 4) return '1-4h'
  return '>4h'
}
function ageTone(age: string) {
  if (age === '<1h') return 'badge-green'
  if (age === '1-4h') return 'badge-yellow'
  return 'badge-red'
}

const TABS = [
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Booked' },
  { key: 'all',       label: 'All' },
] as const

export default function ManualFulfillmentQueuePage() {
  const [rows,    setRows]    = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<(typeof TABS)[number]['key']>('pending')

  function load(status: string) {
    setLoading(true)
    adminFetch(`/api/admin/super/manual-fulfillment-queue?status=${status}`)
      .then(d => setRows(d.bookings ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(tab) }, [tab])

  const pendingCount   = rows.filter(r => r.status === 'pending').length
  const escalatedCount = rows.filter(r => r.status === 'pending' && r.escalated_at).length

  const columns: ColumnDef<QueueRow>[] = [
    {
      key: 'trip', header: 'Trip',
      render: (r) => (
        <div>
          <span className="data-table-cell-bold">{r.origin} → {r.destination}</span>
          <div className="data-table-muted-cell">{r.airline_name ?? r.airline_code} · {new Date(r.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      ),
    },
    { key: 'provider', header: 'Would-Be Source', render: (r) => <span className="badge badge-gray">{r.provider.toUpperCase()}</span> },
    { key: 'source',   header: 'Booked Via',      render: (r) => <span className="badge badge-blue">{r.source}</span> },
    { key: 'pax', header: 'Pax', render: (r) => `${r.adults + r.children + r.infants}` },
    { key: 'amount', header: 'Customer Paid', render: (r) => <span className="data-table-cell-bold">₹{Number(r.total_amount).toLocaleString('en-IN')}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => <span className={`badge ${r.status === 'pending' ? 'badge-yellow' : r.status === 'confirmed' ? 'badge-green' : 'badge-gray'}`}>{r.status}</span>,
    },
    {
      key: 'age', header: 'Age',
      render: (r) => (
        <div>
          <span className={`badge ${ageTone(ageLabel(r.created_at))}`}>{ageLabel(r.created_at)}</span>
          {r.escalated_at && <div className="data-table-muted-cell"><AlertTriangle size={11} /> Escalated</div>}
        </div>
      ),
    },
    {
      key: 'claim', header: 'Claim',
      render: (r) => r.claimed_by
        ? <span className="data-table-muted-cell">Claimed</span>
        : <span className="data-table-muted-cell">Unclaimed</span>,
    },
    {
      key: 'actions', header: 'Action',
      render: (r) => (
        <Link href={`/super/manual-fulfillment-queue/${r.id}`} className="data-table-btn data-table-btn-edit">
          <Eye size={12} /> View
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Manual Fulfillment Queue</h2>
        <span className="topbar-meta">{pendingCount} pending</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={ClipboardList} label="Pending" value={pendingCount} sub="Awaiting staff booking" badge="Queue" />
            <StatCard Icon={AlertTriangle} label="Escalated" value={escalatedCount} sub="Past SLA, flagged to ops" badge="Attention" iconBg="#FEF2F2" iconColor="#DC2626" badgeBg="#FEE2E2" badgeColor="#991B1B" />
            <StatCard Icon={Clock} label="Total Shown" value={rows.length} sub={tab === 'pending' ? 'Pending items' : 'All manual bookings'} badge={tab} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                className={`btn btn-sm ${tab === t.key ? 'btn-primary' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <DataTable
            title="Manual Fulfillment Queue"
            subtitle="Bookings diverted from a live provider API to staff — claim one, book it on the airline's corporate portal, then confirm with the real PNR."
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage={tab === 'pending' ? 'Nothing pending — the queue is clear.' : 'No manual bookings yet.'}
            keyExtractor={(r) => r.id}
          />
        </div>
      </div>
    </div>
  )
}
