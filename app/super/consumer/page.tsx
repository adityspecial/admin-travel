'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/api'

const SEGMENTS = [
  { key: 'flight_domestic',      label: 'Flight — Domestic',      color: '#2563EB', bg: '#EFF6FF' },
  { key: 'flight_international', label: 'Flight — International',  color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'hotel',                label: 'Hotel',                   color: '#059669', bg: '#ECFDF5' },
  { key: 'bus',                  label: 'Bus',                     color: '#D97706', bg: '#FFFBEB' },
  { key: 'cab_outstation',       label: 'Cab — Outstation',       color: '#0891B2', bg: '#ECFEFF' },
  { key: 'cab_airport',          label: 'Cab — Airport Transfer', color: '#0F766E', bg: '#F0FDFA' },
] as const

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {SEGMENTS.map(seg => (
        <div key={seg.key} style={{
          borderRadius: 10, overflow: 'hidden',
          border: `1.5px solid ${seg.color}30`,
        }}>
          <div style={{
            background: seg.bg, padding: '9px 16px',
            borderBottom: `1px solid ${seg.color}20`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: seg.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: seg.color }}>{seg.label}</span>
          </div>
          {COMPONENTS.map((comp, ci) => {
            const row = rates.get(rateKey(seg.key, comp.key, null)) ?? {
              segment: seg.key, component: comp.key, airline_code: null,
              pct: 0, flat: 0, min_pct: null, max_pct: null,
            }
            return (
              <div key={comp.key} style={{
                display: 'flex', alignItems: 'center', gap: 0,
                padding: '10px 16px',
                background: ci % 2 === 0 ? '#fff' : '#FAFAFA',
                borderTop: ci > 0 ? '1px solid #F3F4F6' : 'none',
              }}>
                <span style={{ width: 110, fontSize: 12, color: '#6B7280', fontWeight: 500, flexShrink: 0 }}>
                  {comp.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 20 }}>
                  <input className="form-input" type="number" step="0.1" min="0"
                    style={{ width: 90, textAlign: 'right' }}
                    value={row.pct}
                    onChange={e => onUpdate(seg.key, comp.key, 'pct', e.target.value)} />
                  <span style={{ fontSize: 12, color: '#9CA3AF', width: 12 }}>%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 20 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>₹</span>
                  <input className="form-input" type="number" step="1" min="0"
                    style={{ width: 90, textAlign: 'right' }}
                    value={row.flat}
                    onChange={e => onUpdate(seg.key, comp.key, 'flat', e.target.value)} />
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>flat</span>
                </div>
                {showCaps && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Agent cap:</span>
                    <input className="form-input" type="number" step="0.1" placeholder="min"
                      style={{ width: 70, textAlign: 'right' }}
                      value={row.min_pct ?? ''}
                      onChange={e => onUpdate(seg.key, comp.key, 'min_pct', e.target.value)} />
                    <span style={{ fontSize: 11, color: '#D1D5DB' }}>–</span>
                    <input className="form-input" type="number" step="0.1" placeholder="max"
                      style={{ width: 70, textAlign: 'right' }}
                      value={row.max_pct ?? ''}
                      onChange={e => onUpdate(seg.key, comp.key, 'max_pct', e.target.value)} />
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>%</span>
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
        <div style={{
          padding: '20px 16px', borderRadius: 8, border: '1.5px dashed #E5E7EB',
          textAlign: 'center', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>No airline overrides set</div>
          <div style={{ fontSize: 12, color: '#D1D5DB', marginTop: 4 }}>Add one to charge a different rate for a specific carrier</div>
        </div>
      ) : (
        <div style={{ marginBottom: 12, borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.2fr 100px 90px 90px 60px',
            gap: 0, background: '#F9FAFB',
            padding: '8px 14px', borderBottom: '1px solid #E5E7EB',
          }}>
            {['Segment', 'Component', 'Airline', '%', 'Flat ₹', ''].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.04em' }}>{h}</span>
            ))}
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.2fr 100px 90px 90px 60px',
              gap: 0, alignItems: 'center',
              padding: '8px 14px',
              background: i % 2 === 0 ? '#fff' : '#FAFAFA',
              borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}>
              <select className="form-input" style={{ width: '90%', fontSize: 12 }}
                value={r.segment} onChange={e => onChange(i, 'segment', e.target.value)}>
                {SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select className="form-input" style={{ width: '90%', fontSize: 12 }}
                value={r.component} onChange={e => onChange(i, 'component', e.target.value)}>
                {COMPONENTS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <input className="form-input" placeholder="e.g. 6E" style={{ width: 80, textTransform: 'uppercase', fontSize: 12 }}
                value={r.airline_code ?? ''} onChange={e => onChange(i, 'airline_code', e.target.value.toUpperCase())} />
              <input className="form-input" type="number" step="0.1" min="0" style={{ width: 72, textAlign: 'right', fontSize: 12 }}
                value={r.pct} onChange={e => onChange(i, 'pct', e.target.value)} />
              <input className="form-input" type="number" step="1" min="0" style={{ width: 72, textAlign: 'right', fontSize: 12 }}
                value={r.flat} onChange={e => onChange(i, 'flat', e.target.value)} />
              <button onClick={() => onRemove(i)} style={{
                fontSize: 11, fontWeight: 600, color: '#DC2626',
                background: '#FEF2F2',
                borderTop: '1px solid #FECACA', borderBottom: '1px solid #FECACA',
                borderLeft: '1px solid #FECACA', borderRight: '1px solid #FECACA',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd} style={{
        fontSize: 12, fontWeight: 600, color: '#2563EB',
        background: '#EFF6FF',
        borderTop: '1px solid #BFDBFE', borderBottom: '1px solid #BFDBFE',
        borderLeft: '1px solid #BFDBFE', borderRight: '1px solid #BFDBFE',
        borderRadius: 7, padding: '7px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Airline Override
      </button>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, sub, children, action }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      padding: '18px 20px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Save bar ───────────────────────────────────────────────────────────────
function SaveBar({ msg, saving, onClick }: { msg: string; saving: boolean; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
      <button onClick={onClick} disabled={saving} style={{
        padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700,
        background: saving ? '#93C5FD' : '#2563EB', color: '#fff',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        borderBottom: saving ? '2px solid #60A5FA' : '2px solid #1D4ED8',
        cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}>{saving ? 'Saving…' : 'Save Changes'}</button>
      {msg && (
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: msg.startsWith('✓') ? '#16A34A' : '#DC2626',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {msg.startsWith('✓') ? '✓' : '⚠'} {msg.replace(/^[✓⚠]\s*/, '')}
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

  if (loading) return <p style={{ color: '#6B7280', padding: 32 }}>Loading…</p>

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 580px', minWidth: 0 }}>
        <Section title="Segment Rates" sub="Base % charged on every booking by segment. Agent Min/Max cap what agents can add on top.">
          <RatesGrid rates={rates} showCaps onUpdate={updateRate} />
        </Section>

        <Section title="Airline-Specific Overrides" sub="Override the segment rate above for a specific carrier — applies globally unless the org/agent has their own override.">
          <AirlineOverridesTable
            rows={airlineRows}
            onChange={(i, f, v) => setAirlineRows(prev => prev.map((r, j) => j !== i ? r : { ...r, [f]: f === 'pct' || f === 'flat' ? Number(v) : v }))}
            onAdd={() => setAirlineRows(prev => [...prev, { segment: 'flight_domestic', component: 'markup', airline_code: '', pct: 0, flat: 0, min_pct: null, max_pct: null }])}
            onRemove={removeAirlineRow}
          />
        </Section>

        <Section title="GST Tiers" sub="Statutory rate applied on base fare by price band. Global only — not overridable per org or agent.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {gstTiers.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                background: i % 2 === 0 ? '#F9FAFB' : '#fff',
                border: '1px solid #F3F4F6',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 44, flexShrink: 0 }}>TIER {i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>₹</span>
                  <input className="form-input" type="number" min="0" style={{ width: 90 }}
                    value={t.min_amount} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, min_amount: Number(e.target.value) }))} />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                  <input className="form-input" type="number" min="0" style={{ width: 90 }}
                    placeholder="∞" value={t.max_amount ?? ''} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, max_amount: e.target.value === '' ? null : Number(e.target.value) }))} />
                  <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>GST</span>
                  <input className="form-input" type="number" step="0.1" min="0" style={{ width: 72, textAlign: 'right' }}
                    value={t.gst_pct} onChange={e => setGstTiers(p => p.map((x, j) => j !== i ? x : { ...x, gst_pct: Number(e.target.value) }))} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>%</span>
                </div>
                <button onClick={() => setGstTiers(p => p.filter((_, j) => j !== i).map((x, j) => ({ ...x, sort_order: j })))} style={{
                  fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2',
                  borderTop: '1px solid #FECACA', borderBottom: '1px solid #FECACA',
                  borderLeft: '1px solid #FECACA', borderRight: '1px solid #FECACA',
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                }}>Remove</button>
              </div>
            ))}
          </div>
          <button onClick={() => {
            const last = gstTiers[gstTiers.length - 1]
            setGstTiers(p => [...p, { min_amount: last?.max_amount ?? 0, max_amount: null, gst_pct: 18, sort_order: p.length }])
          }} style={{
            fontSize: 12, fontWeight: 600, color: '#059669', background: '#ECFDF5',
            borderTop: '1px solid #A7F3D0', borderBottom: '1px solid #A7F3D0',
            borderLeft: '1px solid #A7F3D0', borderRight: '1px solid #A7F3D0',
            borderRadius: 7, padding: '7px 16px', cursor: 'pointer',
          }}>+ Add Tier</button>
        </Section>

        <SaveBar msg={msg} saving={saving} onClick={save} />
      </div>

      {/* Live preview card */}
      <div style={{ width: 272, flexShrink: 0, position: 'sticky', top: 80 }}>
        <div style={{ background: '#0F2942', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Preview</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Flight Domestic · ₹5,000 base</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <PreviewRow label="Base Fare" value={`₹${previewBase.toLocaleString('en-IN')}`} />
            <PreviewRow label="Convenience Fee & Taxes" value={`₹${fee.toLocaleString('en-IN')}`} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
            <PreviewRow label="Total Payable" value={`₹${(previewBase + fee).toLocaleString('en-IN')}`} bold />
          </div>
          <div style={{ margin: '0 18px 18px', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 9 }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>BREAKDOWN</div>
            {[
              { label: `Markup (${mRow?.pct ?? 0}%)`, value: mAmt },
              { label: `Gateway (${gRow?.pct ?? 0}%)`, value: gAmt },
              { label: `GST (${tier?.gst_pct ?? 0}%)`, value: tAmt },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E5E7EB' }}>₹{r.value}</span>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: bold ? '#fff' : '#9CA3AF', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: bold ? '#60A5FA' : '#E5E7EB' }}>{value}</span>
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
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <div style={{ width: 256, flexShrink: 0 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input className="form-input" placeholder={`Search ${emptyLabel.toLowerCase()}s…`}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32 }} />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF' }}>🔍</span>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>
          {filtered.length} {emptyLabel}{filtered.length !== 1 ? 's' : ''}
        </div>
        <div style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', overflow: 'hidden', maxHeight: 560, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No results</div>
          )}
          {filtered.map(it => {
            const active = selected?.id === it.id
            const initials = (it[labelKey] ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
            return (
              <button key={it.id} onClick={() => loadRates(it)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left', padding: '11px 14px',
                cursor: 'pointer', background: active ? '#EFF6FF' : 'transparent',
                borderTop: 'none', borderRight: 'none',
                borderBottom: '1px solid #F3F4F6',
                borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
                transition: 'background 0.1s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: active ? '#2563EB' : '#F3F4F6',
                  color: active ? '#fff' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#1D4ED8' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it[labelKey]}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{it[codeKey]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 24px', background: '#fff', borderRadius: 12,
            border: '1.5px dashed #E5E7EB',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 14,
            }}>₹</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Select a {emptyLabel.toLowerCase()}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', maxWidth: 280 }}>
              Pick one from the list to set custom rates. Leave any value at 0 to inherit the global default.
            </div>
          </div>
        )}

        {selected && loading && (
          <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>Loading rates…</div>
        )}

        {selected && !loading && (
          <>
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              padding: '14px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>
                {(selected[labelKey] ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{selected[labelKey]}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {selected[codeKey]} · Rates below override global defaults for this {emptyLabel.toLowerCase()} only
                </div>
              </div>
            </div>

            <Section title="Segment Rates" sub="Non-zero values override the global rate for this entity. Leave at 0 to fall back to global.">
              <RatesGrid rates={rates} showCaps={false} onUpdate={updateRate} />
            </Section>

            <Section title="Airline-Specific Overrides" sub="Override for a specific carrier within this entity. Takes priority over the segment rate above.">
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
      <div className="page-header">
        <h1 className="page-title">Fee Settings</h1>
        <p className="page-sub">
          Markup, gateway fee, and GST across all surfaces. Org/agent rates override global for that entity; partner agents add their own increment on top.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, padding: '4px', background: '#F3F4F6', borderRadius: 12, width: 'fit-content' }}>
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: 'none',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#111827' : '#6B7280', whiteSpace: 'nowrap' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: active ? '#2563EB' : '#9CA3AF', marginTop: 1 }}>{t.desc}</div>
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
  )
}
