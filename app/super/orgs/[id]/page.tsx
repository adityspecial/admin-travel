'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'

const ROLES = ['employee', 'manager', 'admin']

export default function EditOrgPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [org,      setOrg]      = useState<any>(null)
  const [members,  setMembers]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    if (!confirm(`Delete organisation "${org?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/orgs/${id}`, { method: 'DELETE' })
      router.replace('/super/orgs')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
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

  async function removeMember(memberId: string, email: string) {
    if (!confirm(`Remove ${email} from this organisation?`)) return
    await adminFetch(`/api/admin/biz/members/${memberId}`, { method: 'DELETE', orgId: id }).catch(() => {})
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  if (loading) return <div className="admin-content"><p style={{ color: '#94A3B8' }}>Loading…</p></div>

  return (
    <div>
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
          <h2>Edit Organisation</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm"
            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete Org'}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
        {saved  && <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>Changes saved.</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Edit form */}
          <form className="form-card" onSubmit={handleSave}>
            <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700 }}>Organisation Details</h3>

            <div className="form-group">
              <label>Company Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Org Code</label>
              <input
                value={form.org_code}
                onChange={e => setForm(f => ({ ...f, org_code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                maxLength={12}
                required
              />
              <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>Internal reference only — auto-generated, not used to join anymore.</span>
            </div>

            <div className="form-group">
              <label>Google Workspace Domain</label>
              <input
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value.toLowerCase().trim() }))}
                placeholder="acme.com"
              />
              <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>Employees signing in with a Google Workspace account on this domain join here automatically.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Flight Cap (₹ per trip)</label>
                <input type="number" min="0" value={form.flight_cap} onChange={e => setForm(f => ({ ...f, flight_cap: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Hotel Cap (₹ per night)</label>
                <input type="number" min="0" value={form.hotel_cap} onChange={e => setForm(f => ({ ...f, hotel_cap: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Insurance Cap (₹ per policy)</label>
                <input type="number" min="0" value={form.insurance_cap} onChange={e => setForm(f => ({ ...f, insurance_cap: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label>GST Number</label>
              <input value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="is_active" style={{ margin: 0, fontWeight: 600 }}>Organisation is active</label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => router.back()}>Cancel</button>
            </div>
          </form>

          {/* Org stats */}
          <div className="form-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Info</h3>
            {[
              { label: 'Members',   value: `${members.length} members` },
              { label: 'Status',    value: <span className={`badge ${org?.is_active ? 'badge-green' : 'badge-red'}`}>{org?.is_active ? 'Active' : 'Inactive'}</span> },
              { label: 'Created',   value: org?.created_at ? new Date(org.created_at).toLocaleDateString('en-IN') : '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members table */}
        <div className="table-card" style={{ marginTop: 24 }}>
          <div className="table-header">
            <h3>Members ({members.length})</h3>
          </div>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 32 }}>No members yet</div>
          ) : (
            <table>
              <thead>
                <tr><th>Email</th><th>Department</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.work_email}</td>
                    <td style={{ color: '#64748B' }}>{m.dept ?? '—'}</td>
                    <td>
                      <select
                        value={m.role}
                        onChange={e => changeMemberRole(m.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </td>
                    <td style={{ color: '#64748B', fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id, m.work_email)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
