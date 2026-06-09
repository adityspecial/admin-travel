'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { MiniBarChart } from '@/components/charts'

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

  return (
    <div>
      <div className="admin-topbar">
        <h2>Earnings & Wallet</h2>
        <span className="topbar-meta">Commission overview for your team</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">

          <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Wallet Balance',    value: `₹${walletBalance.toLocaleString('en-IN')}`,  sub: 'Available credit',       icon: 'WL',  tone: '' },
              { label: 'Total Earned',      value: `₹${totalEarned.toLocaleString('en-IN')}`,    sub: 'All commissions',        icon: 'ER',  tone: 'orange' },
              { label: 'Paid Out',          value: `₹${totalPaid.toLocaleString('en-IN')}`,      sub: 'Commission paid',        icon: 'PD',  tone: 'teal' },
              { label: 'Pending Payout',    value: `₹${totalPending.toLocaleString('en-IN')}`,   sub: 'Awaiting payout',        icon: 'PY',  tone: 'rose' },
            ].map(card => (
              <div className={`stat-card ${card.tone}`.trim()} key={card.label}>
                <div className="stat-head">
                  <div className="stat-num">{card.value}</div>
                  <span className="stat-icon">{card.icon}</span>
                </div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            ))}
          </section>

          {monthBars.length > 0 && (
            <div className="chart-card">
              <div className="card-title">Monthly Commission Trend</div>
              <div className="card-copy">Commission earned per month across your team.</div>
              <MiniBarChart data={monthBars} />
            </div>
          )}

          {/* Tab switcher */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            {(['commissions', 'wallet'] as const).map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'commissions' ? '💰 Commission Ledger' : '🏦 Wallet Transactions'}
              </button>
            ))}
          </div>

          {tab === 'commissions' && (
            <div className="table-card">
              <div className="table-header">
                <div className="card-title">Commission Records</div>
              </div>
              {loading ? <p style={{ padding: 20, color: 'var(--muted)' }}>Loading…</p> : (
                <table>
                  <thead>
                    <tr><th>Month</th><th>Booking</th><th>Agent</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr><td colSpan={6} className="empty-state">No commission records yet.</td></tr>
                    ) : commissions.map(c => (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--muted)' }}>{c.month ?? '--'}</td>
                        <td>
                          {c.booking ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.booking.customer_name ?? c.booking.booking_ref}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.booking.booking_type}</div>
                            </div>
                          ) : '--'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.agent?.agency_name ?? 'Self'}</td>
                        <td><span className="badge badge-gray">{c.type}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>+₹{c.amount.toLocaleString('en-IN')}</td>
                        <td><span className={`badge ${c.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'wallet' && (
            <div className="table-card">
              <div className="table-header">
                <div>
                  <div className="card-title">Wallet Transactions</div>
                  <div className="card-copy">All credits and debits on your wallet.</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Balance: ₹{walletBalance.toLocaleString('en-IN')}</div>
              </div>
              {loading ? <p style={{ padding: 20, color: 'var(--muted)' }}>Loading…</p> : (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance After</th></tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="empty-state">No transactions yet.</td></tr>
                    ) : transactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ color: 'var(--muted)' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                        <td><span className={`badge ${t.type === 'topup' || t.type === 'commission' ? 'badge-green' : 'badge-red'}`}>{t.type}</span></td>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.description ?? '--'}</td>
                        <td style={{ fontWeight: 700, color: t.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {t.amount >= 0 ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{t.balance_after.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
