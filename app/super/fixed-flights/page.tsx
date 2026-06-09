'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

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
        <div style={{ display: 'flex', gap: 8 }}>
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
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0F172A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([
            { key: 'bookings', label: 'Nexus Bookings' },
            { key: 'featured', label: 'Featured Routes' },
            { key: 'manual',   label: 'Manual Flights' },
            { key: 'settings', label: '⚙ API Settings' },
          ] as { key: TabType; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#1A56DB' : 'transparent',
                color:      tab === t.key ? '#fff' : '#64748B',
              }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Bookings', value: nexusStats.total_bookings },
                  { label: 'Total Revenue',  value: fmtAmt(nexusStats.total_revenue) },
                  { label: 'Consumer',       value: nexusStats.by_source.consumer },
                  { label: 'myBiz',          value: nexusStats.by_source.mybiz },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#0F172A', borderRadius: 12, padding: '16px 20px', border: '1px solid #1E293B' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {nexusLoading ? (
              <div style={{ color: '#94A3B8', padding: 32 }}>Loading…</div>
            ) : nexusBookings.length === 0 ? (
              <div style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>
                No Nexus bookings yet. Charter routes must be configured in "Featured Routes" first.
              </div>
            ) : (
              <div className="table-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                      {['Booking Ref / PNR', 'Route', 'Date', 'Passengers', 'Amount', 'Source', 'Status', 'Booked On'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nexusBookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #0F172A' }}>
                        <td style={{ padding: '12px', fontSize: 13 }}>
                          <div style={{ fontWeight: 700, color: '#F1F5F9', letterSpacing: 1 }}>{b.booking_ref}</div>
                          {b.pnr && <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>PNR: {b.pnr}</div>}
                          {b.contact_email && <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.contact_email}</div>}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0', fontSize: 14 }}>
                          {b.origin} → {b.destination}
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{b.airline} {b.flight_number}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#CBD5E1' }}>{fmtDate(b.travel_date)}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>
                          {b.adults}A{b.children > 0 ? ` ${b.children}C` : ''}{b.infants > 0 ? ` ${b.infants}I` : ''}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0' }}>{fmtAmt(b.total_amount)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: b.source === 'mybiz' ? '#1e3a5f' : b.source === 'mypartner' ? '#2d1b69' : '#0d3321',
                            color:      b.source === 'mybiz' ? '#93C5FD' : b.source === 'mypartner' ? '#C4B5FD' : '#86EFAC',
                          }}>
                            {b.source}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#14532D', color: '#86EFAC' }}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: '#64748B' }}>
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
            <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20, padding: '10px 14px', background: '#0F172A', borderRadius: 8, border: '1px solid #1E293B' }}>
              Featured routes appear on the consumer home screen as charter flight cards, powered by live Nexus DMC data.
              Add the IATA codes and city names for routes you want to highlight.
            </div>

            {sectorsLoad ? (
              <div style={{ color: '#94A3B8', padding: 24 }}>Loading…</div>
            ) : sectors.length === 0 ? (
              <div style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>
                No featured routes yet. Click "+ Add Route" to add your first charter route.
              </div>
            ) : (
              <div className="table-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                      {['Route', 'Cities', 'Order', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #0F172A' }}>
                        <td style={{ padding: '12px', fontSize: 15, fontWeight: 800, color: '#F1F5F9', letterSpacing: 1 }}>
                          {s.origin} → {s.destination}
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>
                          {s.origin_city} → {s.destination_city}
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>{s.display_order}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: s.is_active ? '#14532D' : '#1E293B',
                            color:      s.is_active ? '#86EFAC' : '#64748B',
                          }}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '4px 10px' }}
                              onClick={() => { setSectorForm({ origin: s.origin, destination: s.destination, origin_city: s.origin_city, destination_city: s.destination_city, display_order: s.display_order }); setEditSectorId(s.id); setSectorErr(''); setShowSectorForm(true) }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '4px 10px', color: s.is_active ? '#EF4444' : '#22C55E' }}
                              onClick={() => toggleSector(s)}
                            >
                              {s.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '4px 10px', color: '#EF4444' }}
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: 28, width: 420 }}>
                  <h3 style={{ margin: '0 0 20px', color: '#F1F5F9', fontSize: 18 }}>
                    {editSectorId ? 'Edit Featured Route' : 'Add Featured Route'}
                  </h3>
                  {sectorErr && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{sectorErr}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { key: 'origin',           label: 'Origin IATA',       placeholder: 'DEL' },
                      { key: 'destination',      label: 'Destination IATA',  placeholder: 'BOM' },
                      { key: 'origin_city',      label: 'Origin City',       placeholder: 'Delhi' },
                      { key: 'destination_city', label: 'Destination City',  placeholder: 'Mumbai' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{label}</label>
                        <input
                          value={(sectorForm as any)[key]}
                          placeholder={placeholder}
                          onChange={e => setSectorForm(f => ({ ...f, [key]: e.target.value }))}
                          disabled={!!editSectorId && (key === 'origin' || key === 'destination')}
                          style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box', opacity: (!!editSectorId && (key === 'origin' || key === 'destination')) ? 0.5 : 1 }}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Display Order</label>
                      <input
                        type="number"
                        value={sectorForm.display_order}
                        onChange={e => setSectorForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
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
            <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20, padding: '10px 14px', background: '#0F172A', borderRadius: 8, border: '1px solid #1E293B' }}>
              Manual flights are custom fixed-departure entries managed by admins directly (not sourced from Nexus DMC).
            </div>

            {manualLoad ? (
              <div style={{ color: '#94A3B8', padding: 32 }}>Loading…</div>
            ) : manualFlights.length === 0 ? (
              <div style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>No manual flights yet. Click "+ Add Flight" to create one.</div>
            ) : (
              <div className="table-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                      {['Flight', 'Route', 'Date', 'Seats', 'Price', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {manualFlights.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #0F172A' }}>
                        <td style={{ padding: '12px', fontSize: 13 }}>
                          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{f.airline_name}</div>
                          <div style={{ color: '#64748B', fontSize: 11 }}>{f.flight_number} · {f.departure_time}–{f.arrival_time} ({f.duration})</div>
                          <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{f.title}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0', fontSize: 14 }}>{f.from_code} → {f.to_code}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#CBD5E1' }}>{fmtDate(f.departure_date)}</td>
                        <td style={{ padding: '12px', minWidth: 120 }}>
                          <div style={{ fontSize: 12, color: seatsLeft(f) <= 5 ? '#EF4444' : '#94A3B8', marginBottom: 4 }}>
                            {f.seats_booked}/{f.total_seats} · <strong style={{ color: seatsLeft(f) <= 5 ? '#EF4444' : '#22C55E' }}>{seatsLeft(f)} left</strong>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: '#1E293B' }}>
                            <div style={{ height: 4, borderRadius: 2, background: pct(f) > 80 ? '#EF4444' : '#1A56DB', width: `${pct(f)}%` }} />
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0' }}>{fmtAmt(f.price_per_seat)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: f.is_active ? '#14532D' : '#1E293B', color: f.is_active ? '#86EFAC' : '#64748B' }}>
                            {f.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                              onClick={() => {
                                setFlightForm({ title: f.title, from_city: '', from_code: f.from_code, to_city: '', to_code: f.to_code, departure_date: f.departure_date, departure_time: f.departure_time, arrival_time: f.arrival_time, duration: f.duration, airline_name: f.airline_name, airline_code: '', flight_number: f.flight_number, total_seats: String(f.total_seats), price_per_seat: String(f.price_per_seat), booking_deadline: f.booking_deadline ?? '', description: '', image_url: '' })
                                setEditFlightId(f.id); setFlightErr(''); setShowFlightForm(true)
                              }}>Edit</button>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: f.is_active ? '#EF4444' : '#22C55E' }} onClick={() => toggleManual(f)}>
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 20px', color: '#F1F5F9', fontSize: 18 }}>{editFlightId ? 'Edit Flight' : 'Add Fixed Departure Flight'}</h3>
                  {flightErr && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{flightErr}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                      <div key={key} style={key === 'title' ? { gridColumn: 'span 2' } : {}}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{label}</label>
                        <input type={type ?? 'text'} value={(flightForm as any)[key]} placeholder={placeholder} onChange={e => setFlightForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
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
          <div style={{ maxWidth: 700 }}>
            {/* Conditions banner */}
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Nexus DMC API Conditions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Minimum bookings',   value: '100 / month' },
                  { label: 'Wallet balance',      value: '₹1,00,000 minimum' },
                  { label: 'Portal vs API price', value: '₹50 per passenger' },
                  { label: 'Rate limit',          value: '100 requests / min' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', background: '#1E293B', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#F1F5F9', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {settingsLoad ? (
              <div style={{ color: '#94A3B8', padding: 24 }}>Loading…</div>
            ) : (
              <>
                {settingsErr && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{settingsErr}</div>}
                {settingsOk  && <div style={{ background: '#052e16', color: '#86efac', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{settingsOk}</div>}

                {/* Price markup */}
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>Price Markup per Passenger</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                    Added on top of Nexus API fare before showing to users. Nexus requires min ₹50/pax.
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                        Amount (₹)
                      </label>
                      <input
                        type="number" min="50" step="1"
                        value={markupInput}
                        onChange={e => setMarkupInput(e.target.value)}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSettings('markup')}
                      disabled={settingsSaving}
                      style={{ padding: '10px 20px', whiteSpace: 'nowrap' as const }}
                    >
                      Save Markup
                    </button>
                  </div>
                  {apiSettings && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
                      Current: <strong style={{ color: '#94A3B8' }}>₹{Number(apiSettings.markup_per_pax).toLocaleString('en-IN')}/pax</strong>
                      {' · '}Last updated: {new Date(apiSettings.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Account balance */}
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>Nexus DMC Account Balance</div>
                    {apiSettings && (
                      <div style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                        background: Number(apiSettings.account_balance) < 100000 ? '#450a0a' : '#052e16',
                        color:      Number(apiSettings.account_balance) < 100000 ? '#fca5a5' : '#86efac',
                      }}>
                        ₹{Number(apiSettings.account_balance).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                    Balance held with Nexus DMC. Each booking deducts automatically. Top up after depositing to Nexus.
                    {apiSettings && Number(apiSettings.account_balance) < 100000 && (
                      <span style={{ color: '#fca5a5', fontWeight: 700 }}> ⚠ Below ₹1 lakh minimum — top up required.</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                        Set new balance after top-up (₹)
                      </label>
                      <input
                        type="number" min="0" step="1000"
                        value={balanceInput}
                        onChange={e => setBalanceInput(e.target.value)}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSettings('balance')}
                      disabled={settingsSaving}
                      style={{ padding: '10px 20px', whiteSpace: 'nowrap' as const }}
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
