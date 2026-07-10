'use client'
import { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'

const PRESETS = [10000, 25000, 50000, 100000]

interface Transaction { id: string; type: string; amount: number; balance_after: number; description: string; reference: string; created_at: string; created_by?: string }

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '/')
}

const MONTHS_NOW = (() => {
  const now = new Date(); const m = now.getMonth(); const y = now.getFullYear()
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const results = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(y, m - i, 1)
    results.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, from: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })
  }
  // Q1 quarter stub
  results.push({ label: `Jan'${String(y).slice(2)} - Mar'${String(y).slice(2)}`, from: `${y}-01-01` })
  results.push({ label: 'Enter Dates', from: '' })
  return results
})()

const TRIP_TYPES    = ['Flights', 'Hotels', 'Cabs', 'Bus', 'Train', 'Meals']
const RECHARGE_METHODS = ['myBiz Payment Gateway', 'Bank Transfer to Virtual Account', 'Others']

export default function WalletPage() {
  const [balance,      setBalance]      = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [amount,       setAmount]       = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [reminder,     setReminder]     = useState(false)
  const [datePreset,   setDatePreset]   = useState(MONTHS_NOW[0].label)
  const [txnType,      setTxnType]      = useState<string[]>([])
  const [tripType,     setTripType]     = useState<string[]>([])
  const [rechargeMethod,setRechargeMethod]=useState<string[]>([])

  const rzpRef = useRef<boolean>(false)

  useEffect(() => {
    load()
    if (!rzpRef.current) {
      rzpRef.current = true
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.async = true
      document.body.appendChild(s)
    }
  }, [])

  function load() {
    setLoading(true)
    adminFetch('/api/admin/biz/wallet')
      .then(d => { setBalance(d.balance ?? 0); setTransactions(d.transactions ?? []) })
      .finally(() => setLoading(false))
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    const rupees = Number(amount)
    if (!rupees || rupees <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const { orderId, amount: orderAmount, currency, key } = await adminFetch('/api/admin/biz/wallet/order', {
        method: 'POST',
        body: JSON.stringify({ amount: rupees }),
      })
      const options = {
        key,
        amount: orderAmount,
        currency,
        order_id: orderId,
        name: 'AirDunia myBiz',
        description: 'Wallet Recharge',
        theme: { color: '#E31E24' },
        handler: async (res: any) => {
          try {
            await adminFetch('/api/admin/biz/wallet/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id:   res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature:  res.razorpay_signature,
                amount: orderAmount,
              }),
            })
            setSuccess(`₹${rupees.toLocaleString('en-IN')} added to wallet!`)
            setAmount('')
            load()
          } catch (err: any) {
            setError(err.message ?? 'Payment verification failed')
          } finally {
            setSaving(false)
          }
        },
        modal: { ondismiss: () => setSaving(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  const LOW_THRESHOLD = 500000
  const isLow = !loading && balance < LOW_THRESHOLD

  const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    topup:      { label: 'CREDIT', color: '#16A34A', dot: '#16A34A' },
    refund:     { label: 'CREDIT', color: '#16A34A', dot: '#16A34A' },
    debit:      { label: 'DEBIT',  color: '#D97706', dot: '#F59E0B' },
    adjustment: { label: 'ADJUST', color: '#6B7280', dot: '#9CA3AF' },
  }

  function CheckItem({ label, arr, setArr }: { label: string; arr: string[]; setArr: (v: string[]) => void }) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={arr.includes(label)} onChange={e => setArr(e.target.checked ? [...arr, label] : arr.filter(x => x !== label))} style={{ accentColor: '#E31E24' }} />
        <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      </label>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>

      {/* Left sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '24px 20px', overflowY: 'auto', position: 'sticky', top: 54, height: 'calc(100vh - 54px)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Transaction Date</div>
          {MONTHS_NOW.map(p => (
            <label key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name="txnDate" checked={datePreset === p.label} onChange={() => setDatePreset(p.label)} style={{ accentColor: '#E31E24' }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{p.label}</span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Transaction Type</div>
          {[['Debit','debit'],['Credit','topup']].map(([label, val]) => (
            <CheckItem key={val} label={label} arr={txnType} setArr={setTxnType} />
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Trip Type</div>
          {TRIP_TYPES.map(t => <CheckItem key={t} label={t} arr={tripType} setArr={setTripType} />)}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Recharge Method</div>
          {RECHARGE_METHODS.map(t => <CheckItem key={t} label={t} arr={rechargeMethod} setArr={setRechargeMethod} />)}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>myBiz Wallet</h1>

        {/* Top row: balance card + add money */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16 }}>

          {/* Balance card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px' }}>
            {isLow && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>Low Balance:</span>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 3, background: '#D97706', color: '#fff', letterSpacing: '0.04em' }}>RECHARGE NEEDED</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>💳</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#1a1a2e' }}>{loading ? '…' : fmt(balance)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <span style={{ fontSize: 13, color: '#374151' }}>
                <strong>0</strong> Reward Bonus<strong>0</strong>
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: '#9CA3AF' }}>›</span>
            </div>
          </div>

          {/* Add Money */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Left: input */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>Add Money To Wallet</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {PRESETS.map(p => (
                    <button key={p} type="button" onClick={() => setAmount(String(p))}
                      style={{
                        padding: '5px 10px', borderRadius: 6, border: '1.5px solid',
                        borderColor: amount === String(p) ? '#E31E24' : '#E5E7EB',
                        background: amount === String(p) ? '#FEF2F2' : '#F9FAFB',
                        color: amount === String(p) ? '#E31E24' : '#374151',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                      ₹{(p / 1000).toLocaleString('en-IN')}K
                    </button>
                  ))}
                </div>
                <form onSubmit={handleTopup} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>₹</span>
                    <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="Enter Amount"
                      style={{ width: '100%', padding: '10px 14px 10px 28px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" disabled={saving || !amount} style={{
                    padding: '10px 18px', background: !amount ? '#F9FAFB' : '#E31E24',
                    color: !amount ? '#9CA3AF' : '#fff', border: '1.5px solid', borderColor: !amount ? '#E5E7EB' : '#E31E24',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: !amount ? 'default' : 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {saving ? '…' : 'Recharge Now'}
                  </button>
                </form>
                {error   && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</div>}
                {success && <div style={{ color: '#16A34A', fontSize: 12, marginTop: 8, fontWeight: 600 }}>{success}</div>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, fontSize: 12, color: '#6B7280' }}>
                  <span style={{ fontSize: 16 }}>📢</span>
                  For seamless booking, most of our customers keep adequate balance in wallet
                </div>
              </div>
              {/* Right: Bank transfer */}
              <div style={{ borderLeft: '1px solid #F3F4F6', paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Recharge Via Bank Transfer</span>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 3, background: '#2563EB', color: '#fff', letterSpacing: '0.04em' }}>NEW</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                  Wallet gets automatically recharged within 3hrs of bank transfer.
                </div>
                <button style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  View Account Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enable Reminder */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setReminder(r => !r)} style={{
              width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: reminder ? '#E31E24' : '#D1D5DB', position: 'relative',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: reminder ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>Enable Reminder</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>- Remind me daily when wallet balance is below <strong>₹10,000</strong></span>
          </div>
          <button style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Reminder Settings</button>
        </div>

        {/* Transactions */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Transactions</span>
              <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 8 }}>(Last month till date)</span>
            </div>
            <button style={{ padding: '7px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#9CA3AF', fontWeight: 700, fontSize: 13, cursor: 'default' }}>
              Download Report
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ width: 40, padding: '12px 16px' }}><input type="checkbox" /></th>
                {['UNIQUE ID','BOOKED BY/ADDED BY','TYPE','TXN. DATE','AMOUNT','REASON'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No transactions yet.</td></tr>
              ) : transactions.map(tx => {
                const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type.toUpperCase(), color: '#6B7280', dot: '#9CA3AF' }
                return (
                  <tr key={tx.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 16px' }}><input type="checkbox" /></td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>✈️</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#374151' }}>
                          {tx.reference ? tx.reference.slice(0, 18) + (tx.reference.length > 18 ? '…' : '') : tx.id.slice(0, 14) + '…'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 12, color: '#374151' }}>{tx.created_by ?? '—'}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#6B7280' }}>{fmtDate(tx.created_at)}</td>
                    <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 800 }}>{fmt(tx.amount)}</td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: '#6B7280' }}>{tx.description ?? '—'}</td>
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
