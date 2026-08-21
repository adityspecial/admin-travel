'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch, adminDownload } from '@/lib/api'
import { AppInput } from '@/components/ui/AppInput'
import {
  Plane, User, Users, ShieldAlert, CheckCircle2, XCircle, Lock,
  Phone, Mail, FileJson, Copy, Check, Download,
  CircleDollarSign, Percent, TrendingUp, Landmark, Wallet,
  Cake, VenusAndMars, CreditCard, Globe, Tag, Briefcase,
} from 'lucide-react'

interface Booking {
  id: string
  provider: string
  booking_ref: string
  org_id: string | null
  agent_id: string | null
  origin: string
  destination: string
  travel_date: string
  airline_code: string
  airline_name: string | null
  adults: number; children: number; infants: number
  base_fare: number
  tax: number
  markup_applied: number
  gst_amount: number
  total_amount: number
  currency: string
  status: string
  source: string
  passengers: any[]
  booker_email: string | null
  booker_phone: string | null
  biz_dept: string | null
  biz_cost_center: string | null
  biz_purpose: string | null
  biz_notes: string | null
  outbound_payload: any
  claimed_by: string | null
  claimed_at: string | null
  actual_cost_paid: number | null
  pnr: string | null
  created_at: string
}

// This page renders no DataTable/AppPopup/ConfirmModal, so their CSS files
// (imported per-component, not global) aren't in this page's bundle — using
// their classnames here would render unstyled. Sticking to globals.css
// classes (.admin-topbar/.btn/.badge/.login-error/.agents-edit-grid) plus
// inline styles for everything else, rather than a bare-bones page.
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }
const muted: React.CSSProperties = { fontSize: 12, color: '#64748B' }
const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }
const fieldValue: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }

function paxTypeLabel(i: number, adults: number, children: number): string {
  if (i < adults) return `Adult ${i + 1}`
  if (i < adults + children) return `Child ${i - adults + 1}`
  return `Infant ${i - adults - children + 1}`
}
const bold: React.CSSProperties = { fontWeight: 600, color: '#0F172A' }

function IconChip({ icon, size = 32, round = false }: { icon: React.ReactNode; size?: number; round?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: round ? '50%' : 8,
      background: 'var(--accent-lt)', color: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
  )
}

function CopyJsonButton({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={() => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
    </button>
  )
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return null
  return Math.floor(diffMs / (365.25 * 24 * 3600 * 1000))
}

interface NormalizedPax {
  name: string
  dob: string | null
  gender: string | null
  passportNo: string | null
  passportExpiry: string | null
  nationality: string | null
}

// Every source snapshots passengers.jsonb in ITS OWN native field-naming
// convention (whatever shape its own /book route already collects) — no
// shared shape was ever forced, so this branches per `booking.provider`
// rather than guessing one set of field names for everyone. Fields a given
// source genuinely never collects (e.g. Kafila has no passport field at all)
// are left null rather than guessed.
function normalizePax(p: any, provider: string): NormalizedPax {
  switch (provider) {
    case 'tbo':
      return {
        name: [p?.Title, p?.FirstName, p?.LastName].filter(Boolean).join(' '),
        dob: p?.DateOfBirth ? String(p.DateOfBirth).slice(0, 10) : null,
        gender: p?.Gender === 2 ? 'Female' : p?.Gender === 1 ? 'Male' : null,
        passportNo: p?.PassportNo || null,
        passportExpiry: p?.PassportExpDate ? String(p.PassportExpDate).slice(0, 10) : null,
        nationality: p?.PassportIssueCountryCode || null,
      }
    case 'flightseva':
      return {
        name: [p?.title, p?.firstName, p?.lastName].filter(Boolean).join(' '),
        dob: p?.dob || null,
        gender: p?.gender === 1 ? 'Female' : p?.gender === 0 ? 'Male' : null,
        passportNo: p?.passportNumber || null,
        passportExpiry: p?.passportExpiry || null,
        nationality: p?.nationality || null,
      }
    case 'nexus':
      return {
        name: [p?.title, p?.first_name, p?.last_name].filter(Boolean).join(' '),
        dob: p?.dob || null,
        gender: null,
        passportNo: p?.passport_num || null,
        passportExpiry: p?.passport_expiry_date || null,
        nationality: p?.nationality || null,
      }
    case 'fareguide':
      return {
        name: [p?.title, p?.firstName, p?.lastName].filter(Boolean).join(' '),
        dob: p?.dob || null,
        gender: null,
        passportNo: p?.passportNumber || null,
        passportExpiry: p?.expDate || null,
        nationality: null,
      }
    case 'airiq':
      return {
        name: [p?.title, p?.first_name, p?.last_name].filter(Boolean).join(' ').replace(/\.\s/g, ' ').trim(),
        dob: p?.dob || null,
        gender: null,
        passportNo: p?.passport_number || null,
        passportExpiry: p?.passport_expirydate || null,
        nationality: null,
      }
    case 'kafila':
      // Kafila never collects passport/nationality at all — this route
      // genuinely has nothing more to show for those fields.
      return {
        name: [p?.ttl, p?.fn, p?.ln].filter(Boolean).join(' '),
        dob: p?.dob || null,
        gender: null,
        passportNo: null,
        passportExpiry: null,
        nationality: null,
      }
    default:
      return {
        name: [p?.title ?? p?.Title, p?.firstName ?? p?.FirstName ?? p?.first_name, p?.lastName ?? p?.LastName ?? p?.last_name].filter(Boolean).join(' '),
        dob: p?.dob ?? p?.DateOfBirth ?? null,
        gender: null,
        passportNo: p?.passportNo ?? p?.passportNumber ?? p?.passport_num ?? p?.passport_number ?? null,
        passportExpiry: p?.passportExpiry ?? p?.PassportExpDate ?? p?.expDate ?? p?.passport_expiry_date ?? p?.passport_expirydate ?? null,
        nationality: p?.nationality ?? null,
      }
  }
}

export default function ManualFulfillmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState('')
  const [downloadingTicket, setDownloadingTicket] = useState(false)

  const [pnr,            setPnr]            = useState('')
  const [actualCostPaid, setActualCostPaid] = useState('')
  // One ticket number per passenger, not one shared free-text box — staff need
  // to see whose ticket they're entering, same reason the passenger table
  // above shows each traveller separately instead of a blob.
  const [ticketNumbers,  setTicketNumbers]  = useState<string[]>([])

  function setTicketNumberAt(i: number, value: string) {
    setTicketNumbers(prev => {
      const next = [...prev]
      next[i] = value
      return next
    })
  }

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/super/manual-fulfillment-queue/${id}`)
      .then(d => setBooking(d.booking))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setBusy(true); setError('')
    try {
      const res = await adminFetch(`/api/admin/super/manual-fulfillment-queue/${id}`, {
        method: 'PATCH', body: JSON.stringify({ action, ...extra }),
      })
      if (action === 'mark_booked' && res.marginWarning) {
        alert('Booked — but the actual cost paid is at or above what the customer paid. This booking has thin or negative margin.')
      }
      load()
    } catch (err: any) {
      setError(err.message ?? 'Action failed')
    }
    setBusy(false)
  }

  function handleMarkBooked(e: React.FormEvent) {
    e.preventDefault()
    if (!pnr.trim()) { setError('PNR is required'); return }
    const cost = Number(actualCostPaid)
    if (!cost || cost <= 0) { setError('Actual cost paid is required'); return }
    doAction('mark_booked', {
      pnr: pnr.trim(),
      actualCostPaid: cost,
      ticketNumbers: ticketNumbers.map(s => (s ?? '').trim()).filter(Boolean),
    })
  }

  function handleUnableToFulfill() {
    if (!window.confirm('Refund the customer and cancel this booking?')) return
    doAction('unable_to_fulfill', { reason: window.prompt('Reason (optional)') ?? undefined })
  }

  if (loading) return <div className="admin-content">Loading…</div>
  if (!booking) return <div className="admin-content">Not found.</div>

  const isClaimed   = !!booking.claimed_by
  const totalPax    = booking.adults + booking.children + booking.infants
  const projectedCost = Number(actualCostPaid || 0)
  const marginLooksThin = projectedCost > 0 && projectedCost >= Number(booking.total_amount)

  return (
    <div>
      <div className="admin-topbar">
        <h2>{booking.origin} → {booking.destination}</h2>
        <span className="topbar-meta">{booking.booking_ref}</span>
        <button type="button" className="btn btn-sm" onClick={() => router.push('/super/manual-fulfillment-queue')}>
          Back to Queue
        </button>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {error && <div className="login-error">{error}</div>}

          {/* Trip summary */}
          <div style={{ ...card, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconChip icon={<Plane size={18} />} size={40} />
              <div>
                <div style={bold}>{booking.airline_name ?? booking.airline_code} ({booking.airline_code})</div>
                <div style={muted}>{new Date(booking.travel_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
            <div>
              <div style={muted}>Would-be source</div>
              <span className="badge badge-gray">{booking.provider.toUpperCase()}</span>
            </div>
            <div>
              <div style={muted}>Booked via</div>
              <span className="badge badge-blue">{booking.source}</span>
            </div>
            <div>
              <div style={muted}>Passengers</div>
              <div style={bold}>{totalPax} ({booking.adults}A {booking.children}C {booking.infants}I)</div>
            </div>
            <div>
              <div style={muted}>Customer Paid</div>
              <div style={bold}>₹{Number(booking.total_amount).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={muted}>Status</div>
              <span className={`badge ${booking.status === 'pending' ? 'badge-yellow' : booking.status === 'confirmed' ? 'badge-green' : 'badge-gray'}`}>{booking.status}</span>
            </div>
          </div>

          {/* Contact — booking-level, not per-passenger (every source collects one
              lead contact for the whole booking, not one per traveller). */}
          {(booking.booker_email || booking.booker_phone) && (
            <div style={card}>
              <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><User size={16} /> Contact</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {booking.booker_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconChip icon={<Phone size={15} />} />
                    <div><div style={muted}>Phone</div><div style={bold}>{booking.booker_phone}</div></div>
                  </div>
                )}
                {booking.booker_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconChip icon={<Mail size={15} />} />
                    <div><div style={muted}>Email</div><div style={bold}>{booking.booker_email}</div></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost center — only present for mybiz-sourced bookings (corporate
              expense tracking); consumer/mypartner bookings never have these. */}
          {(booking.biz_dept || booking.biz_cost_center || booking.biz_purpose || booking.biz_notes) && (
            <div style={card}>
              <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={16} /> Cost Center</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {booking.biz_dept && <div><div style={muted}>Department</div><div style={bold}>{booking.biz_dept}</div></div>}
                {booking.biz_cost_center && <div><div style={muted}>Cost Center</div><div style={bold}>{booking.biz_cost_center}</div></div>}
                {booking.biz_purpose && <div><div style={muted}>Purpose</div><div style={bold}>{booking.biz_purpose}</div></div>}
                {booking.biz_notes && <div><div style={muted}>Notes</div><div style={bold}>{booking.biz_notes}</div></div>}
              </div>
            </div>
          )}

          {/* Passengers — full detail per traveller, since staff need every field
              to replicate this exact booking on the airline's own portal. Each
              source snapshots passengers in its own native field shape (see
              normalizePax) — fields a source genuinely never collects (e.g.
              Kafila has no passport field) are simply omitted, not guessed. */}
          <div style={card}>
            <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Passengers ({(booking.passengers ?? []).length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(booking.passengers ?? []).map((raw, i) => {
                const p   = normalizePax(raw, booking.provider)
                const age = calcAge(p.dob)
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                    <IconChip icon={<User size={16} />} size={36} round />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...bold, fontSize: 15, marginBottom: 4 }}>{p.name || `Passenger ${i + 1}`}</div>
                      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Cake size={13} color="var(--ink-3)" />
                          <span style={muted}>DOB:</span>
                          <span style={bold}>{p.dob || '—'}{age != null ? ` (${age} yrs)` : ''}</span>
                        </div>
                        {p.gender && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <VenusAndMars size={13} color="var(--ink-3)" />
                            <span style={muted}>Gender:</span>
                            <span style={bold}>{p.gender}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CreditCard size={13} color="var(--ink-3)" />
                          <span style={muted}>Passport:</span>
                          <span style={bold}>{p.passportNo ? `${p.passportNo}${p.passportExpiry ? ` (exp ${p.passportExpiry})` : ''}` : '—'}</span>
                        </div>
                        {p.nationality && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Globe size={13} color="var(--ink-3)" />
                            <span style={muted}>Nationality:</span>
                            <span style={bold}>{p.nationality}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {(!booking.passengers || booking.passengers.length === 0) && <div style={muted}>No passenger data captured.</div>}
          </div>

          {/* Costing — what the customer paid, broken down, so staff can judge
              margin before entering the actual cost paid to the airline below. */}
          <div style={card}>
            <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={16} /> Costing</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconChip icon={<CircleDollarSign size={15} />} />
                <div><div style={muted}>Base Fare</div><div style={bold}>₹{Number(booking.base_fare ?? 0).toLocaleString('en-IN')}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconChip icon={<Percent size={15} />} />
                <div><div style={muted}>Tax</div><div style={bold}>₹{Number(booking.tax ?? 0).toLocaleString('en-IN')}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconChip icon={<TrendingUp size={15} />} />
                <div><div style={muted}>Markup</div><div style={bold}>₹{Number(booking.markup_applied ?? 0).toLocaleString('en-IN')}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconChip icon={<Landmark size={15} />} />
                <div><div style={muted}>GST on Fee</div><div style={bold}>₹{Number(booking.gst_amount ?? 0).toLocaleString('en-IN')}</div></div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto',
                background: 'var(--accent-lt)', borderRadius: 'var(--r-md)', padding: '10px 16px',
              }}>
                <Wallet size={18} color="var(--accent)" />
                <div>
                  <div style={{ ...muted, color: 'var(--accent-text)' }}>Total Paid by Customer</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-text)' }}>₹{Number(booking.total_amount ?? 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full snapshot — SSR/seat/meal/baggage shape varies by source, shown
              raw so nothing is lost to a display that doesn't understand a
              given provider's field names. Everything a human needs is already
              broken out above; this is the fallback for the rest. */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><FileJson size={16} /> Raw Technical Snapshot (fare/SSR detail, for reference)</h3>
              <CopyJsonButton data={booking.outbound_payload} />
            </div>
            <pre style={{ fontSize: 11, background: '#F8FAFC', padding: 12, borderRadius: 8, overflowX: 'auto', maxHeight: 320 }}>
              {JSON.stringify(booking.outbound_payload, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          {booking.status === 'pending' && (
            <div style={card}>
              {!isClaimed ? (
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => doAction('claim')}>
                  <Lock size={14} /> Claim This Booking
                </button>
              ) : (
                <>
                  <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldAlert size={16} /> Confirm Fulfillment</h3>
                  <form onSubmit={handleMarkBooked}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <AppInput label="PNR" required value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())} />
                      <AppInput
                        label="Actual Cost Paid to Airline (₹)"
                        type="number" min="0" step="0.01" required
                        value={actualCostPaid}
                        onChange={e => setActualCostPaid(e.target.value)}
                      />
                      <div>
                        <label className="app-input-label" style={{ display: 'block', marginBottom: 8 }}>Ticket Numbers</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(booking.passengers ?? []).map((raw, i) => {
                            const p = normalizePax(raw, booking.provider)
                            return (
                              <AppInput
                                key={i}
                                label={`${paxTypeLabel(i, booking.adults, booking.children)} — ${p.name || `Passenger ${i + 1}`}`}
                                value={ticketNumbers[i] ?? ''}
                                onChange={e => setTicketNumberAt(i, e.target.value)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {marginLooksThin && (
                      <p style={{ color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 13 }}>
                        ⚠ This cost is at or above what the customer paid (₹{Number(booking.total_amount).toLocaleString('en-IN')}) — thin or negative margin.
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" className="btn btn-sm" disabled={busy} onClick={handleUnableToFulfill}>
                        <XCircle size={14} /> Unable to Fulfill (Refund)
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                        <CheckCircle2 size={14} /> Mark as Booked
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={bold}>PNR: {booking.pnr}</div>
                <div style={muted}>Actual cost paid: ₹{Number(booking.actual_cost_paid ?? 0).toLocaleString('en-IN')}</div>
              </div>
              <button
                type="button" className="btn btn-sm" disabled={downloadingTicket}
                onClick={() => {
                  setDownloadingTicket(true)
                  adminDownload(`/api/admin/super/manual-fulfillment-queue/${id}/voucher`, `voucher-${booking.booking_ref}.pdf`)
                    .catch(err => setError(err.message ?? 'Could not download voucher'))
                    .finally(() => setDownloadingTicket(false))
                }}
              >
                <Download size={14} /> {downloadingTicket ? 'Downloading…' : 'Download Voucher'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
