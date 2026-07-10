'use client'
import { PieChart, Pie, Cell } from 'recharts'

// ── Gauge (half-circle speedometer via Recharts Pie) ─────────────────────────

function GaugeChart({ pct, color }: { pct: number; color: string }) {
  const p = Math.min(Math.max(pct, 0), 100)
  return (
    <div style={{ position: 'relative', width: 130, height: 76 }}>
      <PieChart width={130} height={76}>
        <Pie data={[{ v: p }, { v: 100 - p }]} cx={65} cy={68}
          startAngle={180} endAngle={0} innerRadius={44} outerRadius={60}
          dataKey="v" stroke="none">
          <Cell fill={color} />
          <Cell fill="#F3F4F6" />
        </Pie>
      </PieChart>
      <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: 900, color: '#1a1a2e' }}>
        {Math.round(pct)}%
      </div>
    </div>
  )
}

// ── Ring Donut (full circle via Recharts Pie) ─────────────────────────────────

function RingChart({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const p = Math.min(Math.max(pct, 0), 100)
  return (
    <PieChart width={size} height={size}>
      <Pie data={[{ v: p }, { v: Math.max(100 - p, 0) }]} cx={size / 2} cy={size / 2}
        startAngle={90} endAngle={-270} innerRadius={size * 0.36} outerRadius={size * 0.47}
        dataKey="v" stroke="none">
        <Cell fill={color} />
        <Cell fill="#F3F4F6" />
      </Pie>
    </PieChart>
  )
}

// ── Approval Stats Row (4 ring stat cards) ────────────────────────────────────

export function ApprovalStatsRow({ total, approved, pending, rejected, flightCount, hotelCount }: {
  total: number; approved: number; pending: number; rejected: number; flightCount: number; hotelCount: number
}) {
  const approvalPct = total > 0 ? Math.round(approved / total * 100) : 0
  const flightPct   = total > 0 ? Math.round(flightCount / total * 100) : 0
  const hotelPct    = total > 0 ? Math.round(hotelCount / total * 100) : 0
  const cards = [
    { label: 'Total Requests', value: total,       sub: `${approved} approved · ${pending} pending`, pct: approvalPct, color: '#2563EB' },
    { label: 'Approved',       value: approved,    sub: `${approvalPct}% approval rate`,             pct: approvalPct, color: '#16A34A' },
    { label: 'Flights',        value: flightCount, sub: `${flightPct}% of requests`,                 pct: flightPct,   color: '#F97316' },
    { label: 'Hotels',         value: hotelCount,  sub: `${hotelPct}% of requests`,                  pct: hotelPct,    color: '#7C3AED' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RingChart pct={c.pct} color={c.color} size={100} />
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginTop: 1 }}>{c.pct}%</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{c.label}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Policy Gauge Row (4 speedometer cards) ────────────────────────────────────

export function PolicyGaugeRow({ approvalRate, flightShare, hotelShare, earlyBookingRate }: {
  approvalRate: number; flightShare: number; hotelShare: number; earlyBookingRate: number
}) {
  const gauges = [
    { label: 'Approval Rate',  pct: approvalRate,    color: '#16A34A', sub: 'of requests approved',   detail: approvalRate >= 80 ? 'Excellent' : approvalRate >= 50 ? 'Good' : 'Needs attention' },
    { label: 'Flight Share',   pct: flightShare,     color: '#F97316', sub: 'of bookings are flights', detail: `${100 - flightShare}% hotels`   },
    { label: 'Hotel Share',    pct: hotelShare,      color: '#7C3AED', sub: 'of bookings are hotels',  detail: `${100 - hotelShare}% flights`  },
    { label: 'Early Booking',  pct: earlyBookingRate,color: '#2563EB', sub: 'booked 7+ days ahead',    detail: earlyBookingRate >= 70 ? 'Great planning' : 'Encourage early' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
      {gauges.map(g => (
        <div key={g.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textAlign: 'center' }}>{g.label}</div>
          <GaugeChart pct={g.pct} color={g.color} />
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{g.sub}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginTop: 4 }}>{g.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
