'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { Pagination, usePagination } from '@/components/Pagination'

interface Transaction { id: string; type: string; amount: number; balance_after: number; description: string; reference: string; created_at: string }

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  topup:      { label: 'Top-up',     color: 'badge-green',  sign: '+' },
  debit:      { label: 'Debit',      color: 'badge-red',    sign: '-' },
  refund:     { label: 'Refund',     color: 'badge-blue',   sign: '+' },
  adjustment: { label: 'Adjustment', color: 'badge-yellow', sign: '±' },
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function WalletPage() {
  const [balance, setBalance]         = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]         = useState(true)
  const { slice: txPage, page: txPageNum, setPage: setTxPage, total: txTotal } = usePagination(transactions, 25)
  const [amount, setAmount]           = useState('')
  const [desc, setDesc]               = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/wallet')
      .then(d => { setBalance(d.balance ?? 0); setTransactions(d.transactions ?? []) })
      .finally(() => setLoading(false))
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const amountPaise = Math.round(Number(amount) * 100)
      await adminFetch('/api/admin/biz/wallet', {
        method: 'POST',
        body: JSON.stringify({ amount: amountPaise, description: desc || 'Manual top-up' }),
      })
      setSuccess(`₹${Number(amount).toLocaleString('en-IN')} added to wallet.`)
      setAmount(''); setDesc('')
      load()
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>Company Wallet</h2>
        <span className="topbar-meta">Prepaid balance for company travel bookings</span>
      </div>
      <div className="admin-content">
        <div className="page-stack">

          {/* Balance hero */}
          <div className="page-hero biz-hero">
            <div className="hero-row">
              <div>
                <h3>Prepaid Balance</h3>
                <p>Used to deduct booking costs for approved travel requests.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>
                  {loading ? '--' : fmt(balance)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>available balance</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
            {/* Top-up form */}
            <div className="form-card">
              <div className="card-title" style={{ marginBottom: 4 }}>Add Funds</div>
              <div className="card-copy" style={{ marginBottom: 18 }}>Top up the company prepaid wallet.</div>
              <form onSubmit={handleTopup}>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" min="1" step="1" placeholder="10000"
                    value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input placeholder="Q1 travel budget" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                {error   && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                {success && <div className="banner-success" style={{ marginBottom: 12 }}>{success}</div>}
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                  {saving ? 'Processing…' : 'Add Funds'}
                </button>
              </form>
            </div>

            {/* Recent transactions */}
            <div className="table-card">
              <div className="table-header">
                <div className="card-title">Transaction History</div>
              </div>
              <table>
                <thead>
                  <tr><th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="empty-state">Loading…</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No transactions yet.</td></tr>
                  ) : txPage.map(tx => {
                    const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'badge-gray', sign: '' }
                    return (
                      <tr key={tx.id}>
                        <td><span className={`badge ${cfg.color}`}>{cfg.label}</span></td>
                        <td style={{ fontWeight: 700 }}>{cfg.sign}{fmt(tx.amount)}</td>
                        <td>{fmt(tx.balance_after)}</td>
                        <td style={{ color: 'var(--ink-3)' }}>{tx.description ?? '--'}</td>
                        <td style={{ color: 'var(--ink-3)' }}>{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination total={txTotal} page={txPageNum} perPage={25} onPage={setTxPage} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
