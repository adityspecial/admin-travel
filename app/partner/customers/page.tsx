'use client'
import { Suspense, useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { Pagination, usePagination } from '@/components/Pagination'

interface Customer { id: string; name: string; email?: string; phone?: string; passport_no?: string; passport_expiry?: string; gender?: string; created_at: string }

function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' }

export default function PartnerCustomersPage() {
  return (
    <Suspense fallback={null}>
      <PartnerCustomersContent />
    </Suspense>
  )
}

function PartnerCustomersContent() {
  const sp       = useSearchParams()
  const agentId  = sp.get('agentId') ?? ''
  const agentName = sp.get('agentName') ?? 'Agent'
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => { load('') }, [agentId])

  function load(q: string) {
    if (!agentId) return
    setLoading(true)
    adminFetch(`/api/admin/partner/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`, { agentId })
      .then(d => setCustomers(d.customers ?? []))
      .finally(() => setLoading(false))
  }

  function handleSearch(q: string) {
    setSearch(q)
    if (q.length > 1 || q.length === 0) load(q)
  }

  const { slice: pageCustomers, page, setPage, total } = usePagination(customers, 20)

  return (
    <div>
      <div className="admin-topbar">
        <h2>{agentName} — Customers</h2>
        <span className="topbar-meta">{customers.length} saved profiles</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="card-title">Customer CRM</div>
                <div className="card-copy">All traveller profiles saved by this agent.</div>
              </div>
              <input className="toolbar-search" style={{ width: 280 }} placeholder="Search by name, email or phone…"
                value={search} onChange={e => handleSearch(e.target.value)} />
            </div>
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Passport</th><th>Expiry</th><th>Gender</th><th>Added</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="empty-state">Loading…</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No customers yet.</td></tr>
                ) : pageCustomers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td>{c.phone ?? '--'}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{c.email ?? '--'}</td>
                    <td><code style={{ fontSize: 12 }}>{c.passport_no ?? '--'}</code></td>
                    <td style={{ color: c.passport_expiry && new Date(c.passport_expiry) < new Date() ? 'var(--danger)' : undefined }}>{fmtDate(c.passport_expiry)}</td>
                    <td>{c.gender ?? '--'}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{fmtDate(c.created_at)}</td>
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
