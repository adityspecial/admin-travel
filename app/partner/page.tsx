'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'
import { StatCard } from '@/components/ui/StatCard'
import {
  Users, Ticket, TrendingUp, Wallet, Clock, BarChart3, Activity,
  CheckCircle2, XCircle, Zap, Compass, ShieldCheck, ArrowRight,
} from 'lucide-react'

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
  const inactiveAgents = Math.max(subAgents - activeAgents, 0)

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
            {/* Team Activity Mix Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                    <BarChart3 size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Team Activity Mix</h3>
                    <p className="dashboard-card-subtitle">An overview of your sub-agents and booking volume</p>
                  </div>
                </div>
                <span className="dashboard-card-badge-pill dashboard-card-badge-orange">Realtime</span>
              </div>

              <MiniBarChart data={agentMix} />
            </div>

            {/* Agent Activation Rate Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                    <Activity size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Agent Activation Rate</h3>
                    <p className="dashboard-card-subtitle">How much of your team is currently active</p>
                  </div>
                </div>
                <span className="dashboard-card-badge-pill dashboard-card-badge-teal">
                  {activeRate >= 80 ? '●Optimal' : '●Monitoring'}
                </span>
              </div>

              <DonutMeter value={activeRate} label="Active Rate" tone="teal" />

              <div className="org-health-metrics-grid">
                <div className="org-health-metric-box active">
                  <div className="org-health-metric-label">
                    <CheckCircle2 size={15} color="#16a34a" />
                    <span>Active</span>
                  </div>
                  <strong className="org-health-metric-value">{fmtCount(activeAgents)}</strong>
                </div>
                <div className="org-health-metric-box inactive">
                  <div className="org-health-metric-label">
                    <XCircle size={15} color="#e11d48" />
                    <span>Inactive</span>
                  </div>
                  <strong className="org-health-metric-value">{fmtCount(inactiveAgents)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-grid">
            {/* Earnings Overview Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header" style={{ marginBottom: 18 }}>
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                    <TrendingUp size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Earnings Overview</h3>
                    <p className="dashboard-card-subtitle">A quick read on your team's financial performance</p>
                  </div>
                </div>
                <span className="dashboard-card-badge-pill dashboard-card-badge-orange">
                  {pendingPayouts > 0 ? '●Payouts Due' : '●Cleared'}
                </span>
              </div>

              <ProgressMeters
                items={[
                  { label: 'Total earnings',  value: totalEarnings,  tone: 'orange' },
                  { label: 'Wallet balance',  value: walletBalance,  tone: 'teal' },
                  { label: 'Pending payouts', value: pendingPayouts, tone: 'rose' },
                ]}
              />
            </div>

            {/* Quick Actions Card */}
            <div className="dashboard-card-lucrative">
              <div>
                <div className="dashboard-card-header" style={{ marginBottom: 14 }}>
                  <div className="dashboard-card-title-group">
                    <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                      <Zap size={19} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="dashboard-card-title">Quick Actions</h3>
                      <p className="dashboard-card-subtitle">Jump to the sections your team needs most</p>
                    </div>
                  </div>
                </div>

                <div className="quick-actions-btns-wrap">
                  <a href="/partner/sub-agents" className="quick-action-btn-primary">
                    <Users size={15} strokeWidth={2} />
                    Manage Sub-Agents
                  </a>

                  <a href="/partner/bookings" className="quick-action-btn-outline">
                    <Ticket size={15} strokeWidth={2} />
                    View Bookings
                  </a>

                  <a href="/partner/permissions" className="quick-action-btn-teal">
                    <ShieldCheck size={15} strokeWidth={2} />
                    Permissions
                  </a>
                </div>
              </div>

              <div className="quick-actions-info-grid">
                <div className="quick-action-info-box base">
                  <div className="quick-action-info-head">
                    <span className="quick-action-info-title">Sub-Agents</span>
                    <Users size={15} color="#3b82f6" />
                  </div>
                  <div className="quick-action-info-num">{fmtCount(subAgents)}</div>
                  <span className="quick-action-info-sub">In your network</span>
                </div>

                <div className="quick-action-info-box approvals">
                  <div className="quick-action-info-head">
                    <span className="quick-action-info-title">Pending Payouts</span>
                    <Clock size={15} color="#ea580c" />
                  </div>
                  <div className="quick-action-info-num">{fmtCurrency(pendingPayouts)}</div>
                  <span className="quick-action-info-sub">Commission to be paid out</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Explore Partner Areas ── */}
          <section className="explore-admin-section">
            <div className="dashboard-card-header" style={{ marginBottom: 4 }}>
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                  <Compass size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Explore Partner Areas</h3>
                  <p className="dashboard-card-subtitle">The most important sections of your partner workspace</p>
                </div>
              </div>
              <span className="dashboard-card-badge-pill">●4 Key Hubs</span>
            </div>

            <div className="explore-admin-grid">
              {[
                {
                  title: 'Sub-Agents',
                  desc: 'Manage your sub-agent network, roles, and wallet credits.',
                  href: '/partner/sub-agents',
                  Icon: Users,
                  badge: 'Team Network',
                  tone: 'blue',
                  accent: '#2563eb',
                },
                {
                  title: 'Bookings',
                  desc: "Review every booking made across your team's accounts.",
                  href: '/partner/bookings',
                  Icon: Ticket,
                  badge: 'Trip Volume',
                  tone: 'violet',
                  accent: '#7c3aed',
                },
                {
                  title: 'Earnings & Payouts',
                  desc: 'Track commission earned and manage pending payouts.',
                  href: '/partner/earnings',
                  Icon: TrendingUp,
                  badge: 'Commission',
                  tone: 'teal',
                  accent: '#0d9488',
                },
                {
                  title: 'Permissions',
                  desc: 'Control what your sub-agents can see and do.',
                  href: '/partner/permissions',
                  Icon: ShieldCheck,
                  badge: 'Access Control',
                  tone: 'orange',
                  accent: '#ea580c',
                },
              ].map((item) => (
                <a key={item.title} href={item.href} className="explore-area-card">
                  <div className="explore-area-accent" style={{ backgroundColor: item.accent }} />

                  <div className="explore-area-head">
                    <div className={`explore-area-icon-box explore-area-icon-${item.tone}`}>
                      <item.Icon size={21} strokeWidth={2.2} />
                    </div>
                    <span className={`explore-area-badge explore-area-badge-${item.tone}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="explore-area-title">{item.title}</h4>
                    <p className="explore-area-desc">{item.desc}</p>
                  </div>

                  <div className="explore-area-footer" style={{ color: item.accent }}>
                    <span>Open Module</span>
                    <ArrowRight size={15} className="explore-area-arrow" />
                  </div>
                </a>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
