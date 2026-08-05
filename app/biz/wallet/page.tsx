'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { FilterSidebar, FilterSidebarBlock } from '../_components/FilterSidebar'
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
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MONTHS_NOW = (() => {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const results = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(y, m - i, 1)
    results.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` })
  }
  results.push({ label: `Q1 ${y}`, from: `${y}-01-01` })
  results.push({ label: 'All Dates', from: '' })
  return results
})()

const TRIP_TYPES = ['Flights', 'Hotels', 'Cabs', 'Bus', 'Train', 'Meals']
const RECHARGE_METHODS = ['Payment Gateway', 'Bank Transfer (Virtual A/C)', 'Manual Topup']

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

  const LOW_THRESHOLD = 500000 // ₹5,000
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
    return true
  })

  const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    topup: { label: 'CREDIT', color: '#047857', bg: '#ECFDF5', border: '#6EE7B7' },
    refund: { label: 'CREDIT', color: '#047857', bg: '#ECFDF5', border: '#6EE7B7' },
    debit: { label: 'DEBIT', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    adjustment: { label: 'ADJUST', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' },
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .wallet-wrapper {
          display: flex;
          min-height: calc(100vh - 54px);
        }
        .filter-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
          border-right: 1px solid #E5E7EB;
        }
        .filter-sidebar__scroll::-webkit-scrollbar { width: 5px; }
        .filter-sidebar__scroll::-webkit-scrollbar-track { background: transparent; }
        .filter-sidebar__scroll::-webkit-scrollbar-thumb {
          background: rgba(209,213,219,0.85);
          border-radius: 99px;
        }
        .filter-sidebar__scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(156,163,175,1);
        }
        .wallet-main {
          flex: 1;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        .hero-banner-box {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
          border-radius: 24px;
          padding: 32px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px -10px rgba(49, 46, 129, 0.25);
        }
        .card-shell {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .input-field {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .input-field:focus {
          border-color: var(--accent, #E31E24);
          box-shadow: 0 0 0 3px rgba(227, 30, 36, 0.1);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px var(--accent, rgba(227, 30, 36, 0.25));
          white-space: nowrap;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px var(--accent, rgba(227, 30, 36, 0.35));
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .preset-chip {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #E5E7EB;
          background: #F9FAFB;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-chip.active {
          border-color: var(--accent, #E31E24);
          background: #FEF2F2;
          color: var(--accent, #E31E24);
          box-shadow: 0 4px 10px rgba(227, 30, 36, 0.1);
        }
        .mobile-filter-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .wallet-wrapper {
            flex-direction: column;
          }
          .filter-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #E5E7EB;
            display: ${showMobileFilters ? 'block' : 'none'};
          }
          .mobile-filter-toggle {
            display: inline-flex;
          }
          .wallet-main {
            padding: 20px 16px 36px;
          }
          .hero-banner-box {
            padding: 24px;
            border-radius: 20px;
          }
        }
        @media (max-width: 640px) {
          .wallet-main {
            padding: 14px 10px 28px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

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
              <label key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="txnDate"
                  checked={datePreset === p.label}
                  onChange={() => setDatePreset(p.label)}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: datePreset === p.label ? 700 : 500 }}>{p.label}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Transaction Type */}
          <FilterSidebarBlock title="Transaction Type">
            {[
              ['Debit (Spend)', 'Debit'],
              ['Credit (Topup/Refund)', 'Credit'],
            ].map(([lbl, val]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={txnType.includes(val)}
                  onChange={(e) => setTxnType((prev) => (e.target.checked ? [...prev, val] : prev.filter((x) => x !== val)))}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{lbl}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Trip Type */}
          <FilterSidebarBlock title="Trip Category">
            {TRIP_TYPES.map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tripType.includes(t)}
                  onChange={(e) => setTripType((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>

          {/* Recharge Method */}
          <FilterSidebarBlock title="Recharge Method">
            {RECHARGE_METHODS.map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rechargeMethod.includes(t)}
                  onChange={(e) => setRechargeMethod((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))}
                  style={{ accentColor: 'var(--accent, #E31E24)', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t}</span>
              </label>
            ))}
          </FilterSidebarBlock>
        </FilterSidebar>

        {/* Main Content Area */}
        <main className="wallet-main">
          {/* Breadcrumb Navigation & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              <span>Admin</span>
              <ChevronRight size={13} color="#9CA3AF" />
              <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Wallet & Balance</span>
            </div>

            <button onClick={() => setShowMobileFilters((v) => !v)} className="btn-secondary mobile-filter-toggle">
              <Filter size={14} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Hero Banner Header */}
          <div className="hero-banner-box">
            {/* Ambient Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(227, 30, 36, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Wallet size={28} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Corporate Wallet <Sparkles size={18} color="#F59E0B" />
                  </h1>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
                    Instant prepaid travel account for automated employee flight & hotel bookings with zero payment friction.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Hero Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Available Balance</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>{loading ? '…' : fmt(balance)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Account Status</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: isLow ? '#FBBF24' : '#34D399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLow ? '#FBBF24' : '#34D399' }} />
                  {isLow ? 'RECHARGE RECOMMENDED' : 'ACTIVE & READY'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Recent Transactions</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>{transactions.length} Activity Log</div>
              </div>
            </div>
          </div>

          {/* Top Cards Row: Balance Summary + Recharge Center */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* 1. Wallet Balance Card */}
            <div className="card-shell">
              {isLow && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    color: '#B45309',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Low Balance Warning: Maintain over ₹5,000 for uninterrupted bookings</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#FEF2F2',
                    color: 'var(--accent, #E31E24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(227, 30, 36, 0.1)',
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Total Available Balance</span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>
                    {loading ? '…' : fmt(balance)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #F3F4F6',
                }}
              >
                <Gift size={20} color="#F59E0B" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>0 Corporate Bonus Points</div>
                  <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Earn rewards on every flight & hotel booking</div>
                </div>
              </div>
            </div>

            {/* 2. Add Money & Recharge Center */}
            <div className="card-shell">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Zap size={20} color="var(--accent, #E31E24)" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Recharge Wallet Balance</h3>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
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

              <form onSubmit={handleTopup} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Custom Amount"
                    className="input-field"
                    style={{ paddingLeft: '28px', width: '100%', fontWeight: 700 }}
                  />
                </div>
                <button type="submit" disabled={saving || !amount} className="btn-primary">
                  <Plus size={15} /> {saving ? 'Processing…' : 'Recharge Now'}
                </button>
              </form>

              {error && (
                <div style={{ color: '#DC2626', fontSize: '12.5px', marginTop: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {success && (
                <div style={{ color: '#047857', fontSize: '12.5px', marginTop: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> {success}
                </div>
              )}

              {/* Bank Transfer Box */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="#2563EB" />
                  <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>Virtual Bank Account Transfer (NEFT/RTGS)</span>
                </div>
                <button style={{ fontSize: '12px', color: '#2563EB', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>
                  View Account Details ›
                </button>
              </div>
            </div>
          </div>

          {/* 3. Enable Reminder Alert Banner */}
          <div className="card-shell" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FFF7ED',
                  color: '#EA580C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Automated Daily Low Balance Email Alert</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Receive email notifications when corporate wallet balance drops below ₹10,000</div>
              </div>
            </div>

            <button
              onClick={() => setReminder((r) => !r)}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                background: reminder ? 'var(--accent, #E31E24)' : '#D1D5DB',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: reminder ? '23px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* 4. Transactions Data Table Card */}
          <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header Bar */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Wallet Activity & Transactions ({filteredTransactions.length})
                </h3>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>All debits, top-ups, and refunds</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reference..."
                    className="input-field"
                    style={{ paddingLeft: '32px', fontSize: '12px' }}
                  />
                </div>

                <button className="btn-secondary">
                  <Download size={14} /> Download CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['REFERENCE ID', 'BOOKED / ADDED BY', 'TYPE', 'DATE', 'AMOUNT', 'REASON / DETAILS'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
                        Loading transaction log…
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Wallet size={32} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>No Activity Found</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Wallet activity will appear here once top-ups or bookings occur.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type.toUpperCase(), color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' }
                      const isCredit = tx.type === 'topup' || tx.type === 'refund'

                      return (
                        <tr key={tx.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isCredit ? <ArrowDownLeft size={16} color="#047857" /> : <ArrowUpRight size={16} color="#B45309" />}
                              <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: 800, color: '#111827' }}>
                                {tx.reference ? tx.reference.slice(0, 18) : tx.id.slice(0, 14)}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                            {tx.created_by || 'System Admin'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.border}`,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#6B7280' }}>{fmtDate(tx.created_at)}</td>
                          <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 900, color: isCredit ? '#047857' : '#111827' }}>
                            {isCredit ? '+' : '-'}{fmt(tx.amount)}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>{tx.description || '—'}</td>
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
