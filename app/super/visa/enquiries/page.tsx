'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'

interface Enquiry {
  id: string; slug: string; country: string; full_name: string
  email: string; phone: string; passport_number: string
  travel_date: string; return_date: string | null; num_travellers: number
  notes: string | null; status: string; created_at: string
}

const PAGE_SIZE = 20

export default function VisaEnquiriesPage() {
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
    adminFetch(`/api/admin/super/visa/enquiries?${qs}`)
      .then((d: { enquiries: Enquiry[]; total: number }) => {
        setEnquiries(d.enquiries ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(status, page) }, [page])

  async function updateStatus(id: string, newStatus: string) {
    await adminFetch(`/api/admin/super/visa/enquiries?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
    flash('Status updated.')
    load(status, page)
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="visaenq-page">
      <div className="visaenq-header">
        <div>
          <div className="visaenq-title-row">
            <a href="/super/visa" className="visaenq-back-link">← Visa Pages</a>
            <h1 className="visaenq-title">Visa Enquiries</h1>
          </div>
          <p className="visaenq-subtitle">{total} enquiries total</p>
        </div>
        {msg && <span className="visaenq-msg">{msg}</span>}
      </div>

      {/* Filter */}
      <div className="visaenq-filter-row">
        {['', 'pending', 'contacted', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); load(s, 1) }}
            className={`visaenq-filter-btn ${status === s ? 'visaenq-filter-btn--active' : ''}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="visaenq-loading">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="visaenq-empty">No enquiries yet.</div>
      ) : (
        <div className="visaenq-table-wrap">
          <table className="visaenq-table">
            <thead>
              <tr className="visaenq-thead-row">
                {['Date', 'Country', 'Name', 'Email', 'Phone', 'Passport', 'Travel Date', 'Return', 'Pax', 'Status', 'Action'].map(h => (
                  <th key={h} className="visaenq-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e, i) => (
                <tr key={e.id} className={`visaenq-tr ${i % 2 !== 0 ? 'visaenq-tr--alt' : ''}`}>
                  <td className="visaenq-td visaenq-td--muted visaenq-td--nowrap">{new Date(e.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="visaenq-td visaenq-td--bold">{e.country}</td>
                  <td className="visaenq-td visaenq-td--plain">{e.full_name}</td>
                  <td className="visaenq-td visaenq-td--plain">{e.email}</td>
                  <td className="visaenq-td visaenq-td--plain visaenq-td--nowrap">{e.phone}</td>
                  <td className="visaenq-td visaenq-td--mono">{e.passport_number}</td>
                  <td className="visaenq-td visaenq-td--nowrap">{e.travel_date}</td>
                  <td className="visaenq-td visaenq-td--muted visaenq-td--nowrap">{e.return_date ?? '—'}</td>
                  <td className="visaenq-td visaenq-td--center">{e.num_travellers}</td>
                  <td className="visaenq-td">
                    <span className={`visaenq-status-pill visaenq-status-pill--${e.status}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="visaenq-td">
                    <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value)}
                      className="visaenq-status-select">
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
        <div className="visaenq-pagination-row">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="visaenq-page-btn">← Prev</button>
          <span className="visaenq-page-label">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="visaenq-page-btn visaenq-page-btn--primary">Next →</button>
        </div>
      )}
    </div>
  )
}
