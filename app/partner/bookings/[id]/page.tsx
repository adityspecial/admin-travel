'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'
import { ArrowLeft, Plane, Hotel, User } from 'lucide-react'

function fmt(v: number) { return `Rs ${Number(v ?? 0).toLocaleString('en-IN')}` }
function fmtD(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' }
function fmtDT(d: string) { return d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '--' }
function fmtT(d: string) {
  if (!d) return '--'
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Read-only admin view of the exact same partner_bookings shape mypartner's
// own bookings/[id] page renders — mirrors that page's buildDetail() so the
// two stay consistent, minus the interactive actions (cancel/amend/PDF),
// which belong to the agent, not AirDunia staff viewing on their behalf.
function buildDetail(booking: any) {
  const d = booking?.booking_data ?? {}
  const bookingType: string = booking?.booking_type ?? 'flight'
  const isHotel     = bookingType === 'hotel'
  const isMulticity = d.trip_type === 'multicity'
  const isRoundtrip = d.trip_type === 'roundtrip'
  const f  = d.flight ?? {}
  const rf = d.returnFlight ?? {}
  const pnr = d.pnr ?? d.PNR ?? booking?.pnr ?? '--'
  const travelDate = booking?.travel_date ? fmtD(booking.travel_date) : '--'

  const legs = isMulticity && Array.isArray(d.legs) ? d.legs : []
  const firstLeg = legs[0], lastLeg = legs[legs.length - 1]

  const fromCode = isMulticity ? (firstLeg?.origin ?? '--') : (d.from ?? d.origin ?? f.origin ?? '--')
  const toCode   = isMulticity ? (lastLeg?.destination ?? '--') : (d.to ?? d.destination ?? f.destination ?? '--')
  const depart   = isMulticity ? firstLeg?.departTime : (f.departTime ?? d.departTime ?? d.departure_time)
  const arrive   = isMulticity ? lastLeg?.arrivalTime  : (f.arrivalTime ?? d.arrivalTime ?? d.arrival_time)
  const departTerminal = isMulticity ? firstLeg?.departTerminal : f.departTerminal
  const arriveTerminal = isMulticity ? lastLeg?.arrivalTerminal : f.arrivalTerminal

  const passengers = Array.isArray(d.passengers) && d.passengers.length
    ? d.passengers.map((p: any) => ({
        name: [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || '--',
        paxType: p.paxType === 2 ? 'Child' : p.paxType === 3 ? 'Infant' : 'Adult',
        ticket: p.ticketNumber || '--',
        ticketStatus: p.ticketStatus || '--',
      }))
    : [{ name: booking?.customer_name || '--', paxType: 'Adult', ticket: '--', ticketStatus: '--' }]

  const hasRealFare = d.base_fare != null || d.convenience_fee_taxes != null || d.total_payable != null
  const fareRows = hasRealFare
    ? [
        { label: 'Base Fare', value: fmt(d.base_fare ?? 0) },
        { label: 'Convenience Fee & Taxes', value: fmt(d.convenience_fee_taxes ?? 0) },
      ]
    : []
  const fareTotal = hasRealFare ? fmt(d.total_payable ?? booking?.amount ?? 0) : fmt(booking?.amount ?? 0)

  return {
    bookingType, isHotel, isMulticity, isRoundtrip, pnr,
    airline: isMulticity ? (legs.length > 1 ? 'Multi-city trip' : (firstLeg?.airlineCode ?? '--')) : (f.airline ?? d.airline ?? d.supplier ?? '--'),
    flightNo: isMulticity ? legs.map((l: any) => l.flightNumber).filter(Boolean).join(' + ') || '--' : (f.flightNum ?? f.flightNo ?? d.flightNo ?? '--'),
    from: { code: fromCode, city: d.fromCity || null, time: depart ? fmtT(depart) : '--', date: travelDate, terminal: departTerminal || null },
    to:   { code: toCode,   city: d.toCity   || null, time: arrive ? fmtT(arrive) : '--', date: travelDate, terminal: arriveTerminal || null },
    returnLeg: isRoundtrip && d.returnFlight ? {
      airline: rf.airline || '--', flightNo: rf.flightNum || '--',
      from: { code: toCode, time: rf.departTime ? fmtT(rf.departTime) : '--', date: d.return_date ? fmtD(d.return_date) : travelDate, terminal: rf.departTerminal || null },
      to:   { code: fromCode, time: rf.arrivalTime ? fmtT(rf.arrivalTime) : '--', date: d.return_date ? fmtD(d.return_date) : travelDate, terminal: rf.arrivalTerminal || null },
    } : null,
    legs: legs.map((l: any) => ({
      origin: l.origin ?? '--', destination: l.destination ?? '--',
      travelDate: l.travelDate ? fmtD(l.travelDate) : '--',
      airlineCode: l.airlineCode ?? '', flightNumber: l.flightNumber ?? '--',
      departTime: l.departTime ? fmtT(l.departTime) : '--', arrivalTime: l.arrivalTime ? fmtT(l.arrivalTime) : '--',
      departTerminal: l.departTerminal ?? null, arrivalTerminal: l.arrivalTerminal ?? null,
      pnr: l.pnr ?? '--', status: l.status ?? 'pending', fare: l.fare ?? 0,
    })),
    hotel: isHotel ? {
      name: d.hotel_name ?? booking?.customer_name ?? '--', city: d.city_name ?? '--',
      address: d.hotel_address || null, starRating: d.hotel_star_rating || null,
      checkIn: d.check_in ? fmtD(d.check_in) : '--', checkOut: d.check_out ? fmtD(d.check_out) : '--',
      nights: d.nights ?? 1, roomName: d.room_name ?? '--',
      confirmationNo: d.confirmation_no ?? '--', bookingRefNo: d.booking_ref_no ?? '--',
    } : null,
    duration: isMulticity ? null : (d.duration ?? null),
    stops: isMulticity ? null : (d.stops ?? null),
    cabin: d.cabin || null,
    aircraft: f.aircraft || d.aircraft || null,
    passengers, fareRows, fareTotal,
  }
}

export default function PartnerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const agentId = typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null
    if (!agentId) return
    adminFetch(`/api/admin/partner/bookings/${id}`, { agentId })
      .then((d: any) => setBooking(d.booking))
      .catch((e: Error) => setError(e.message ?? 'Booking not found'))
      .finally(() => setLoading(false))
  }, [id])

  const detail = booking ? buildDetail(booking) : null

  return (
    <div>
      <div className="admin-topbar">
        <button className="btn-secondary" onClick={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h2>Booking Details</h2>
        {booking && <span className="topbar-meta">{booking.booking_ref}</span>}
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {loading && <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</div>}
          {error && <div style={{ color: '#DC2626', fontSize: 13 }}>{error}</div>}

          {booking && detail && (
            <>
              <div className="card-shell" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {detail.isHotel ? <Hotel size={28} /> : <Plane size={28} />}
                    <div>
                      {detail.isHotel ? (
                        <>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>{detail.hotel?.name}{detail.hotel?.starRating ? ` · ${detail.hotel.starRating}★` : ''}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.hotel?.address ? `${detail.hotel.address}, ${detail.hotel.city}` : detail.hotel?.city}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>{detail.airline} {detail.flightNo}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.from.code} → {detail.to.code}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`data-table-status-pill ${booking.status === 'confirmed' ? 'active' : 'inactive'}`}>
                    ●{booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </span>
                </div>

                {!detail.isHotel && (
                  <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{detail.from.time}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.from.code} · {detail.from.date}{detail.from.terminal ? ` · T${detail.from.terminal}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>{detail.duration || ''}{detail.stops != null ? ` · ${detail.stops === 0 ? 'Non-stop' : `${detail.stops} stop(s)`}` : ''}</div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{detail.to.time}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.to.code} · {detail.to.date}{detail.to.terminal ? ` · T${detail.to.terminal}` : ''}</div>
                    </div>
                    {(detail.cabin || detail.aircraft) && (
                      <div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{detail.cabin || ''}{detail.cabin && detail.aircraft ? ' · ' : ''}{detail.aircraft || ''}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 32, marginTop: 16, borderTop: '1px solid #E5E7EB', paddingTop: 16, flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{detail.isHotel ? 'CONFIRMATION NO' : 'PNR'}</div><div style={{ fontWeight: 700 }}>{detail.isHotel ? detail.hotel?.confirmationNo : detail.pnr}</div></div>
                  <div><div style={{ fontSize: 11, color: '#9CA3AF' }}>BOOKING REF</div><div style={{ fontWeight: 700 }}>{booking.booking_ref}</div></div>
                  <div><div style={{ fontSize: 11, color: '#9CA3AF' }}>AGENT</div><div style={{ fontWeight: 700 }}>{booking.partner_agents?.agency_name ?? '--'} {booking.partner_agents?.agent_code ? `(${booking.partner_agents.agent_code})` : ''}</div></div>
                  <div><div style={{ fontSize: 11, color: '#9CA3AF' }}>BOOKED</div><div style={{ fontWeight: 700 }}>{fmtDT(booking.created_at)}</div></div>
                </div>
              </div>

              {detail.isMulticity && detail.legs.length > 0 && (
                <div className="card-shell" style={{ padding: 20 }}>
                  <div className="card-title" style={{ marginBottom: 12 }}>Itinerary</div>
                  {detail.legs.map((l: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                      <Plane size={16} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{l.origin} → {l.destination}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{l.airlineCode} {l.flightNumber} · {l.travelDate}</div>
                      </div>
                      <div style={{ fontSize: 12 }}>{l.departTime}</div>
                      <div style={{ fontSize: 12, textTransform: 'capitalize' }}>{l.status}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(l.fare)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card-shell" style={{ padding: 20 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Passengers ({detail.passengers.length})</div>
                {detail.passengers.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                    <User size={16} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{p.paxType}</div>
                    </div>
                    <div style={{ fontSize: 12 }}>{p.ticket}</div>
                    <div style={{ fontSize: 12 }}>{p.ticketStatus}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card-shell" style={{ padding: 20 }}>
                  <div className="card-title" style={{ marginBottom: 12 }}>Fare Summary</div>
                  {detail.fareRows.map((r: any) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>{r.label}</span><span>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 8, borderTop: '1px solid #E5E7EB', fontWeight: 800 }}>
                    <span>Total</span><span>{detail.fareTotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#0D9488', fontWeight: 700, fontSize: 13 }}>
                    <span>Commission</span><span>+{fmt(booking.commission ?? 0)}</span>
                  </div>
                </div>

                <div className="card-shell" style={{ padding: 20 }}>
                  <div className="card-title" style={{ marginBottom: 12 }}>Customer</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{booking.customer_name || '--'}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{booking.customer_email || '--'}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{booking.customer_phone || '--'}</div>
                  <div style={{ marginTop: 12, fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>Payment: </span>
                    <span>{booking.payment_method === 'wallet' ? 'Wallet' : booking.payment_method === 'razorpay' ? 'Razorpay' : '--'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
