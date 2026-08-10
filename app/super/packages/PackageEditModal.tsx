'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

interface ItinDay { day: number; title: string; description: string; meals: string }
interface Accom   { name: string; location: string; nights: string; roomType: string; mealsIncluded: string }
interface KV      { key: string; value: string }

const splitCSV = (s: string) => s.split(',').map(l => l.trim()).filter(Boolean)

export function PackageEditModal({ pkgId, onClose, onSaved }: {
  pkgId: string | null; onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(!!pkgId)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [tab,     setTab]     = useState<'basic'|'media'|'content'|'itinerary'|'stays'|'policies'>('basic')
  const [pkgName, setPkgName] = useState('')

  // Basic
  const [name,           setName]           = useState('')
  const [destination,    setDestination]    = useState('')
  const [destinationCode,setDestinationCode]= useState('')
  const [originCities,   setOriginCities]   = useState<string[]>([])
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
    if (!pkgId) { setLoading(false); return }
    adminFetch(`/api/admin/super/packages/${pkgId}`)
      .then(({ package: p }: { package: any }) => {
        setPkgName(p.name)
        setName(p.name); setDestination(p.destination)
        setDestinationCode(p.destination_code ?? '')
        setOriginCities(Array.isArray(p.origin_cities) ? p.origin_cities : [])
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
    const body = {
      name, destination,
      destination_code: destinationCode || null,
      origin_cities: originCities.filter(Boolean),
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
    }
    try {
      if (pkgId) {
        await adminFetch(`/api/admin/super/packages/${pkgId}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await adminFetch('/api/admin/super/packages', { method: 'POST', body: JSON.stringify(body) })
      }
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
    <div className="pkg-modal-overlay">
      <div className="pkg-modal-box">

        <div className="pkg-modal-header">
          <div>
            <h2 className="pkg-modal-title">{pkgId ? 'Edit Package' : 'Add Package'}</h2>
            {pkgName && <p className="pkg-modal-subtitle">{pkgName}</p>}
          </div>
          <button onClick={onClose} className="pkg-modal-close-btn">✕</button>
        </div>

        <div className="pkg-modal-tabs">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`pkg-modal-tab ${tab === t.id ? 'pkg-modal-tab--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="pkg-modal-body">
          {loading ? <div className="pkg-modal-loading">Loading…</div> : <>

            {tab === 'basic' && (
              <div className="pkg-form-grid">
                <div className="pkg-span-2"><F label="Package Name" value={name} onChange={setName} /></div>
                <F label="Destination" value={destination} onChange={setDestination} />
                <F label="Destination Code" value={destinationCode} onChange={setDestinationCode} placeholder="e.g. GOI" />
                <F label="Operator / DMC" value={operator} onChange={setOperator} placeholder="e.g. Nexus DMC" />
                <F label="Duration — Nights" value={nights} onChange={setNights} type="number" />
                <F label="Duration — Days"   value={days}   onChange={setDays}   type="number" />
                <F label="Base Price (₹)" value={price} onChange={setPrice} type="number" />
                <F label="Currency" value={currency} onChange={setCurrency} />
                <F label="Group Size" value={groupSize} onChange={setGroupSize} placeholder="e.g. 2–15 pax" />
                <F label="Rating (0–5)" value={rating} onChange={setRating} type="number" placeholder="4.5" />
                <div className="pkg-checkbox-row">
                  <Chk label="Featured"        checked={featured}       onChange={setFeatured} />
                  <Chk label="Active (visible)" checked={active}         onChange={setActive} />
                  <Chk label="Commissionable"   checked={commissionable} onChange={setCommissionable} />
                </div>
                <div className="pkg-span-2">
                  <LineList label="Origin Cities (departure cities this package is sold from)" value={originCities} onChange={setOriginCities} placeholder="e.g. Delhi" />
                </div>
              </div>
            )}

            {tab === 'media' && (
              <div className="pkg-stack-20">
                <F label="Thumbnail / Cover Image URL" value={thumbnail} onChange={setThumbnail} placeholder="https://…" />
                {thumbnail && <img src={thumbnail} alt="" className="pkg-thumb-preview" />}
                <LineList label="Gallery Images" value={images} onChange={setImages} placeholder="https://…/photo.jpg" />
                <p className="pkg-hint-text">First gallery image is used as cover if the URL above is empty.</p>
              </div>
            )}

            {tab === 'content' && (
              <div className="pkg-stack-20">
                <TA label="Description" value={description} onChange={setDescription} rows={4} placeholder="Full package description shown to customers…" />
                <TA label="What to Expect" value={whatToExpect} onChange={setWhatToExpect} rows={3} placeholder="Overview of the experience…" />
                <LineList label="Highlights" value={highlights} onChange={setHighlights} placeholder="e.g. Sunset cruise in Santorini" />
                <LineList label="What's Included" value={inclusions} onChange={setInclusions} placeholder="e.g. Return airfare (economy class)" />
                <TA label="Inclusions Note (optional)" value={inclusionsDetail} onChange={setInclusionsDetail} rows={2} placeholder="Any additional note about inclusions…" />
                <LineList label="What's Not Included" value={exclusions} onChange={setExclusions} placeholder="e.g. Visa fees and travel insurance" />
              </div>
            )}

            {tab === 'itinerary' && (
              <div className="pkg-stack-12">
                <p className="pkg-tab-hint">One card per day. Meals: e.g. <em>Breakfast, Dinner</em></p>
                {itinerary.map((d, i) => (
                  <div key={i} className="pkg-card">
                    <div className="pkg-card-row">
                      <span className="pkg-card-label-blue">Day {d.day}</span>
                      <button onClick={() => setItinerary(it => it.filter((_,j) => j!==i))} className="pkg-btn-remove">✕ Remove</button>
                    </div>
                    <div className="pkg-day-grid">
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
                  className="pkg-btn-add">+ Add Day</button>
              </div>
            )}

            {tab === 'stays' && (
              <div className="pkg-stack-12">
                <p className="pkg-tab-hint">Add every hotel or property included in this package.</p>
                {accommodations.map((a, i) => (
                  <div key={i} className="pkg-card">
                    <div className="pkg-card-row">
                      <span className="pkg-card-label-dark">Stay {i+1}</span>
                      <button onClick={() => setAccommodations(ac => ac.filter((_,j) => j!==i))} className="pkg-btn-remove">✕ Remove</button>
                    </div>
                    <div className="pkg-stay-grid">
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
                  className="pkg-btn-add">+ Add Hotel / Stay</button>
              </div>
            )}

            {tab === 'policies' && (
              <div className="pkg-stack-20">
                <LineList label="Terms & Conditions" value={terms} onChange={setTerms}
                  placeholder="e.g. Cancellation within 24 hours: full refund" />

                <div>
                  <label className="pkg-field-label">Policy Rules</label>
                  <p className="pkg-policy-hint">
                    E.g. cancellation, visa requirements, health & safety, insurance…
                  </p>
                  <div className="pkg-stack-8">
                    {policies.map((p, i) => (
                      <div key={i} className="pkg-policy-row">
                        <input value={p.key} placeholder="Policy name"
                          onChange={e => setPolicies(ps => ps.map((x,j) => j===i ? {...x, key:e.target.value} : x))}
                          className="pkg-field-input" />
                        <input value={p.value} placeholder="Policy details"
                          onChange={e => setPolicies(ps => ps.map((x,j) => j===i ? {...x, value:e.target.value} : x))}
                          className="pkg-field-input" />
                        <button onClick={() => setPolicies(ps => ps.filter((_,j) => j!==i))} className="pkg-btn-remove">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setPolicies(ps => [...ps, { key:'', value:'' }])} className="pkg-btn-add">+ Add Policy</button>
                  </div>
                </div>
              </div>
            )}
          </>}
        </div>

        <div className="pkg-modal-footer">
          {err ? <span className="pkg-modal-err">{err}</span> : <span className="pkg-flex-1" />}
          <button onClick={onClose} className="pkg-btn-footer pkg-btn-footer--cancel">Cancel</button>
          <button onClick={save} disabled={saving||loading} className="pkg-btn-footer pkg-btn-footer--save">
            {saving ? 'Saving…' : pkgId ? 'Save All Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Field primitives ───────────────────────────────────────────────────────────
function F({ label, value, onChange, type='text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="pkg-field-label">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="pkg-field-input" />
    </div>
  )
}

function TA({ label, value, onChange, rows=4, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="pkg-field-label">{label}</label>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="pkg-field-input pkg-field-textarea" />
    </div>
  )
}

function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="pkg-chk-label">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="pkg-chk-input" />
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
      <label className="pkg-field-label">{label}</label>
      <div className="pkg-linelist-wrap">
        {value.map((line, i) => (
          <div key={i} className="pkg-linelist-row">
            <input value={line} placeholder={placeholder}
              onChange={e => onChange(value.map((x, j) => j === i ? e.target.value : x))}
              className="pkg-field-input pkg-field-flex" />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="pkg-btn-remove">✕</button>
          </div>
        ))}
        <button onClick={() => onChange([...value, ''])} className="pkg-btn-add">+ Add</button>
      </div>
    </div>
  )
}
