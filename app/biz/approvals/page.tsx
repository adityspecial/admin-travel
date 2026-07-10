'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'

type Tab = 'pending' | 'expired' | 'all'

function ageLabel(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const h = diff / 3600000
  if (h < 3)  return '<3h'
  if (h < 12) return '3-12h'
  return '>12h'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<Tab>('pending')
  const [search,    setSearch]    = useState('')

  // Sidebar filter state
  const [filterPolicy,    setFilterPolicy]   = useState<string[]>([])
  const [filterApprover,  setFilterApprover] = useState('')
  const [filterTraveller, setFilterTraveller]= useState('')
  const [filterDateReq,   setFilterDateReq]  = useState('')
  const [filterAge,       setFilterAge]      = useState('')
  const [filterDateTravel,setFilterDateTravel]=useState('')

  useEffect(() => {
    adminFetch('/api/admin/biz/approvals?status=all')
      .then(d => setApprovals(d.approvals ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function doAction(id: string, act: 'approve' | 'reject') {
    await adminFetch(`/api/admin/biz/approvals/${id}`, {
      method: 'PATCH', body: JSON.stringify({ action: act }),
    })
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: act === 'approve' ? 'approved' : 'rejected' } : a))
  }

  const now = new Date()
  function isExpired(a: any) {
    return a.expires_at && new Date(a.expires_at) < now
  }
  function matchesDateReq(a: any) {
    if (!filterDateReq) return true
    const d = new Date(a.created_at)
    const today = new Date(); today.setHours(0,0,0,0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
    if (filterDateReq === 'today')     return d >= today
    if (filterDateReq === 'yesterday') return d >= yesterday && d < today
    if (filterDateReq === 'last7')     { const w = new Date(today); w.setDate(today.getDate()-7); return d >= w }
    return true
  }

  const filtered = useMemo(() => {
    let list = approvals
    if (tab === 'pending')  list = list.filter(a => a.status === 'pending' && !isExpired(a))
    if (tab === 'expired')  list = list.filter(a => isExpired(a))
    if (tab === 'all')      list = [...list]
    if (search)             list = list.filter(a => a.id.includes(search) || (a.requester?.work_email ?? '').includes(search))
    if (filterApprover)     list = list.filter(a => (a.reviewer?.work_email ?? '').toLowerCase().includes(filterApprover.toLowerCase()))
    if (filterTraveller)    list = list.filter(a => (a.requester?.work_email ?? '').toLowerCase().includes(filterTraveller.toLowerCase()))
    if (filterAge)          list = list.filter(a => ageLabel(a.created_at) === filterAge)
    list = list.filter(matchesDateReq)
    return list
  }, [approvals, tab, search, filterApprover, filterTraveller, filterAge, filterDateReq])

  const counts = {
    pending: approvals.filter(a => a.status === 'pending' && !isExpired(a)).length,
    expired: approvals.filter(a => isExpired(a)).length,
    all:     approvals.length,
  }

  const SIDEBAR_SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )

  const RadioItem = ({ label, value, group, current, onChange }: { label: string; value: string; group: string; current: string; onChange: (v: string) => void }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
      <input type="radio" name={group} checked={current === value} onChange={() => onChange(value === current ? '' : value)} style={{ accentColor: '#E31E24' }} />
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
    </label>
  )

  const CheckItem = ({ label, value, arr, setArr }: { label: string; value: string; arr: string[]; setArr: (v: string[]) => void }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={arr.includes(value)} onChange={e => setArr(e.target.checked ? [...arr, value] : arr.filter(x => x !== value))} style={{ accentColor: '#E31E24' }} />
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
    </label>
  )

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* ── Left sidebar ── */}
      <aside style={{ width: 230, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '24px 20px', overflowY: 'auto', position: 'sticky', top: 54, height: 'calc(100vh - 54px)' }}>

        <SIDEBAR_SECTION title="Policy Type">
          <CheckItem label="In Policy"     value="in"  arr={filterPolicy}    setArr={setFilterPolicy} />
          <CheckItem label="Out of Policy" value="out" arr={filterPolicy}    setArr={setFilterPolicy} />
        </SIDEBAR_SECTION>

        <SIDEBAR_SECTION title="Approver">
          <input value={filterApprover} onChange={e => setFilterApprover(e.target.value)}
            placeholder="Search by Approver Email ID"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </SIDEBAR_SECTION>

        <SIDEBAR_SECTION title="Traveller">
          <input value={filterTraveller} onChange={e => setFilterTraveller(e.target.value)}
            placeholder="Search by Traveller Email ID"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </SIDEBAR_SECTION>

        <SIDEBAR_SECTION title="Date of Request">
          {[['today','Today'],['yesterday','Yesterday'],['last7','Last 7 days']].map(([v,l]) => (
            <RadioItem key={v} label={l} value={v} group="dateReq" current={filterDateReq} onChange={setFilterDateReq} />
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="radio" name="dateReq" checked={filterDateReq === 'custom'} onChange={() => setFilterDateReq('custom')} style={{ accentColor: '#E31E24' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>Your Dates</span>
          </label>
        </SIDEBAR_SECTION>

        <SIDEBAR_SECTION title="Age of Request">
          {[['<3h','Less than 3 hours'],['3-12h','3- 12 hours'],['>12h','Greater than 12 hours']].map(([v,l]) => (
            <RadioItem key={v} label={l} value={v} group="age" current={filterAge} onChange={setFilterAge} />
          ))}
        </SIDEBAR_SECTION>

        <SIDEBAR_SECTION title="Date of Travel">
          {[['today','Today'],['tomorrow','Tomorrow'],['next7','Next Seven Days']].map(([v,l]) => (
            <RadioItem key={v} label={l} value={v} group="dateTravel" current={filterDateTravel} onChange={setFilterDateTravel} />
          ))}
        </SIDEBAR_SECTION>

        {(filterApprover || filterTraveller || filterDateReq || filterAge || filterDateTravel || filterPolicy.length > 0) && (
          <button onClick={() => { setFilterPolicy([]); setFilterApprover(''); setFilterTraveller(''); setFilterDateReq(''); setFilterAge(''); setFilterDateTravel('') }}
            style={{ fontSize: 12, color: '#E31E24', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Clear All Filters
          </button>
        )}
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Manage Requests &amp; Bookings</h1>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by Request ID"
            style={{ padding: '9px 14px 9px 36px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', width: 240, background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") no-repeat 10px center` }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 20 }}>
          {([['pending','PENDING REQUESTS'],['expired','EXPIRED REQUESTS'],['all','ALL BOOKINGS']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.03em',
              color: tab === key ? '#E31E24' : '#6B7280',
              borderBottom: tab === key ? '2px solid #E31E24' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {label}
              <span style={{ fontSize: 11, marginLeft: 6, color: tab === key ? '#E31E24' : '#9CA3AF' }}>({counts[key]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                {['TRIP DETAILS','TRAVELLER','APPROVER','DATE OF TRAVEL ↑','AGE OF REQUEST','↑ EXPENSE ↑','ACTIONS'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>No Requests Found.</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try removing some filters to see results.</div>
                  </td>
                </tr>
              ) : filtered.map(a => {
                const fd = a.flight_data
                const hd = a.hotel_data
                const travelDate = fd?.date || fd?.departure_date || hd?.check_in || hd?.checkIn || ''
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a2e' }}>
                        {a.booking_type === 'flight' && fd ? `${fd.from || fd.origin} → ${fd.to || fd.destination}` :
                         a.booking_type === 'hotel'  && hd ? (hd.hotelName || hd.hotel_name || 'Hotel') : '--'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        <span style={{ padding: '1px 6px', borderRadius: 3, background: a.booking_type === 'flight' ? '#EFF6FF' : '#F0FDF4', color: a.booking_type === 'flight' ? '#1D4ED8' : '#15803D', fontWeight: 700 }}>
                          {a.booking_type}
                        </span>
                        {fd?.airline && <span style={{ marginLeft: 6 }}>{fd.airline}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: '#374151' }}>{a.requester?.work_email ?? '—'}</div>
                      {a.dept && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.dept}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>
                      {a.reviewer?.work_email ?? <span style={{ color: '#D1D5DB' }}>Auto-assign</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#374151' }}>
                      {travelDate ? fmtDate(travelDate) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: ageLabel(a.created_at) === '<3h' ? '#F0FDF4' : ageLabel(a.created_at) === '3-12h' ? '#FFFBEB' : '#FEF2F2',
                        color:      ageLabel(a.created_at) === '<3h' ? '#15803D' : ageLabel(a.created_at) === '3-12h' ? '#B45309' : '#DC2626',
                      }}>{ageLabel(a.created_at)}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800 }}>
                      ₹{(a.amount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => doAction(a.id, 'approve')} style={{
                              padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                              background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', cursor: 'pointer',
                            }}>Approve</button>
                            <button onClick={() => doAction(a.id, 'reject')} style={{
                              padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                              background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer',
                            }}>Reject</button>
                          </>
                        )}
                        <Link href={`/biz/approvals/${a.id}`} style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>View</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
