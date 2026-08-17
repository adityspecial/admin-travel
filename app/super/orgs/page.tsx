'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PermissionDenied } from '@/components/ui/PermissionDenied'
import { Pencil, Power, Plus } from 'lucide-react'

function formatCurrency(value: number) {
  return typeof value === 'number' ? `Rs ${value.toLocaleString('en-IN')}` : 'Rs 0'
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmOrg, setConfirmOrg] = useState<{ id: string; name: string; is_active: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const { slice: pageOrgs, page, setPage, total } = usePagination(orgs, 20)

  useEffect(() => {
    adminFetch('/api/admin/super/orgs')
      .then((data) => setOrgs(data.orgs ?? []))
      .catch((e) => { setError(e.message); setPermissionDenied(!!e.isPermissionDenied) })
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirmToggle() {
    if (!confirmOrg) return
    setActionLoading(true)
    try {
      const newStatus = !confirmOrg.is_active
      await adminFetch(`/api/admin/super/orgs/${confirmOrg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      })
      setOrgs((prev) => prev.map((org) => (org.id === confirmOrg.id ? { ...org, is_active: newStatus } : org)))
      setConfirmOrg(null)
    } finally {
      setActionLoading(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (org) => (
        <span className="data-table-cell-bold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {org.name}
          {org.escalated && (
            <span title={org.escalation_reason ?? 'Escalated'} style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '2px 7px', borderRadius: 99 }}>
              ⚠ ESCALATED
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'org_code',
      header: 'Org Code',
      render: (org) => <span className="data-table-code-pill">{org.org_code}</span>,
    },
    {
      key: 'flight_cap',
      header: 'Flight Cap',
      render: (org) => formatCurrency(org.flight_cap),
    },
    {
      key: 'hotel_cap',
      header: 'Hotel Cap',
      render: (org) => formatCurrency(org.hotel_cap),
    },
    {
      key: 'gst_number',
      header: 'GST',
      render: (org) => <span className="data-table-muted-cell">{org.gst_number ?? '--'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (org) => (
        <span className={`data-table-status-pill ${org.is_active ? 'active' : 'inactive'}`}>
          {org.is_active ? '●Active' : '●Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (org) => (
        <div className="data-table-actions">
          <a href={`/super/orgs/${org.id}`} className="data-table-btn data-table-btn-edit">
            <Pencil size={12} />
            <span>Edit</span>
          </a>
          <button
            className={`data-table-btn ${org.is_active ? 'data-table-btn-danger' : 'data-table-btn-success'}`}
            onClick={() => setConfirmOrg({ id: org.id, name: org.name, is_active: org.is_active })}
          >
            <Power size={12} />
            <span>{org.is_active ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Organisations</h2>
        <a href="/super/orgs/new" className="btn btn-primary btn-sm orgs-btn-icon-gap">
          <Plus size={14} />
          <span>New Org</span>
        </a>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          {permissionDenied ? (
            <div className="table-card"><PermissionDenied message={error} /></div>
          ) : (
            <DataTable
              title="Business Accounts"
              subtitle="Manage active organisations, caps, and basic configuration."
              columns={columns}
              data={pageOrgs}
              loading={loading}
              emptyMessage="No organisations configured yet."
              keyExtractor={(org) => org.id}
              footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
            />
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmOrg)}
        title={confirmOrg?.is_active ? 'Confirm Organisation Deactivation' : 'Confirm Organisation Activation'}
        tone={confirmOrg?.is_active ? 'danger' : 'success'}
        confirmLabel={confirmOrg?.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
        loading={actionLoading}
        message={
          confirmOrg ? (
            <span>
              Are you sure you want to {confirmOrg.is_active ? 'deactivate' : 'activate'} <strong>{confirmOrg.name}</strong>?
              {confirmOrg.is_active ? ' This will temporarily restrict platform access for users under this organisation.' : ' This will enable platform access for users under this organisation.'}
            </span>
          ) : null
        }
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmOrg(null)}
      />
    </div>
  )
}
