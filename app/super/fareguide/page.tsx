'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { Ticket, TrendingUp, Users, Building2 } from 'lucide-react'

type TabType = 'bookings' | 'sectors' | 'settings'

interface FGBooking {
  id: string; reference_id: string; pnr: string
  source_code: string; destination_code: string
  origin_city: string; destination_city: string
  travel_date: string; flight_number: string; airline: string
  departure_time: string; arrival_time: string
  adults: number; children: number; infants: number
  fareguide_amount: number; total_amount: number
  booker_email: string; status: string; source: string
  created_at: string
}

interface FGStats {
  total_bookings: number; total_revenue: number
  by_source: { consumer: number; mybiz: number; mypartner: number }
}

interface FGSector {
  id: string; origin: string; destination: string
  origin_city: string; destination_city: string
  sector_type: string; display_order: number; is_active: boolean
}

interface AvailableDate {
  travelDate: string; totalAvailableQuantity: number
}

const EMPTY_SECTOR = { origin: '', destination: '', origin_city: '', destination_city: '', sector_type: 'DOMESTIC', display_order: 0 }

function fmtAmt(n: number) { return '₹' + Number(n).toLocaleString('en-IN') }
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

function sourcePillClass(source: string) {
  if (source === 'mybiz') return 'fg-source-pill--mybiz'
  if (source === 'mypartner') return 'fg-source-pill--mypartner'
  return 'fg-source-pill--consumer'
}

export default function FareGuidePage() {
  const [tab, setTab] = useState<TabType>('bookings')

  // Bookings
  const [bookings,     setBookings]     = useState<FGBooking[]>([])
  const [stats,        setStats]        = useState<FGStats | null>(null)
  const [bookingsLoad, setBookingsLoad] = useState(true)

  // Featured sectors
  const [sectors,      setSectors]      = useState<FGSector[]>([])
  const [sectorsLoad,  setSectorsLoad]  = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [sectorForm,   setSectorForm]   = useState(EMPTY_SECTOR)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [sectorErr,    setSectorErr]    = useState('')

  // API settings / dates
  const [markup,       setMarkup]       = useState('0')
  const [markupSaving, setMarkupSaving] = useState(false)
  const [markupOk,     setMarkupOk]     = useState('')
  const [settingsLoad, setSettingsLoad] = useState(false)
  const [datesSector,  setDatesSector]  = useState('')
  const [dates,        setDates]        = useState<AvailableDate[]>([])
  const [datesLoad,    setDatesLoad]    = useState(false)
  const [datesErr,     setDatesErr]     = useState('')
  const [apiKey,       setApiKey]       = useState('tfg_7cf830da2a175d3dc6c33e2d9aab7850fd21482b7e758ffe19')
  const [healthOk,     setHealthOk]     = useState<boolean | null>(null)
  const [healthLoad,   setHealthLoad]   = useState(false)

  useEffect(() => {
    loadBookings()
    loadSectors()
    loadMarkup()
  }, [])

  function loadBookings() {
    setBookingsLoad(true)
    adminFetch('/api/admin/super/fareguide')
      .then(d => { setBookings(d.bookings ?? []); setStats(d.stats ?? null) })
      .catch(() => {})
      .finally(() => setBookingsLoad(false))
  }

  function loadSectors() {
    setSectorsLoad(true)
    adminFetch('/api/admin/super/fareguide/featured')
      .then(d => setSectors(d.sectors ?? []))
      .catch(() => {})
      .finally(() => setSectorsLoad(false))
  }

  function loadMarkup() {
    setSettingsLoad(true)
    adminFetch('/api/admin/super/nexus/settings')
      .then(d => setMarkup(String(d.settings?.markup_per_pax ?? 0)))
      .catch(() => {})
      .finally(() => setSettingsLoad(false))
  }

  async function saveMarkup() {
    setMarkupSaving(true); setMarkupOk('')
    try {
      await adminFetch('/api/admin/super/nexus/settings', {
        method: 'PATCH',
        body: JSON.stringify({ markup_per_pax: Number(markup) }),
      })
      setMarkupOk('Markup saved.')
      setTimeout(() => setMarkupOk(''), 3000)
    } catch {}
    setMarkupSaving(false)
  }

  async function checkHealth() {
    setHealthLoad(true); setHealthOk(null)
    try {
      const res = await fetch('https://thefareguide.com/api/v1/agent/health', {
        headers: { 'x-api-key': apiKey, 'x-api-secret': '375f11e8c209be47751d333ca1ec467f82e449bda50b7bf25f4627ed928cfa7fe8' },
      })
      const json = await res.json()
      setHealthOk(json.success === true)
    } catch { setHealthOk(false) }
    setHealthLoad(false)
  }

  async function loadDates() {
    if (!datesSector) return
    const [src, dst] = datesSector.split('-')
    if (!src || !dst) return
    setDatesLoad(true); setDatesErr(''); setDates([])
    try {
      const d = await adminFetch(`/api/fareguide/dates?sourceCode=${src}&destinationCode=${dst}`)
      setDates(d.dates ?? [])
      if (!(d.dates?.length)) setDatesErr('No available dates for this sector.')
    } catch (e: any) { setDatesErr(e.message) }
    setDatesLoad(false)
  }

  async function saveSector() {
    setSaving(true); setSectorErr('')
    try {
      if (editId) {
        await adminFetch('/api/admin/super/fareguide/featured', {
          method: 'PATCH',
          body: JSON.stringify({ id: editId, ...sectorForm }),
        })
      } else {
        await adminFetch('/api/admin/super/fareguide/featured', {
          method: 'POST',
          body: JSON.stringify(sectorForm),
        })
      }
      setShowForm(false); loadSectors()
    } catch (e: any) { setSectorErr(e.message) }
    setSaving(false)
  }

  async function toggleSector(s: FGSector) {
    await adminFetch('/api/admin/super/fareguide/featured', {
      method: 'PATCH',
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    }).then(loadSectors).catch(() => {})
  }

  async function deleteSector(id: string) {
    if (!confirm('Remove this sector?')) return
    await adminFetch('/api/admin/super/fareguide/featured', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }).then(loadSectors).catch(() => {})
  }

  return (
    <div>
      <div className="admin-topbar">
        <h2>FareGuide Charter</h2>
        <div className="fg-topbar-actions">
          {tab === 'sectors' && (
            <button className="btn btn-primary"
              onClick={() => { setSectorForm(EMPTY_SECTOR); setEditId(null); setSectorErr(''); setShowForm(true) }}>
              + Add Sector
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {/* Tabs */}
        <div className="fg-tab-bar">
          {([
            { key: 'bookings', label: 'Bookings' },
            { key: 'sectors',  label: 'Featured Sectors' },
            { key: 'settings', label: '⚙ API Settings' },
          ] as { key: TabType; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`fg-tab-btn ${tab === t.key ? 'fg-tab-btn--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Bookings ── */}
        {tab === 'bookings' && (
          <>
            {stats && (
              <div className="fg-stats-grid">
                <StatCard
                  label="Total Bookings"
                  value={stats.total_bookings}
                  sub="FareGuide charter bookings"
                  badge="FareGuide"
                  Icon={Ticket}
                  iconBg="#eff6ff"
                  iconColor="#2563eb"
                  badgeBg="#dbeafe"
                  badgeColor="#1d4ed8"
                />
                <StatCard
                  label="Total Revenue"
                  value={fmtAmt(stats.total_revenue)}
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
                  value={stats.by_source.consumer}
                  sub="Bookings via consumer app"
                  badge="B2C"
                  Icon={Users}
                  iconBg="#fff7ed"
                  iconColor="#ea580c"
                  badgeBg="#ffedd5"
                  badgeColor="#c2410c"
                />
                <StatCard
                  label="Corporate & Partner"
                  value={stats.by_source.mybiz + stats.by_source.mypartner}
                  sub="Bookings via B2B partners"
                  badge="B2B"
                  Icon={Building2}
                  iconBg="#fdf2f8"
                  iconColor="#db2777"
                  badgeBg="#fce7f3"
                  badgeColor="#be185d"
                />
              </div>
            )}

            {bookingsLoad ? <div className="fg-loading">Loading…</div> :
              bookings.length === 0 ? (
                <div className="fg-empty">No bookings yet. Add featured sectors first.</div>
              ) : (
                <div className="table-card">
                  <table className="fg-table">
                    <thead>
                      <tr className="fg-thead-row">
                        {['Ref / PNR', 'Route', 'Date', 'Pax', 'Fare Guide Amt', 'Total Charged', 'Source', 'Booked On'].map(h => (
                          <th key={h} className="fg-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} className="fg-tr">
                          <td className="fg-td-ref">
                            <div className="fg-ref-code">{b.reference_id}</div>
                            {b.pnr && <div className="fg-pnr-sub">PNR: {b.pnr}</div>}
                          </td>
                          <td className="fg-td-route">
                            {b.source_code} → {b.destination_code}
                            <div className="fg-flight-sub">{b.airline} {b.flight_number}</div>
                          </td>
                          <td className="fg-td-date">{fmtDate(b.travel_date)}</td>
                          <td className="fg-td-muted13">
                            {b.adults}A{b.children > 0 ? ` ${b.children}C` : ''}{b.infants > 0 ? ` ${b.infants}I` : ''}
                          </td>
                          <td className="fg-td-amt">{fmtAmt(b.fareguide_amount)}</td>
                          <td className="fg-td-amt-strong">{fmtAmt(b.total_amount)}</td>
                          <td className="fg-td-plain">
                            <span className={`fg-source-pill ${sourcePillClass(b.source)}`}>{b.source}</span>
                          </td>
                          <td className="fg-td-sub">
                            {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </>
        )}

        {/* ── Tab: Featured Sectors ── */}
        {tab === 'sectors' && (
          <>
            <div className="fg-info-banner">
              Featured sectors appear on the consumer home screen as charter flight cards. Use IATA codes from the FareGuide sector list.
            </div>
            {sectorsLoad ? <div className="fg-loading-24">Loading…</div> :
              sectors.length === 0 ? (
                <div className="fg-empty">No sectors yet. Click "+ Add Sector".</div>
              ) : (
                <div className="table-card">
                  <table className="fg-table">
                    <thead>
                      <tr className="fg-thead-row">
                        {['Sector', 'Cities', 'Type', 'Order', 'Status', ''].map(h => (
                          <th key={h} className="fg-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectors.map(s => (
                        <tr key={s.id} className="fg-tr">
                          <td className="fg-td-sector">{s.origin} → {s.destination}</td>
                          <td className="fg-td-muted13">{s.origin_city} → {s.destination_city}</td>
                          <td className="fg-td-plain">
                            <span className={`fg-type-pill ${s.sector_type === 'INTERNATIONAL' ? 'fg-type-pill--intl' : 'fg-type-pill--domestic'}`}>
                              {s.sector_type}
                            </span>
                          </td>
                          <td className="fg-td-muted13">{s.display_order}</td>
                          <td className="fg-td-plain">
                            <span className={`fg-status-pill ${s.is_active ? 'fg-status-pill--active' : 'fg-status-pill--inactive'}`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="fg-td-plain">
                            <div className="fg-row-actions">
                              <button className="btn btn-ghost fg-btn-sm"
                                onClick={() => { setSectorForm({ origin: s.origin, destination: s.destination, origin_city: s.origin_city, destination_city: s.destination_city, sector_type: s.sector_type, display_order: s.display_order }); setEditId(s.id); setSectorErr(''); setShowForm(true) }}>
                                Edit
                              </button>
                              <button className={`btn btn-ghost fg-btn-sm ${s.is_active ? 'fg-btn-danger' : 'fg-btn-success'}`} onClick={() => toggleSector(s)}>
                                {s.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="btn btn-ghost fg-btn-sm fg-btn-danger" onClick={() => deleteSector(s.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }

            {showForm && (
              <div className="fg-modal-overlay">
                <div className="fg-modal-box">
                  <h3 className="fg-modal-title">{editId ? 'Edit Sector' : 'Add Featured Sector'}</h3>
                  {sectorErr && <div className="fg-error-banner">{sectorErr}</div>}
                  <div className="fg-modal-grid">
                    {[
                      { key: 'origin',           label: 'Origin IATA',       placeholder: 'BLR' },
                      { key: 'destination',      label: 'Destination IATA',  placeholder: 'IXJ' },
                      { key: 'origin_city',      label: 'Origin City',       placeholder: 'Bangalore' },
                      { key: 'destination_city', label: 'Destination City',  placeholder: 'Jammu' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="fg-field-label">{label}</label>
                        <input value={(sectorForm as any)[key]} placeholder={placeholder}
                          onChange={e => setSectorForm(f => ({ ...f, [key]: e.target.value }))}
                          disabled={!!editId && (key === 'origin' || key === 'destination')}
                          className="fg-field-input" />
                      </div>
                    ))}
                    <div>
                      <label className="fg-field-label">Type</label>
                      <select value={sectorForm.sector_type} onChange={e => setSectorForm(f => ({ ...f, sector_type: e.target.value }))}
                        className="fg-field-input">
                        <option value="DOMESTIC">DOMESTIC</option>
                        <option value="INTERNATIONAL">INTERNATIONAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="fg-field-label">Display Order</label>
                      <input type="number" value={sectorForm.display_order} onChange={e => setSectorForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                        className="fg-field-input" />
                    </div>
                  </div>
                  <div className="fg-modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveSector} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Sector'}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab: API Settings ── */}
        {tab === 'settings' && (
          <div className="fg-settings-wrap">
            {/* API Credentials */}
            <div className="fg-card">
              <div className="fg-card-title">API Credentials (Staging)</div>
              <div className="fg-card-sub">These are set in backend/.env.local. Contact the backend to rotate.</div>
              <div className="fg-creds-list">
                {[
                  { label: 'API Key',    value: 'tfg_7cf830da2a175d3dc6c33e2d9aab7850fd21482b7e758ffe19' },
                  { label: 'API Secret', value: '375f11e8c209be47751d333ca1ec467f82e449bda50b7bf25f4627ed928cfa7fe8' },
                  { label: 'Base URL',   value: 'https://thefareguide.com/api/v1/agent' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="fg-cred-label">{label}</div>
                    <code className="fg-cred-value">{value}</code>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost fg-btn-check-health" onClick={checkHealth} disabled={healthLoad}>
                {healthLoad ? 'Checking…' : '🔍 Check API Health'}
              </button>
              {healthOk !== null && (
                <div className={`fg-health-status ${healthOk ? 'fg-health-status--ok' : 'fg-health-status--fail'}`}>
                  {healthOk ? '✓ API is healthy' : '✗ API unreachable'}
                </div>
              )}
            </div>

            {/* Markup */}
            <div className="fg-card">
              <div className="fg-card-title">Price Markup per Passenger (₹)</div>
              <div className="fg-card-sub">Added on top of FareGuide API fare before showing to users. Shared with Nexus settings.</div>
              {markupOk && <div className="fg-markup-ok-banner">{markupOk}</div>}
              <div className="fg-markup-row">
                <div className="fg-flex-1">
                  <input type="number" min="0" step="1" value={markup} onChange={e => setMarkup(e.target.value)}
                    className="fg-markup-input" />
                </div>
                <button className="btn btn-primary fg-btn-pad-lg" onClick={saveMarkup} disabled={markupSaving}>Save Markup</button>
              </div>
            </div>

            {/* Available dates per sector — admin only */}
            <div className="fg-card fg-card--last">
              <div className="fg-card-title">Available Dates (Admin View)</div>
              <div className="fg-card-sub">Check all available departure dates for any sector. Format: ORIGIN-DESTINATION (e.g. BLR-IXJ)</div>
              <div className="fg-dates-row">
                <input value={datesSector} onChange={e => setDatesSector(e.target.value.toUpperCase())} placeholder="BLR-IXJ"
                  className="fg-dates-input" />
                <button className="btn btn-primary fg-btn-pad-md" onClick={loadDates} disabled={datesLoad || !datesSector}>
                  {datesLoad ? 'Loading…' : 'Check Dates'}
                </button>
              </div>
              {/* Quick sector buttons from featured list */}
              {sectors.length > 0 && (
                <div className="fg-quick-sectors">
                  {sectors.slice(0, 8).map(s => (
                    <button key={s.id} className="btn btn-ghost fg-btn-xs"
                      onClick={() => { setDatesSector(`${s.origin}-${s.destination}`); }}>
                      {s.origin}-{s.destination}
                    </button>
                  ))}
                </div>
              )}
              {datesErr && <div className="fg-error-text">{datesErr}</div>}
              {dates.length > 0 && (
                <div>
                  <div className="fg-results-label">{dates.length} available dates for {datesSector}</div>
                  <div className="fg-dates-grid">
                    {dates.map(d => (
                      <div key={d.travelDate} className="fg-date-card">
                        <span className="fg-date-label">{fmtDate(d.travelDate)}</span>
                        <span className={`fg-seats-pill ${d.totalAvailableQuantity <= 9 ? 'fg-seats-pill--low' : 'fg-seats-pill--ok'}`}>
                          {d.totalAvailableQuantity} seats
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
