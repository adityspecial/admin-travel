'use client'

import React from 'react'
import {
  FileCheck2,
  CheckCircle2,
  Plane,
  Building2,
  Activity,
  Compass,
  Hotel,
  Clock,
} from 'lucide-react'

// ── Speedometer Half-Circle Gauge (Pure Math SVG) ─────────

function GaugeChart({ pct, color }: { pct: number; color: string }) {
  const p = Math.min(Math.max(pct, 0), 100)
  const width = 140
  const height = 76
  const strokeWidth = 14
  const radius = 54
  const cx = 70
  const cy = 66
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (p / 100) * circumference

  return (
    <div style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
        {/* Background Half Ring */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active Colored Half Ring */}
        {p > 0 && (
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      {/* Centered Percentage Text */}
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '17px',
          fontWeight: 900,
          color: '#111827',
          letterSpacing: '-0.02em',
        }}
      >
        {Math.round(pct)}%
      </div>
    </div>
  )
}

// ── Ring Donut Full Circle (Pure Math SVG) ─────────────────

function RingChart({ pct, color, size = 96 }: { pct: number; color: string; size?: number }) {
  const p = Math.min(Math.max(pct, 0), 100)
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (p / 100) * circumference

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto', flexShrink: 0 }}>
      {/* Background Ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F3F4F6"
        strokeWidth={strokeWidth}
      />
      {/* Active Colored Ring */}
      {p > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      )}
    </svg>
  )
}

// ── Approval Stats Row (4 Lucrative Ring Stat Cards) ──────────────────────────

export function ApprovalStatsRow({
  total,
  approved,
  pending,
  rejected,
  flightCount,
  hotelCount,
}: {
  total: number
  approved: number
  pending: number
  rejected: number
  flightCount: number
  hotelCount: number
}) {
  const approvalPct = total > 0 ? Math.round((approved / total) * 100) : 0
  const flightPct = total > 0 ? Math.round((flightCount / total) * 100) : 0
  const hotelPct = total > 0 ? Math.round((hotelCount / total) * 100) : 0

  const cards = [
    {
      label: 'Total Requests',
      value: total,
      sub: `${approved} approved · ${pending} pending`,
      pct: approvalPct,
      color: '#2563EB',
      lightBg: '#EFF6FF',
      icon: FileCheck2,
    },
    {
      label: 'Approved',
      value: approved,
      sub: `${approvalPct}% approval rate`,
      pct: approvalPct,
      color: '#10B981',
      lightBg: '#ECFDF5',
      icon: CheckCircle2,
    },
    {
      label: 'Flights',
      value: flightCount,
      sub: `${flightPct}% of requests`,
      pct: flightPct,
      color: '#F97316',
      lightBg: '#FFF7ED',
      icon: Plane,
    },
    {
      label: 'Hotels',
      value: hotelCount,
      sub: `${hotelPct}% of requests`,
      pct: hotelPct,
      color: '#8B5CF6',
      lightBg: '#F5F3FF',
      icon: Building2,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '24px' }}>
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.label}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              padding: '22px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(0, 0, 0, 0.09)'
              e.currentTarget.style.borderColor = c.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)'
              e.currentTarget.style.borderColor = '#E5E7EB'
            }}
          >
            {/* Top Label & Icon Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', width: '100%' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: c.lightBg,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>{c.label}</span>
            </div>

            {/* Central Ring Donut Chart */}
            <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <RingChart pct={c.pct} color={c.color} size={96} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '19px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: c.color, marginTop: '3px' }}>{c.pct}%</div>
              </div>
            </div>

            {/* Bottom Subtitle Pill */}
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#6B7280',
                background: '#F9FAFB',
                padding: '4px 12px',
                borderRadius: '99px',
                border: '1px solid #F3F4F6',
                margin: '0 auto',
              }}
            >
              {c.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Policy Gauge Row (4 Lucrative Speedometer Cards) ──────────────────────────

export function PolicyGaugeRow({
  approvalRate,
  flightShare,
  hotelShare,
  earlyBookingRate,
}: {
  approvalRate: number
  flightShare: number
  hotelShare: number
  earlyBookingRate: number
}) {
  const gauges = [
    {
      label: 'Approval Rate',
      pct: approvalRate,
      color: '#10B981',
      lightBg: '#ECFDF5',
      icon: Activity,
      sub: 'of requests approved',
      detail: approvalRate >= 80 ? 'Excellent' : approvalRate >= 50 ? 'Good' : 'Needs attention',
    },
    {
      label: 'Flight Share',
      pct: flightShare,
      color: '#F97316',
      lightBg: '#FFF7ED',
      icon: Compass,
      sub: 'of bookings are flights',
      detail: `${100 - flightShare}% hotels`,
    },
    {
      label: 'Hotel Share',
      pct: hotelShare,
      color: '#8B5CF6',
      lightBg: '#F5F3FF',
      icon: Hotel,
      sub: 'of bookings are hotels',
      detail: `${100 - hotelShare}% flights`,
    },
    {
      label: 'Early Booking',
      pct: earlyBookingRate,
      color: '#2563EB',
      lightBg: '#EFF6FF',
      icon: Clock,
      sub: 'booked 7+ days ahead',
      detail: earlyBookingRate >= 70 ? 'Great planning' : 'Encourage early',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '24px' }}>
      {gauges.map((g) => {
        const Icon = g.icon
        return (
          <div
            key={g.label}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              padding: '22px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(0, 0, 0, 0.09)'
              e.currentTarget.style.borderColor = g.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)'
              e.currentTarget.style.borderColor = '#E5E7EB'
            }}
          >
            {/* Header Title with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', width: '100%' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: g.lightBg,
                  color: g.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>{g.label}</span>
            </div>

            {/* Gauge Speedometer Chart Centered */}
            <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
              <GaugeChart pct={g.pct} color={g.color} />
            </div>

            {/* Description & Detail Chip */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <div style={{ fontSize: '11.5px', color: '#6B7280', marginBottom: '6px' }}>{g.sub}</div>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: g.color,
                  background: g.lightBg,
                  padding: '3px 12px',
                  borderRadius: '99px',
                  display: 'inline-block',
                }}
              >
                {g.detail}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
