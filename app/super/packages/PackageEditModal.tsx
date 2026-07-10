'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface ItinDay { day: number; title: string; description: string; meals: string }
interface Accom   { name: string; location: string; nights: string; roomType: string; mealsIncluded: string }
interface KV      { key: string; value: string }

const splitCSV = (s: string) => s.split(',').map(l => l.trim()).filter(Boolean)

export function PackageEditModal({ pkgId, onClose, onSaved }: {
  pkgId: string; onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [tab,     setTab]     = useState<'basic'|'media'|'content'|'itinerary'|'stays'|'policies'>('basic')
  const [pkgName, setPkgName] = useState('')

  // Basic
  const [name,           setName]           = useState('')
  const [destination,    setDestination]    = useState('')
  const [nights,         setNights]         = useState('')
  const [days,           setDays]           = useState('')
  const [price,          setPrice]          = useState('')
  const [currency,       setCurrency]       = useState('INR')
  const [operator,       setOperator]       = useState('')
  const [groupSize,      setGroupSize]      = useState('')
  const [rating,         setRating]         = useState('')
  const [featured,       setFeatured]       = useState(false)
  const [active,         setActive]         = useState(true)
  const [commissionable, setCommissionable] = useState(false)

  // Media — each image is a separate editable row
  const [thumbnail, setThumbnail] = useState('')
  const [images,    setImages]    = useState<string[]>([])

  // Content — each list item is a separate editable row
  const [description,      setDescription]      = useState('')
  const [whatToExpect,     setWhatToExpect]      = useState('')
  const [highlights,       setHighlights]        = useState<string[]>([])
  const [inclusions,       setInclusions]        = useState<string[]>([])
  const [inclusionsDetail, setInclusionsDetail]  = useState('')
  const [exclusions,       setExclusions]        = useState<string[]>([])

  // Itinerary — structured day cards
  const [itinerary,      setItinerary]      = useState<ItinDay[]>([])

  // Accommodations — structured stay cards
  const [accommodations, setAccommodations] = useState<Accom[]>([])

  // Terms & Policies — each term is a separate row; policies are key-value rows
  const [terms,    setTerms]    = useState<string[]>([])
  const [policies, setPolicies] = useState<KV[]>([])

  useEffect(() => {
    adminFetch(`/api/admin/super/packages/${pkgId}`)
      .then(({ package: p }: { package: any }) => {
        setPkgName(p.name)
        setName(p.name); setDestination(p.destination)
        setNights(String(p.duration_nights)); setDays(String(p.duration_days))
        setPrice(String(p.base_price)); setCurrency(p.currency ?? 'INR')
        setOperator(p.operator ?? ''); setGroupSize(p.group_size ?? '')
        setRating(p.rating != null ? String(p.rating) : '')
        setFeatured(p.is_featured); setActive(p.is_active); setCommissionable(p.commissionable ?? false)
        setThumbnail(p.thumbnail_url ?? '')
        setImages(Array.isArray(p.images) ? p.images : [])
        setDescription(p.description ?? ''); setWhatToExpect(p.what_to_expect ?? '')
        setHighlights(Array.isArray(p.highlights) ? p.highlights : [])
        setInclusions(Array.isArray(p.inclusions) ? p.inclusions : [])
        setInclusionsDetail(p.inclusions_detail ?? '')
        setExclusions(Array.isArray(p.exclusions) ? p.exclusions : [])
        setTerms(Array.isArray(p.terms_conditions) ? p.terms_conditions : [])

        setItinerary((p.itinerary ?? []).map((d: any, i: number) => ({
          day:         d.day ?? i + 1,
          title:       d.title ?? '',
          description: d.description ?? '',
          meals:       Array.isArray(d.meals) ? d.meals.join(', ') : (d.meals ?? ''),
        })))
        setAccommodations((p.accommodations ?? []).map((a: any) => ({
          name:          a.name ?? '',
          location:      a.location ?? '',
          nights:        String(a.nights ?? 1),
          roomType:      a.roomType ?? a.room_type ?? '',
          mealsIncluded: Array.isArray(a.mealsIncluded) ? a.mealsIncluded.join(', ') : (a.mealsIncluded ?? ''),
        })))

        const pol = p.policies
        if (pol && typeof pol === 'object' && !Array.isArray(pol)) {
          setPolicies(Object.entries(pol).map(([k, v]) => ({ key: k, value: String(v) })))
        } else { setPolicies([]) }
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [pkgId])

  async function save() {
    setSaving(true); setErr('')
    const cleanImages = images.filter(Boolean)
    try {
      await adminFetch(`/api/admin/super/packages/${pkgId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name, destination,
          duration_nights: Number(nights), duration_days: Number(days),
          base_price: Number(price), currency,
          operator: operator || null, group_size: groupSize || null,
          rating: rating ? Number(rating) : null,
          is_featured: featured, is_active: active, commissionable,
          thumbnail_url: thumbnail || cleanImages[0] || null,
          images: cleanImages,
          description: description || null,
          what_to_expect: whatToExpect || null,
          highlights:        highlights.filter(Boolean),
          inclusions:        inclusions.filter(Boolean),
          inclusions_detail: inclusionsDetail || null,
          exclusions:        exclusions.filter(Boolean),
          terms_conditions:  terms.filter(Boolean),
          itinerary: itinerary.map((d, i) => ({
            day: d.day || i + 1, title: d.title, description: d.description,
            meals: splitCSV(d.meals),
          })),
          accommodations: accommodations.map(a => ({
            name: a.name, location: a.location, nights: Number(a.nights) || 1,
            roomType: a.roomType, mealsIncluded: splitCSV(a.mealsIncluded),
          })),
          policies: policies.length > 0
            ? Object.fromEntries(policies.filter(p => p.key).map(p => [p.key, p.value]))
            : null,
        }),
      })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Save failed') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'basic',     label: 'Basic Info' },
    { id: 'media',     label: 'Media' },
    { id: 'content',   label: 'Content' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'stays',     label: 'Hotels / Stays' },
    { id: 'policies',  label: 'Terms & Policies' },
  ] as const

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:700, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Edit Package</h2>
            {pkgName && <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280' }}>{pkgName}</p>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9CA3AF' }}>✕</button>
        </div>

        <div style={{ display:'flex', borderBottom:'1px solid #E5E7EB', overflowX:'auto', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding:'10px 16px', border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap',
              fontSize:13, fontWeight: tab===t.id ? 700 : 500,
              color: tab===t.id ? '#2563EB' : '#6B7280',
              borderBottom: tab===t.id ? '2px solid #2563EB' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#6B7280' }}>Loading…</div> : <>

            {tab === 'basic' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}><F label="Package Name" value={name} onChange={setName} /></div>
                <F label="Destination" value={destination} onChange={setDestination} />
                <F label="Operator / DMC" value={operator} onChange={setOperator} placeholder="e.g. Nexus DMC" />
                <F label="Duration — Nights" value={nights} onChange={setNights} type="number" />
                <F label="Duration — Days"   value={days}   onChange={setDays}   type="number" />
                <F label="Base Price (₹)" value={price} onChange={setPrice} type="number" />
                <F label="Currency" value={currency} onChange={setCurrency} />
                <F label="Group Size" value={groupSize} onChange={setGroupSize} placeholder="e.g. 2–15 pax" />
                <F label="Rating (0–5)" value={rating} onChange={setRating} type="number" placeholder="4.5" />
                <div style={{ gridColumn:'1/-1', display:'flex', gap:24, paddingTop:4 }}>
                  <Chk label="Featured"        checked={featured}       onChange={setFeatured} />
                  <Chk label="Active (visible)" checked={active}         onChange={setActive} />
                  <Chk label="Commissionable"   checked={commissionable} onChange={setCommissionable} />
                </div>
              </div>
            )}

            {tab === 'media' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <F label="Thumbnail / Cover Image URL" value={thumbnail} onChange={setThumbnail} placeholder="https://…" />
                {thumbnail && <img src={thumbnail} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:8, border:'1px solid #E5E7EB' }} />}
                <LineList label="Gallery Images" value={images} onChange={setImages} placeholder="https://…/photo.jpg" />
                <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>First gallery image is used as cover if the URL above is empty.</p>
              </div>
            )}

            {tab === 'content' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <TA label="Description" value={description} onChange={setDescription} rows={4} placeholder="Full package description shown to customers…" />
                <TA label="What to Expect" value={whatToExpect} onChange={setWhatToExpect} rows={3} placeholder="Overview of the experience…" />
                <LineList label="Highlights" value={highlights} onChange={setHighlights} placeholder="e.g. Sunset cruise in Santorini" />
                <LineList label="What's Included" value={inclusions} onChange={setInclusions} placeholder="e.g. Return airfare (economy class)" />
                <TA label="Inclusions Note (optional)" value={inclusionsDetail} onChange={setInclusionsDetail} rows={2} placeholder="Any additional note about inclusions…" />
                <LineList label="What's Not Included" value={exclusions} onChange={setExclusions} placeholder="e.g. Visa fees and travel insurance" />
              </div>
            )}

            {tab === 'itinerary' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280' }}>One card per day. Meals: e.g. <em>Breakfast, Dinner</em></p>
                {itinerary.map((d, i) => (
                  <div key={i} style={{ border:'1px solid #E5E7EB', borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#2563EB' }}>Day {d.day}</span>
                      <button onClick={() => setItinerary(it => it.filter((_,j) => j!==i))} style={removeBtn()}>✕ Remove</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'70px 1fr', gap:10 }}>
                      <F label="Day #" value={String(d.day)} type="number"
                        onChange={v => setItinerary(it => it.map((x,j) => j===i ? {...x, day:Number(v)||i+1} : x))} />
                      <F label="Title" value={d.title}
                        onChange={v => setItinerary(it => it.map((x,j) => j===i ? {...x, title:v} : x))}
                        placeholder="e.g. Arrival & city orientation" />
                    </div>
                    <TA label="Description" value={d.description} rows={3}
                      onChange={v => setItinerary(it => it.map((x,j) => j===i ? {...x, description:v} : x))}
                      placeholder="Activities and schedule for this day…" />
                    <F label="Meals (comma-separated)" value={d.meals}
                      onChange={v => setItinerary(it => it.map((x,j) => j===i ? {...x, meals:v} : x))}
                      placeholder="Breakfast, Dinner" />
                  </div>
                ))}
                <button onClick={() => setItinerary(it => [...it, { day:it.length+1, title:'', description:'', meals:'' }])}
                  style={addBtn()}>+ Add Day</button>
              </div>
            )}

            {tab === 'stays' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280' }}>Add every hotel or property included in this package.</p>
                {accommodations.map((a, i) => (
                  <div key={i} style={{ border:'1px solid #E5E7EB', borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>Stay {i+1}</span>
                      <button onClick={() => setAccommodations(ac => ac.filter((_,j) => j!==i))} style={removeBtn()}>✕ Remove</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <F label="Hotel / Property Name" value={a.name}
                        onChange={v => setAccommodations(ac => ac.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="e.g. Taj Beachfront Goa" />
                      <F label="Location / City" value={a.location}
                        onChange={v => setAccommodations(ac => ac.map((x,j) => j===i ? {...x, location:v} : x))} placeholder="e.g. North Goa" />
                      <F label="Nights" value={a.nights} type="number"
                        onChange={v => setAccommodations(ac => ac.map((x,j) => j===i ? {...x, nights:v} : x))} />
                      <F label="Room Type" value={a.roomType}
                        onChange={v => setAccommodations(ac => ac.map((x,j) => j===i ? {...x, roomType:v} : x))} placeholder="e.g. Deluxe Pool View" />
                    </div>
                    <F label="Meals Included (comma-separated)" value={a.mealsIncluded}
                      onChange={v => setAccommodations(ac => ac.map((x,j) => j===i ? {...x, mealsIncluded:v} : x))}
                      placeholder="Breakfast, Dinner" />
                  </div>
                ))}
                <button onClick={() => setAccommodations(ac => [...ac, { name:'', location:'', nights:'1', roomType:'', mealsIncluded:'' }])}
                  style={addBtn()}>+ Add Hotel / Stay</button>
              </div>
            )}

            {tab === 'policies' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <LineList label="Terms & Conditions" value={terms} onChange={setTerms}
                  placeholder="e.g. Cancellation within 24 hours: full refund" />

                <div>
                  <label style={labelStyle}>Policy Rules</label>
                  <p style={{ margin:'2px 0 8px', fontSize:11, color:'#9CA3AF' }}>
                    E.g. cancellation, visa requirements, health & safety, insurance…
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {policies.map((p, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr auto', gap:8, alignItems:'center' }}>
                        <input value={p.key} placeholder="Policy name"
                          onChange={e => setPolicies(ps => ps.map((x,j) => j===i ? {...x, key:e.target.value} : x))}
                          style={inputStyle()} />
                        <input value={p.value} placeholder="Policy details"
                          onChange={e => setPolicies(ps => ps.map((x,j) => j===i ? {...x, value:e.target.value} : x))}
                          style={inputStyle()} />
                        <button onClick={() => setPolicies(ps => ps.filter((_,j) => j!==i))} style={removeBtn()}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setPolicies(ps => [...ps, { key:'', value:'' }])} style={addBtn()}>+ Add Policy</button>
                  </div>
                </div>
              </div>
            )}
          </>}
        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          {err ? <span style={{ flex:1, fontSize:13, color:'#dc2626' }}>{err}</span> : <span style={{ flex:1 }} />}
          <button onClick={onClose} style={footerBtn('#6B7280')}>Cancel</button>
          <button onClick={save} disabled={saving||loading} style={{ ...footerBtn('#2563EB'), opacity:(saving||loading)?0.6:1, minWidth:140 }}>
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }
const inputStyle = (): React.CSSProperties => ({
  width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:8,
  fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit',
})
function addBtn(): React.CSSProperties {
  return { background:'#EFF6FF', color:'#2563EB', border:'1px solid #BFDBFE', borderRadius:8, cursor:'pointer', padding:'7px 14px', fontSize:13, fontWeight:600, fontFamily:'inherit', alignSelf:'flex-start' }
}
function removeBtn(): React.CSSProperties {
  return { background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:12, fontWeight:600, fontFamily:'inherit', padding:'2px 6px' }
}
function footerBtn(color: string): React.CSSProperties {
  return { background:color, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', padding:'9px 20px', fontSize:14, fontWeight:600, fontFamily:'inherit' }
}

// ── Field primitives ───────────────────────────────────────────────────────────
function F({ label, value, onChange, type='text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inputStyle()} />
    </div>
  )
}

function TA({ label, value, onChange, rows=4, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle(), resize:'vertical', lineHeight:1.5 }} />
    </div>
  )
}

function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width:16, height:16 }} />
      {label}
    </label>
  )
}

// LineList: each list item gets its own text input row with an ✕ remove button
function LineList({ label, value, onChange, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
        {value.map((line, i) => (
          <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input value={line} placeholder={placeholder}
              onChange={e => onChange(value.map((x, j) => j === i ? e.target.value : x))}
              style={{ ...inputStyle(), flex:1 }} />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={removeBtn()}>✕</button>
          </div>
        ))}
        <button onClick={() => onChange([...value, ''])} style={addBtn()}>+ Add</button>
      </div>
    </div>
  )
}
