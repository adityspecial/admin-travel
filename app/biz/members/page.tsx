'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

const ROLES = ['employee', 'manager', 'admin']

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/admin/biz/members')
      .then((data) => setMembers(data.members ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function changeRole(id: string, role: string) {
    await adminFetch(`/api/admin/biz/members/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)))
  }

  async function changeDept(id: string, dept: string) {
    await adminFetch(`/api/admin/biz/members/${id}`, { method: 'PATCH', body: JSON.stringify({ dept: dept || null }) }).catch(() => {})
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, dept: dept || null } : member)))
  }

  async function removeMember(id: string, email: string) {
    if (!confirm(`Remove ${email} from the organisation?`)) return
    await adminFetch(`/api/admin/biz/members/${id}`, { method: 'DELETE' })
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const { slice: pageMembers, page, setPage, total } = usePagination(members, 25)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Members</h2>
        <span className="topbar-meta">{members.length.toLocaleString('en-IN')} total</span>
      </div>
      <div className="admin-content">
        <div className="table-card">
          <div className="table-header">
            <div>
              <div className="card-title">Organisation Members</div>
              <div className="card-copy">Update departments, roles, and access from one place.</div>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Email</th><th>Department</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="empty-state">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No members found.</td></tr>
              ) : pageMembers.map((member) => (
                <tr key={member.id}>
                  <td style={{ fontWeight: 700 }}>{member.work_email}</td>
                  <td>
                    <input
                      defaultValue={member.dept ?? ''}
                      onBlur={(e) => {
                        if (e.target.value !== (member.dept ?? '')) changeDept(member.id, e.target.value)
                      }}
                      placeholder="Department"
                      style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.3)', fontSize: 12, width: 160 }}
                    />
                  </td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.3)', fontSize: 12, fontWeight: 700 }}
                    >
                      {ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={{ color: '#64748B' }}>{new Date(member.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(member.id, member.work_email)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination total={total} page={page} perPage={25} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
