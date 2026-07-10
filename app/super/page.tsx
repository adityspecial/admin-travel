'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'

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
}

interface ApiStat {
  key: string; name: string; type: string; env: string; description: string
  total: number; last30: number; revenue: number; lastBooking: string | null
  bySource: { consumer: number; mybiz: number; mypartner: number } | null
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
            {[
              { label: 'Total Organisations', value: formatCount(totalOrgs), sub: `${formatCount(activeOrgs)} active accounts`, icon: 'ORG', tone: '' },
              { label: 'Total Members', value: formatCount(totalMembers), sub: 'Across all active businesses', icon: 'MBR', tone: 'teal' },
              { label: 'Total Approvals', value: formatCount(totalApprovals), sub: `${formatCount(pendingApprovals)} waiting for review`, icon: 'APP', tone: 'orange' },
              { label: 'Activation Rate', value: `${activeRate}%`, sub: `${formatCount(inactiveOrgs)} organisations inactive`, icon: 'ACT', tone: 'rose' },
            ].map((card) => (
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

          <section className="dashboard-grid">
            <div className="chart-card">
              <div className="card-title">Platform Mix</div>
              <div className="card-copy">A fast visual read on your biggest operating buckets right now.</div>
              <MiniBarChart data={platformBars} />
            </div>

            <div className="chart-card">
              <div className="card-title">Organisation Health</div>
              <div className="card-copy">How much of the platform is currently active.</div>
              <DonutMeter value={activeRate} label="Active" tone="teal" />
              <div className="metric-list" style={{ marginTop: 18 }}>
                <div className="metric-row-head"><span>Active organisations</span><span>{formatCount(activeOrgs)}</span></div>
                <div className="metric-row-head"><span>Inactive organisations</span><span>{formatCount(inactiveOrgs)}</span></div>
              </div>
            </div>
          </section>

          <section className="panel-grid">
            <div className="chart-card">
              <div className="card-title">Approvals Watchlist</div>
              <div className="card-copy">Prioritise the queues that need attention first.</div>
              <div style={{ marginTop: 18 }}>
                <ProgressMeters
                  items={[
                    { label: 'Pending reviews', value: pendingApprovals, tone: 'orange' },
                    { label: 'Processed approvals', value: Math.max(totalApprovals - pendingApprovals, 0), tone: 'teal' },
                    { label: 'Member base', value: totalMembers, tone: 'blue' },
                  ]}
                />
              </div>
            </div>

            <div className="chart-card">
              <div className="card-title">Quick Actions</div>
              <div className="card-copy">Jump straight into the parts of the platform your team uses most.</div>
              <div className="page-actions" style={{ marginTop: 18 }}>
                <a href="/super/orgs/new" className="btn btn-primary">New Organisation</a>
                <a href="/super/orgs" className="btn btn-ghost">Manage Orgs</a>
                <a href="/super/agents" className="btn btn-muted">Agent Ops</a>
              </div>
              <div className="info-grid" style={{ marginTop: 18 }}>
                <div className="info-card">
                  <h4>Organisation base</h4>
                  <strong>{formatCount(totalOrgs)}</strong>
                  <span>Businesses configured on the platform</span>
                </div>
                <div className="info-card">
                  <h4>Open approvals</h4>
                  <strong>{formatCount(pendingApprovals)}</strong>
                  <span>Requests that still need action</span>
                </div>
              </div>
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Explore Admin Areas</div>
                <div className="card-copy">The most important sections of the super admin workspace.</div>
              </div>
            </div>
            <div className="quick-link-grid">
              {[
                { title: 'Organisations', desc: 'Create, edit, and manage company accounts across the platform.', href: '/super/orgs' },
                { title: 'All Members', desc: 'Search users across every organisation and inspect access patterns.', href: '/super/users' },
                { title: 'myPartner Agents', desc: 'Manage partner agents, wallet credits, and test credentials.', href: '/super/agents' },
                { title: 'Fixed Departures', desc: 'Review fixed-flight inventory and keep schedules in check.', href: '/super/fixed-flights' },
              ].map((item) => (
                <a key={item.title} href={item.href} className="quick-link-card">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </a>
              ))}
            </div>
          </section>

          {/* ── API Health & Usage ── */}
          <section className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">API Health &amp; Usage</div>
                <div className="card-copy">All flight booking APIs integrated on the platform — live booking counts and revenue.</div>
              </div>
            </div>

            {!apiHealth ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading API stats…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 20 }}>
                {apiHealth.map(api => {
                  const typeStyle = TYPE_STYLE[api.type] ?? { bg: '#F3F4F6', color: '#374151' }
                  const totalSrc  = api.bySource ? api.bySource.consumer + api.bySource.mybiz + api.bySource.mypartner : 0
                  return (
                    <div key={api.key} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{api.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{api.description}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: typeStyle.bg, color: typeStyle.color }}>{api.type}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#DCFCE7', color: '#166534' }}>● LIVE</span>
                        </div>
                      </div>

                      {/* Booking stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: '#F9FAFB', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{formatCount(api.total)}</div>
                          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Total</div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: api.last30 > 0 ? '#16A34A' : '#9CA3AF' }}>{formatCount(api.last30)}</div>
                          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Last 30d</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#F97316' }}>{formatMoney(api.revenue)}</div>
                          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Revenue</div>
                        </div>
                      </div>

                      {/* Source breakdown */}
                      {api.bySource ? (
                        <div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bookings by channel</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                              { label: 'Consumer', value: api.bySource.consumer, bg: '#EFF6FF', color: '#1D4ED8' },
                              { label: 'MyBiz',    value: api.bySource.mybiz,    bg: '#F0FDF4', color: '#16A34A' },
                              { label: 'Partner',  value: api.bySource.mypartner, bg: '#FFF7ED', color: '#C2410C' },
                            ].map(s => (
                              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 8, padding: '4px 10px' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{formatCount(s.value)}</span>
                                <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
                                {totalSrc > 0 && (
                                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>({Math.round(s.value / totalSrc * 100)}%)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Channel breakdown stored in JSONB — query via raw_book_response</div>
                      )}

                      {/* Last booking */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>Last booking:</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: api.lastBooking ? '#374151' : '#9CA3AF' }}>
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
