'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

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
        <div style={{ display: 'flex', gap: 8 }}>
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
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0F172A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([
            { key: 'bookings', label: 'Bookings' },
            { key: 'sectors',  label: 'Featured Sectors' },
            { key: 'settings', label: '⚙ API Settings' },
          ] as { key: TabType; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#1A56DB' : 'transparent',
              color:      tab === t.key ? '#fff' : '#64748B',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Bookings ── */}
        {tab === 'bookings' && (
          <>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Bookings', value: stats.total_bookings },
                  { label: 'Total Revenue',  value: fmtAmt(stats.total_revenue) },
                  { label: 'Consumer',       value: stats.by_source.consumer },
                  { label: 'myBiz / Partner',value: stats.by_source.mybiz + stats.by_source.mypartner },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#0F172A', borderRadius: 12, padding: '16px 20px', border: '1px solid #1E293B' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {bookingsLoad ? <div style={{ color: '#94A3B8', padding: 32 }}>Loading…</div> :
              bookings.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>No bookings yet. Add featured sectors first.</div>
              ) : (
                <div className="table-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                        {['Ref / PNR', 'Route', 'Date', 'Pax', 'Fare Guide Amt', 'Total Charged', 'Source', 'Booked On'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #0F172A' }}>
                          <td style={{ padding: '12px', fontSize: 13 }}>
                            <div style={{ fontWeight: 700, color: '#F1F5F9', letterSpacing: 1 }}>{b.reference_id}</div>
                            {b.pnr && <div style={{ fontSize: 11, color: '#64748B' }}>PNR: {b.pnr}</div>}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0' }}>
                            {b.source_code} → {b.destination_code}
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{b.airline} {b.flight_number}</div>
                          </td>
                          <td style={{ padding: '12px', fontSize: 13, color: '#CBD5E1' }}>{fmtDate(b.travel_date)}</td>
                          <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>
                            {b.adults}A{b.children > 0 ? ` ${b.children}C` : ''}{b.infants > 0 ? ` ${b.infants}I` : ''}
                          </td>
                          <td style={{ padding: '12px', color: '#94A3B8' }}>{fmtAmt(b.fareguide_amount)}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#E2E8F0' }}>{fmtAmt(b.total_amount)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: b.source === 'mybiz' ? '#1e3a5f' : b.source === 'mypartner' ? '#2d1b69' : '#0d3321',
                              color:      b.source === 'mybiz' ? '#93C5FD' : b.source === 'mypartner' ? '#C4B5FD' : '#86EFAC',
                            }}>{b.source}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: 12, color: '#64748B' }}>
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
            <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20, padding: '10px 14px', background: '#0F172A', borderRadius: 8, border: '1px solid #1E293B' }}>
              Featured sectors appear on the consumer home screen as charter flight cards. Use IATA codes from the FareGuide sector list.
            </div>
            {sectorsLoad ? <div style={{ color: '#94A3B8', padding: 24 }}>Loading…</div> :
              sectors.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>No sectors yet. Click "+ Add Sector".</div>
              ) : (
                <div className="table-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1E293B', textAlign: 'left' }}>
                        {['Sector', 'Cities', 'Type', 'Order', 'Status', ''].map(h => (
                          <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectors.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #0F172A' }}>
                          <td style={{ padding: '12px', fontSize: 15, fontWeight: 800, color: '#F1F5F9', letterSpacing: 1 }}>{s.origin} → {s.destination}</td>
                          <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>{s.origin_city} → {s.destination_city}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.sector_type === 'INTERNATIONAL' ? '#2d1b69' : '#0d3321', color: s.sector_type === 'INTERNATIONAL' ? '#C4B5FD' : '#86EFAC' }}>
                              {s.sector_type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>{s.display_order}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.is_active ? '#14532D' : '#1E293B', color: s.is_active ? '#86EFAC' : '#64748B' }}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                                onClick={() => { setSectorForm({ origin: s.origin, destination: s.destination, origin_city: s.origin_city, destination_city: s.destination_city, sector_type: s.sector_type, display_order: s.display_order }); setEditId(s.id); setSectorErr(''); setShowForm(true) }}>
                                Edit
                              </button>
                              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: s.is_active ? '#EF4444' : '#22C55E' }} onClick={() => toggleSector(s)}>
                                {s.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#EF4444' }} onClick={() => deleteSector(s.id)}>Delete</button>
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: 28, width: 440 }}>
                  <h3 style={{ margin: '0 0 20px', color: '#F1F5F9', fontSize: 18 }}>{editId ? 'Edit Sector' : 'Add Featured Sector'}</h3>
                  {sectorErr && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{sectorErr}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { key: 'origin',           label: 'Origin IATA',       placeholder: 'BLR' },
                      { key: 'destination',      label: 'Destination IATA',  placeholder: 'IXJ' },
                      { key: 'origin_city',      label: 'Origin City',       placeholder: 'Bangalore' },
                      { key: 'destination_city', label: 'Destination City',  placeholder: 'Jammu' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{label}</label>
                        <input value={(sectorForm as any)[key]} placeholder={placeholder}
                          onChange={e => setSectorForm(f => ({ ...f, [key]: e.target.value }))}
                          disabled={!!editId && (key === 'origin' || key === 'destination')}
                          style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, opacity: (!!editId && (key === 'origin' || key === 'destination')) ? 0.5 : 1 }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Type</label>
                      <select value={sectorForm.sector_type} onChange={e => setSectorForm(f => ({ ...f, sector_type: e.target.value }))}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}>
                        <option value="DOMESTIC">DOMESTIC</option>
                        <option value="INTERNATIONAL">INTERNATIONAL</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Display Order</label>
                      <input type="number" value={sectorForm.display_order} onChange={e => setSectorForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
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
          <div style={{ maxWidth: 700 }}>
            {/* API Credentials */}
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>API Credentials (Staging)</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>These are set in backend/.env.local. Contact the backend to rotate.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'API Key',    value: 'tfg_7cf830da2a175d3dc6c33e2d9aab7850fd21482b7e758ffe19' },
                  { label: 'API Secret', value: '375f11e8c209be47751d333ca1ec467f82e449bda50b7bf25f4627ed928cfa7fe8' },
                  { label: 'Base URL',   value: 'https://thefareguide.com/api/v1/agent' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <code style={{ fontSize: 12, color: '#94A3B8', background: '#1E293B', padding: '6px 10px', borderRadius: 6, display: 'block', wordBreak: 'break-all' }}>{value}</code>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 14, fontSize: 12 }} onClick={checkHealth} disabled={healthLoad}>
                {healthLoad ? 'Checking…' : '🔍 Check API Health'}
              </button>
              {healthOk !== null && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: healthOk ? '#86EFAC' : '#fca5a5' }}>
                  {healthOk ? '✓ API is healthy' : '✗ API unreachable'}
                </div>
              )}
            </div>

            {/* Markup */}
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>Price Markup per Passenger (₹)</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Added on top of FareGuide API fare before showing to users. Shared with Nexus settings.</div>
              {markupOk && <div style={{ background: '#052e16', color: '#86efac', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{markupOk}</div>}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input type="number" min="0" step="1" value={markup} onChange={e => setMarkup(e.target.value)}
                    style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <button className="btn btn-primary" onClick={saveMarkup} disabled={markupSaving} style={{ padding: '10px 20px' }}>Save Markup</button>
              </div>
            </div>

            {/* Available dates per sector — admin only */}
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>Available Dates (Admin View)</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Check all available departure dates for any sector. Format: ORIGIN-DESTINATION (e.g. BLR-IXJ)</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input value={datesSector} onChange={e => setDatesSector(e.target.value.toUpperCase())} placeholder="BLR-IXJ"
                  style={{ flex: 1, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none' }} />
                <button className="btn btn-primary" onClick={loadDates} disabled={datesLoad || !datesSector} style={{ padding: '9px 20px' }}>
                  {datesLoad ? 'Loading…' : 'Check Dates'}
                </button>
              </div>
              {/* Quick sector buttons from featured list */}
              {sectors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {sectors.slice(0, 8).map(s => (
                    <button key={s.id} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => { setDatesSector(`${s.origin}-${s.destination}`); }}>
                      {s.origin}-{s.destination}
                    </button>
                  ))}
                </div>
              )}
              {datesErr && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{datesErr}</div>}
              {dates.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>{dates.length} available dates for {datesSector}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {dates.map(d => (
                      <div key={d.travelDate} style={{ background: '#1E293B', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>{fmtDate(d.travelDate)}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: d.totalAvailableQuantity <= 9 ? '#450a0a' : '#052e16',
                          color:      d.totalAvailableQuantity <= 9 ? '#fca5a5' : '#86EFAC',
                        }}>
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
