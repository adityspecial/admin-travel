'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

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

  return (
    <div>
      <div className="admin-topbar">
        <h2>Promo Codes</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {cashBalance !== null && (
            <span className="badge badge-yellow" style={{ fontSize: 13, padding: '4px 10px' }}>
              Promo Cash: {fmtRs(cashBalance)}
            </span>
          )}
          <span className="topbar-meta">{promos.length} codes · {active} active</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Promo Cash Card */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="card-title">Promo Cash Balance</div>
                <div className="card-copy">Credit promo cash to your agent account. Customers can redeem it at checkout.</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
                  {cashBalance !== null ? fmtRs(cashBalance) : '—'}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCash(true)}>
                + Credit Cash
              </button>
            </div>
            {cashTxs.length > 0 && (
              <div className="metric-list" style={{ marginTop: 18 }}>
                {cashTxs.slice(0, 5).map(tx => (
                  <div className="metric-row-head" key={tx.id}>
                    <span style={{ fontSize: 13 }}>
                      <span className={`badge ${tx.type === 'credit' ? 'badge-green' : 'badge-red'}`} style={{ marginRight: 8 }}>
                        {tx.type}
                      </span>
                      {tx.description}
                    </span>
                    <span style={{ fontWeight: 700 }}>{tx.type === 'credit' ? '+' : '-'}{fmtRs(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promos Table */}
          <div className="surface-card">
            <div className="table-toolbar">
              <input
                className="toolbar-search"
                style={{ maxWidth: 320 }}
                placeholder="Search by code or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                + New Promo
              </button>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Amt</th>
                  <th>Uses</th>
                  <th>Applies To</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="empty-state">Loading...</td></tr>
                ) : slice.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No promo codes yet. Create one to offer discounts to your clients.</td></tr>
                ) : slice.map(p => (
                  <tr key={p.id}>
                    <td><code style={{ fontWeight: 700 }}>{p.code}</code></td>
                    <td style={{ fontWeight: 700 }}>
                      {p.discount_type === 'percentage' ? `${p.discount_value}%` : fmtRs(p.discount_value)}
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {p.min_booking_amount ? fmtRs(p.min_booking_amount) : '—'}
                    </td>
                    <td>
                      {p.current_uses}
                      <span style={{ color: '#94A3B8' }}>{p.max_uses ? ` / ${p.max_uses}` : ''}</span>
                    </td>
                    <td><span className="badge badge-gray">{p.applicable_to ?? 'all'}</span></td>
                    <td style={{ color: '#64748B', fontSize: 12 }}>{fmtDate(p.valid_until)}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${p.is_active ? 'btn-ghost' : 'btn-muted'}`}
                        disabled={toggling === p.id}
                        onClick={() => toggle(p)}
                      >
                        {toggling === p.id ? '...' : p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={20} onPage={setPage} />
          </div>

        </div>
      </div>

      {/* Create Promo Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="form-card modal-card" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800 }}>Create Promo Code</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowCreate(false); setCreateError('') }}>Close</button>
            </div>
            <div className="banner-soft" style={{ marginBottom: 16, fontSize: 13 }}>
              This promo will be scoped to your agency's clients only.
            </div>
            {createError && <div className="login-error" style={{ marginBottom: 12 }}>{createError}</div>}
            <form onSubmit={createPromo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Coupon Code *</label>
                  <input
                    value={form.code}
                    onChange={e => setF('code', e.target.value.toUpperCase())}
                    placeholder="AGENT10"
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <input
                    value={form.description}
                    onChange={e => setF('description', e.target.value)}
                    placeholder="Exclusive discount for agency clients"
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select value={form.discount_type} onChange={e => setF('discount_type', e.target.value)}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number" min="0.01" step="any"
                    value={form.discount_value}
                    onChange={e => setF('discount_value', e.target.value)}
                    placeholder={form.discount_type === 'percentage' ? '10' : '200'}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Min Booking Amount (Rs)</label>
                  <input
                    type="number" min="0"
                    value={form.min_booking_amount}
                    onChange={e => setF('min_booking_amount', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Total Uses Limit</label>
                  <input
                    type="number" min="1"
                    value={form.max_uses}
                    onChange={e => setF('max_uses', e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="form-group">
                  <label>Applicable To</label>
                  <select value={form.applicable_to} onChange={e => setF('applicable_to', e.target.value)}>
                    <option value="all">All bookings</option>
                    <option value="flights">Flights only</option>
                    <option value="hotels">Hotels only</option>
                  </select>
                </div>
                <div className="form-group" />
                <div className="form-group">
                  <label>Valid From *</label>
                  <input type="date" value={form.valid_from} onChange={e => setF('valid_from', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Valid Until *</label>
                  <input type="date" value={form.valid_until} onChange={e => setF('valid_until', e.target.value)} required />
                </div>
              </div>
              <div className="page-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowCreate(false); setCreateError('') }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Promo Cash Modal */}
      {showCash && (
        <div className="modal-overlay">
          <div className="form-card modal-card" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800 }}>Credit Promo Cash</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCash(false)}>Close</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Current balance: <strong>{cashBalance !== null ? fmtRs(cashBalance) : '—'}</strong>
            </div>
            {cashError && <div className="login-error" style={{ marginBottom: 12 }}>{cashError}</div>}
            {cashDone  && <div className="banner-success" style={{ marginBottom: 16 }}>{cashDone}</div>}
            <form onSubmit={creditCash}>
              <div className="form-group">
                <label>Amount to Credit (Rs) *</label>
                <input
                  type="number" min="1"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  placeholder="5000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input
                  value={cashNote}
                  onChange={e => setCashNote(e.target.value)}
                  placeholder="Promotion for Q3 campaign"
                />
              </div>
              <div className="form-group">
                <label>Expires At (optional)</label>
                <input type="date" value={cashExpiry} onChange={e => setCashExpiry(e.target.value)} />
              </div>
              <div className="page-actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCash(false)}>Close</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={cashBusy}>
                  {cashBusy ? 'Crediting...' : 'Credit Promo Cash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
