'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { Ticket, TrendingUp, Users, Building2 } from 'lucide-react'

type TabType = 'bookings' | 'featured' | 'manual' | 'settings'

// ── Nexus booking shape ──────────────────────────────────────────────────────
interface NexusBooking {
  id: string; booking_ref: string; pnr: string
  origin: string; destination: string; origin_city: string; destination_city: string
  travel_date: string; flight_number: string; airline: string
  departure_time: string; arrival_time: string
  total_amount: number; currency: string
  adults: number; children: number; infants: number
  contact_email: string; status: string; source: string
  created_at: string
}

interface NexusStats {
  total_bookings: number; total_revenue: number
  by_source: { consumer: number; mybiz: number; mypartner: number }
}

// ── Featured sector shape ────────────────────────────────────────────────────
interface FeaturedSector {
  id: string; origin: string; destination: string
  origin_city: string; destination_city: string
  display_order: number; is_active: boolean
}

// ── Manual flight shape (legacy) ──────────────────────────────────────────────
interface FixedFlight {
  id: string; title: string; from_code: string; to_code: string
  departure_date: string; departure_time: string; arrival_time: string
  duration: string; airline_name: string; flight_number: string
  total_seats: number; seats_booked: number; price_per_seat: number
  booking_deadline: string | null; is_active: boolean
}

interface NexusApiSettings {
  id: string
  markup_per_pax: number
  account_balance: number
  updated_at: string
}

const EMPTY_SECTOR = { origin: '', destination: '', origin_city: '', destination_city: '', display_order: 0 }

const EMPTY_FORM = {
  title: '', from_city: '', from_code: '', to_city: '', to_code: '',
  departure_date: '', departure_time: '', arrival_time: '', duration: '',
  airline_name: '', airline_code: '', flight_number: '',
  total_seats: '50', price_per_seat: '', booking_deadline: '',
  description: '', image_url: '',
}

function fmtAmt(n: number) { return '₹' + Number(n).toLocaleString('en-IN') }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

function sourcePillClass(source: string) {
  if (source === 'mybiz') return 'ff-source-pill--mybiz'
  if (source === 'mypartner') return 'ff-source-pill--mypartner'
  return 'ff-source-pill--consumer'
}

export default function FixedFlightsPage() {
  const [tab, setTab] = useState<TabType>('bookings')

  // ── Nexus bookings state ─────────────────────────────────────────────────
  const [nexusBookings, setNexusBookings]   = useState<NexusBooking[]>([])
  const [nexusStats,    setNexusStats]      = useState<NexusStats | null>(null)
  const [nexusLoading,  setNexusLoading]    = useState(true)

  // ── Featured sectors state ────────────────────────────────────────────────
  const [sectors,      setSectors]      = useState<FeaturedSector[]>([])
  const [sectorsLoad,  setSectorsLoad]  = useState(false)
  const [showSectorForm, setShowSectorForm] = useState(false)
  const [sectorForm,   setSectorForm]   = useState(EMPTY_SECTOR)
  const [editSectorId, setEditSectorId] = useState<string | null>(null)
  const [sectorSaving, setSectorSaving] = useState(false)
  const [sectorErr,    setSectorErr]    = useState('')

  // ── API Settings state ────────────────────────────────────────────────────
  const [apiSettings,    setApiSettings]    = useState<NexusApiSettings | null>(null)
  const [settingsLoad,   setSettingsLoad]   = useState(false)
  const [markupInput,    setMarkupInput]    = useState('')
  const [balanceInput,   setBalanceInput]   = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsErr,    setSettingsErr]    = useState('')
  const [settingsOk,     setSettingsOk]     = useState('')

  // ── Manual flights state ─────────────────────────────────────────────────
  const [manualFlights, setManualFlights] = useState<FixedFlight[]>([])
  const [manualLoad,    setManualLoad]    = useState(false)
  const [showFlightForm, setShowFlightForm] = useState(false)
  const [flightForm,   setFlightForm]    = useState(EMPTY_FORM)
  const [editFlightId, setEditFlightId]  = useState<string | null>(null)
  const [flightSaving, setFlightSaving]  = useState(false)
  const [flightErr,    setFlightErr]     = useState('')

  // Load on mount
  useEffect(() => {
    loadNexus()
    loadSectors()
    loadManual()
    loadSettings()
  }, [])

  function loadSettings() {
    setSettingsLoad(true)
    adminFetch('/api/admin/super/nexus/settings')
      .then(d => {
        setApiSettings(d.settings ?? null)
        setMarkupInput(String(d.settings?.markup_per_pax ?? 50))
        setBalanceInput(String(d.settings?.account_balance ?? 0))
      })
      .catch(() => {})
      .finally(() => setSettingsLoad(false))
  }

  async function saveSettings(field: 'markup' | 'balance') {
    setSettingsSaving(true); setSettingsErr(''); setSettingsOk('')
    try {
      const body = field === 'markup'
        ? { markup_per_pax: Number(markupInput) }
        : { account_balance: Number(balanceInput) }
      const d = await adminFetch('/api/admin/super/nexus/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setApiSettings(d.settings)
      setSettingsOk(field === 'markup' ? 'Markup updated.' : 'Balance updated.')
      setTimeout(() => setSettingsOk(''), 3000)
    } catch (e: any) { setSettingsErr(e.message) }
    setSettingsSaving(false)
  }

  function loadNexus() {
    setNexusLoading(true)
    adminFetch('/api/admin/super/nexus')
      .then(d => { setNexusBookings(d.bookings ?? []); setNexusStats(d.stats ?? null) })
      .catch(() => {})
      .finally(() => setNexusLoading(false))
  }

  function loadSectors() {
    setSectorsLoad(true)
    adminFetch('/api/admin/super/nexus/featured')
      .then(d => setSectors(d.sectors ?? []))
      .catch(() => {})
      .finally(() => setSectorsLoad(false))
  }

  function loadManual() {
    setManualLoad(true)
    adminFetch('/api/admin/fixed-flights')
      .then(d => setManualFlights(d.flights ?? []))
      .catch(() => {})
      .finally(() => setManualLoad(false))
  }

  // ── Featured sector CRUD ─────────────────────────────────────────────────
  async function saveSector() {
    setSectorSaving(true); setSectorErr('')
    try {
      if (editSectorId) {
        await adminFetch('/api/admin/super/nexus/featured', {
          method: 'PATCH',
          body: JSON.stringify({ id: editSectorId, ...sectorForm }),
        })
      } else {
        await adminFetch('/api/admin/super/nexus/featured', {
          method: 'POST',
          body: JSON.stringify(sectorForm),
        })
      }
      setShowSectorForm(false)
      loadSectors()
    } catch (e: any) { setSectorErr(e.message) }
    setSectorSaving(false)
  }

  async function toggleSector(s: FeaturedSector) {
    await adminFetch('/api/admin/super/nexus/featured', {
      method: 'PATCH',
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    }).then(loadSectors).catch(() => {})
  }

  async function deleteSector(id: string) {
    if (!confirm('Remove this featured route?')) return
    await adminFetch('/api/admin/super/nexus/featured', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }).then(loadSectors).catch(() => {})
  }

  // ── Manual flight CRUD ───────────────────────────────────────────────────
  async function saveManualFlight() {
    setFlightSaving(true); setFlightErr('')
    try {
      if (editFlightId) {
        await adminFetch(`/api/admin/fixed-flights/${editFlightId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...flightForm, total_seats: Number(flightForm.total_seats), price_per_seat: Number(flightForm.price_per_seat) }),
        })
      } else {
        await adminFetch('/api/admin/fixed-flights', {
          method: 'POST',
          body: JSON.stringify({ ...flightForm, total_seats: Number(flightForm.total_seats), price_per_seat: Number(flightForm.price_per_seat) }),
        })
      }
      setShowFlightForm(false)
      loadManual()
    } catch (e: any) { setFlightErr(e.message) }
    setFlightSaving(false)
  }

  async function toggleManual(f: FixedFlight) {
    await adminFetch(`/api/admin/fixed-flights/${f.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !f.is_active }),
    }).then(loadManual).catch(() => {})
  }

  const seatsLeft = (f: FixedFlight) => f.total_seats - f.seats_booked
  const pct       = (f: FixedFlight) => Math.round((f.seats_booked / f.total_seats) * 100)

  return (
    <div>
      <div className="admin-topbar">
        <h2>Charter & Fixed Departures</h2>
        <div className="ff-topbar-actions">
          {tab === 'featured' && (
            <button
              className="btn btn-primary"
              onClick={() => { setSectorForm(EMPTY_SECTOR); setEditSectorId(null); setSectorErr(''); setShowSectorForm(true) }}
            >
              + Add Route
            </button>
          )}
          {tab === 'manual' && (
            <button
              className="btn btn-primary"
              onClick={() => { setFlightForm(EMPTY_FORM); setEditFlightId(null); setFlightErr(''); setShowFlightForm(true) }}
            >
              + Add Flight
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {/* Tabs */}
        <div className="ff-tab-bar">
          {([
            { key: 'bookings', label: 'Nexus Bookings' },
            { key: 'featured', label: 'Featured Routes' },
            { key: 'manual',   label: 'Manual Flights' },
            { key: 'settings', label: '⚙ API Settings' },
          ] as { key: TabType; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ff-tab-btn ${tab === t.key ? 'ff-tab-btn--active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Nexus Bookings ── */}
        {tab === 'bookings' && (
          <>
            {/* Stats */}
            {nexusStats && (
              <div className="ff-stats-grid">
                <StatCard
                  label="Total Bookings"
                  value={nexusStats.total_bookings}
                  sub="Live Nexus charter bookings"
                  badge="Nexus"
                  Icon={Ticket}
                  iconBg="#eff6ff"
                  iconColor="#2563eb"
                  badgeBg="#dbeafe"
                  badgeColor="#1d4ed8"
                />
                <StatCard
                  label="Total Revenue"
                  value={fmtAmt(nexusStats.total_revenue)}
                  sub="Revenue generated all time"
                  badge="Revenue"
                  Icon={TrendingUp}
                  iconBg="#f0fdf4"
                  iconColor="#0d9488"
                  badgeBg="#ccfbf1"
                  badgeColor="#0f766e"
                />
                <StatCard
                  label="Consumer Channel"
                  value={nexusStats.by_source.consumer}
                  sub="Bookings via consumer app"
                  badge="B2C"
                  Icon={Users}
                  iconBg="#fff7ed"
                  iconColor="#ea580c"
                  badgeBg="#ffedd5"
                  badgeColor="#c2410c"
                />
                <StatCard
                  label="Corporate"
                  value={nexusStats.by_source.mybiz}
                  sub="Bookings via corporate team"
                  badge="B2B"
                  Icon={Building2}
                  iconBg="#fdf2f8"
                  iconColor="#db2777"
                  badgeBg="#fce7f3"
                  badgeColor="#be185d"
                />
              </div>
            )}

            {nexusLoading ? (
              <div className="ff-loading">Loading…</div>
            ) : nexusBookings.length === 0 ? (
              <div className="ff-empty">
                No Nexus bookings yet. Charter routes must be configured in "Featured Routes" first.
              </div>
            ) : (
              <div className="table-card">
                <table className="ff-table">
                  <thead>
                    <tr className="ff-thead-row">
                      {['Booking Ref / PNR', 'Route', 'Date', 'Passengers', 'Amount', 'Source', 'Status', 'Booked On'].map(h => (
                        <th key={h} className="ff-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nexusBookings.map(b => (
                      <tr key={b.id} className="ff-tr">
                        <td className="ff-td-ref">
                          <div className="ff-ref-code">{b.booking_ref}</div>
                          {b.pnr && <div className="ff-pnr-sub">PNR: {b.pnr}</div>}
                          {b.contact_email && <div className="ff-email-sub">{b.contact_email}</div>}
                        </td>
                        <td className="ff-td-route">
                          {b.origin} → {b.destination}
                          <div className="ff-flight-sub">{b.airline} {b.flight_number}</div>
                        </td>
                        <td className="ff-td-date">{fmtDate(b.travel_date)}</td>
                        <td className="ff-td-muted13">
                          {b.adults}A{b.children > 0 ? ` ${b.children}C` : ''}{b.infants > 0 ? ` ${b.infants}I` : ''}
                        </td>
                        <td className="ff-td-amt-strong">{fmtAmt(b.total_amount)}</td>
                        <td className="ff-td-plain">
                          <span className={`ff-source-pill ${sourcePillClass(b.source)}`}>
                            {b.source}
                          </span>
                        </td>
                        <td className="ff-td-plain">
                          <span className="ff-status-pill-static">
                            {b.status}
                          </span>
                        </td>
                        <td className="ff-td-sub">
                          {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Featured Routes ── */}
        {tab === 'featured' && (
          <>
            <div className="ff-info-banner">
              Featured routes appear on the consumer home screen as charter flight cards, powered by live Nexus DMC data.
              Add the IATA codes and city names for routes you want to highlight.
            </div>

            {sectorsLoad ? (
              <div className="ff-loading-24">Loading…</div>
            ) : sectors.length === 0 ? (
              <div className="ff-empty">
                No featured routes yet. Click "+ Add Route" to add your first charter route.
              </div>
            ) : (
              <div className="table-card">
                <table className="ff-table">
                  <thead>
                    <tr className="ff-thead-row">
                      {['Route', 'Cities', 'Order', 'Status', ''].map(h => (
                        <th key={h} className="ff-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map(s => (
                      <tr key={s.id} className="ff-tr">
                        <td className="ff-td-route-lg">
                          {s.origin} → {s.destination}
                        </td>
                        <td className="ff-td-muted13">
                          {s.origin_city} → {s.destination_city}
                        </td>
                        <td className="ff-td-muted13">{s.display_order}</td>
                        <td className="ff-td-plain">
                          <span className={`ff-status-pill ${s.is_active ? 'ff-status-pill--active' : 'ff-status-pill--inactive'}`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="ff-td-plain">
                          <div className="ff-row-actions">
                            <button
                              className="btn btn-ghost ff-btn-sm"
                              onClick={() => { setSectorForm({ origin: s.origin, destination: s.destination, origin_city: s.origin_city, destination_city: s.destination_city, display_order: s.display_order }); setEditSectorId(s.id); setSectorErr(''); setShowSectorForm(true) }}
                            >
                              Edit
                            </button>
                            <button
                              className={`btn btn-ghost ff-btn-sm ${s.is_active ? 'ff-btn-danger' : 'ff-btn-success'}`}
                              onClick={() => toggleSector(s)}
                            >
                              {s.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="btn btn-ghost ff-btn-sm ff-btn-danger"
                              onClick={() => deleteSector(s.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add/Edit sector modal */}
            {showSectorForm && (
              <div className="ff-modal-overlay">
                <div className="ff-modal-box ff-modal-box--sector">
                  <h3 className="ff-modal-title">
                    {editSectorId ? 'Edit Featured Route' : 'Add Featured Route'}
                  </h3>
                  {sectorErr && <div className="ff-error-banner">{sectorErr}</div>}

                  <div className="ff-modal-grid">
                    {[
                      { key: 'origin',           label: 'Origin IATA',       placeholder: 'DEL' },
                      { key: 'destination',      label: 'Destination IATA',  placeholder: 'BOM' },
                      { key: 'origin_city',      label: 'Origin City',       placeholder: 'Delhi' },
                      { key: 'destination_city', label: 'Destination City',  placeholder: 'Mumbai' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="ff-field-label">{label}</label>
                        <input
                          value={(sectorForm as any)[key]}
                          placeholder={placeholder}
                          onChange={e => setSectorForm(f => ({ ...f, [key]: e.target.value }))}
                          disabled={!!editSectorId && (key === 'origin' || key === 'destination')}
                          className="ff-field-input"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="ff-field-label">Display Order</label>
                      <input
                        type="number"
                        value={sectorForm.display_order}
                        onChange={e => setSectorForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                        className="ff-field-input"
                      />
                    </div>
                  </div>

                  <div className="ff-modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowSectorForm(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveSector} disabled={sectorSaving}>
                      {sectorSaving ? 'Saving…' : editSectorId ? 'Save Changes' : 'Add Route'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Manual Flights (legacy) ── */}
        {tab === 'manual' && (
          <>
            <div className="ff-info-banner">
              Manual flights are custom fixed-departure entries managed by admins directly (not sourced from Nexus DMC).
            </div>

            {manualLoad ? (
              <div className="ff-loading">Loading…</div>
            ) : manualFlights.length === 0 ? (
              <div className="ff-empty">No manual flights yet. Click "+ Add Flight" to create one.</div>
            ) : (
              <div className="table-card">
                <table className="ff-table">
                  <thead>
                    <tr className="ff-thead-row">
                      {['Flight', 'Route', 'Date', 'Seats', 'Price', 'Status', ''].map(h => (
                        <th key={h} className="ff-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {manualFlights.map(f => (
                      <tr key={f.id} className="ff-tr">
                        <td className="ff-td-ref">
                          <div className="ff-airline-name">{f.airline_name}</div>
                          <div className="ff-flight-meta">{f.flight_number} · {f.departure_time}–{f.arrival_time} ({f.duration})</div>
                          <div className="ff-flight-title-sub">{f.title}</div>
                        </td>
                        <td className="ff-td-route">{f.from_code} → {f.to_code}</td>
                        <td className="ff-td-date">{fmtDate(f.departure_date)}</td>
                        <td className="ff-td-seats">
                          <div className={`ff-seats-line ${seatsLeft(f) <= 5 ? 'ff-seats-line--low' : ''}`}>
                            {f.seats_booked}/{f.total_seats} · <strong className={seatsLeft(f) <= 5 ? 'ff-seats-left--low' : 'ff-seats-left'}>{seatsLeft(f)} left</strong>
                          </div>
                          <div className="ff-progress-track">
                            <div className={`ff-progress-fill ${pct(f) > 80 ? 'ff-progress-fill--danger' : ''}`} style={{ width: `${pct(f)}%` }} />
                          </div>
                        </td>
                        <td className="ff-td-amt-strong">{fmtAmt(f.price_per_seat)}</td>
                        <td className="ff-td-plain">
                          <span className={`ff-status-pill ${f.is_active ? 'ff-status-pill--active' : 'ff-status-pill--inactive'}`}>
                            {f.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="ff-td-plain">
                          <div className="ff-row-actions">
                            <button className="btn btn-ghost ff-btn-sm"
                              onClick={() => {
                                setFlightForm({ title: f.title, from_city: '', from_code: f.from_code, to_city: '', to_code: f.to_code, departure_date: f.departure_date, departure_time: f.departure_time, arrival_time: f.arrival_time, duration: f.duration, airline_name: f.airline_name, airline_code: '', flight_number: f.flight_number, total_seats: String(f.total_seats), price_per_seat: String(f.price_per_seat), booking_deadline: f.booking_deadline ?? '', description: '', image_url: '' })
                                setEditFlightId(f.id); setFlightErr(''); setShowFlightForm(true)
                              }}>Edit</button>
                            <button className={`btn btn-ghost ff-btn-sm ${f.is_active ? 'ff-btn-danger' : 'ff-btn-success'}`} onClick={() => toggleManual(f)}>
                              {f.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showFlightForm && (
              <div className="ff-modal-overlay">
                <div className="ff-modal-box ff-modal-box--flight">
                  <h3 className="ff-modal-title">{editFlightId ? 'Edit Flight' : 'Add Fixed Departure Flight'}</h3>
                  {flightErr && <div className="ff-error-banner">{flightErr}</div>}
                  <div className="ff-modal-grid">
                    {[
                      { key: 'title', label: 'Flight Title', placeholder: 'Mumbai → Goa Charter' },
                      { key: 'from_city', label: 'From City', placeholder: 'Mumbai' },
                      { key: 'from_code', label: 'From IATA', placeholder: 'BOM' },
                      { key: 'to_city', label: 'To City', placeholder: 'Goa' },
                      { key: 'to_code', label: 'To IATA', placeholder: 'GOI' },
                      { key: 'departure_date', label: 'Departure Date', placeholder: '', type: 'date' },
                      { key: 'departure_time', label: 'Departure Time', placeholder: '14:00' },
                      { key: 'arrival_time', label: 'Arrival Time', placeholder: '15:15' },
                      { key: 'duration', label: 'Duration', placeholder: '1h 15m' },
                      { key: 'airline_name', label: 'Airline Name', placeholder: 'IndiGo' },
                      { key: 'airline_code', label: 'Airline Code', placeholder: '6E' },
                      { key: 'flight_number', label: 'Flight Number', placeholder: '6E-204' },
                      { key: 'total_seats', label: 'Total Seats', placeholder: '50', type: 'number' },
                      { key: 'price_per_seat', label: 'Price Per Seat (₹)', placeholder: '4999', type: 'number' },
                      { key: 'booking_deadline', label: 'Booking Deadline', placeholder: '', type: 'date' },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key} className={key === 'title' ? 'ff-span-2' : ''}>
                        <label className="ff-field-label">{label}</label>
                        <input type={type ?? 'text'} value={(flightForm as any)[key]} placeholder={placeholder} onChange={e => setFlightForm(f => ({ ...f, [key]: e.target.value }))} className="ff-field-input" />
                      </div>
                    ))}
                  </div>
                  <div className="ff-modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowFlightForm(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveManualFlight} disabled={flightSaving}>{flightSaving ? 'Saving…' : editFlightId ? 'Save Changes' : 'Create Flight'}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* ── Tab: API Settings ── */}
        {tab === 'settings' && (
          <div className="ff-settings-wrap">
            {/* Conditions banner */}
            <div className="ff-conditions-banner">
              <div className="ff-conditions-title">
                Nexus DMC API Conditions
              </div>
              <div className="ff-conditions-grid">
                {[
                  { label: 'Minimum bookings',   value: '100 / month' },
                  { label: 'Wallet balance',      value: '₹1,00,000 minimum' },
                  { label: 'Portal vs API price', value: '₹50 per passenger' },
                  { label: 'Rate limit',          value: '100 requests / min' },
                ].map(({ label, value }) => (
                  <div key={label} className="ff-condition-row">
                    <span className="ff-condition-label">{label}</span>
                    <span className="ff-condition-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {settingsLoad ? (
              <div className="ff-loading-24">Loading…</div>
            ) : (
              <>
                {settingsErr && <div className="ff-error-banner">{settingsErr}</div>}
                {settingsOk  && <div className="ff-ok-banner">{settingsOk}</div>}

                {/* Price markup */}
                <div className="ff-card">
                  <div className="ff-card-title">Price Markup per Passenger</div>
                  <div className="ff-card-sub">
                    Added on top of Nexus API fare before showing to users. Nexus requires min ₹50/pax.
                  </div>
                  <div className="ff-inline-form-row">
                    <div className="ff-flex-1">
                      <label className="ff-field-label">
                        Amount (₹)
                      </label>
                      <input
                        type="number" min="50" step="1"
                        value={markupInput}
                        onChange={e => setMarkupInput(e.target.value)}
                        className="ff-num-input"
                      />
                    </div>
                    <button
                      className="btn btn-primary ff-btn-save"
                      onClick={() => saveSettings('markup')}
                      disabled={settingsSaving}
                    >
                      Save Markup
                    </button>
                  </div>
                  {apiSettings && (
                    <div className="ff-current-note">
                      Current: <strong className="ff-current-value">₹{Number(apiSettings.markup_per_pax).toLocaleString('en-IN')}/pax</strong>
                      {' · '}Last updated: {new Date(apiSettings.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Account balance */}
                <div className="ff-card ff-card--last">
                  <div className="ff-card-header-row">
                    <div className="ff-card-title-inline">Nexus DMC Account Balance</div>
                    {apiSettings && (
                      <div className={`ff-balance-pill ${Number(apiSettings.account_balance) < 100000 ? 'ff-balance-pill--low' : 'ff-balance-pill--ok'}`}>
                        ₹{Number(apiSettings.account_balance).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="ff-card-sub">
                    Balance held with Nexus DMC. Each booking deducts automatically. Top up after depositing to Nexus.
                    {apiSettings && Number(apiSettings.account_balance) < 100000 && (
                      <span className="ff-warn-text"> ⚠ Below ₹1 lakh minimum — top up required.</span>
                    )}
                  </div>
                  <div className="ff-inline-form-row">
                    <div className="ff-flex-1">
                      <label className="ff-field-label">
                        Set new balance after top-up (₹)
                      </label>
                      <input
                        type="number" min="0" step="1000"
                        value={balanceInput}
                        onChange={e => setBalanceInput(e.target.value)}
                        className="ff-num-input"
                      />
                    </div>
                    <button
                      className="btn btn-primary ff-btn-save"
                      onClick={() => saveSettings('balance')}
                      disabled={settingsSaving}
                    >
                      Update Balance
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
