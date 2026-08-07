'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination } from '@/components/Pagination'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import '@/components/ui/AppInput.css'
import './visa-enquiries.css'

interface Enquiry {
  id: string; slug: string; country: string; full_name: string
  email: string; phone: string; passport_number: string
  travel_date: string; return_date: string | null; num_travellers: number
  notes: string | null; status: string; created_at: string
}

const STATUSES = ['', 'pending', 'contacted', 'completed', 'cancelled']

// Maps 1:1 onto the real badge system (globals.css only ships green/red/yellow/blue/gray).
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow', contacted: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red',
}

const PAGE_SIZE = 20

export default function PartnerVisaEnquiriesPage() {
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
    adminFetch(`/api/admin/partner/visa/enquiries?${qs}`)
      .then((d: { enquiries: Enquiry[]; total: number }) => {
        setEnquiries(d.enquiries ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(status, page) }, [page])

  async function updateStatus(id: string, newStatus: string) {
    await adminFetch(`/api/admin/partner/visa/enquiries?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
    flash('Status updated.')
    load(status, page)
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  function changeFilter(s: string) {
    setStatus(s)
    setPage(1)
    load(s, 1)
  }

  const columns: ColumnDef<Enquiry>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (e) => <span className="data-table-muted-cell">{new Date(e.created_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      key: 'country',
      header: 'Country',
      render: (e) => <span className="data-table-cell-bold">{e.country}</span>,
    },
    {
      key: 'full_name',
      header: 'Traveller',
      render: (e) => (
        <div>
          <div className="data-table-cell-bold">{e.full_name}</div>
          <div className="data-table-muted-cell">{e.email} · {e.phone}</div>
        </div>
      ),
    },
    {
      key: 'passport_number',
      header: 'Passport',
      render: (e) => <span className="data-table-code-pill">{e.passport_number}</span>,
    },
    {
      key: 'travel_date',
      header: 'Travel Date',
      render: (e) => <span className="data-table-muted-cell">{e.travel_date}</span>,
    },
    {
      key: 'return_date',
      header: 'Return',
      render: (e) => <span className="data-table-muted-cell">{e.return_date ?? '--'}</span>,
    },
    {
      key: 'num_travellers',
      header: 'Pax',
      align: 'center',
      render: (e) => e.num_travellers,
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <span className={`badge ${STATUS_BADGE[e.status] ?? 'badge-gray'}`}>{e.status}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <select
          className="app-input pvisaenq-status-select"
          value={e.status}
          onChange={(ev) => updateStatus(e.id, ev.target.value)}
        >
          {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Visa Enquiries</h2>
        <span className="topbar-meta">
          {total.toLocaleString('en-IN')} enquiries from you and your sub-agents
          {msg && <span className="pvisaenq-msg">{msg}</span>}
        </span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <DataTable
            title="Visa Enquiries"
            subtitle="Track and update enquiry status for you and your sub-agents."
            headerAction={
              <div className="segmented-row">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`segment-btn ${status === s ? 'active' : ''}`}
                    onClick={() => changeFilter(s)}
                  >
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                  </button>
                ))}
              </div>
            }
            columns={columns}
            data={enquiries}
            loading={loading}
            emptyMessage="No enquiries yet."
            keyExtractor={(e) => e.id}
            footer={<Pagination total={total} page={page} perPage={PAGE_SIZE} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
