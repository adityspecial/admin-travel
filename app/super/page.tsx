'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('en-IN') : '--'
}

export default function SuperDashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    adminFetch('/api/admin/super/stats').then(setStats).catch(() => {})
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
        </div>
      </div>
    </div>
  )
}
