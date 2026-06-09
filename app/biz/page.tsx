'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { DonutMeter, MiniBarChart, ProgressMeters } from '@/components/charts'

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function BizDashboard() {
  const [members, setMembers] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [policy, setPolicy] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/members'),
      adminFetch('/api/admin/biz/approvals?status=all'),
      adminFetch('/api/admin/biz/policy'),
    ]).then(([m, a, p]) => {
      setMembers(m.members ?? [])
      setApprovals(a.approvals ?? [])
      setPolicy(p.policy)
    }).catch(() => {})
  }, [])

  const pending = approvals.filter((item) => item.status === 'pending').length
  const approved = approvals.filter((item) => item.status === 'approved').length
  const rejected = approvals.filter((item) => item.status === 'rejected').length
  const managers = members.filter((item) => item.role === 'manager').length
  const admins = members.filter((item) => item.role === 'admin').length
  const employees = members.filter((item) => item.role === 'employee').length
  const approvalRate = approvals.length > 0 ? Math.round((approved / approvals.length) * 100) : 0

  const teamMix = useMemo(
    () => [
      { label: 'Employees', value: employees, tone: 'blue' as const },
      { label: 'Managers', value: managers, tone: 'teal' as const },
      { label: 'Admins', value: admins, tone: 'violet' as const },
      { label: 'Pending', value: pending, tone: 'orange' as const },
    ],
    [admins, employees, managers, pending]
  )

  return (
    <div>
      <div className="admin-topbar">
        <h2>{policy?.name ?? 'Company'} Admin Dashboard</h2>
        <span className="topbar-meta">Org code: <b>{policy?.org_code ?? '--'}</b></span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <section className="page-hero biz-hero">
            <div className="hero-row">
              <div>
                <h3>Manage travel, approvals, and spend with more clarity.</h3>
                <p>This dashboard keeps your company travel program easy to review, with cleaner team visibility and a stronger approvals snapshot.</p>
              </div>
              <div className="hero-chip-row">
                <span className="hero-chip"><strong>{members.length.toLocaleString('en-IN')}</strong> members</span>
                <span className="hero-chip"><strong>{pending.toLocaleString('en-IN')}</strong> awaiting approval</span>
                <span className="hero-chip"><strong>{formatCurrency(policy?.flight_cap ?? 10000)}</strong> flight cap</span>
              </div>
            </div>
          </section>

          <section className="stat-grid">
            {[
              { label: 'Total Members', value: members.length.toLocaleString('en-IN'), sub: 'Travellers in your organisation', icon: 'MBR', tone: '' },
              { label: 'Pending Approvals', value: pending.toLocaleString('en-IN'), sub: 'Trips waiting for review', icon: 'PND', tone: 'orange' },
              { label: 'Approved Trips', value: approved.toLocaleString('en-IN'), sub: `${rejected.toLocaleString('en-IN')} rejected requests`, icon: 'OK', tone: 'teal' },
              { label: 'Flight Cap', value: formatCurrency(policy?.flight_cap ?? 10000), sub: 'Per trip budget threshold', icon: 'FLT', tone: 'rose' },
              { label: 'Hotel Cap', value: formatCurrency(policy?.hotel_cap ?? 5000), sub: 'Per night budget threshold', icon: 'HTL', tone: 'violet' },
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
              <div className="card-title">Team and Queue Snapshot</div>
              <div className="card-copy">A simple view of who is in the system and how much approval work is stacked up.</div>
              <MiniBarChart data={teamMix} />
            </div>

            <div className="chart-card">
              <div className="card-title">Approval Success Rate</div>
              <div className="card-copy">Percent of requests that made it through approval.</div>
              <DonutMeter value={approvalRate} label="Approved" tone="teal" />
              <div className="metric-list" style={{ marginTop: 18 }}>
                <div className="metric-row-head"><span>Approved</span><span>{approved.toLocaleString('en-IN')}</span></div>
                <div className="metric-row-head"><span>Pending</span><span>{pending.toLocaleString('en-IN')}</span></div>
                <div className="metric-row-head"><span>Rejected</span><span>{rejected.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </section>

          <section className="panel-grid">
            <div className="chart-card">
              <div className="card-title">Policy Limits</div>
              <div className="card-copy">Quick budget references for your travel team.</div>
              <div style={{ marginTop: 18 }}>
                <ProgressMeters
                  items={[
                    { label: 'Flight cap', value: policy?.flight_cap ?? 10000, tone: 'blue' },
                    { label: 'Hotel cap', value: policy?.hotel_cap ?? 5000, tone: 'teal' },
                    { label: 'Pending approvals', value: pending || 0, tone: 'orange' },
                  ]}
                />
              </div>
            </div>

            <div className="chart-card">
              <div className="card-title">Quick Actions</div>
              <div className="card-copy">The screens your admins usually need next.</div>
              <div className="page-actions" style={{ marginTop: 18 }}>
                <a href="/biz/approvals" className="btn btn-primary">Review Approvals</a>
                <a href="/biz/members" className="btn btn-ghost">Manage Members</a>
                <a href="/biz/policy" className="btn btn-muted">Update Policy</a>
              </div>
              <div className="info-grid" style={{ marginTop: 18 }}>
                <div className="info-card">
                  <h4>Managers</h4>
                  <strong>{managers.toLocaleString('en-IN')}</strong>
                  <span>People who can guide approvals</span>
                </div>
                <div className="info-card">
                  <h4>Employees</h4>
                  <strong>{employees.toLocaleString('en-IN')}</strong>
                  <span>Travellers using the platform</span>
                </div>
              </div>
            </div>
          </section>

          <section className="table-card" style={{ marginBottom: 0 }}>
            <div className="table-header">
              <div>
                <div className="card-title">Recent Members</div>
                <div className="card-copy">A quick look at the most recent travellers added to your organisation.</div>
              </div>
              <a href="/biz/members" className="btn btn-ghost btn-sm">View all</a>
            </div>
            <table>
              <thead>
                <tr><th>Email</th><th>Department</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">No members have been added yet.</td></tr>
                ) : members.slice(0, 5).map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 700 }}>{member.work_email}</td>
                    <td>{member.dept ?? '--'}</td>
                    <td><span className={`badge ${member.role === 'admin' ? 'badge-blue' : member.role === 'manager' ? 'badge-yellow' : 'badge-gray'}`}>{member.role}</span></td>
                    <td style={{ color: '#64748B' }}>{new Date(member.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {pending > 0 && (
            <section className="table-card">
              <div className="table-header">
                <div>
                  <div className="card-title">Pending Approvals</div>
                  <div className="card-copy">The requests most likely to need attention next.</div>
                </div>
                <a href="/biz/approvals" className="btn btn-primary btn-sm">Review all ({pending})</a>
              </div>
              <table>
                <thead>
                  <tr><th>Requester</th><th>Type</th><th>Amount</th><th>Purpose</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {approvals.filter((item) => item.status === 'pending').slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.requester?.work_email ?? '--'}</td>
                      <td><span className="badge badge-blue">{item.booking_type}</span></td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(item.amount)}</td>
                      <td>{item.purpose}</td>
                      <td style={{ color: '#64748B' }}>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
