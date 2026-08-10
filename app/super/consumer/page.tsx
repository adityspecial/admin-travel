'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'
import { Percent, Plane, Receipt } from 'lucide-react'

// segment keys must match what the real pricing routes actually send to
// resolveFeeQuote() — cab_airport/cab_outstation come from /api/cabs/quote;
// a plain 'hotel'/'bus' segment was offered here before but never matched
// any real booking flow's segment key (bus has no live fee resolution at
// all yet, so it's still left out).
const SEGMENTS = [
  { key: 'flight_domestic',      label: 'Flight — Domestic',      color: '#2563EB', bg: '#EFF6FF' },
  { key: 'flight_international', label: 'Flight — International', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'hotel_domestic',       label: 'Hotel — Domestic',       color: '#059669', bg: '#ECFDF5' },
  { key: 'hotel_international',  label: 'Hotel — International',  color: '#0D9488', bg: '#F0FDFA' },
  { key: 'insurance',            label: 'Insurance',              color: '#D97706', bg: '#FFFBEB' },
  { key: 'cab_outstation',       label: 'Cab — Outstation',       color: '#0891B2', bg: '#ECFEFF' },
  { key: 'cab_airport',          label: 'Cab — Airport Transfer', color: '#0F766E', bg: '#F0FDFA' },
] as const

// Airline-code overrides only make sense for flight segments — a hotel,
// cab, or insurance booking has no airline to override.
const FLIGHT_SEGMENTS = SEGMENTS.filter(s => s.key.startsWith('flight_'))

const COMPONENTS = [
  { key: 'markup',      label: 'Markup' },
  { key: 'gateway_fee', label: 'Gateway Fee' },
] as const

type Tab = 'global' | 'org' | 'agent'

interface RateRow {
  id?: string; segment: string; component: string
  airline_code: string | null
  pct: number; flat: number
  min_pct: number | null; max_pct: number | null
}
interface GstTier {
  id?: string; min_amount: number; max_amount: number | null; gst_pct: number; sort_order: number
}

function rateKey(segment: string, component: string, airlineCode: string | null) {
  return `${segment}:${component}:${airlineCode ?? ''}`
}

function defaultRateMap(): Map<string, RateRow> {
  const m = new Map<string, RateRow>()
  for (const seg of SEGMENTS) {
    for (const comp of COMPONENTS) {
      m.set(rateKey(seg.key, comp.key, null), {
        segment: seg.key, component: comp.key, airline_code: null,
        pct: 0, flat: 0, min_pct: null, max_pct: null,
      })
    }
  }
  return m
}

function rowsToMap(rows: RateRow[]): Map<string, RateRow> {
  const m = defaultRateMap()
  for (const r of rows) {
    if (r.airline_code !== null) continue
    m.set(rateKey(r.segment, r.component, null), {
      ...r, pct: Number(r.pct), flat: Number(r.flat),
      min_pct: r.min_pct == null ? null : Number(r.min_pct),
      max_pct: r.max_pct == null ? null : Number(r.max_pct),
    })
  }
  return m
}

// ── Rate Grid — card per segment ───────────────────────────────────────────
function RatesGrid({ rates, showCaps, onUpdate }: {
  rates: Map<string, RateRow>
  showCaps: boolean
  onUpdate: (seg: string, comp: string, field: string, value: string) => void
}) {
  return (
    <div className="consumer-rates-grid">
      {SEGMENTS.map(seg => (
        <div key={seg.key} className={`consumer-segment-card consumer-segment--${seg.key}`}>
          <div className="consumer-segment-header">
            <span className="consumer-segment-dot" />
            <span className="consumer-segment-label">{seg.label}</span>
          </div>
          {COMPONENTS.map((comp, ci) => {
            const row = rates.get(rateKey(seg.key, comp.key, null)) ?? {
              segment: seg.key, component: comp.key, airline_code: null,
              pct: 0, flat: 0, min_pct: null, max_pct: null,
            }
            return (
              <div key={comp.key} className={`consumer-component-row ${ci % 2 !== 0 ? 'consumer-component-row--alt' : ''}`}>
                <span className="consumer-comp-label">
                  {comp.label}
                </span>
                <div className="consumer-field-group">
                  <input className="form-input consumer-input-narrow" type="number" step="0.1" min="0"
                    value={row.pct}
                    onChange={e => onUpdate(seg.key, comp.key, 'pct', e.target.value)} />
                  <span className="consumer-unit-pct">%</span>
                </div>
                <div className="consumer-field-group">
                  <span className="consumer-currency-symbol">₹</span>
                  <input className="form-input consumer-input-narrow" type="number" step="1" min="0"
                    value={row.flat}
                    onChange={e => onUpdate(seg.key, comp.key, 'flat', e.target.value)} />
                  <span className="consumer-unit-label">flat</span>
                </div>
                {showCaps && (
                  <div className="consumer-caps-group">
                    <span className="consumer-unit-label">Agent cap:</span>
                    <input className="form-input consumer-input-cap" type="number" step="0.1" placeholder="min"
                      value={row.min_pct ?? ''}
                      onChange={e => onUpdate(seg.key, comp.key, 'min_pct', e.target.value)} />
                    <span className="consumer-cap-sep">–</span>
                    <input className="form-input consumer-input-cap" type="number" step="0.1" placeholder="max"
                      value={row.max_pct ?? ''}
                      onChange={e => onUpdate(seg.key, comp.key, 'max_pct', e.target.value)} />
                    <span className="consumer-unit-label">%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Airline Overrides Table ────────────────────────────────────────────────
function AirlineOverridesTable({ rows, onChange, onAdd, onRemove }: {
  rows: RateRow[]
  onChange: (idx: number, field: string, value: string) => void
  onAdd: () => void
  onRemove: (idx: number) => void
}) {
  return (
    <div>
      {rows.length === 0 ? (
        <div className="consumer-empty-box">
          <div className="consumer-empty-title">No airline overrides set</div>
          <div className="consumer-empty-sub">Add one to charge a different rate for a specific carrier</div>
        </div>
      ) : (
        <div className="consumer-table-wrap">
          <div className="consumer-airline-header-row">
            {['Segment', 'Component', 'Airline', '%', 'Flat ₹', ''].map(h => (
              <span key={h} className="consumer-airline-header-cell">{h}</span>
            ))}
          </div>
          {rows.map((r, i) => (
            <div key={i} className={`consumer-airline-row ${i % 2 !== 0 ? 'consumer-airline-row--alt' : ''}`}>
              <select className="form-input consumer-airline-select"
                value={r.segment} onChange={e => onChange(i, 'segment', e.target.value)}>
                {FLIGHT_SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select className="form-input consumer-airline-select"
                value={r.component} onChange={e => onChange(i, 'component', e.target.value)}>
                {COMPONENTS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <input className="form-input consumer-airline-code-input" placeholder="e.g. 6E"
                value={r.airline_code ?? ''} onChange={e => onChange(i, 'airline_code', e.target.value.toUpperCase())} />
              <input className="form-input consumer-airline-num-input" type="number" step="0.1" min="0"
                value={r.pct} onChange={e => onChange(i, 'pct', e.target.value)} />
              <input className="form-input consumer-airline-num-input" type="number" step="1" min="0"
                value={r.flat} onChange={e => onChange(i, 'flat', e.target.value)} />
              <button onClick={() => onRemove(i)} className="consumer-btn-remove-row">✕</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd} className="consumer-btn-add">
        <span className="consumer-plus-icon">+</span> Add Airline Override
      </button>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, sub, children, action, icon, tone = 'blue' }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode
  icon?: React.ReactNode; tone?: 'blue' | 'teal' | 'orange'
}) {
  return (
    <div className="dashboard-card-lucrative" style={{ marginBottom: 16 }}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-title-group">
          {icon && (
            <div className={`dashboard-card-icon-icon dashboard-card-icon-${tone}`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="dashboard-card-title">{title}</h3>
            {sub && <p className="dashboard-card-subtitle">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Save bar ───────────────────────────────────────────────────────────────
function SaveBar({ msg, saving, onClick }: { msg: string; saving: boolean; onClick: () => void }) {
  const isOk = msg.startsWith('✓')
  return (
    <div className="consumer-savebar">
      <button onClick={onClick} disabled={saving} className={`consumer-save-btn ${saving ? 'consumer-save-btn--saving' : ''}`}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {msg && (
        <span className={`consumer-savebar-msg ${isOk ? 'consumer-savebar-msg--ok' : 'consumer-savebar-msg--err'}`}>
          {isOk ? '✓' : '⚠'} {msg.replace(/^[✓⚠]\s*/, '')}
        </span>
      )}
    </div>
  )
}

// ── Global Tab ─────────────────────────────────────────────────────────────
function GlobalTab() {
  const [rates,       setRates]       = useState<Map<string, RateRow>>(defaultRateMap())
  const [airlineRows, setAirlineRows] = useState<RateRow[]>([])
  const [gstTiers,    setGstTiers]    = useState<GstTier[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState('')

  useEffect(() => {
    adminFetch('/api/admin/super/fees?scope=global')
      .then((d: any) => {
        const all: RateRow[] = d.rates ?? []
        setRates(rowsToMap(all))
        setAirlineRows(all.filter(r => r.airline_code !== null).map(r => ({
          ...r, pct: Number(r.pct), flat: Number(r.flat), min_pct: null, max_pct: null,
        })))
        setGstTiers((d.gstTiers ?? []).map((t: any) => ({
          id: t.id, min_amount: Number(t.min_amount),
          max_amount: t.max_amount == null ? null : Number(t.max_amount),
          gst_pct: Number(t.gst_pct), sort_order: t.sort_order,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateRate(segment: string, component: string, field: string, value: string) {
    setRates(prev => {
      const next = new Map(prev)
      const key  = rateKey(segment, component, null)
      const row  = { ...(next.get(key) ?? { segment, component, airline_code: null, pct: 0, flat: 0, min_pct: null, max_pct: null }) }
      ;(row as any)[field] = (field === 'min_pct' || field === 'max_pct')
        ? (value === '' ? null : Number(value)) : Number(value)
      next.set(key, row)
      return next
    })
  }

  async function removeAirlineRow(idx: number) {
    const row = airlineRows[idx]
    if (row.id && row.airline_code) {
      await adminFetch('/api/admin/super/fees', {
        method: 'PUT',
        body: JSON.stringify({ scope: 'global', rates: [], deleteAirlineRows: [{ segment: row.segment, component: row.component, airline_code: row.airline_code }] }),
      }).catch(() => {})
    }
    setAirlineRows(prev => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true); setMsg('')
    try {
      await adminFetch('/api/admin/super/fees', {
        method: 'PUT',
        body: JSON.stringify({
          scope: 'global',
          rates: [...Array.from(rates.values()), ...airlineRows.filter(r => r.airline_code)],
          gstTiers: gstTiers.map((t, i) => ({ ...t, sort_order: i })),
        }),
      })
      setMsg('✓ Saved successfully')
      setTimeout(() => setMsg(''), 4000)
    } catch (e: any) { setMsg('Error: ' + (e.message ?? 'Could not save')) }
    setSaving(false)
  }

  const previewBase = 5000
  const mRow  = rates.get(rateKey('flight_domestic', 'markup', null))
  const gRow  = rates.get(rateKey('flight_domestic', 'gateway_fee', null))
  const mAmt  = mRow ? Math.round(previewBase * mRow.pct / 100 + mRow.flat) : 0
  const gAmt  = gRow ? Math.round(previewBase * gRow.pct / 100 + gRow.flat) : 0
  const tier  = gstTiers.find(t => previewBase >= t.min_amount && (t.max_amount === null || previewBase < t.max_amount))
  const tAmt  = tier ? Math.round(previewBase * tier.gst_pct / 100) : 0
  const fee   = mAmt + gAmt + tAmt

  if (loading) return <p className="consumer-loading-text">Loading…</p>

  return (
    <div className="consumer-tab-layout">
      <div className="consumer-tab-main">
        <Section title="Segment Rates" sub="Base % charged on every booking by segment. Agent Min/Max cap what agents can add on top." icon={<Percent size={19} strokeWidth={2.2} />} tone="blue">
          <RatesGrid rates={rates} showCaps onUpdate={updateRate} />
        </Section>

        <Section title="Airline-Specific Overrides" sub="Override the segment rate above for a specific carrier — applies globally unless the org/agent has their own override." icon={<Plane size={19} strokeWidth={2.2} />} tone="teal">
          <AirlineOverridesTable
            rows={airlineRows}
            onChange={(i, f, v) => setAirlineRows(prev => prev.map((r, j) => j !== i ? r : { ...r, [f]: f === 'pct' || f === 'flat' ? Number(v) : v }))}
            onAdd={() => setAirlineRows(prev => [...prev, { segment: 'flight_domestic', component: 'markup', airline_code: '', pct: 0, flat: 0, min_pct: null, max_pct: null }])}
            onRemove={removeAirlineRow}
          />
        </Section>

        <Section title="GST Tiers" sub="Statutory rate applied on base fare by price band. Global only — not overridable per org or agent." icon={<Receipt size={19} strokeWidth={2.2} />} tone="orange">
          <div className="consumer-gst-list">
            {gstTiers.map((t, i) => (
              <div key={i} className="consumer-gst-row">
                <span className="consumer-gst-tier-label">TIER {i + 1}</span>
                <div className="consumer-gst-fields">
                  <span className="consumer-gst-currency">₹</span>
                  <input className="form-input consumer-gst-input" type="number" min="0"
                    value={t.min_amount} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, min_amount: Number(e.target.value) }))} />
                  <span className="consumer-gst-dash">—</span>
                  <input className="form-input consumer-gst-input" type="number" min="0"
                    placeholder="∞" value={t.max_amount ?? ''} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, max_amount: e.target.value === '' ? null : Number(e.target.value) }))} />
                  <span className="consumer-gst-label-inline">GST</span>
                  <input className="form-input consumer-gst-pct-input" type="number" step="0.1" min="0"
                    value={t.gst_pct} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, gst_pct: Number(e.target.value) }))} />
                  <span className="consumer-gst-pct-symbol">%</span>
                </div>
                <button onClick={() => setGstTiers(p => p.filter((_, j) => j !== i).map((x, j) => ({ ...x, sort_order: j })))} className="consumer-btn-remove-tier">Remove</button>
              </div>
            ))}
          </div>
          <button onClick={() => {
            const last = gstTiers[gstTiers.length - 1]
            setGstTiers(p => [...p, { min_amount: last?.max_amount ?? 0, max_amount: null, gst_pct: 18, sort_order: p.length }])
          }} className="consumer-btn-add-tier">+ Add Tier</button>
        </Section>

        <SaveBar msg={msg} saving={saving} onClick={save} />
      </div>

      {/* Live preview card */}
      <div className="consumer-preview-wrap">
        <div className="consumer-preview-card">
          <div className="consumer-preview-header">
            <div className="consumer-preview-eyebrow">Live Preview</div>
            <div className="consumer-preview-subtitle">Flight Domestic · ₹5,000 base</div>
          </div>
          <div className="consumer-preview-body">
            <PreviewRow label="Base Fare" value={`₹${previewBase.toLocaleString('en-IN')}`} />
            <PreviewRow label="Convenience Fee & Taxes" value={`₹${fee.toLocaleString('en-IN')}`} />
            <div className="consumer-preview-divider" />
            <PreviewRow label="Total Payable" value={`₹${(previewBase + fee).toLocaleString('en-IN')}`} bold />
          </div>
          <div className="consumer-breakdown-box">
            <div className="consumer-breakdown-title">BREAKDOWN</div>
            {[
              { label: `Markup (${mRow?.pct ?? 0}%)`, value: mAmt },
              { label: `Gateway (${gRow?.pct ?? 0}%)`, value: gAmt },
              { label: `GST (${tier?.gst_pct ?? 0}%)`, value: tAmt },
            ].map(r => (
              <div key={r.label} className="consumer-breakdown-row">
                <span className="consumer-breakdown-label">{r.label}</span>
                <span className="consumer-breakdown-value">₹{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="consumer-preview-item-row">
      <span className={`consumer-preview-item-label ${bold ? 'consumer-preview-item-label--bold' : ''}`}>{label}</span>
      <span className={`consumer-preview-item-value ${bold ? 'consumer-preview-item-value--bold' : ''}`}>{value}</span>
    </div>
  )
}

// ── Scoped Tab (By Org / By Agent) ─────────────────────────────────────────
function ScopedTab({ feeScope, listKey, labelKey, codeKey, listUrl, emptyLabel }:
  { feeScope: 'biz_org' | 'sa_agent'; listKey: string; labelKey: string; codeKey: string; listUrl: string; emptyLabel: string }
) {
  const [items,       setItems]       = useState<any[]>([])
  const [selected,    setSelected]    = useState<any | null>(null)
  const [search,      setSearch]      = useState('')
  const [rates,       setRates]       = useState<Map<string, RateRow>>(defaultRateMap())
  const [airlineRows, setAirlineRows] = useState<RateRow[]>([])
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState('')

  useEffect(() => {
    adminFetch(listUrl).then((d: any) => setItems(d[listKey] ?? [])).catch(() => {})
  }, [listUrl, listKey])

  const loadRates = useCallback((item: any) => {
    setSelected(item); setMsg('')
    setLoading(true)
    adminFetch(`/api/admin/super/fees?scope=${feeScope}&scopeId=${item.id}`)
      .then((d: any) => {
        const all: RateRow[] = d.rates ?? []
        setRates(rowsToMap(all))
        setAirlineRows(all.filter(r => r.airline_code !== null).map(r => ({
          ...r, pct: Number(r.pct), flat: Number(r.flat), min_pct: null, max_pct: null,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [feeScope])

  function updateRate(segment: string, component: string, field: string, value: string) {
    setRates(prev => {
      const next = new Map(prev)
      const key  = rateKey(segment, component, null)
      const row  = { ...(next.get(key) ?? { segment, component, airline_code: null, pct: 0, flat: 0, min_pct: null, max_pct: null }) }
      ;(row as any)[field] = Number(value)
      next.set(key, row)
      return next
    })
  }

  async function removeAirlineRow(idx: number) {
    const row = airlineRows[idx]
    if (selected && row.airline_code) {
      await adminFetch('/api/admin/super/fees', {
        method: 'PUT',
        body: JSON.stringify({ scope: feeScope, scopeId: selected.id, rates: [], deleteAirlineRows: [{ segment: row.segment, component: row.component, airline_code: row.airline_code }] }),
      }).catch(() => {})
    }
    setAirlineRows(prev => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!selected) return
    setSaving(true); setMsg('')
    try {
      await adminFetch('/api/admin/super/fees', {
        method: 'PUT',
        body: JSON.stringify({
          scope: feeScope, scopeId: selected.id,
          rates: [...Array.from(rates.values()), ...airlineRows.filter(r => r.airline_code)],
        }),
      })
      setMsg('✓ Saved successfully')
      setTimeout(() => setMsg(''), 4000)
    } catch (e: any) { setMsg('Error: ' + (e.message ?? 'Could not save')) }
    setSaving(false)
  }

  const filtered = items.filter(it =>
    (it[labelKey] ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (it[codeKey]  ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="consumer-scoped-layout">
      {/* Sidebar */}
      <div className="consumer-sidebar">
        <div className="consumer-search-wrap">
          <input className="form-input consumer-search-input" placeholder={`Search ${emptyLabel.toLowerCase()}s…`}
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="consumer-search-icon">🔍</span>
        </div>
        <div className="consumer-count-label">
          {filtered.length} {emptyLabel}{filtered.length !== 1 ? 's' : ''}
        </div>
        <div className="consumer-list-wrap">
          {filtered.length === 0 && (
            <div className="consumer-no-results">No results</div>
          )}
          {filtered.map(it => {
            const active = selected?.id === it.id
            const initials = (it[labelKey] ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
            return (
              <button key={it.id} onClick={() => loadRates(it)} className={`consumer-list-item ${active ? 'consumer-list-item--active' : ''}`}>
                <div className={`consumer-avatar ${active ? 'consumer-avatar--active' : ''}`}>{initials}</div>
                <div className="consumer-item-text">
                  <div className={`consumer-item-name ${active ? 'consumer-item-name--active' : ''}`}>{it[labelKey]}</div>
                  <div className="consumer-item-code">{it[codeKey]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="consumer-editor">
        {!selected && (
          <div className="consumer-editor-empty">
            <div className="consumer-editor-empty-icon">₹</div>
            <div className="consumer-editor-empty-title">
              Select a {emptyLabel.toLowerCase()}
            </div>
            <div className="consumer-editor-empty-sub">
              Pick one from the list to set custom rates. Leave any value at 0 to inherit the global default.
            </div>
          </div>
        )}

        {selected && loading && (
          <div className="consumer-editor-loading">Loading rates…</div>
        )}

        {selected && !loading && (
          <>
            <div className="consumer-selected-card">
              <div className="consumer-selected-avatar">
                {(selected[labelKey] ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="consumer-selected-name">{selected[labelKey]}</div>
                <div className="consumer-selected-meta">
                  {selected[codeKey]} · Rates below override global defaults for this {emptyLabel.toLowerCase()} only
                </div>
              </div>
            </div>

            <Section title="Segment Rates" sub="Non-zero values override the global rate for this entity. Leave at 0 to fall back to global." icon={<Percent size={19} strokeWidth={2.2} />} tone="blue">
              <RatesGrid rates={rates} showCaps={false} onUpdate={updateRate} />
            </Section>

            <Section title="Airline-Specific Overrides" sub="Override for a specific carrier within this entity. Takes priority over the segment rate above." icon={<Plane size={19} strokeWidth={2.2} />} tone="teal">
              <AirlineOverridesTable
                rows={airlineRows}
                onChange={(i, f, v) => setAirlineRows(prev => prev.map((r, j) => j !== i ? r : { ...r, [f]: f === 'pct' || f === 'flat' ? Number(v) : v }))}
                onAdd={() => setAirlineRows(prev => [...prev, { segment: 'flight_domestic', component: 'markup', airline_code: '', pct: 0, flat: 0, min_pct: null, max_pct: null }])}
                onRemove={removeAirlineRow}
              />
            </Section>

            <SaveBar msg={msg} saving={saving} onClick={save} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function FeeSettingsPage() {
  const [tab, setTab] = useState<Tab>('global')

  const tabs: { key: Tab; label: string; desc: string }[] = [
    { key: 'global', label: 'Global Defaults',  desc: 'All bookings' },
    { key: 'org',    label: 'By Organisation',   desc: 'Per corporate' },
    { key: 'agent',  label: 'By Agent',          desc: 'Per partner agent' },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Fee Settings</h2>
        <span className="topbar-meta">Markup, gateway fee, and GST across all surfaces</span>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          {/* Tab bar */}
          <div className="consumer-tab-bar">
            {tabs.map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`consumer-tab-btn ${active ? 'consumer-tab-btn--active' : ''}`}>
                  <div className={`consumer-tab-btn-label ${active ? 'consumer-tab-btn-label--active' : ''}`}>{t.label}</div>
                  <div className={`consumer-tab-btn-desc ${active ? 'consumer-tab-btn-desc--active' : ''}`}>{t.desc}</div>
                </button>
              )
            })}
          </div>

          {tab === 'global' && <GlobalTab />}
          {tab === 'org' && (
            <ScopedTab feeScope="biz_org" listKey="orgs" labelKey="name" codeKey="orgCode"
              listUrl="/api/admin/super/orgs" emptyLabel="Organisation" />
          )}
          {tab === 'agent' && (
            <ScopedTab feeScope="sa_agent" listKey="agents" labelKey="agency_name" codeKey="agent_code"
              listUrl="/api/admin/super/agents" emptyLabel="Agent" />
          )}
        </div>
      </div>
    </div>
  )
}
