'use client'

import React from 'react'
import Link from 'next/link'
import {
  Ticket,
  CreditCard,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronRight,
  PlusCircle,
  Sparkles,
} from 'lucide-react'

type Period = 'week' | 'month' | 'quarter' | 'year'

interface DashboardMetricsBarProps {
  period: Period
  setPeriod: (p: Period) => void
  rangeLabel: string
  loading: boolean
  totalBookings: string | number
  totalSpend: string
  totalSavings: string
  walletBalance: string
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'THIS WEEK' },
  { key: 'month', label: 'THIS MONTH' },
  { key: 'quarter', label: 'THIS QUARTER' },
  { key: 'year', label: 'THIS YEAR' },
]

export default function DashboardMetricsBar({
  period,
  setPeriod,
  rangeLabel,
  loading,
  totalBookings,
  totalSpend,
  totalSavings,
  walletBalance,
}: DashboardMetricsBarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        marginTop: '24px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar with Range & Period Segmented Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderBottom: '1px solid #F3F4F6',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left Title & Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(227, 30, 36, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31E24',
            }}
          >
            <Calendar size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Dashboard Overview
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6B7280',
                  background: '#F3F4F6',
                  padding: '2px 10px',
                  borderRadius: '99px',
                }}
              >
                {rangeLabel}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Real-time corporate travel analytics</div>
          </div>
        </div>

        {/* Right Segmented Period Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#F3F4F6',
            padding: '4px',
            borderRadius: '12px',
          }}
        >
          {PERIODS.map((p) => {
            const isActive = period === p.key
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.03em',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'var(--accent, #E31E24)' : 'transparent',
                  color: isActive ? '#ffffff' : '#6B7280',
                  boxShadow: isActive ? '0 4px 12px var(--accent, rgba(227, 30, 36, 0.25))' : 'none',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        .metrics-bar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .metrics-card-item {
          padding: 24px 28px;
          border-right: 1px solid #F3F4F6;
          transition: background 0.2s ease;
        }
        .metrics-card-item:last-child {
          border-right: none;
        }
        @media (max-width: 1024px) {
          .metrics-bar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .metrics-card-item {
            padding: 20px;
            border-bottom: 1px solid #F3F4F6;
          }
          .metrics-card-item:nth-child(2n) {
            border-right: none;
          }
        }
        @media (max-width: 640px) {
          .metrics-bar-grid {
            grid-template-columns: 1fr;
          }
          .metrics-card-item {
            padding: 16px;
            border-right: none !important;
            border-bottom: 1px solid #F3F4F6;
          }
          .metrics-card-item:last-child {
            border-bottom: none;
          }
        }
      `}</style>

      {/* 4 Lucrative Stat Cards */}
      <div className="metrics-bar-grid">
        {/* Stat 1: Total Bookings */}
        <div className="metrics-card-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#6B7280' }}>Total Bookings</span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ticket size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
            {loading ? '…' : totalBookings}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Live Active Trackers
          </div>
        </div>

        {/* Stat 2: Total Spend */}
        <div className="metrics-card-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#6B7280' }}>Total Spend</span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FEF2F2',
                color: '#E31E24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
            {loading ? '…' : totalSpend}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '6px' }}>Corporate Expenses</div>
        </div>

        {/* Stat 3: Total Savings */}
        <div className="metrics-card-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#6B7280' }}>Total Savings</span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em' }}>
            {totalSavings}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700, marginTop: '6px' }}>Policy Optimized</div>
        </div>

        {/* Stat 4: Current Wallet Balance */}
        <div className="metrics-card-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#6B7280' }}>Current Wallet Balance</span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FFF7ED',
                color: '#F97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              {loading ? '…' : walletBalance}
            </div>
            <Link
              href="/biz/wallet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 800,
                color: '#2563EB',
                textDecoration: 'none',
                background: '#EFF6FF',
                padding: '6px 14px',
                borderRadius: '6px',
              }}
            >
              <PlusCircle size={16} />
              <span>Top-up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
