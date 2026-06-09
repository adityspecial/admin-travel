'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { slice: pageOrgs, page, setPage, total } = usePagination(orgs, 20)

  useEffect(() => {
    adminFetch('/api/admin/super/orgs')
      .then((data) => setOrgs(data.orgs ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, current: boolean) {
    await adminFetch(`/api/admin/super/orgs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !current }),
    })
    setOrgs((prev) => prev.map((org) => (org.id === id ? { ...org, is_active: !current } : org)))
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Organisations</h2>
        <a href="/super/orgs/new" className="btn btn-primary btn-sm">New Org</a>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Business Accounts</div>
                <div className="card-copy">Manage active organisations, caps, and basic configuration.</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Org Code</th>
                  <th>Flight Cap</th>
                  <th>Hotel Cap</th>
                  <th>GST</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
                ) : orgs.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No organisations yet.</td></tr>
                ) : pageOrgs.map((org) => (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 800 }}>{org.name}</td>
                    <td><code>{org.org_code}</code></td>
                    <td>{formatCurrency(org.flight_cap)}</td>
                    <td>{formatCurrency(org.hotel_cap)}</td>
                    <td style={{ color: '#64748B' }}>{org.gst_number ?? '--'}</td>
                    <td>
                      <span className={`badge ${org.is_active ? 'badge-green' : 'badge-red'}`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="page-actions">
                        <a href={`/super/orgs/${org.id}`} className="btn btn-ghost btn-sm">Edit</a>
                        <button
                          className={`btn btn-sm ${org.is_active ? 'btn-danger' : 'btn-ghost'}`}
                          onClick={() => toggleActive(org.id, org.is_active)}
                        >
                          {org.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
