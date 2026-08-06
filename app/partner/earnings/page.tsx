'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { MiniBarChart } from '@/components/charts'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Wallet, TrendingUp, CheckCircle2, Clock, BarChart3 } from 'lucide-react'
import './earning.css'

interface Commission {
  id: string
  amount: number
  type: string
  status: string
  month: string
  created_at: string
  booking?: { booking_ref: string; booking_type: string; customer_name: string }
  agent?: { agency_name: string; agent_code: string }
}

interface Transaction {
  id: string
  type: string
  amount: number
  balance_after: number
  description: string
  created_at: string
}

function fmtRs(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function EarningsPage() {
  const [commissions,   setCommissions]   = useState<Commission[]>([])
  const [transactions,  setTransactions]  = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState<'commissions' | 'wallet'>('commissions')

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    Promise.all([
      adminFetch('/api/admin/partner/earnings', { agentId }),
      adminFetch('/api/admin/partner/wallet', { agentId }),
    ]).then(([e, w]) => {
      setCommissions(e.commissions ?? [])
      setTransactions(w.transactions ?? [])
      setWalletBalance(w.balance ?? 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalEarned  = commissions.reduce((s, c) => s + c.amount, 0)
  const totalPaid    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0)

  // Group by month for chart
  const byMonth = commissions.reduce((acc: Record<string, number>, c) => {
    if (c.month) acc[c.month] = (acc[c.month] ?? 0) + c.amount
    return acc
  }, {})
  const monthBars = Object.entries(byMonth).slice(-6).map(([label, value]) => ({ label, value, tone: 'orange' as const }))

  const commissionColumns: ColumnDef<Commission>[] = [
    {
      key: 'month',
      header: 'Month',
      render: (c) => <span className="data-table-muted-cell">{c.month ?? '--'}</span>,
    },
    {
      key: 'booking',
      header: 'Booking',
      render: (c) => c.booking ? (
        <div>
          <div className="data-table-cell-bold">{c.booking.customer_name ?? c.booking.booking_ref}</div>
          <div className="data-table-muted-cell">{c.booking.booking_type}</div>
        </div>
      ) : '--',
    },
    {
      key: 'agent',
      header: 'Agent',
      render: (c) => <span className="data-table-muted-cell">{c.agent?.agency_name ?? 'Self'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => <span className="badge badge-gray">{c.type}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (c) => <span className="earning-amount-positive">+{fmtRs(c.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <span className={`badge ${c.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span>,
    },
  ]

  const walletColumns: ColumnDef<Transaction>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (t) => <span className="data-table-muted-cell">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (t) => <span className={`badge ${t.type === 'topup' || t.type === 'commission' ? 'badge-green' : 'badge-red'}`}>{t.type}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (t) => <span className="data-table-muted-cell">{t.description ?? '--'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <span className={`earning-wallet-amount ${t.amount >= 0 ? '' : 'earning-wallet-amount--negative'}`}>
          {t.amount >= 0 ? '+' : ''}{fmtRs(Math.abs(t.amount))}
        </span>
      ),
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      render: (t) => <span className="data-table-cell-bold">{fmtRs(t.balance_after)}</span>,
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Earnings & Wallet</h2>
        <span className="topbar-meta">Commission overview for your team</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Wallet} label="Wallet Balance" value={fmtRs(walletBalance)} sub="Available credit" badge="Live" />
            <StatCard Icon={TrendingUp} label="Total Earned" value={fmtRs(totalEarned)} sub="All commissions" badge="All Time" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
            <StatCard Icon={CheckCircle2} label="Paid Out" value={fmtRs(totalPaid)} sub="Commission paid" badge="Settled" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={Clock} label="Pending Payout" value={fmtRs(totalPending)} sub="Awaiting payout" badge="Upcoming" iconBg="#fdf2f8" iconColor="#db2777" badgeBg="#fce7f3" badgeColor="#be185d" />
          </div>

          {monthBars.length > 0 && (
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                    <BarChart3 size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Monthly Commission Trend</h3>
                    <p className="dashboard-card-subtitle">Commission earned per month across your team</p>
                  </div>
                </div>
              </div>
              <MiniBarChart data={monthBars} />
            </div>
          )}

          {/* Tab switcher */}
          <div className="segmented-row earning-tab-switcher">
            <button type="button" className={`segment-btn ${tab === 'commissions' ? 'active' : ''}`} onClick={() => setTab('commissions')}>
              💰 Commission Ledger
            </button>
            <button type="button" className={`segment-btn ${tab === 'wallet' ? 'active' : ''}`} onClick={() => setTab('wallet')}>
              🏦 Wallet Transactions
            </button>
          </div>

          {tab === 'commissions' && (
            <DataTable
              title="Commission Records"
              columns={commissionColumns}
              data={commissions}
              loading={loading}
              emptyMessage="No commission records yet."
              keyExtractor={(c) => c.id}
            />
          )}

          {tab === 'wallet' && (
            <DataTable
              title="Wallet Transactions"
              subtitle="All credits and debits on your wallet."
              headerAction={<div className="earning-balance-header">Balance: {fmtRs(walletBalance)}</div>}
              columns={walletColumns}
              data={transactions}
              loading={loading}
              emptyMessage="No transactions yet."
              keyExtractor={(t) => t.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
