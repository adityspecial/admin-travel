'use client'
import { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

const ROLES = ['employee', 'manager', 'admin']
const STATUS_OPTIONS = ['Invited', 'Pending Verification', 'Disabled', 'Verified']

export default function MembersPage() {
  const [members,  setMembers]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterStatus,      setFilterStatus]      = useState<string[]>([])
  const [filterRole,        setFilterRole]        = useState('')
  const [filterGroup,       setFilterGroup]       = useState('')
  const [filterReporting,   setFilterReporting]   = useState('')
  const [filterDesignation, setFilterDesignation] = useState('')
  const [inviteEmail,  setInviteEmail]  = useState('')
  const [inviting,     setInviting]     = useState(false)
  const [inviteMsg,    setInviteMsg]    = useState('')
  const [csvPreview,   setCsvPreview]   = useState<string[]>([])
  const [csvUploading, setCsvUploading] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminFetch('/api/admin/biz/members')
      .then(d => setMembers(d.members ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function changeRole(id: string, role: string) {
    await adminFetch(`/api/admin/biz/members/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  async function removeMember(id: string, email: string) {
    if (!confirm(`Remove ${email} from the organisation?`)) return
    await adminFetch(`/api/admin/biz/members/${id}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg('')
    try {
      await adminFetch('/api/admin/biz/members', {
        method: 'POST',
        body: JSON.stringify({ work_email: inviteEmail.trim(), role: 'employee' }),
      })
      setInviteMsg(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      adminFetch('/api/admin/biz/members').then(d => setMembers(d.members ?? []))
    } catch (e: any) { setInviteMsg(e.message ?? 'Failed') }
    setInviting(false)
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const emails: string[] = []
      for (const line of lines) {
        const first = line.split(',')[0].replace(/["']/g, '').trim().toLowerCase()
        if (first.includes('@') && first !== 'work_email' && first !== 'email') emails.push(first)
      }
      setCsvPreview(emails)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function confirmCsvUpload() {
    if (!csvPreview.length) return
    setCsvUploading(true); setInviteMsg('')
    try {
      const { added, total } = await adminFetch('/api/admin/biz/members/bulk', {
        method: 'POST',
        body: JSON.stringify({ emails: csvPreview }),
      })
      setInviteMsg(`${added} of ${total} employees invited successfully.`)
      setCsvPreview([])
      adminFetch('/api/admin/biz/members').then(d => setMembers(d.members ?? []))
    } catch (err: any) { setInviteMsg(err.message ?? 'Bulk invite failed') }
    setCsvUploading(false)
  }

  const groups       = [...new Set(members.map(m => m.dept).filter(Boolean))]
  const reportingTos = [...new Set(members.map(m => m.reporting_to).filter(Boolean))]
  const designations = [...new Set(members.map(m => m.designation).filter(Boolean))]

  const filtered = members.filter(m => {
    if (search && !m.work_email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole        && m.role        !== filterRole)        return false
    if (filterGroup       && m.dept        !== filterGroup)       return false
    if (filterReporting   && m.reporting_to !== filterReporting)  return false
    if (filterDesignation && m.designation !== filterDesignation) return false
    // filterStatus: status column not in biz_members yet — filter is a no-op until schema is extended
    return true
  })

  const { slice: pageMembers, page, setPage, total } = usePagination(filtered, 25)

  const toggleSelect = (id: string) => setSelected(prev => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id); else s.add(id)
    return s
  })
  const toggleAll = () => setSelected(prev => prev.size === pageMembers.length ? new Set() : new Set(pageMembers.map(m => m.id)))

  const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    admin:    { bg: '#FEF2F2', color: '#DC2626' },
    manager:  { bg: '#EFF6FF', color: '#1D4ED8' },
    employee: { bg: '#F0FDF4', color: '#15803D' },
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* Left sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '24px 20px', overflowY: 'auto', position: 'sticky', top: 54, height: 'calc(100vh - 54px)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: 16 }}>FILTERS</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Groups</div>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }}>
            <option value="">Search and Select…</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Reporting To</div>
          <select value={filterReporting} onChange={e => setFilterReporting(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }}>
            <option value="">Search and Select…</option>
            {reportingTos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Designation</div>
          <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }}>
            <option value="">Search and Select…</option>
            {designations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Role</div>
          {ROLES.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name="role" checked={filterRole === r} onChange={() => setFilterRole(filterRole === r ? '' : r)} style={{ accentColor: '#E31E24' }} />
              <span style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{r}</span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Employee Status</div>
          {STATUS_OPTIONS.map(s => {
            const count = s === 'Verified' ? members.filter(m => m.status !== 'invited').length
                        : s === 'Invited'  ? members.filter(m => m.status === 'invited').length : 0
            return (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={filterStatus.includes(s)} onChange={e => setFilterStatus(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s))} style={{ accentColor: '#E31E24' }} />
                <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{s}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>({count})</span>
              </label>
            )
          })}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Add Employees panel */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>Add Employees</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com" type="email"
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', width: 220 }} />
                <button type="submit" disabled={inviting} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', background: '#E31E24', color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                  + {inviting ? 'Inviting…' : 'Invite via EMAIL'}
                </button>
              </form>
              <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvFile} />
              <button onClick={() => csvInputRef.current?.click()} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', background: '#E31E24', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                📄 Bulk Upload / Edit (CSV)
              </button>
            </div>
            {inviteMsg && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 8, fontWeight: 600 }}>{inviteMsg}</div>}
            {csvPreview.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>
                  Found {csvPreview.length} email{csvPreview.length !== 1 ? 's' : ''} — confirm to invite all
                </div>
                <div style={{ maxHeight: 80, overflowY: 'auto', marginBottom: 10 }}>
                  {csvPreview.map(e => <div key={e} style={{ fontSize: 11, color: '#374151' }}>{e}</div>)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={confirmCsvUpload} disabled={csvUploading} style={{ padding: '6px 14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {csvUploading ? 'Inviting…' : `Invite ${csvPreview.length}`}
                  </button>
                  <button onClick={() => setCsvPreview([])} style={{ padding: '6px 14px', background: 'none', border: '1px solid #BFDBFE', borderRadius: 6, fontWeight: 600, fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Invitations will be sent via <strong>EMAIL</strong></div>
          </div>
        </div>

        {/* Employee table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>
                {loading ? 'Employees' : `Employees (${filtered.length})`}
              </div>
              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 3, background: '#7C3AED', color: '#fff', letterSpacing: '0.04em' }}>NEW</span>
              <button style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                🖊 Update Preferences
              </button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Employee Name / Email"
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', width: 220,
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") no-repeat 10px center` }} />
          </div>

          {/* Action bar */}
          {selected.size > 0 && (
            <div style={{ padding: '10px 20px', background: '#FFF7ED', borderBottom: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>{selected.size} selected</span>
              <button style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, background: 'none', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                onClick={() => { if (confirm(`Remove ${selected.size} member(s)?`)) selected.forEach(id => { const m = members.find(x => x.id === id); if (m) removeMember(id, m.work_email) }) }}>
                🗑 Remove
              </button>
            </div>
          )}

          {/* Edit toolbar */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700, marginRight: 10 }}>Edit:</span>
            {['Manager', 'Role', 'Group'].map((label, i) => (
              <span key={label} style={{ fontSize: 12, color: '#E31E24', fontWeight: 700, padding: '4px 12px', borderRadius: 99, border: i === 1 ? '1.5px solid #E31E24' : 'none', cursor: 'pointer', marginRight: 4 }}>
                {label}{i === 1 && <span style={{ fontSize: 10, marginLeft: 4, background: '#E31E24', color: '#fff', borderRadius: 3, padding: '1px 4px' }}>new</span>}
              </span>
            ))}
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700, marginLeft: 10, marginRight: 10 }}>Help:</span>
            <span style={{ fontSize: 12, color: '#E31E24', fontWeight: 700, cursor: 'pointer' }}>Re-Invite</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ width: 40, padding: '12px 16px' }}>
                  <input type="checkbox" checked={selected.size === pageMembers.length && pageMembers.length > 0} onChange={toggleAll} style={{ accentColor: '#E31E24' }} />
                </th>
                {['EMPLOYEE', 'EMAIL', 'ROLE', 'GROUP', 'JOINED', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>No Employee(s) found</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try removing some filters to see results.</div>
                  </td>
                </tr>
              ) : pageMembers.map(m => {
                const rc = ROLE_COLORS[m.role] ?? { bg: '#F3F4F6', color: '#374151' }
                const initials = (m.work_email ?? '?')[0].toUpperCase()
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} style={{ accentColor: '#E31E24' }} />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E31E24', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                          {m.work_email?.split('@')[0] ?? '—'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: '#6B7280' }}>{m.work_email}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: rc.color, background: rc.bg, outline: 'none', cursor: 'pointer' }}>
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: '#9CA3AF' }}>{m.dept ?? '—'}</td>
                    <td style={{ padding: '12px 12px', fontSize: 12, color: '#9CA3AF' }}>
                      {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <button onClick={() => removeMember(m.id, m.work_email)} style={{
                        fontSize: 12, color: '#DC2626', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer',
                      }}>Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
            <Pagination total={total} page={page} perPage={25} onPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
