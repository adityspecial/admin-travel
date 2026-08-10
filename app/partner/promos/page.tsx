'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppInput } from '@/components/ui/AppInput'
import { AppPopup } from '@/components/ui/AppPopup'
import '@/components/ui/ConfirmModal.css'
import { Wallet, Tag, Search, Plus } from 'lucide-react'
import './promos.css'

interface Promo {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_booking_amount: number | null
  max_uses: number | null
  current_uses: number
  applicable_to: string | null
  valid_until: string
  is_active: boolean
  created_at: string
  created_by_role: 'super' | 'biz_admin' | 'partner_agent'
}

interface PromoCashTx {
  id: string
  amount: number
  balance_after: number
  type: 'credit' | 'debit'
  description: string
  created_at: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtRs(n: number) {
  return `Rs ${n.toLocaleString('en-IN')}`
}

const BLANK = {
  code: '', description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_booking_amount: '', max_discount_amount: '',
  max_uses: '', uses_per_user: '1',
  applicable_to: 'all',
  valid_from: '', valid_until: '',
}

export default function PartnerPromosPage() {
  const [promos, setPromos]         = useState<Promo[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(BLANK)
  const [saving, setSaving]         = useState(false)
  const [createError, setCreateError] = useState('')
  const [toggling, setToggling]     = useState<string | null>(null)

  // Promo cash state
  const [cashBalance, setCashBalance]   = useState<number | null>(null)
  const [cashTxs, setCashTxs]           = useState<PromoCashTx[]>([])
  const [showCash, setShowCash]         = useState(false)
  const [cashAmount, setCashAmount]     = useState('')
  const [cashNote, setCashNote]         = useState('')
  const [cashExpiry, setCashExpiry]     = useState('')
  const [cashBusy, setCashBusy]         = useState(false)
  const [cashError, setCashError]       = useState('')
  const [cashDone, setCashDone]         = useState('')

  function loadPromos() {
    setLoading(true)
    adminFetch('/api/admin/partner/promos')
      .then((d: { promos: Promo[] }) => setPromos(d.promos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function loadCash() {
    adminFetch('/api/admin/partner/promo-cash')
      .then((d: { balance: number; transactions: PromoCashTx[] }) => {
        setCashBalance(d.balance ?? 0)
        setCashTxs(d.transactions ?? [])
      })
      .catch(() => {})
  }

  useEffect(() => { loadPromos(); loadCash() }, [])

  function setF(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setCreateError('')
    try {
      const body: Record<string, any> = {
        code:           form.code,
        discount_type:  form.discount_type,
        discount_value: Number(form.discount_value),
        valid_from:     form.valid_from,
        valid_until:    form.valid_until,
        uses_per_user:  Number(form.uses_per_user),
        applicable_to:  form.applicable_to === 'all' ? null : form.applicable_to,
      }
      if (form.description)         body.description         = form.description
      if (form.min_booking_amount)  body.min_booking_amount  = Number(form.min_booking_amount)
      if (form.max_discount_amount) body.max_discount_amount = Number(form.max_discount_amount)
      if (form.max_uses)            body.max_uses            = Number(form.max_uses)

      await adminFetch('/api/admin/partner/promos', { method: 'POST', body: JSON.stringify(body) })
      setShowCreate(false); setForm(BLANK)
      loadPromos()
    } catch (err: any) {
      setCreateError(err.message)
    }
    setSaving(false)
  }

  async function toggle(p: Promo) {
    setToggling(p.id)
    try {
      await adminFetch('/api/admin/partner/promos', {
        method: 'PATCH',
        body: JSON.stringify({ promoId: p.id, is_active: !p.is_active }),
      })
      setPromos(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    } catch { }
    setToggling(null)
  }

  async function creditCash(e: React.FormEvent) {
    e.preventDefault()
    setCashBusy(true); setCashError(''); setCashDone('')
    try {
      const data = await adminFetch('/api/admin/partner/promo-cash', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(cashAmount),
          description: cashNote || undefined,
          expiresAt: cashExpiry || undefined,
        }),
      })
      setCashDone(`Credited ${fmtRs(Number(cashAmount))}. New balance: ${fmtRs(data.newBalance)}`)
      setCashBalance(data.newBalance)
      setCashAmount(''); setCashNote(''); setCashExpiry('')
      loadCash()
    } catch (err: any) {
      setCashError(err.message)
    }
    setCashBusy(false)
  }

  const filtered = promos.filter(p =>
    !search ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const { slice, page, setPage, total } = usePagination(filtered, 20)
  const active = promos.filter(p => p.is_active).length

  const columns: ColumnDef<Promo>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (p) => <span className="data-table-code-pill">{p.code}</span>,
    },
    {
      key: 'discount_value',
      header: 'Discount',
      render: (p) => (
        <span className="data-table-cell-bold">
          {p.discount_type === 'percentage' ? `${p.discount_value}%` : fmtRs(p.discount_value)}
        </span>
      ),
    },
    {
      key: 'min_booking_amount',
      header: 'Min Amt',
      render: (p) => <span className="data-table-muted-cell">{p.min_booking_amount ? fmtRs(p.min_booking_amount) : '--'}</span>,
    },
    {
      key: 'current_uses',
      header: 'Uses',
      render: (p) => (
        <span>
          {p.current_uses}
          <span className="data-table-muted-cell">{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
        </span>
      ),
    },
    {
      key: 'applicable_to',
      header: 'Applies To',
      render: (p) => <span className="badge badge-gray">{p.applicable_to ?? 'all'}</span>,
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      render: (p) => <span className="data-table-muted-cell">{fmtDate(p.valid_until)}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (p) => <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>,
    },
    {
      key: 'created_by_role',
      header: 'Source',
      render: (p) => p.created_by_role === 'partner_agent'
        ? <span className="badge badge-gray">Self-created</span>
        : <span className="badge badge-yellow">Granted by AirDunia</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => p.created_by_role === 'partner_agent' ? (
        <button
          type="button"
          className={`data-table-btn ${p.is_active ? 'data-table-btn-edit' : 'data-table-btn-success'}`}
          disabled={toggling === p.id}
          onClick={() => toggle(p)}
        >
          {toggling === p.id ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ) : (
        <span className="data-table-muted-cell">View only</span>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Promo Codes</h2>
        <div className="ppromo-topbar-right">
          {cashBalance !== null && (
            <span className="badge badge-yellow ppromo-cash-badge">
              Promo Cash: {fmtRs(cashBalance)}
            </span>
          )}
          <span className="topbar-meta">{promos.length} codes · {active} active</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Promo Cash Card */}
          <div className="dashboard-card-lucrative">
            <div className="dashboard-card-header">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-orange">
                  <Wallet size={19} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Promo Cash Balance</h3>
                  <p className="dashboard-card-subtitle">Credit promo cash to your agent account. Customers can redeem it at checkout.</p>
                </div>
              </div>
              <button type="button" className="quick-action-btn-primary" onClick={() => setShowCash(true)}>
                <Plus size={14} strokeWidth={2.5} />
                Credit Cash
              </button>
            </div>

            <div className="ppromo-balance-display">
              {cashBalance !== null ? fmtRs(cashBalance) : '--'}
            </div>

            {cashTxs.length > 0 && (
              <div className="metric-list">
                {cashTxs.slice(0, 5).map(tx => (
                  <div className="metric-row-head" key={tx.id}>
                    <span className="ppromo-tx-desc">
                      <span className={`badge ppromo-tx-badge ${tx.type === 'credit' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type}
                      </span>
                      {tx.description}
                    </span>
                    <span className="ppromo-tx-amount">{tx.type === 'credit' ? '+' : '-'}{fmtRs(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promos Table */}
          <DataTable
            title="Promo Codes"
            subtitle="Discount codes scoped to your agency's clients."
            headerAction={
              <div className="ppromo-header-actions">
                <div className="ppromo-search-wrapper">
                  <AppInput
                    placeholder="Search by code or description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={15} />}
                    wrapperClassName="m-0"
                  />
                </div>
                <button type="button" className="quick-action-btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={14} strokeWidth={2.5} />
                  New Promo
                </button>
              </div>
            }
            columns={columns}
            data={slice}
            loading={loading}
            emptyMessage="No promo codes yet. Create one to offer discounts to your clients."
            keyExtractor={(p) => p.id}
            footer={<Pagination total={total} page={page} perPage={20} onPage={setPage} />}
          />
        </div>
      </div>

      {/* Create Promo AppPopup */}
      <AppPopup
        isOpen={showCreate}
        title="Create Promo Code"
        subtitle="This promo will be scoped to your agency's clients only."
        icon={<Tag size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={540}
        onClose={() => { setShowCreate(false); setCreateError('') }}
      >
        {createError && <div className="login-error">{createError}</div>}

        <form onSubmit={createPromo}>
          <div className="agents-edit-grid">
            <div className="ppromo-span-2">
              <AppInput
                label="Coupon Code"
                required
                value={form.code}
                onChange={e => setF('code', e.target.value.toUpperCase())}
                placeholder="AGENT10"
              />
            </div>

            <div className="ppromo-span-2">
              <AppInput
                label="Description"
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="Exclusive discount for agency clients"
              />
            </div>

            <div className="app-input-group">
              <label className="app-input-label">Discount Type</label>
              <select className="app-input" value={form.discount_type} onChange={e => setF('discount_type', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs)</option>
              </select>
            </div>

            <AppInput
              label="Discount Value"
              type="number" min="0.01" step="any" required
              value={form.discount_value}
              onChange={e => setF('discount_value', e.target.value)}
              placeholder={form.discount_type === 'percentage' ? '10' : '200'}
            />

            <AppInput
              label="Min Booking Amount (Rs)"
              type="number" min="0"
              value={form.min_booking_amount}
              onChange={e => setF('min_booking_amount', e.target.value)}
              placeholder="Optional"
            />

            <AppInput
              label="Total Uses Limit"
              type="number" min="1"
              value={form.max_uses}
              onChange={e => setF('max_uses', e.target.value)}
              placeholder="Unlimited"
            />

            <div className="app-input-group">
              <label className="app-input-label">Applicable To</label>
              <select className="app-input" value={form.applicable_to} onChange={e => setF('applicable_to', e.target.value)}>
                <option value="all">All bookings</option>
                <option value="flight">Flights only</option>
                <option value="hotel">Hotels only</option>
              </select>
            </div>
            <div />

            <AppInput label="Valid From" type="date" required value={form.valid_from} onChange={e => setF('valid_from', e.target.value)} />
            <AppInput label="Valid Until" type="date" required value={form.valid_until} onChange={e => setF('valid_until', e.target.value)} />
          </div>

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => { setShowCreate(false); setCreateError('') }}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={saving}>
              {saving ? 'Creating…' : 'Create Promo'}
            </button>
          </div>
        </form>
      </AppPopup>

      {/* Credit Promo Cash AppPopup */}
      <AppPopup
        isOpen={showCash}
        title="Credit Promo Cash"
        subtitle={`Current balance: ${cashBalance !== null ? fmtRs(cashBalance) : '--'}`}
        icon={<Wallet size={22} strokeWidth={2.2} />}
        iconTone="teal"
        maxWidth={460}
        onClose={() => setShowCash(false)}
      >
        {cashError && <div className="login-error">{cashError}</div>}
        {cashDone  && <div className="banner-success ppromo-mb-16">{cashDone}</div>}

        <form onSubmit={creditCash}>
          <AppInput
            label="Amount to Credit (Rs)"
            type="number" min="1" required
            value={cashAmount}
            onChange={e => setCashAmount(e.target.value)}
            placeholder="5000"
          />

          <AppInput
            label="Note (optional)"
            value={cashNote}
            onChange={e => setCashNote(e.target.value)}
            placeholder="Promotion for Q3 campaign"
          />

          <AppInput
            label="Expires At (optional)"
            type="date"
            value={cashExpiry}
            onChange={e => setCashExpiry(e.target.value)}
          />

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowCash(false)}>
              Close
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={cashBusy}>
              {cashBusy ? 'Crediting…' : 'Credit Promo Cash'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
