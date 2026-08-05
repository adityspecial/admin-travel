'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/api'
import { SpendAndBookingsRow, AdvanceAndHotelsRow, AirlinesAndTravellersRow } from './_components/DashboardCharts'
import { ApprovalStatsRow, PolicyGaugeRow } from './_components/DashboardCharts2'
import DashboardMetricsBar from './_components/DashboardMetricsBar'
import HeroSection from './_components/HeroSection'

function fmtFull(n: number) { return '₹' + n.toLocaleString('en-IN') }

type Period = 'week' | 'month' | 'quarter' | 'year'

function getRange(p: Period): { from: string; to: string; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  if (p === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { from: iso(mon), to: iso(now), label: `${fmt(mon)} → ${fmt(sun)}` }
  }
  if (p === 'month') return { from: iso(new Date(y, m, 1)), to: iso(now), label: M[m] }
  if (p === 'quarter') {
    const qm = Math.floor(m / 3) * 3
    return { from: iso(new Date(y, qm, 1)), to: iso(now), label: `${M[qm]} → ${M[qm + 2]}` }
  }
  return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) }
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week',    label: 'THIS WEEK'    },
  { key: 'month',   label: 'THIS MONTH'   },
  { key: 'quarter', label: 'THIS QUARTER' },
  { key: 'year',    label: 'THIS YEAR'    },
]

export default function BizDashboard() {
  const [period,    setPeriod]    = useState<Period>('quarter')
  const [reports,   setReports]   = useState<any>(null)
  const [wallet,    setWallet]    = useState<any>(null)
  const [approvals, setApprovals] = useState<any[]>([])
  const [policy,    setPolicy]    = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  const range = useMemo(() => getRange(period), [period])

  // Reports are the only call scoped to the selected period — refetch on period change only
  useEffect(() => {
    setLoading(true)
    adminFetch(`/api/admin/biz/reports?from=${range.from}&to=${range.to}`)
      .then(setReports).catch(() => {}).finally(() => setLoading(false))
  }, [range.from, range.to])

  // Wallet/approvals/policy are period-independent — fetch once on mount, not on every period switch
  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/wallet'),
      adminFetch('/api/admin/biz/approvals?status=all'),
      adminFetch('/api/admin/biz/policy'),
    ]).then(([w, a, p]) => {
      setWallet(w)
      setApprovals(a.approvals ?? [])
      setPolicy(p.policy)
    }).catch(() => {})
  }, [])

  const s          = reports?.summary
  const walletBal  = (wallet?.balance ?? 0) / 100
  const byType     = reports?.byType ?? []
  const travellers = (reports?.byEmployee ?? []).slice(0, 5)

  const topAirlines = (reports?.byAirline ?? []).slice(0, 5) as { airline: string; code: string; count: number }[]

  const approvalStats = useMemo(() => {
    const total      = approvals.length
    const approved   = approvals.filter(a => a.status === 'approved').length
    const pending    = approvals.filter(a => a.status === 'pending').length
    const rejected   = approvals.filter(a => a.status === 'rejected').length
    const flightCount = approvals.filter(a => a.flight_data).length
    const hotelCount  = approvals.filter(a => a.hotel_data).length
    return { total, approved, pending, rejected, flightCount, hotelCount }
  }, [approvals])

  const topHotels = useMemo(() => {
    const map: Record<string, { hotel: string; city: string; spend: number; count: number }> = {}
    for (const a of approvals) {
      if (a.status !== 'approved' || !a.hotel_data) continue
      const key = a.hotel_data.hotel_name ?? a.hotel_data.hotelName ?? 'Unknown'
      if (!map[key]) map[key] = { hotel: key, city: a.hotel_data.city ?? a.hotel_data.cityName ?? '--', spend: 0, count: 0 }
      map[key].spend += a.amount ?? 0
      map[key].count += 1
    }
    return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 5)
  }, [approvals])

  const gaugeStats = useMemo(() => {
    const { total, approved, flightCount, hotelCount } = approvalStats
    const approvalRate = total > 0 ? Math.round(approved / total * 100) : 0
    const flightShare  = total > 0 ? Math.round(flightCount / total * 100) : 0
    const hotelShare   = total > 0 ? Math.round(hotelCount  / total * 100) : 0
    let earlyCount = 0, flightTotal = 0
    for (const a of approvals) {
      const dep = a.flight_data?.date || a.flight_data?.departure_date
      if (!dep) continue
      flightTotal++
      const days = Math.floor((new Date(dep).getTime() - new Date(a.created_at).getTime()) / 86400000)
      if (days >= 7) earlyCount++
    }
    const earlyBookingRate = flightTotal > 0 ? Math.round(earlyCount / flightTotal * 100) : 0
    return { approvalRate, flightShare, hotelShare, earlyBookingRate }
  }, [approvalStats, approvals])

  const advancePurchase = useMemo(() => {
    const b = { '<7': 0, '7–14': 0, '15–30': 0, '>30': 0 }
    for (const a of approvals) {
      const dep = a.flight_data?.date || a.flight_data?.departure_date
             // || a.bus_data?.date          // uncomment when bus approvals go live
             // || a.train_data?.date        // uncomment when train approvals go live
      if (!dep) continue
      const days = Math.max(0, Math.floor((new Date(dep).getTime() - new Date(a.created_at).getTime()) / 86400000))
      if (days < 7) b['<7']++; else if (days < 15) b['7–14']++; else if (days < 31) b['15–30']++; else b['>30']++
    }
    const max = Math.max(...Object.values(b), 1)
    return Object.entries(b).map(([label, count]) => ({ label, count, pct: Math.round((count / max) * 100) }))
  }, [approvals])

  return (
    <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 54px)', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .biz-content-container {
          padding: 0 32px 40px;
        }
        @media (max-width: 1024px) {
          .biz-content-container {
            padding: 0 20px 32px;
          }
        }
        @media (max-width: 640px) {
          .biz-content-container {
            padding: 0 12px 24px;
          }
        }
      `}</style>

      {/* Lucrative Hero Section Component */}
      <HeroSection companyName={policy?.name} walletBalance={walletBal} />

      <div className="biz-content-container">

        {/* Lucrative Dashboard Overview & Metrics Bar */}
        <DashboardMetricsBar
          period={period}
          setPeriod={setPeriod}
          rangeLabel={range.label}
          loading={loading}
          totalBookings={s?.totalBookings ?? 0}
          totalSpend={fmtFull(s?.totalSpend ?? 0)}
          totalSavings="₹0"
          walletBalance={fmtFull(walletBal)}
        />

        {/* Approval + gauge charts */}
        <ApprovalStatsRow {...approvalStats} />
        <PolicyGaugeRow {...gaugeStats} />

        {/* Charts — all extracted */}
        <SpendAndBookingsRow byType={byType} />
        <AdvanceAndHotelsRow advancePurchase={advancePurchase} topHotels={topHotels} />
        <AirlinesAndTravellersRow topAirlines={topAirlines} travellers={travellers} />
      </div>
    </div>
  )
}
