'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'
import { StatCard } from '@/components/ui/StatCard'
import { Building2, Users, ClipboardCheck, Zap, BarChart3, Activity, CheckCircle2, XCircle, Plus, Clock, ArrowUpRight, Compass, UserCheck, ShieldCheck, Plane, ArrowRight, Cpu } from 'lucide-react'

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('en-IN') : '--'
}

function formatMoney(value?: number) {
  if (typeof value !== 'number') return '--'
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`
  if (value >= 1_00_000)    return `₹${(value / 1_00_000).toFixed(1)}L`
  return '₹' + value.toLocaleString('en-IN')
}

function formatDate(iso?: string | null) {
  if (!iso) return 'No bookings yet'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'GDS':     { bg: '#EFF6FF', color: '#1D4ED8' },
  'B2B GDS': { bg: '#F5F3FF', color: '#7C3AED' },
  'Charter': { bg: '#FFF7ED', color: '#C2410C' },
  'Hotel':   { bg: '#ECFDF5', color: '#047857' },
  'Package': { bg: '#FDF2F8', color: '#BE185D' },
  'Cab':     { bg: '#F0FDFA', color: '#0F766E' },
  'Insurance': { bg: '#FEF9C3', color: '#854D0E' },
}

interface ApiStat {
  key: string; name: string; type: string; env: string; description: string
  total: number; last30: number; revenue: number; lastBooking: string | null
  bySource: { consumer: number; mybiz: number; mypartner: number } | null
  balance?: { creditBalance: number; effectiveBalance: number; lienBalance: number; odAmount: number } | null
}

export default function SuperDashboard() {
  const [stats,     setStats]     = useState<any>(null)
  const [apiHealth, setApiHealth] = useState<ApiStat[] | null>(null)

  useEffect(() => {
    adminFetch('/api/admin/super/stats').then(setStats).catch(() => {})
    adminFetch('/api/admin/super/api-health').then(d => setApiHealth(d.apis)).catch(() => {})
  }, [])

  const totalOrgs = stats?.totalOrgs ?? 0
  const activeOrgs = stats?.activeOrgs ?? 0
  const totalMembers = stats?.totalMembers ?? 0
  const totalApprovals = stats?.totalApprovals ?? 0
  const pendingApprovals = stats?.pendingApprovals ?? 0
  const inactiveOrgs = Math.max(totalOrgs - activeOrgs, 0)
  const activeRate = totalOrgs > 0 ? Math.round((activeOrgs / totalOrgs) * 100) : 0

  const platformBars = useMemo(
    () => [
      { label: 'Orgs', value: totalOrgs, tone: 'blue' as const },
      { label: 'Active', value: activeOrgs, tone: 'teal' as const },
      { label: 'Members', value: totalMembers, tone: 'violet' as const },
      { label: 'All Approvals', value: totalApprovals, tone: 'orange' as const },
      { label: 'Pending', value: pendingApprovals, tone: 'rose' as const },
    ],
    [activeOrgs, pendingApprovals, totalApprovals, totalMembers, totalOrgs]
  )

  const statCards = useMemo(() => [
    {
      label: 'Total Organisations',
      value: formatCount(totalOrgs),
      sub: `${formatCount(activeOrgs)} active accounts`,
      badge: `${activeOrgs} Live`,
      Icon: Building2,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
      borderTone: '#bfdbfe',
    },
    {
      label: 'Total Members',
      value: formatCount(totalMembers),
      sub: 'Across all active businesses',
      badge: 'Active Base',
      Icon: Users,
      iconBg: '#f0fdf4',
      iconColor: '#0d9488',
      badgeBg: '#ccfbf1',
      badgeColor: '#0f766e',
      borderTone: '#99f6e4',
    },
    {
      label: 'Total Approvals',
      value: formatCount(totalApprovals),
      sub: `${formatCount(pendingApprovals)} waiting for review`,
      badge: pendingApprovals > 0 ? `${pendingApprovals} Pending` : 'All Clear',
      Icon: ClipboardCheck,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      badgeBg: '#ffedd5',
      badgeColor: '#c2410c',
      borderTone: '#fed7aa',
    },
    {
      label: 'Activation Rate',
      value: `${activeRate}%`,
      sub: `${formatCount(inactiveOrgs)} organisations inactive`,
      badge: activeRate >= 90 ? 'Optimal' : 'Needs Focus',
      Icon: Zap,
      iconBg: '#fff1f2',
      iconColor: '#e11d48',
      badgeBg: '#ffe4e6',
      badgeColor: '#be123c',
      borderTone: '#fecdd3',
    },
  ], [activeOrgs, activeRate, inactiveOrgs, pendingApprovals, totalApprovals, totalMembers, totalOrgs])

  return (
    <div>
      <div className="admin-topbar">
        <h2>Platform Overview</h2>
        <span className="topbar-meta">AirDunia myBiz | Super control center</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="page-hero">
            <div className="hero-row">
              <div>
                <h3>Everything important, in one clean view.</h3>
                <p>Track organisation health, member scale, approvals flow, and agent operations from a brighter, easier-to-scan admin dashboard.</p>
              </div>
              <div className="hero-chip-row">
                <span className="hero-chip"><strong>{formatCount(totalOrgs)}</strong> orgs live</span>
                <span className="hero-chip"><strong>{formatCount(totalMembers)}</strong> members onboarded</span>
                <span className="hero-chip"><strong>{formatCount(pendingApprovals)}</strong> pending actions</span>
              </div>
            </div>
          </section>

          <section className="stat-grid">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="dashboard-grid">
            {/* Platform Mix Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                    <BarChart3 size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Platform Mix</h3>
                    <p className="dashboard-card-subtitle">Visual read on your biggest operating buckets right now</p>
                  </div>
                </div>
                <span className="dashboard-card-badge-pill">Realtime</span>
              </div>

              <MiniBarChart data={platformBars} />
            </div>

            {/* Organisation Health Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                    <Activity size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Organisation Health</h3>
                    <p className="dashboard-card-subtitle">Active vs inactive platform accounts</p>
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
                  <strong className="org-health-metric-value">{formatCount(activeOrgs)}</strong>
                </div>
                <div className="org-health-metric-box inactive">
                  <div className="org-health-metric-label">
                    <XCircle size={15} color="#e11d48" />
                    <span>Inactive</span>
                  </div>
                  <strong className="org-health-metric-value">{formatCount(inactiveOrgs)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-grid">
            {/* Approvals Watchlist Card */}
            <div className="dashboard-card-lucrative">
              <div className="dashboard-card-header" style={{ marginBottom: 18 }}>
                <div className="dashboard-card-title-group">
                  <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                    <ClipboardCheck size={19} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="dashboard-card-title">Approvals Watchlist</h3>
                    <p className="dashboard-card-subtitle">Prioritise the queues that need attention first</p>
                  </div>
                </div>
                <span className="dashboard-card-badge-pill dashboard-card-badge-orange">
                  {pendingApprovals > 0 ? `●${pendingApprovals} Pending` : '●Clear'}
                </span>
              </div>

              <ProgressMeters
                items={[
                  { label: 'Pending reviews', value: pendingApprovals, tone: 'orange' },
                  { label: 'Processed approvals', value: Math.max(totalApprovals - pendingApprovals, 0), tone: 'teal' },
                  { label: 'Member base', value: totalMembers, tone: 'blue' },
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
                      <p className="dashboard-card-subtitle">Jump straight into high priority tasks</p>
                    </div>
                  </div>
                </div>

                <div className="quick-actions-btns-wrap">
                  <a href="/super/orgs/new" className="quick-action-btn-primary">
                    <Plus size={15} strokeWidth={2.5} />
                    New Organisation
                  </a>

                  <a href="/super/orgs" className="quick-action-btn-outline">
                    <Building2 size={15} strokeWidth={2} />
                    Manage Orgs
                  </a>

                  <a href="/super/agents" className="quick-action-btn-teal">
                    <Users size={15} strokeWidth={2} />
                    Agent Ops
                  </a>
                </div>
              </div>

              <div className="quick-actions-info-grid">
                <div className="quick-action-info-box base">
                  <div className="quick-action-info-head">
                    <span className="quick-action-info-title">Organisation Base</span>
                    <Building2 size={15} color="#3b82f6" />
                  </div>
                  <div className="quick-action-info-num">{formatCount(totalOrgs)}</div>
                  <span className="quick-action-info-sub">Configured on platform</span>
                </div>

                <div className="quick-action-info-box approvals">
                  <div className="quick-action-info-head">
                    <span className="quick-action-info-title">Open Approvals</span>
                    <Clock size={15} color="#ea580c" />
                  </div>
                  <div className="quick-action-info-num">{formatCount(pendingApprovals)}</div>
                  <span className="quick-action-info-sub">Requests awaiting action</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Explore Admin Areas ── */}
          <section className="explore-admin-section">
            <div className="dashboard-card-header" style={{ marginBottom: 4 }}>
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                  <Compass size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Explore Admin Areas</h3>
                  <p className="dashboard-card-subtitle">The most important sections of the super admin workspace</p>
                </div>
              </div>
              <span className="dashboard-card-badge-pill">●4 Key Hubs</span>
            </div>

            <div className="explore-admin-grid">
              {[
                {
                  title: 'Organisations',
                  desc: 'Create, edit, and manage company accounts across the platform.',
                  href: '/super/orgs',
                  Icon: Building2,
                  badge: 'Company Base',
                  tone: 'blue',
                  accent: '#2563eb',
                },
                {
                  title: 'All Members',
                  desc: 'Search users across every organisation and inspect access patterns.',
                  href: '/super/users',
                  Icon: UserCheck,
                  badge: 'User Access',
                  tone: 'violet',
                  accent: '#7c3aed',
                },
                {
                  title: 'myPartner Agents',
                  desc: 'Manage partner agents, wallet credits, and test credentials.',
                  href: '/super/agents',
                  Icon: ShieldCheck,
                  badge: 'Partner Network',
                  tone: 'teal',
                  accent: '#0d9488',
                },
                {
                  title: 'Fixed Departures',
                  desc: 'Review fixed-flight inventory and keep schedules in check.',
                  href: '/super/fixed-flights',
                  Icon: Plane,
                  badge: 'Charter Flights',
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

          {/* ── API Health & Usage ── */}
          <section className="api-health-section">
            <div className="dashboard-card-header" style={{ marginBottom: 4 }}>
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                  <Cpu size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">API Health &amp; Usage</h3>
                  <p className="dashboard-card-subtitle">All booking APIs integrated on the platform — live booking counts and revenue</p>
                </div>
              </div>
              <span className="dashboard-card-badge-pill dashboard-card-badge-teal">●Live Integrations</span>
            </div>

            {!apiHealth ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading API stats…</div>
            ) : (
              <div className="api-health-grid">
                {apiHealth.map(api => {
                  const typeStyle = TYPE_STYLE[api.type] ?? { bg: '#EFF6FF', color: '#1D4ED8' }
                  const totalSrc  = api.bySource ? api.bySource.consumer + api.bySource.mybiz + api.bySource.mypartner : 0
                  return (
                    <div key={api.key} className="api-health-card">
                      {/* Header row */}
                      <div className="api-health-card-head">
                        <div>
                          <div className="api-health-name">{api.name}</div>
                          <div className="api-health-desc">{api.description}</div>
                        </div>
                        <div className="api-health-badges">
                          <span className="api-health-badge-type" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                            {api.type}
                          </span>
                          <span className="api-health-badge-live">●LIVE</span>
                        </div>
                      </div>

                      {/* Trade API wallet balance — only FlightSeva returns this today */}
                      {api.balance && (
                        <div className="api-wallet-box">
                          <div>
                            <div className="api-wallet-title">Wallet Balance</div>
                            <div className="api-wallet-amount">{formatMoney(api.balance.effectiveBalance)}</div>
                          </div>
                          <div className="api-wallet-details">
                            <div>Credit: {formatMoney(api.balance.creditBalance)}</div>
                            <div>Lien: {formatMoney(api.balance.lienBalance)}</div>
                            <div>OD: {formatMoney(api.balance.odAmount)}</div>
                          </div>
                        </div>
                      )}

                      {/* Booking stats */}
                      <div className="api-metrics-grid">
                        <div className="api-metric-item">
                          <div className="api-metric-val">{formatCount(api.total)}</div>
                          <div className="api-metric-lbl">Total</div>
                        </div>
                        <div className="api-metric-item middle">
                          <div className={`api-metric-val ${api.last30 > 0 ? 'green' : 'muted'}`}>{formatCount(api.last30)}</div>
                          <div className="api-metric-lbl">Last 30d</div>
                        </div>
                        <div className="api-metric-item">
                          <div className="api-metric-val orange">{formatMoney(api.revenue)}</div>
                          <div className="api-metric-lbl">Revenue</div>
                        </div>
                      </div>

                      {/* Source breakdown */}
                      {api.bySource ? (
                        <div>
                          <div className="api-channel-subhead">Bookings by channel</div>
                          <div className="api-channel-pills">
                            <div className="api-channel-pill consumer">
                              <span className="api-channel-val">{formatCount(api.bySource.consumer)}</span>
                              <span className="api-channel-lbl">Consumer</span>
                              {totalSrc > 0 && (
                                <span className="api-channel-pct">({Math.round(api.bySource.consumer / totalSrc * 100)}%)</span>
                              )}
                            </div>

                            <div className="api-channel-pill mybiz">
                              <span className="api-channel-val">{formatCount(api.bySource.mybiz)}</span>
                              <span className="api-channel-lbl">MyBiz</span>
                              {totalSrc > 0 && (
                                <span className="api-channel-pct">({Math.round(api.bySource.mybiz / totalSrc * 100)}%)</span>
                              )}
                            </div>

                            <div className="api-channel-pill partner">
                              <span className="api-channel-val">{formatCount(api.bySource.mypartner)}</span>
                              <span className="api-channel-lbl">Partner</span>
                              {totalSrc > 0 && (
                                <span className="api-channel-pct">({Math.round(api.bySource.mypartner / totalSrc * 100)}%)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Channel breakdown not available yet — only bookable via one channel today</div>
                      )}

                      {/* Last booking */}
                      <div className="api-card-footer">
                        <Clock size={13} color="#64748b" />
                        <span className="api-footer-lbl">Last booking:</span>
                        <span className={`api-footer-val ${api.lastBooking ? '' : 'muted'}`}>
                          {formatDate(api.lastBooking)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
