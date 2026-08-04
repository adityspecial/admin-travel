'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { Users, ShieldCheck, Briefcase, UserCheck, Search } from 'lucide-react'

interface Member {
  id: string
  work_email: string
  role: string
  dept?: string | null
  created_at: string
  biz_organizations?: {
    name: string
    org_code: string
  } | null
}

const ROLES = ['all', 'admin', 'manager', 'employee']

export default function AllUsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    adminFetch('/api/admin/super/users')
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = members
    .filter((member) => roleFilter === 'all' || member.role === roleFilter)
    .filter((member) => {
      if (!search) return true
      const query = search.toLowerCase()
      return (
        (member.work_email ?? '').toLowerCase().includes(query) ||
        (member.biz_organizations?.name ?? '').toLowerCase().includes(query) ||
        (member.biz_organizations?.org_code ?? '').toLowerCase().includes(query) ||
        (member.dept ?? '').toLowerCase().includes(query)
      )
    })

  const adminCount = members.filter((m) => m.role === 'admin').length
  const managerCount = members.filter((m) => m.role === 'manager').length
  const employeeCount = members.filter((m) => m.role === 'employee').length

  const { slice: pageMembers, page, setPage, total } = usePagination(filtered, 25)

  const columns: ColumnDef<Member>[] = [
    {
      key: 'work_email',
      header: 'Work Email',
      render: (m) => <span className="data-table-cell-bold">{m.work_email}</span>,
    },
    {
      key: 'organization',
      header: 'Organisation',
      render: (m) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>
            {m.biz_organizations?.name ?? '--'}
          </div>
          {m.biz_organizations?.org_code && (
            <span className="data-table-code-pill" style={{ marginTop: 2 }}>
              {m.biz_organizations.org_code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Department',
      render: (m) => <span className="data-table-muted-cell">{m.dept || '--'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => {
        const role = (m.role || 'employee').toLowerCase()
        const roleStyle =
          role === 'admin'
            ? { bg: '#dbeafe', color: '#1e40af' }
            : role === 'manager'
            ? { bg: '#fef3c7', color: '#92400e' }
            : { bg: '#f1f5f9', color: '#475569' }
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 99,
              background: roleStyle.bg,
              color: roleStyle.color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {role}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (m) => (
        <span className="data-table-muted-cell" style={{ fontSize: 12.5 }}>
          {new Date(m.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>All Members</h2>
        <span className="topbar-meta">
          {members.length.toLocaleString('en-IN')} total across all organisations
        </span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Stat Cards */}
          <div className="stat-grid">
            <StatCard
              Icon={Users}
              label="Total Members"
              value={members.length}
              sub="Across all MyBiz organisations"
              badge="Directory"
            />
            <StatCard
              Icon={ShieldCheck}
              label="Admins"
              value={adminCount}
              sub="Company policy administrators"
              badge="Access"
            />
            <StatCard
              Icon={Briefcase}
              label="Managers"
              value={managerCount}
              sub="Approval managers"
              badge="Approvers"
            />
            <StatCard
              Icon={UserCheck}
              label="Employees"
              value={employeeCount}
              sub="Standard business travelers"
              badge="Travelers"
            />
          </div>

          {/* DataTable */}
          <DataTable
            title="Organisation Members"
            subtitle="Cross-organisation user directory across all registered corporate accounts"
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 280 }}>
                  <AppInput
                    placeholder="Search email, org, dept..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                    style={{ padding: '8px 12px 8px 36px', fontSize: 13 }}
                  />
                </div>

                <div className="segmented-row">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`segment-btn ${roleFilter === role ? 'active' : ''}`}
                      onClick={() => setRoleFilter(role)}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                      {role !== 'all' && ` (${members.filter((m) => m.role === role).length})`}
                    </button>
                  ))}
                </div>
              </div>
            }
            columns={columns}
            data={pageMembers}
            loading={loading}
            emptyMessage="No members found matching your search filter."
            keyExtractor={(m) => m.id}
            footer={<Pagination total={total} page={page} perPage={25} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
