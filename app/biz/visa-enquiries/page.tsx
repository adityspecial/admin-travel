'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'

interface Enquiry {
  id: string; slug: string; country: string; full_name: string
  email: string; phone: string; passport_number: string
  travel_date: string; return_date: string | null; num_travellers: number
  notes: string | null; status: string; created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#D97706',
  contacted: '#2563EB',
  completed: '#16A34A',
  cancelled: '#DC2626',
}

const PAGE_SIZE = 20

export default function BizVisaEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [status,    setStatus]    = useState('')
  const [page,      setPage]      = useState(1)
  const [msg,       setMsg]       = useState('')

  const load = useCallback((s: string, p: number) => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(p) })
    if (s) qs.set('status', s)
    adminFetch(`/api/admin/biz/visa/enquiries?${qs}`)
      .then((d: { enquiries: Enquiry[]; total: number }) => {
        setEnquiries(d.enquiries ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(status, page) }, [page])

  async function updateStatus(id: string, newStatus: string) {
    await adminFetch(`/api/admin/biz/visa/enquiries?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
    flash('Status updated.')
    load(status, page)
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111' }}>Visa Enquiries</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>{total} enquiries from your employees</p>
        </div>
        {msg && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{msg}</span>}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'pending', 'contacted', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); load(s, 1) }}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: status === s ? '#2563EB' : '#fff', color: status === s ? '#fff' : '#374151' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading…</div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>No enquiries yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Country', 'Name', 'Email', 'Phone', 'Passport', 'Travel Date', 'Return', 'Pax', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '8px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#111' }}>{e.country}</td>
                  <td style={{ padding: '8px 14px', color: '#374151' }}>{e.full_name}</td>
                  <td style={{ padding: '8px 14px', color: '#374151' }}>{e.email}</td>
                  <td style={{ padding: '8px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{e.phone}</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>{e.passport_number}</td>
                  <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>{e.travel_date}</td>
                  <td style={{ padding: '8px 14px', whiteSpace: 'nowrap', color: '#6B7280' }}>{e.return_date ?? '—'}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>{e.num_travellers}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: (STATUS_COLORS[e.status] ?? '#6B7280') + '20',
                      color: STATUS_COLORS[e.status] ?? '#6B7280',
                      border: `1px solid ${(STATUS_COLORS[e.status] ?? '#6B7280')}50` }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, cursor: 'pointer' }}>
                      <option value="pending">pending</option>
                      <option value="contacted">contacted</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#fff' }}>← Prev</button>
          <span style={{ fontSize: 13, color: '#374151' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600 }}>Next →</button>
        </div>
      )}
    </div>
  )
}
