'use client'

import React from 'react'
import Link from 'next/link'
import {
  CreditCard,
  BarChart3,
  Calendar,
  Building2,
  Plane,
  Users,
  ArrowUpRight,
} from 'lucide-react'

function fmtFull(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

const COLORS: Record<string, string> = {
  flight: '#F97316',
  international_flight: '#0EA5E9',
  hotel: '#2563EB',
  bus: '#7C3AED',
  package: '#10B981',
}

const LABELS: Record<string, string> = {
  flight: 'Domestic Flights (DF)',
  international_flight: 'International Flights (IF)',
  hotel: 'Domestic Hotels (DH)',
  bus: 'Bus Services',
  package: 'Holiday Packages',
}

// ── Row 1: Spend Donut + Bookings Bar ──────────────────────────────────────────

export function SpendAndBookingsRow({ byType }: { byType: any[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
      {/* Total Spend Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
        }}
      >
        <div>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
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
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Total Spend</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Expense breakdown by booking type</span>
              </div>
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '3px 10px', borderRadius: '99px' }}>
              Live Data
            </span>
          </div>

          {/* Body Content — Centered */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              {byType.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9CA3AF', padding: '16px 0', textAlign: 'center' }}>No spend recorded for this period.</div>
              ) : (
                byType.map((t: any, idx: number) => {
                  const categoryColor = COLORS[t.booking_type] ?? '#9CA3AF'
                  const categoryName = LABELS[t.booking_type] ?? t.booking_type
                  return (
                    <div
                      key={t.booking_type ?? idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: '#F9FAFB',
                        marginBottom: '8px',
                        border: '1px solid #F3F4F6',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: categoryColor, flexShrink: 0 }} />
                        <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>{categoryName}</span>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>{fmtFull(t.spend)}</span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Donut Chart Container Centered */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DonutChart segments={byType.map((t: any) => ({ value: t.spend, color: COLORS[t.booking_type] ?? '#9CA3AF' }))} />
            </div>
          </div>
        </div>

        {/* Action Link */}
        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Total Bookings Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
        }}
      >
        <div>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Total Bookings</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Volume by travel segment</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container Centered */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <BookingBarChart data={byType} />
          </div>
        </div>

        {/* Action Link */}
        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ── Row 2: Advance Purchase + Top Booked Hotels ─────────────────────────────

export function AdvanceAndHotelsRow({
  advancePurchase,
  topHotels,
}: {
  advancePurchase: { label: string; count: number; pct: number }[]
  topHotels: { hotel: string; city: string; spend: number; count: number }[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
      {/* Advance Purchase Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FFF7ED',
                  color: '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Advance Purchase Stats</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Booking lead time distribution</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <AdvancePurchaseDonut data={advancePurchase} />
          </div>
        </div>

        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Top Booked Hotels Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Top Booked Hotels</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Preferred hotel accommodations</span>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['HOTEL', 'CITY', 'TOTAL SPEND', 'BOOKINGS'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        fontSize: '11px',
                        color: '#6B7280',
                        fontWeight: 700,
                        padding: '10px 12px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topHotels.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '28px 12px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>
                      No hotel booking data available for this period.
                    </td>
                  </tr>
                ) : (
                  topHotels.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ fontSize: '13px', fontWeight: 700, color: '#111827', padding: '12px' }}>{h.hotel}</td>
                      <td style={{ fontSize: '12.5px', color: '#4B5563', padding: '12px' }}>{h.city}</td>
                      <td style={{ fontSize: '13px', fontWeight: 800, color: '#111827', padding: '12px' }}>{fmtFull(h.spend)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '99px' }}>
                          {h.count}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ── Row 3: Top Airlines + Frequent Travellers ─────────────────────────────────

export function AirlinesAndTravellersRow({
  topAirlines,
  travellers,
}: {
  topAirlines: { airline: string; code: string; count: number }[]
  travellers: { email: string; count: number; spend: number }[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
      {/* Top Airlines Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FFF7ED',
                  color: '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plane size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Top Airlines</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Most preferred flight carriers</span>
              </div>
            </div>
          </div>

          {topAirlines.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9CA3AF', padding: '24px 0', textAlign: 'center' }}>No flight booking data available yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', fontSize: '11px', color: '#6B7280', fontWeight: 700, padding: '10px 12px' }}>AIRLINE</th>
                    <th style={{ textAlign: 'right', fontSize: '11px', color: '#6B7280', fontWeight: 700, padding: '10px 12px' }}>BOOKINGS</th>
                  </tr>
                </thead>
                <tbody>
                  {topAirlines.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ fontSize: '13px', fontWeight: 700, color: '#111827', padding: '12px' }}>
                        {a.airline}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF' }}>({a.code})</span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#F97316', background: '#FFF7ED', padding: '3px 12px', borderRadius: '99px' }}>
                          {a.count} flight{a.count > 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Frequent Travellers Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          padding: '26px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Frequent Travellers</h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Top active employee travellers</span>
              </div>
            </div>
          </div>

          {travellers.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9CA3AF', padding: '24px 0', textAlign: 'center' }}>No traveller data recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', fontSize: '11px', color: '#6B7280', fontWeight: 700, padding: '10px 12px' }}>TRAVELLER</th>
                    <th style={{ textAlign: 'right', fontSize: '11px', color: '#6B7280', fontWeight: 700, padding: '10px 12px' }}>SPEND</th>
                    <th style={{ textAlign: 'right', fontSize: '11px', color: '#6B7280', fontWeight: 700, padding: '10px 12px' }}>BOOKINGS</th>
                  </tr>
                </thead>
                <tbody>
                  {travellers.map((t: any, i: number) => {
                    const initials = t.email?.slice(0, 2).toUpperCase() || 'TR'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#E31E24', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {initials}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{t.email}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', fontWeight: 800, color: '#111827', textAlign: 'right', padding: '12px' }}>{fmtFull(t.spend)}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '99px' }}>
                            {t.count}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Link
          href="/biz/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: '#2563EB',
            textDecoration: 'none',
            marginTop: '20px',
            letterSpacing: '0.03em',
          }}
        >
          <span>VIEW DETAILED REPORT</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ── Advance Purchase Donut Component (Pure Math SVG) ──────────────────────────

const ADV_COLORS = ['#EF4444', '#F97316', '#2563EB', '#10B981']
const ADV_LABELS = ['< 7 days', '7 – 14 days', '15 – 30 days', '> 30 days']

function AdvancePurchaseDonut({ data }: { data: { label: string; count: number; pct: number }[] }) {
  const total = data.reduce((s, b) => s + b.count, 0)
  const size = 136
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativeAngle = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', width: '100%', padding: '4px 0' }}>
      {total === 0 ? (
        <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', padding: '28px 0', width: '100%' }}>
          No flight booking lead time data recorded yet.
        </div>
      ) : (
        <>
          {/* Pure Math Centered Donut Ring */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ display: 'block', margin: 0, transform: 'rotate(-90deg)' }}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#F3F4F6"
                strokeWidth={strokeWidth}
              />
              {data.map((b, i) => {
                if (b.count === 0 || total === 0) return null
                const segPct = b.count / total
                const dashArray = `${segPct * circumference} ${circumference}`
                const strokeDashoffset = -cumulativeAngle * (circumference / 360)
                const currentAngle = segPct * 360
                const color = ADV_COLORS[i]

                const circleElement = (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                )
                cumulativeAngle += currentAngle
                return circleElement
              })}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.05em', marginTop: '3px' }}>BOOKINGS</div>
            </div>
          </div>

          {/* Progress Bars List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
            {data.map((d, i) => {
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
              const color = ADV_COLORS[i]
              const label = ADV_LABELS[i]
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#111827' }}>
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '99px', background: '#F3F4F6', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '99px',
                        background: color,
                        width: `${pct}%`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── SVG Donut Chart Component ────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (!total)
    return (
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: '#F9FAFB',
          border: '8px solid #F3F4F6',
          flexShrink: 0,
        }}
      />
    )

  const R = 52,
    cx = 65,
    cy = 65,
    stroke = 20
  let angle = -90
  const paths = segments.map((seg) => {
    const sweep = (seg.value / total) * 360
    const a1 = (angle * Math.PI) / 180
    const a2 = ((angle + sweep) * Math.PI) / 180
    const d = `M ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)}`
    angle += sweep
    return { d, color: seg.color }
  })

  return (
    <svg width={130} height={130} viewBox="0 0 130 130" style={{ flexShrink: 0, display: 'block' }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round" />
      ))}
    </svg>
  )
}

// ── Booking Bar Chart Component ──────────────────────────────────────────────

function BookingBarChart({ data }: { data: any[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  if (data.length === 0)
    return (
      <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', padding: '36px 0', width: '100%' }}>
        No booking data recorded for this period.
      </div>
    )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '24px',
          height: '140px',
          paddingBottom: '24px',
          position: 'relative',
          width: '100%',
          maxWidth: '360px',
          margin: '0 auto',
        }}
      >
        {/* Background Dashed Gridlines */}
        {[0, 1, 2, 3].map((n) => (
          <div key={`grid-${n}`} style={{ position: 'absolute', left: 0, right: 0, bottom: 24 + (n / 3) * 100, borderTop: '1px dashed #F3F4F6' }}>
            <span style={{ position: 'absolute', left: 0, top: -7, fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>
              {Math.round((n / 3) * maxCount)}
            </span>
          </div>
        ))}

        {/* Bars Centered */}
        {data.map((t: any, idx: number) => {
          const barColor = COLORS[t.booking_type] ?? '#9CA3AF'
          const barLabel = LABELS[t.booking_type] ?? t.booking_type
          const barHeight = Math.max((t.count / maxCount) * 90, 8)

          return (
            <div
              key={t.booking_type ?? idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
                zIndex: 2,
                height: '100%',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#111827' }}>{t.count}</div>
              <div
                style={{
                  width: '48px',
                  background: barColor,
                  borderRadius: '8px 8px 0 0',
                  height: `${barHeight}px`,
                  transition: 'height 0.4s ease',
                  boxShadow: `0 4px 12px ${barColor}44`,
                  margin: '0 auto',
                }}
              />
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textAlign: 'center', position: 'absolute', bottom: 0 }}>
                {barLabel}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
