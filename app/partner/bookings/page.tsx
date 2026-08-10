'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { Ticket, CreditCard, TrendingUp, Search, Eye } from 'lucide-react'

interface Booking {
  id: string
  booking_ref: string
  booking_type: string
  amount: number
  commission: number
  status: string
  customer_name: string
  travel_date: string
  created_at: string
  payment_method: 'razorpay' | 'wallet' | null
  wallet_type: string | null
  agent?: { agency_name: string; agent_code: string }
}

const STATUSES = ['all', 'confirmed', 'pending', 'cancelled']

// partner_bookings.booking_type only ever has these 3 real values — mypartner
// has no cab (or bus/package) booking route at all, so a "Cabs" option here
// would always show zero results.
const BOOKING_TYPES = [
  { value: 'flight',  label: 'Flights' },
  { value: 'hotel',   label: 'Hotels' },
  { value: 'charter', label: 'Fixed Flights (Charter)' },
  { value: 'all',     label: 'All Types' },
]

// The real badge system (globals.css) only ships green/red/yellow/blue/gray —
// no teal or violet — so booking types and payment methods are mapped onto
// those five tones instead of classes that don't exist.
const TYPE_TONE: Record<string, string> = {
  flight: 'badge-blue', hotel: 'badge-green', bus: 'badge-gray',
  fixed_flight: 'badge-yellow', package: 'badge-red',
}

function formatCurrency(value: number) {
  return `₹${(value ?? 0).toLocaleString('en-IN')}`
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [typeFilter, setTypeFilter] = useState('flight')

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    adminFetch('/api/admin/partner/bookings', { agentId })
      .then((d: any) => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const matchType = typeFilter === 'all' || b.booking_type === typeFilter
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.agent?.agency_name?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  const totalAmount     = bookings.reduce((s, b) => s + b.amount,     0)
  const totalCommission = bookings.reduce((s, b) => s + b.commission, 0)
  const { slice: pageBookings, page, setPage, total } = usePagination(filtered, 20)

  const columns: ColumnDef<Booking>[] = [
    {
      key: 'booking_ref',
      header: 'Booking Ref',
      render: (b) => <span className="data-table-code-pill">{b.booking_ref}</span>,
    },
    {
      key: 'booking_type',
      header: 'Type',
      render: (b) => (
        <span className={`badge ${TYPE_TONE[b.booking_type] ?? 'badge-gray'}`}>
          {b.booking_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (b) => <span className="data-table-cell-bold">{b.customer_name ?? '--'}</span>,
    },
    {
      key: 'agent',
      header: 'Agent',
      render: (b) => (
        <span className="data-table-muted-cell">
          {b.agent?.agency_name ?? 'Self'}
          {b.agent?.agent_code && ` (${b.agent.agent_code})`}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (b) => <span className="data-table-cell-bold">{formatCurrency(b.amount)}</span>,
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (b) => <span style={{ color: 'var(--success)', fontWeight: 700 }}>+{formatCurrency(b.commission)}</span>,
    },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (b) =>
        b.payment_method === 'wallet' ? (
          <span className="badge badge-yellow">Wallet</span>
        ) : b.payment_method === 'razorpay' ? (
          <span className="badge badge-blue">Razorpay</span>
        ) : (
          <span className="data-table-muted-cell">--</span>
        ),
    },
    {
      key: 'travel_date',
      header: 'Travel Date',
      render: (b) => (
        <span className="data-table-muted-cell">
          {b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-IN') : '--'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => {
        const isConfirmed = b.status === 'confirmed'
        const isPending   = b.status === 'pending'
        return (
          <span className={`data-table-status-pill ${isConfirmed ? 'active' : 'inactive'} ${isPending ? 'agents-status-pill-pending' : ''}`}>
            {isConfirmed ? '●Confirmed' : isPending ? '●Pending' : '●Cancelled'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div className="data-table-actions">
          <a href={`/partner/bookings/${b.id}`} className="data-table-btn data-table-btn-edit">
            <Eye size={12} />
            <span>View</span>
          </a>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Team Bookings</h2>
        <span className="topbar-meta">{bookings.length.toLocaleString('en-IN')} total bookings</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Ticket} label="Total Bookings" value={bookings.length} sub="Across your team" badge="Volume" />
            <StatCard Icon={CreditCard} label="Total Amount" value={formatCurrency(totalAmount)} sub="Combined booking value" badge="Revenue" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={TrendingUp} label="Total Commission" value={formatCurrency(totalCommission)} sub="Earned by your team" badge="Earnings" iconBg="#fff7ed" iconColor="#ea580c" badgeBg="#ffedd5" badgeColor="#c2410c" />
          </div>

          <DataTable
            title="All Team Bookings"
            subtitle="Bookings made by you and all your sub-agents."
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <select
                  className="app-input"
                  style={{ width: 200 }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {BOOKING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <div style={{ width: 260 }}>
                  <AppInput
                    placeholder="Search ref, customer, agent…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                  />
                </div>

                <div className="segmented-row">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`segment-btn ${filter === s ? 'active' : ''}`}
                      onClick={() => setFilter(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            }
            columns={columns}
            data={pageBookings}
            loading={loading}
            emptyMessage="No bookings found."
            keyExtractor={(b) => b.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>
    </div>
  )
}
