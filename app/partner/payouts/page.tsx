'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Clock, Wallet, CheckCircle2 } from 'lucide-react'
import './payout.css'

interface Payout { id: string; amount: number; status: string; bank_name?: string; account_no?: string; upi_id?: string; notes?: string; created_at: string; processed_at?: string }

const STATUS_BADGE: Record<string, string> = { pending: 'badge-yellow', processing: 'badge-blue', paid: 'badge-green', rejected: 'badge-red' }
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })

export default function PartnerPayoutsPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    setLoading(true)
    adminFetch('/api/admin/partner/payouts', { agentId })
      .then(d => setPayouts(d.payouts ?? []))
      .finally(() => setLoading(false))
  }, [agentId])

  async function handleAction(id: string, status: 'paid' | 'processing' | 'rejected') {
    setSaving(id)
    const updated = await adminFetch('/api/admin/partner/payouts', {
      agentId, method: 'PATCH', body: JSON.stringify({ id, status }),
    }).catch(() => null)
    if (updated) setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setSaving(null)
  }

  const pending      = payouts.filter(p => p.status === 'pending')
  const pendingAmount = pending.reduce((s, p) => s + p.amount, 0)
  const totalPaid    = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const { slice: pagePayouts, page, setPage, total } = usePagination(payouts, 20)

  const columns: ColumnDef<Payout>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (p) => <span className="data-table-muted-cell">{fmtDate(p.created_at)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => <span className="data-table-cell-bold">{fmt(p.amount)}</span>,
    },
    {
      key: 'to',
      header: 'To',
      render: (p) => (
        <span className="data-table-muted-cell">
          {p.upi_id ? `UPI: ${p.upi_id}` : p.account_no ? `****${p.account_no.slice(-4)} · ${p.bank_name ?? ''}` : '--'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => {
        if (p.status === 'pending') {
          return (
            <div className="data-table-actions">
              <button type="button" className="data-table-btn data-table-btn-edit" disabled={!!saving} onClick={() => handleAction(p.id, 'processing')}>
                Mark Processing
              </button>
              <button type="button" className="data-table-btn data-table-btn-success" disabled={!!saving} onClick={() => handleAction(p.id, 'paid')}>
                {saving === p.id ? '…' : 'Mark Paid'}
              </button>
              <button type="button" className="data-table-btn data-table-btn-danger" disabled={!!saving} onClick={() => handleAction(p.id, 'rejected')}>
                Reject
              </button>
            </div>
          )
        }
        if (p.status === 'processing') {
          return (
            <button type="button" className="data-table-btn data-table-btn-success" disabled={!!saving} onClick={() => handleAction(p.id, 'paid')}>
              {saving === p.id ? '…' : 'Mark Paid'}
            </button>
          )
        }
        return <span className="data-table-muted-cell">{p.processed_at ? fmtDate(p.processed_at) : '--'}</span>
      },
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Payouts</h2>
        {pending.length > 0 && <span className="badge badge-yellow">{pending.length} pending</span>}
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid payout-stat-grid">
            <StatCard Icon={Clock} label="Pending Requests" value={pending.length} sub="Awaiting action" badge="Review" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
            <StatCard Icon={Wallet} label="Pending Amount" value={fmt(pendingAmount)} sub="Requested, not yet paid" badge="Queued" />
            <StatCard Icon={CheckCircle2} label="Total Paid Out" value={fmt(totalPaid)} sub="Settled payouts" badge="Complete" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
          </div>

          <DataTable
            title="Payout Requests"
            columns={columns}
            data={pagePayouts}
            loading={loading}
            emptyMessage="No payout requests."
            keyExtractor={(p) => p.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
