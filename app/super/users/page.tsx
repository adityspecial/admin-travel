'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

const ROLES = ['all', 'admin', 'manager', 'employee']

export default function AllUsersPage() {
  const [members, setMembers] = useState<any[]>([])
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

  const { slice: pageMembers, page, setPage, total } = usePagination(filtered, 25)

  return (
    <div>
      <div className="admin-topbar">
        <h2>All Members</h2>
        <span className="topbar-meta">{members.length.toLocaleString('en-IN')} total across all organisations</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="surface-card">
            <div className="table-toolbar">
              <input
                className="toolbar-search"
                style={{ maxWidth: 340 }}
                placeholder="Search by email, org name, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="segmented-row">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    className={`segment-btn ${roleFilter === role ? 'active' : ''}`}
                    onClick={() => setRoleFilter(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                    {role !== 'all' && ` (${members.filter((member) => member.role === role).length})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Organisation</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">No members found.</td></tr>
                ) : pageMembers.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 700 }}>{member.work_email}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{member.biz_organizations?.name ?? '--'}</div>
                      {member.biz_organizations?.org_code && <code>{member.biz_organizations.org_code}</code>}
                    </td>
                    <td style={{ color: '#64748B' }}>{member.dept ?? '--'}</td>
                    <td>
                      <span className={`badge ${member.role === 'admin' ? 'badge-blue' : member.role === 'manager' ? 'badge-yellow' : 'badge-gray'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {new Date(member.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={25} onPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
