'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
import './wallet.css'
import {
  Wallet,
  CreditCard,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Sparkles,
  ChevronRight,
  Download,
  Building2,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Gift,
  Zap,
} from 'lucide-react'

const PRESETS = [10000, 25000, 50000, 100000]

interface Transaction {
  id: string
  type: string
  amount: number
  balance_after: number
  description: string
  reference: string
  created_at: string
  created_by?: string
  category?: 'flight' | 'hotel' | 'cab' | 'bus' | 'train' | 'meal' | null
}

// biz_wallets.balance / biz_wallet_transactions.amount are stored in plain
// rupees — Razorpay's own API is paise-denominated, but that's converted
// right at the boundary (backend's createOrder()/verify route), never here.
function fmt(rupees: number) {
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Each month preset is a distinct bucket (that month only), not "from this
// month onward" — `to` is the exclusive upper bound (1st of the next month).
const MONTHS_NOW = (() => {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const results = []
  for (let i = 0; i <= 3; i++) {
    const d    = new Date(y, m - i, 1)
    const next = new Date(y, m - i + 1, 1)
    results.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, from: ymd(d), to: ymd(next) })
  }
  results.push({ label: `Q1 ${y}`, from: `${y}-01-01`, to: `${y}-04-01` })
  results.push({ label: 'All Dates', from: '', to: '' })
  return results
})()

const TRIP_TYPES = ['Flights', 'Hotels', 'Cabs', 'Bus', 'Train', 'Meals']
const RECHARGE_METHODS = ['Payment Gateway', 'Bank Transfer (Virtual A/C)', 'Manual Topup']

// TRIP_TYPES label -> biz_wallet_transactions.category value.
const TRIP_TYPE_TO_CATEGORY: Record<string, string> = {
  Flights: 'flight', Hotels: 'hotel', Cabs: 'cab', Bus: 'bus', Train: 'train', Meals: 'meal',
}

// Recharge method has no dedicated column — only 'topup' rows have one at
// all, and the two write paths (admin/biz/wallet's manual credit, and its
// verify route's Razorpay-paid credit) each write a fixed, recognizable
// description. "Bank Transfer (Virtual A/C)" has no write path yet — it'll
// just never match anything, same as Bus/Train/Meals category having no
// bookings yet.
function rechargeMethodOf(tx: Transaction): string | null {
  if (tx.type !== 'topup') return null
  if (tx.description === 'Razorpay wallet recharge') return 'Payment Gateway'
  if (tx.description?.startsWith('Manual top-up by')) return 'Manual Topup'
  return null
}

const TYPE_LABELS: Record<string, string> = {
  topup: 'CREDIT',
  refund: 'CREDIT',
  debit: 'DEBIT',
  adjustment: 'ADJUST',
}

function typePillClass(type: string) {
  if (type === 'topup' || type === 'refund') return 'wal-type-pill--credit'
  if (type === 'debit') return 'wal-type-pill--debit'
  if (type === 'adjustment') return 'wal-type-pill--adjustment'
  return ''
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reminder, setReminder] = useState(true)
  const [datePreset, setDatePreset] = useState(MONTHS_NOW[0].label)
  const [txnType, setTxnType] = useState<string[]>([])
  const [tripType, setTripType] = useState<string[]>([])
  const [rechargeMethod, setRechargeMethod] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
      .then((d) => {
        setBalance(d.balance ?? 0)
        setTransactions(d.transactions ?? [])
      })
      .finally(() => setLoading(false))
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    const rupees = Number(amount)
    if (!rupees || rupees <= 0) {
      setError('Enter a valid recharge amount')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
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
        name: 'AirDunia Corporate',
        description: 'Wallet Balance Topup',
        theme: { color: '#E31E24' },
        handler: async (res: any) => {
          try {
            await adminFetch('/api/admin/biz/wallet/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                amount: orderAmount,
              }),
            })
            setSuccess(`₹${rupees.toLocaleString('en-IN')} added to wallet successfully!`)
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

  function resetFilters() {
    setDatePreset(MONTHS_NOW[0].label)
    setTxnType([])
    setTripType([])
    setRechargeMethod([])
    setSearch('')
  }

  const LOW_THRESHOLD = 5000 // ₹5,000 (balance is plain rupees, not paise)
  const isLow = !loading && balance < LOW_THRESHOLD

  const filteredTransactions = transactions.filter((tx) => {
    if (search) {
      const q = search.toLowerCase()
      const matchRef = tx.reference?.toLowerCase().includes(q) ?? false
      const matchDesc = tx.description?.toLowerCase().includes(q) ?? false
      const matchBy = tx.created_by?.toLowerCase().includes(q) ?? false
      if (!matchRef && !matchDesc && !matchBy) return false
    }
    if (txnType.length > 0) {
      const isDebit = tx.type === 'debit'
      const isCredit = tx.type === 'topup' || tx.type === 'refund'
      if (txnType.includes('Debit') && !isDebit) return false
      if (txnType.includes('Credit') && !isCredit) return false
    }
    const preset = MONTHS_NOW.find((p) => p.label === datePreset)
    if (preset?.from) {
      const txDate = tx.created_at.slice(0, 10)
      if (txDate < preset.from) return false
      if (preset.to && txDate >= preset.to) return false
    }
    if (tripType.length > 0) {
      const wantCategories = tripType.map((t) => TRIP_TYPE_TO_CATEGORY[t])
      if (!tx.category || !wantCategories.includes(tx.category)) return false
    }
    if (rechargeMethod.length > 0) {
      const method = rechargeMethodOf(tx)
      if (!method || !rechargeMethod.includes(method)) return false
    }
    return true
  })

  return (
    <div className="wal-page">
      <div className="wallet-wrapper">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          title="Wallet Filters"
          icon={<Filter size={16} />}
          activeCount={txnType.length + tripType.length + rechargeMethod.length}
          onReset={resetFilters}
          showMobile={showMobileFilters}
          activeTags={[
            ...txnType.map((t) => ({ id: `txn-${t}`, label: `Type: ${t}`, onRemove: () => setTxnType((prev) => prev.filter((x) => x !== t)) })),
            ...tripType.map((t) => ({ id: `trip-${t}`, label: `Cat: ${t}`, onRemove: () => setTripType((prev) => prev.filter((x) => x !== t)) })),
            ...rechargeMethod.map((t) => ({ id: `rec-${t}`, label: `Method: ${t}`, onRemove: () => setRechargeMethod((prev) => prev.filter((x) => x !== t)) })),
          ]}
        >
          {/* Date Presets */}
          <FilterSidebarBlock title="Transaction Period">
            {MONTHS_NOW.map((p) => (
              <label key={p.label} className="wal-filter-label">
                <input
                  type="radio"
                  name="txnDate"
                  checked={datePreset === p.label}
                  onChange={() => setDatePreset(p.label)}
                  className="wal-filter-input"
                />
                <span className={`wal-filter-text ${datePreset === p.label ? 'wal-filter-text--active' : ''}`}>{p.label}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Transaction Type */}
          <FilterSidebarBlock title="Transaction Type">
            {[
              ['Debit (Spend)', 'Debit'],
              ['Credit (Topup/Refund)', 'Credit'],
            ].map(([lbl, val]) => (
              <label key={val} className="wal-filter-label">
                <input
                  type="checkbox"
                  checked={txnType.includes(val)}
                  onChange={(e) => setTxnType((prev) => (e.target.checked ? [...prev, val] : prev.filter((x) => x !== val)))}
                  className="wal-filter-input"
                />
                <span className="wal-filter-text">{lbl}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Trip Type */}
          <FilterSidebarBlock title="Trip Category">
            {TRIP_TYPES.map((t) => (
              <label key={t} className="wal-filter-label">
                <input
                  type="checkbox"
                  checked={tripType.includes(t)}
                  onChange={(e) => setTripType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  className="wal-filter-input"
                />
                <span className="wal-filter-text">{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Recharge Method */}
          <FilterSidebarBlock title="Recharge Method">
            {RECHARGE_METHODS.map((t) => (
              <label key={t} className="wal-filter-label">
                <input
                  type="checkbox"
                  checked={rechargeMethod.includes(t)}
                  onChange={(e) => setRechargeMethod((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  className="wal-filter-input"
                />
                <span className="wal-filter-text">{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Area */}
        <main className="wallet-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div className="wal-topbar">
            <div className="wal-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span className="wal-breadcrumb-active">Corporate Wallet & Balance</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Banner Header */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div className="wal-hero-glow" />

            <div className="wal-hero-content">
              <div className="wal-hero-left">
                <div className="wal-hero-icon">
                  <Wallet size={28} />
                </div>
                <div>
                  <h1 className="wal-hero-title">
                    Corporate Wallet <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p className="wal-hero-subtitle">
                    Instant prepaid travel account for automated employee flight & hotel bookings with zero payment friction.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Hero Metrics Bar */}
            <div className="wal-hero-metrics">
              <div>
                <div className="wal-metric-label">Available Balance</div>
                <div className="wal-metric-value--balance">{loading ? '…' : fmt(balance)}</div>
              </div>
              <div>
                <div className="wal-metric-label">Account Status</div>
                <div className={`wal-status-value ${isLow ? 'wal-status-value--low' : 'wal-status-value--active'}`}>
                  <span className={`wal-status-dot ${isLow ? 'wal-status-dot--low' : 'wal-status-dot--active'}`} />
                  {isLow ? 'RECHARGE RECOMMENDED' : 'ACTIVE & READY'}
                </div>
              </div>
              <div>
                <div className="wal-metric-label">Recent Transactions</div>
                <div className="wal-metric-value--activity">{transactions.length} Activity Log</div>
              </div>
            </div>
          </div>

          {/* Top Cards Row: Balance Summary + Recharge Center */}
          <div className="wal-cards-row">
            {/* 1. Wallet Balance Card */}
            <div className="card-shell">
              {isLow && (
                <div className="wal-low-warning">
                  <AlertCircle size={16} />
                  <span>Low Balance Warning: Maintain over ₹5,000 for uninterrupted bookings</span>
                </div>
              )}

              <div className="wal-balance-head">
                <div className="wal-balance-icon">
                  <CreditCard size={24} />
                </div>
                <div>
                  <span className="wal-balance-label">Total Available Balance</span>
                  <div className="wal-balance-amount">
                    {loading ? '…' : fmt(balance)}
                  </div>
                </div>
              </div>

              <div className="wal-bonus-box">
                <Gift size={20} color="#F59E0B" />
                <div>
                  <div className="wal-bonus-title">0 Corporate Bonus Points</div>
                  <div className="wal-bonus-sub">Earn rewards on every flight & hotel booking</div>
                </div>
              </div>
            </div>

            {/* 2. Add Money & Recharge Center */}
            <div className="card-shell">
              <div className="wal-recharge-head">
                <Zap size={20} color="var(--accent, #E31E24)" />
                <h3 className="wal-card-title">Recharge Wallet Balance</h3>
              </div>

              {/* Quick Presets */}
              <div className="wal-presets-row">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className={`preset-chip ${amount === String(p) ? 'active' : ''}`}
                  >
                    + ₹{(p / 1000).toLocaleString('en-IN')}K
                  </button>
                ))}
              </div>

              <form onSubmit={handleTopup} className="wal-recharge-form">
                <div className="wal-amount-wrap">
                  <span className="wal-amount-symbol">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Custom Amount"
                    className="input-field wal-amount-input"
                  />
                </div>
                <button type="submit" disabled={saving || !amount} className="btn-primary">
                  <Plus size={15} /> {saving ? 'Processing…' : 'Recharge Now'}
                </button>
              </form>

              {error && (
                <div className="wal-error-msg">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {success && (
                <div className="wal-success-msg">
                  <CheckCircle2 size={14} /> {success}
                </div>
              )}

              {/* Bank Transfer Box */}
              <div className="wal-bank-row">
                <div className="wal-bank-left">
                  <Building2 size={16} color="#2563EB" />
                  <span className="wal-bank-label">Virtual Bank Account Transfer (NEFT/RTGS)</span>
                </div>
                <button className="wal-bank-link">
                  View Account Details ›
                </button>
              </div>
            </div>
          </div>

          {/* 3. Enable Reminder Alert Banner */}
          <div className="card-shell wal-reminder-card">
            <div className="wal-reminder-left">
              <div className="wal-reminder-icon">
                <Bell size={18} />
              </div>
              <div>
                <div className="wal-reminder-title">Automated Daily Low Balance Email Alert</div>
                <div className="wal-reminder-sub">Receive email notifications when corporate wallet balance drops below ₹10,000</div>
              </div>
            </div>

            <button
              onClick={() => setReminder((r) => !r)}
              className={`wal-toggle ${reminder ? 'wal-toggle--on' : ''}`}
            >
              <div className={`wal-toggle-knob ${reminder ? 'wal-toggle-knob--on' : ''}`} />
            </button>
          </div>

          {/* 4. Transactions Data Table Card */}
          <div className="card-shell wal-table-card">
            {/* Header Bar */}
            <div className="wal-table-header">
              <div>
                <h3 className="wal-card-title">
                  Wallet Activity & Transactions ({filteredTransactions.length})
                </h3>
                <span className="wal-table-sub">All debits, top-ups, and refunds</span>
              </div>

              <div className="wal-table-controls">
                <div className="wal-search-wrap">
                  <Search size={14} color="#9CA3AF" className="wal-search-icon" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reference..."
                    className="input-field wal-search-input"
                  />
                </div>

                <button className="btn-secondary">
                  <Download size={14} /> Download CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="wal-table-scroll">
              <table className="wal-table">
                <thead>
                  <tr className="wal-thead-row">
                    {['REFERENCE ID', 'BOOKED / ADDED BY', 'TYPE', 'DATE', 'AMOUNT', 'REASON / DETAILS'].map((h) => (
                      <th key={h} className="wal-th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="wal-loading-cell">
                        Loading transaction log…
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="wal-empty-cell">
                        <Wallet size={32} color="#9CA3AF" className="wal-empty-icon" />
                        <div className="wal-empty-title">No Activity Found</div>
                        <div className="wal-empty-sub">Wallet activity will appear here once top-ups or bookings occur.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const label = TYPE_LABELS[tx.type] ?? tx.type.toUpperCase()
                      const isCredit = tx.type === 'topup' || tx.type === 'refund'

                      return (
                        <tr key={tx.id} className="wal-tr">
                          <td className="wal-td-ref">
                            <div className="wal-ref-row">
                              {isCredit ? <ArrowDownLeft size={16} color="#047857" /> : <ArrowUpRight size={16} color="#B45309" />}
                              <span className="wal-ref-text">
                                {tx.reference ? tx.reference.slice(0, 18) : tx.id.slice(0, 14)}
                              </span>
                            </div>
                          </td>
                          <td className="wal-td-by">
                            {tx.created_by || 'System Admin'}
                          </td>
                          <td className="wal-td-type">
                            <span className={`wal-type-pill ${typePillClass(tx.type)}`}>
                              {label}
                            </span>
                          </td>
                          <td className="wal-td-date">{fmtDate(tx.created_at)}</td>
                          <td className={`wal-td-amount ${isCredit ? 'wal-td-amount--credit' : ''}`}>
                            {isCredit ? '+' : '-'}{fmt(tx.amount)}
                          </td>
                          <td className="wal-td-reason">{tx.description || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
