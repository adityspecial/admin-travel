'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'
import { StatCard } from '@/components/ui/StatCard'
import { Users, Ticket, TrendingUp, Wallet, Clock } from 'lucide-react'

function fmtCurrency(v: number) { return `₹${v.toLocaleString('en-IN')}` }
function fmtCount(v?: number)   { return typeof v === 'number' ? v.toLocaleString('en-IN') : '--' }

export default function PartnerDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    adminFetch('/api/admin/partner/dashboard', { agentId }).then(setData).catch(() => {})
  }, [])

  const subAgents      = data?.subAgents      ?? 0
  const activeAgents   = data?.activeAgents   ?? 0
  const totalBookings  = data?.totalBookings  ?? 0
  const totalEarnings  = data?.totalEarnings  ?? 0
  const pendingPayouts = data?.pendingPayouts ?? 0
  const walletBalance  = data?.walletBalance  ?? 0
  const agentName      = data?.agentName      ?? 'Your Agency'

  const activeRate = subAgents > 0 ? Math.round((activeAgents / subAgents) * 100) : 0

  const agentMix = useMemo(() => [
    { label: 'Active',   value: activeAgents,               tone: 'teal'   as const },
    { label: 'Total',    value: subAgents,                   tone: 'blue'   as const },
    { label: 'Bookings', value: totalBookings,               tone: 'orange' as const },
    { label: 'Payouts',  value: pendingPayouts,              tone: 'rose'   as const },
  ], [activeAgents, pendingPayouts, subAgents, totalBookings])

  const statCards = useMemo(() => [
    {
      label: 'Sub-Agents',
      value: fmtCount(subAgents),
      sub: `${fmtCount(activeAgents)} active sub-agents`,
      badge: `${activeAgents} Active`,
      Icon: Users,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
    },
    {
      label: 'Total Bookings',
      value: fmtCount(totalBookings),
      sub: 'Across your entire team',
      badge: 'Team Volume',
      Icon: Ticket,
      iconBg: '#f0fdf4',
      iconColor: '#0d9488',
      badgeBg: '#ccfbf1',
      badgeColor: '#0f766e',
    },
    {
      label: 'Total Earnings',
      value: fmtCurrency(totalEarnings),
      sub: 'Commission earned all time',
      badge: 'All Time',
      Icon: TrendingUp,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      badgeBg: '#ffedd5',
      badgeColor: '#c2410c',
    },
    {
      label: 'Wallet Balance',
      value: fmtCurrency(walletBalance),
      sub: 'Available credit balance',
      badge: 'Credit',
      Icon: Wallet,
      iconBg: '#fdf2f8',
      iconColor: '#db2777',
      badgeBg: '#fce7f3',
      badgeColor: '#be185d',
    },
    {
      label: 'Pending Payouts',
      value: fmtCurrency(pendingPayouts),
      sub: 'Commission awaiting payout',
      badge: pendingPayouts > 0 ? 'Action Needed' : 'Cleared',
      Icon: Clock,
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed',
      badgeBg: '#ede9fe',
      badgeColor: '#6d28d9',
    },
  ], [activeAgents, pendingPayouts, subAgents, totalBookings, totalEarnings, walletBalance])

  return (
    <div>
      <div className="admin-topbar">
        <h2>{agentName} — Partner Dashboard</h2>
        <span className="topbar-meta">Agent control centre</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">

          <section className="page-hero partner-hero">
            <div className="hero-row">
              <div>
                <h3>Manage your team, track bookings and commissions.</h3>
                <p>Control sub-agent access, monitor team performance, and manage permissions from one place.</p>
              </div>
              <div className="hero-chip-row">
                <span className="hero-chip"><strong>{fmtCount(subAgents)}</strong> sub-agents</span>
                <span className="hero-chip"><strong>{fmtCount(totalBookings)}</strong> total bookings</span>
                <span className="hero-chip"><strong>{fmtCurrency(walletBalance)}</strong> wallet</span>
              </div>
            </div>
          </section>

          <section className="stat-grid">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="dashboard-grid">
            <div className="chart-card">
              <div className="card-title">Team Activity Mix</div>
              <div className="card-copy">An overview of your sub-agents and booking volume.</div>
              <MiniBarChart data={agentMix} />
            </div>
            <div className="chart-card">
              <div className="card-title">Agent Activation Rate</div>
              <div className="card-copy">How much of your team is currently active.</div>
              <DonutMeter value={activeRate} label="Active" tone="orange" />
              <div className="metric-list" style={{ marginTop: 18 }}>
                <div className="metric-row-head"><span>Active sub-agents</span><span>{fmtCount(activeAgents)}</span></div>
                <div className="metric-row-head"><span>Total sub-agents</span><span>{fmtCount(subAgents)}</span></div>
              </div>
            </div>
          </section>

          <section className="panel-grid">
            <div className="chart-card">
              <div className="card-title">Earnings Overview</div>
              <div className="card-copy">A quick read on your team's financial performance.</div>
              <div style={{ marginTop: 18 }}>
                <ProgressMeters items={[
                  { label: 'Total earnings',   value: totalEarnings,  tone: 'orange' },
                  { label: 'Wallet balance',   value: walletBalance,  tone: 'teal' },
                  { label: 'Pending payouts',  value: pendingPayouts, tone: 'rose' },
                ]} />
              </div>
            </div>
            <div className="chart-card">
              <div className="card-title">Quick Actions</div>
              <div className="card-copy">Jump to the sections your team needs most.</div>
              <div className="page-actions" style={{ marginTop: 18 }}>
                <a href="/partner/sub-agents" className="btn btn-primary">Manage Sub-Agents</a>
                <a href="/partner/bookings"   className="btn btn-ghost">View Bookings</a>
                <a href="/partner/permissions" className="btn btn-muted">Permissions</a>
              </div>
              <div className="info-grid" style={{ marginTop: 18 }}>
                <div className="info-card">
                  <h4>Sub-Agents</h4>
                  <strong>{fmtCount(subAgents)}</strong>
                  <span>In your network</span>
                </div>
                <div className="info-card">
                  <h4>Pending Payouts</h4>
                  <strong>{fmtCurrency(pendingPayouts)}</strong>
                  <span>Commission to be paid out</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
