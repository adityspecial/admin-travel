'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'
import { AppInput } from '@/components/ui/AppInput'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Building2, Hash, Globe, Plane, Bed, ShieldCheck, FileText, ArrowLeft, Trash2, Save, Check, Users, Calendar, Activity, UserX } from 'lucide-react'

const ROLES = ['employee', 'manager', 'admin']

export default function EditOrgPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [org,            setOrg]            = useState<any>(null)
  const [members,        setMembers]        = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState('')
  const [deleting,       setDeleting]       = useState(false)
  const [showDeleteModal,setShowDeleteModal] = useState(false)

  const [confirmMember, setConfirmMember]   = useState<{ id: string; email: string } | null>(null)
  const [removeLoading, setRemoveLoading]   = useState(false)

  const [form, setForm] = useState({
    name:          '',
    org_code:      '',
    domain:        '',
    flight_cap:    '',
    hotel_cap:     '',
    insurance_cap: '',
    gst_number:    '',
    is_active:     true,
  })

  useEffect(() => {
    adminFetch(`/api/admin/super/orgs/${id}`)
      .then(d => {
        setOrg(d.org)
        setMembers(d.org.biz_members ?? [])
        setForm({
          name:          d.org.name ?? '',
          org_code:      d.org.org_code ?? '',
          domain:        d.org.domain ?? '',
          flight_cap:    String(d.org.flight_cap    ?? 10000),
          hotel_cap:     String(d.org.hotel_cap     ?? 5000),
          insurance_cap: String(d.org.insurance_cap ?? 3000),
          gst_number:    d.org.gst_number ?? '',
          is_active:     d.org.is_active  ?? true,
        })
      })
      .catch(() => setError('Organisation not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const d = await adminFetch(`/api/admin/super/orgs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name:         form.name,
          orgCode:      form.org_code,
          domain:       form.domain || null,
          flightCap:    Number(form.flight_cap),
          hotelCap:     Number(form.hotel_cap),
          insuranceCap: Number(form.insurance_cap),
          gstNumber:    form.gst_number || null,
          isActive:     form.is_active,
        }),
      })
      setOrg(d.org)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDeleteOrg() {
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/orgs/${id}`, { method: 'DELETE' })
      router.replace('/super/orgs')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function changeMemberRole(memberId: string, role: string) {
    await adminFetch(`/api/admin/biz/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      orgId: id,
    }).catch(() => {})
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
  }

  async function handleConfirmRemoveMember() {
    if (!confirmMember) return
    setRemoveLoading(true)
    try {
      await adminFetch(`/api/admin/biz/members/${confirmMember.id}`, { method: 'DELETE', orgId: id })
      setMembers(prev => prev.filter(m => m.id !== confirmMember.id))
      setConfirmMember(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemoveLoading(false)
    }
  }

  const memberColumns: ColumnDef<any>[] = [
    {
      key: 'work_email',
      header: 'Email',
      render: (m) => <span className="data-table-cell-bold">{m.work_email}</span>,
    },
    {
      key: 'dept',
      header: 'Department',
      render: (m) => <span className="data-table-muted-cell">{m.dept ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => (
        <select
          value={m.role}
          onChange={(e) => changeMemberRole(m.id, e.target.value)}
          className="orgs-role-select"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (m) => (
        <span className="data-table-muted-cell orgs-joined-cell">
          {new Date(m.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <button
          type="button"
          className="data-table-btn data-table-btn-danger"
          onClick={() => setConfirmMember({ id: m.id, email: m.work_email })}
        >
          <UserX size={12} />
          <span>Remove</span>
        </button>
      ),
    },
  ]

  if (loading) return <div className="admin-content"><p className="orgs-loading-text">Loading organisation details…</p></div>

  return (
    <div>
      <div className="admin-topbar">
        <div className="orgs-header-left">
          <button
            className="btn btn-ghost btn-sm orgs-btn-icon-gap"
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <h2>Edit Organisation</h2>
        </div>
        <div className="orgs-header-actions">
          <button
            className="btn btn-sm orgs-btn-delete"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            <Trash2 size={14} />
            <span>Delete Org</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="login-error orgs-mb-16">{error}</div>}
        {saved && (
          <div className="orgs-success-banner orgs-mb-16">
            <Check size={16} />
            <span>Changes saved successfully.</span>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Edit form */}
          <form className="explore-admin-section" onSubmit={handleSave}>
            <div className="dashboard-card-header orgs-card-header-mb20">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                  <Building2 size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Organisation Details</h3>
                  <p className="dashboard-card-subtitle">Configure company settings, caps, and access policies</p>
                </div>
              </div>
            </div>

            <AppInput
              label="Company Name"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Acme Corporation"
              icon={<Building2 size={16} />}
            />

            <AppInput
              label="Org Code"
              required
              value={form.org_code}
              onChange={e => setForm(f => ({ ...f, org_code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              maxLength={12}
              placeholder="IITDH9597"
              helperText="Internal reference only — auto-generated, not used to join anymore."
              icon={<Hash size={16} />}
            />

            <AppInput
              label="Google Workspace Domain"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value.toLowerCase().trim() }))}
              placeholder="iitdh.ac.in"
              helperText="Employees signing in with a Google Workspace account on this domain join here automatically."
              icon={<Globe size={16} />}
            />

            <div className="orgs-caps-grid">
              <AppInput
                label="Flight Cap (₹ per trip)"
                type="number"
                min="0"
                value={form.flight_cap}
                onChange={e => setForm(f => ({ ...f, flight_cap: e.target.value }))}
                placeholder="10000"
                icon={<Plane size={15} />}
              />
              <AppInput
                label="Hotel Cap (₹ per night)"
                type="number"
                min="0"
                value={form.hotel_cap}
                onChange={e => setForm(f => ({ ...f, hotel_cap: e.target.value }))}
                placeholder="5000"
                icon={<Bed size={15} />}
              />
              <AppInput
                label="Insurance Cap (₹ per policy)"
                type="number"
                min="0"
                value={form.insurance_cap}
                onChange={e => setForm(f => ({ ...f, insurance_cap: e.target.value }))}
                placeholder="3000"
                icon={<ShieldCheck size={15} />}
              />
            </div>

            <AppInput
              label="GST Number"
              value={form.gst_number}
              onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))}
              placeholder="22AAAAA0000A1Z5"
              icon={<FileText size={16} />}
            />

            <div className="app-input-group orgs-checkbox-row">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="orgs-checkbox"
              />
              <label htmlFor="is_active" className="orgs-checkbox-label">
                Organisation is active
              </label>
            </div>

            <div className="orgs-form-actions">
              <button
                className="btn btn-primary orgs-btn-save"
                type="submit"
                disabled={saving}
              >
                <Save size={15} />
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
              <button
                className="btn btn-ghost orgs-btn-cancel-pad"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Org stats */}
          <div className="explore-admin-section orgs-panel-pad24">
            <div className="dashboard-card-header orgs-card-header-mb16">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                  <Activity size={19} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Info</h3>
                  <p className="dashboard-card-subtitle">Overview of members and creation metadata</p>
                </div>
              </div>
            </div>

            {[
              {
                label: 'Members',
                icon: Users,
                value: `${members.length} members`,
              },
              {
                label: 'Status',
                icon: Activity,
                value: (
                  <span className={`data-table-status-pill ${org?.is_active ? 'active' : 'inactive'}`}>
                    {org?.is_active ? '● Active' : '● Inactive'}
                  </span>
                ),
              },
              {
                label: 'Created',
                icon: Calendar,
                value: org?.created_at ? new Date(org.created_at).toLocaleDateString('en-IN') : '—',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="orgs-info-row"
              >
                <div className="orgs-info-row-left">
                  <row.icon size={15} color="#64748b" />
                  <span className="orgs-info-label">{row.label}</span>
                </div>
                <span className="orgs-info-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members DataTable */}
        <div className="orgs-mt-24">
          <DataTable
            title={`Members (${members.length})`}
            subtitle="Users linked to this organisation"
            columns={memberColumns}
            data={members}
            loading={false}
            emptyMessage="No members enrolled in this organisation yet."
            keyExtractor={(m) => m.id}
          />
        </div>
      </div>

      {/* Confirm Delete Org Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Organisation Deletion"
        tone="danger"
        confirmLabel="Yes, Delete Organisation"
        loading={deleting}
        message={
          <span>
            Are you sure you want to delete organisation <strong>{org?.name}</strong>? This action is permanent and cannot be undone.
          </span>
        }
        onConfirm={handleConfirmDeleteOrg}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Confirm Remove Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmMember)}
        title="Confirm Member Removal"
        tone="danger"
        confirmLabel="Yes, Remove Member"
        loading={removeLoading}
        message={
          confirmMember ? (
            <span>
              Are you sure you want to remove <strong>{confirmMember.email}</strong> from this organisation?
            </span>
          ) : null
        }
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setConfirmMember(null)}
      />
    </div>
  )
}
