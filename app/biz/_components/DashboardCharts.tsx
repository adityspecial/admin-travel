'use client'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

function fmtFull(n: number) { return '₹' + n.toLocaleString('en-IN') }

const COLORS: Record<string, string> = {
  flight:  '#F97316',
  hotel:   '#2563EB',
  bus:     '#7C3AED',
  package: '#16A34A',
  // train: '#0EA5E9',   // uncomment when train bookings go live
}

// ── Spend donut + bookings bar row ───────────────────────────────────────────

export function SpendAndBookingsRow({ byType }: { byType: any[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>₹</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Total Spend</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            {byType.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No spend this period.</div>
            ) : byType.map((t: any, idx: number) => (
              <div key={t.booking_type ?? idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[t.booking_type] ?? '#9CA3AF', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                    {({ flight: 'Domestic Flights (DF)', hotel: 'Domestic Hotels (DH)',
                       bus: 'Bus',       // uncomment when bus goes live
                    // train: 'Train',   // uncomment when train goes live
                    } as Record<string,string>)[t.booking_type] ?? t.booking_type}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{fmtFull(t.spend)}</div>
                </div>
              </div>
            ))}
          </div>
          <DonutChart segments={byType.map((t: any) => ({ value: t.spend, color: COLORS[t.booking_type] ?? '#9CA3AF' }))} />
        </div>
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Total Bookings</span>
        </div>
        <BookingBarChart data={byType} />
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>
    </div>
  )
}

// ── Advance Purchase + Top Hotels row ────────────────────────────────────────

export function AdvanceAndHotelsRow({
  advancePurchase, topHotels,
}: {
  advancePurchase: { label: string; count: number; pct: number }[]
  topHotels: { hotel: string; city: string; spend: number; count: number }[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Advance Purchase Stats</span>
        </div>
        <AdvancePurchaseDonut data={advancePurchase} />
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>🏨</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Top Booked Hotels</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
              {['Hotel', 'City', 'Total Spend', topHotels.length > 0 ? 'Bookings' : 'No. of Bookings'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px', paddingRight: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topHotels.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '16px 0', fontSize: 13, color: '#9CA3AF' }}>N-A</td></tr>
            ) : topHotels.map((h, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                <td style={{ fontSize: 13, fontWeight: 600, padding: '10px 0', paddingRight: 12 }}>{h.hotel}</td>
                <td style={{ fontSize: 13, color: '#6B7280', paddingRight: 12 }}>{h.city}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{fmtFull(h.spend)}</td>
                <td style={{ fontSize: 13, color: '#6B7280' }}>{h.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>
    </div>
  )
}

// ── Top Airlines + Frequent Travellers row ───────────────────────────────────

export function AirlinesAndTravellersRow({
  topAirlines, travellers,
}: {
  topAirlines: { airline: string; count: number }[]
  travellers:  { email: string; count: number; spend: number }[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>✈️</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Top Airlines</span>
        </div>
        {topAirlines.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>No flight bookings yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px' }}>Airline</th>
                <th style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px' }}>No. of Bookings</th>
              </tr>
            </thead>
            <tbody>
              {topAirlines.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ fontSize: 13, fontWeight: 600, padding: '12px 0' }}>{a.airline}</td>
                  <td style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, textAlign: 'right' }}>{a.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>Frequent Travellers</span>
        </div>
        {travellers.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>No travel data yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px' }}>Traveller</th>
                <th style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px', paddingRight: 16 }}>Total Spend</th>
                <th style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '0 0 10px' }}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {travellers.map((t: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ fontSize: 13, fontWeight: 600, padding: '10px 0' }}>{t.email}</td>
                  <td style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', paddingRight: 16 }}>{fmtFull(t.spend)}</td>
                  <td style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, textAlign: 'right' }}>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link href="/biz/reports" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: 16 }}>
          VIEW DETAILED REPORT
        </Link>
      </div>
    </div>
  )
}

// ── Advance Purchase Donut (Recharts) ────────────────────────────────────────

const ADV_COLORS = ['#EF4444', '#F97316', '#2563EB', '#16A34A']
const ADV_LABELS = ['< 7 days', '7 – 14 days', '15 – 30 days', '> 30 days']

function AdvancePurchaseDonut({ data }: { data: { label: string; count: number; pct: number }[] }) {
  const total = data.reduce((s, b) => s + b.count, 0)
  const pieData = data.map((b, i) => ({ name: ADV_LABELS[i], value: b.count, color: ADV_COLORS[i] }))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {total === 0 ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '28px 0', width: '100%' }}>
          No flight booking data yet.
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={65} cy={65} innerRadius={38} outerRadius={60}
                dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={ADV_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} bookings`, '']} />
            </PieChart>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{total}</div>
              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>BOOKINGS</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{d.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e' }}>{d.value}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: d.color, width: total > 0 ? `${Math.round(d.value / total * 100)}%` : '0%', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── SVG donut chart ──────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (!total) return <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#F3F4F6', flexShrink: 0 }} />
  const R = 54, cx = 60, cy = 60, stroke = 22
  let angle = -90
  const paths = segments.map(seg => {
    const sweep = (seg.value / total) * 360
    const a1 = (angle * Math.PI) / 180
    const a2 = ((angle + sweep) * Math.PI) / 180
    const d = `M ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)}`
    angle += sweep
    return { d, color: seg.color }
  })
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
      {paths.map((p, i) => <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="butt" />)}
    </svg>
  )
}

// ── Bar chart ────────────────────────────────────────────────────────────────

function BookingBarChart({ data }: { data: any[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const LABELS: Record<string, string> = {
    flight: 'Domestic Flights',
    hotel:  'Domestic Hotels',
    bus:    'Bus',           // uncomment when bus goes live
    // train: 'Train',      // uncomment when train goes live
  }
  if (data.length === 0) return <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '28px 0' }}>No bookings this period.</div>
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 130, paddingBottom: 28, position: 'relative' }}>
      {[0,1,2,3].map(n => (
        <div key={`grid-${n}`} style={{ position: 'absolute', left: 0, right: 0, bottom: 28 + (n/3)*100, borderTop: '1px dashed #F3F4F6' }}>
          <span style={{ position: 'absolute', left: -4, top: -7, fontSize: 10, color: '#D1D5DB' }}>{Math.round((n/3)*maxCount)}</span>
        </div>
      ))}
      {data.map((t: any, idx: number) => (
        <div key={t.booking_type ?? idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{t.count}</div>
          <div style={{ width: '60%', background: COLORS[t.booking_type] ?? '#9CA3AF', borderRadius: '3px 3px 0 0', opacity: 0.85, height: Math.max((t.count/maxCount)*100, 4) + 'px' }} />
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', position: 'absolute', bottom: 4 }}>
            {LABELS[t.booking_type] ?? t.booking_type}
          </div>
        </div>
      ))}
    </div>
  )
}
