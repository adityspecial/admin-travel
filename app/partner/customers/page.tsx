'use client'
import { useEffect, useState } from 'react'
import { adminFetch, adminDownload } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { Users, IdCard, AlertTriangle, Search, Download } from 'lucide-react'
import './cutomer.css'

interface Customer { id: string; name: string; email?: string; phone?: string; passport_no?: string; passport_expiry?: string; gender?: string; created_at: string }

function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' }

export default function PartnerCustomersPage() {
  const [agentId] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') ?? '' : '')
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

  function exportCsv() {
    adminDownload('/api/admin/partner/customers/export', 'customer-crm.csv', { agentId })
      .catch((e: any) => alert(e.message ?? 'Export failed'))
  }

  const { slice: pageCustomers, page, setPage, total } = usePagination(customers, 20)

  const expiredCount = customers.filter(c => c.passport_expiry && new Date(c.passport_expiry) < new Date()).length
  const missingPassportCount = customers.filter(c => !c.passport_no).length

  const columns: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => <span className="data-table-cell-bold">{c.name}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => c.phone ?? '--',
    },
    {
      key: 'email',
      header: 'Email',
      render: (c) => <span className="data-table-muted-cell">{c.email ?? '--'}</span>,
    },
    {
      key: 'passport_no',
      header: 'Passport',
      render: (c) => c.passport_no ? <span className="data-table-code-pill">{c.passport_no}</span> : <span className="data-table-muted-cell">--</span>,
    },
    {
      key: 'passport_expiry',
      header: 'Expiry',
      render: (c) => {
        const expired = c.passport_expiry && new Date(c.passport_expiry) < new Date()
        return <span className={expired ? 'customer-expiry-cell--expired' : undefined}>{fmtDate(c.passport_expiry)}</span>
      },
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (c) => c.gender ?? '--',
    },
    {
      key: 'created_at',
      header: 'Added',
      render: (c) => <span className="data-table-muted-cell">{fmtDate(c.created_at)}</span>,
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Customers</h2>
        <span className="topbar-meta">{customers.length.toLocaleString('en-IN')} saved profiles</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Users} label="Total Customers" value={customers.length} sub="Saved traveller profiles" badge="CRM" />
            <StatCard Icon={AlertTriangle} label="Expired Passports" value={expiredCount} sub="Need renewal before next trip" badge="Attention" iconBg="#fef2f2" iconColor="#dc2626" badgeBg="#fee2e2" badgeColor="#b91c1c" />
            <StatCard Icon={IdCard} label="Missing Passport Info" value={missingPassportCount} sub="Profiles without a passport number" badge="Incomplete" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
          </div>

          <DataTable
            title="Customer CRM"
            subtitle="All traveller profiles saved by this agent."
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="customer-search-wrapper">
                  <AppInput
                    placeholder="Search by name, email or phone…"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                  />
                </div>
                <button className="btn-secondary" onClick={exportCsv}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            }
            columns={columns}
            data={pageCustomers}
            loading={loading}
            emptyMessage="No customers yet."
            keyExtractor={(c) => c.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
