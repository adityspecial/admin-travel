'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'

// ── Row types ─────────────────────────────────────────────────────────────────
interface VisaTypeRow  { name: string; processing_time: string; stay_period: string; validity: string; visa_fee: string; service_charge: string }
interface DocSection   { title: string; items: string[] }
interface FAQRow       { question: string; answer: string }
interface StepRow      { step_number: number; title: string; description: string }
interface WhyRow       { title: string; description: string }
interface AttrRow      { name: string; image_url: string; description: string }
interface ExpertRow    { name: string; role: string; experience_years: string; photo_url: string }
interface BannerRow    { text: string; link: string; bg_color: string; button_label: string }
interface EmbassyData  { address: string; phone: string; email: string; website: string; timing: string; city: string }

const EMPTY_EMBASSY: EmbassyData = { address:'', phone:'', email:'', website:'', timing:'', city:'' }

export function VisaEditModal({ visaId, onClose, onSaved }: {
  visaId: string; onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [tab,     setTab]     = useState<'hero'|'about'|'types'|'docs'|'process'|'team'>('hero')
  const [pageTitle, setPageTitle] = useState('')

  // Hero & SEO
  const [country,        setCountry]        = useState('')
  const [title,          setTitle]          = useState('')
  const [metaDesc,       setMetaDesc]       = useState('')
  const [keywords,       setKeywords]       = useState<string[]>([])
  const [heroImage,      setHeroImage]      = useState('')
  const [processingTime, setProcessingTime] = useState('')
  const [visaFee,        setVisaFee]        = useState('')
  const [sortOrder,      setSortOrder]      = useState('0')
  const [isActive,       setIsActive]       = useState(false)
  const [sampleVisaUrl,  setSampleVisaUrl]  = useState('')
  const [footerNotes,    setFooterNotes]    = useState<string[]>([])

  // About
  const [aboutTitle,      setAboutTitle]      = useState('')
  const [aboutParagraphs, setAboutParagraphs] = useState<string[]>([])

  // Visa types
  const [visaTypes, setVisaTypes] = useState<VisaTypeRow[]>([])

  // Documents & FAQs
  const [docSections, setDocSections] = useState<DocSection[]>([])
  const [faqs,        setFaqs]        = useState<FAQRow[]>([])

  // Process & Why Us
  const [steps,       setSteps]       = useState<StepRow[]>([])
  const [whyUs,       setWhyUs]       = useState<WhyRow[]>([])
  const [banners,     setBanners]     = useState<BannerRow[]>([])
  const [embassy,     setEmbassy]     = useState<EmbassyData>(EMPTY_EMBASSY)

  // Team & Attractions
  const [experts,     setExperts]     = useState<ExpertRow[]>([])
  const [attractions, setAttractions] = useState<AttrRow[]>([])

  useEffect(() => {
    adminFetch(`/api/admin/super/visa/${visaId}`)
      .then(({ visa: v }: { visa: any }) => {
        setPageTitle(v.page_title)
        setCountry(v.country); setTitle(v.page_title)
        setMetaDesc(v.meta_description ?? ''); setKeywords(v.keywords ?? [])
        setHeroImage(v.hero_image_url ?? ''); setProcessingTime(v.processing_time ?? '')
        setVisaFee(v.visa_fee_display ?? ''); setSortOrder(String(v.sort_order ?? 0))
        setIsActive(v.is_active); setSampleVisaUrl(v.sample_visa_url ?? '')
        setFooterNotes(v.footer_notes ?? [])
        setAboutTitle(v.about_title ?? ''); setAboutParagraphs(v.about_paragraphs ?? [])
        setVisaTypes((v.visa_types ?? []).map((t: any) => ({
          name: t.name ?? '', processing_time: t.processing_time ?? '',
          stay_period: t.stay_period ?? '', validity: t.validity ?? '',
          visa_fee: t.visa_fee ?? '', service_charge: t.service_charge ?? '',
        })))
        setDocSections((v.document_sections ?? []).map((s: any) => ({
          title: s.title ?? '', items: Array.isArray(s.items) ? s.items : [],
        })))
        setFaqs((v.faqs ?? []).map((f: any) => ({ question: f.question ?? '', answer: f.answer ?? '' })))
        setSteps((v.process_steps ?? []).map((s: any) => ({
          step_number: s.step_number ?? 0, title: s.title ?? '', description: s.description ?? '',
        })))
        setWhyUs((v.why_choose_us ?? []).map((w: any) => ({ title: w.title ?? '', description: w.description ?? '' })))
        setBanners((v.banners ?? []).map((b: any) => ({
          text: b.text ?? '', link: b.link ?? '', bg_color: b.bg_color ?? '#1a3a5c', button_label: b.button_label ?? '',
        })))
        const emb = v.embassy_info
        setEmbassy(emb ? { address: emb.address ?? '', phone: emb.phone ?? '', email: emb.email ?? '', website: emb.website ?? '', timing: emb.timing ?? '', city: emb.city ?? '' } : EMPTY_EMBASSY)
        setExperts((v.visa_experts ?? []).map((e: any) => ({
          name: e.name ?? '', role: e.role ?? '', experience_years: String(e.experience_years ?? ''), photo_url: e.photo_url ?? '',
        })))
        setAttractions((v.tourist_attractions ?? []).map((a: any) => ({
          name: a.name ?? '', image_url: a.image_url ?? '', description: a.description ?? '',
        })))
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [visaId])

  async function save() {
    setSaving(true); setErr('')
    try {
      await adminFetch(`/api/admin/super/visa/${visaId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          country, page_title: title,
          meta_description: metaDesc || null, keywords: keywords.filter(Boolean),
          hero_image_url: heroImage || null, processing_time: processingTime || null,
          visa_fee_display: visaFee || null, sort_order: Number(sortOrder) || 0,
          is_active: isActive, sample_visa_url: sampleVisaUrl || null,
          footer_notes: footerNotes.filter(Boolean),
          about_title: aboutTitle || null, about_paragraphs: aboutParagraphs.filter(Boolean),
          visa_types: visaTypes,
          document_sections: docSections,
          faqs: faqs.filter(f => f.question),
          process_steps: steps.map((s, i) => ({ ...s, step_number: s.step_number || i + 1 })),
          why_choose_us: whyUs.filter(w => w.title),
          banners: banners.filter(b => b.text),
          embassy_info: Object.values(embassy).some(Boolean) ? embassy : null,
          visa_experts: experts.map(e => ({ ...e, experience_years: Number(e.experience_years) || 0 })).filter(e => e.name),
          tourist_attractions: attractions.filter(a => a.name),
        }),
      })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Save failed') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'hero',    label: 'Hero & SEO' },
    { id: 'about',   label: 'About' },
    { id: 'types',   label: 'Visa Types' },
    { id: 'docs',    label: 'Docs & FAQs' },
    { id: 'process', label: 'Process & Info' },
    { id: 'team',    label: 'Team & Attractions' },
  ] as const

  return (
    <div className="visa-modal-overlay">
      <div className="visa-modal-box">

        <div className="visa-modal-header">
          <div>
            <h2 className="visa-modal-title">Edit Visa Page</h2>
            {pageTitle && <p className="visa-modal-subtitle">{pageTitle}</p>}
          </div>
          <button onClick={onClose} className="visa-modal-close-btn">✕</button>
        </div>

        <div className="visa-modal-tabs">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`visa-modal-tab ${tab === t.id ? 'visa-modal-tab--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="visa-modal-body">
          {loading ? <div className="visa-modal-loading">Loading…</div> : <>

            {/* ── Hero & SEO ──────────────────────────────────────────── */}
            {tab === 'hero' && (
              <div className="visa-stack-14">
                <div className="visa-form-grid-14">
                  <F label="Country" value={country} onChange={setCountry} placeholder="Singapore" />
                  <F label="Page Title" value={title} onChange={setTitle} placeholder="Singapore Visa" />
                  <F label="Processing Time" value={processingTime} onChange={setProcessingTime} placeholder="3 to 5 Working Days" />
                  <F label="Visa Fee Display" value={visaFee} onChange={setVisaFee} placeholder="₹2,100/-" />
                  <F label="Sort Order" value={sortOrder} onChange={setSortOrder} type="number" />
                  <F label="Sample Visa Image URL" value={sampleVisaUrl} onChange={setSampleVisaUrl} placeholder="https://…" />
                </div>
                <F label="Hero Background Image URL" value={heroImage} onChange={setHeroImage} placeholder="https://…" />
                {heroImage && <img src={heroImage} alt="" className="visa-hero-preview" />}
                <TA label="Meta Description (SEO)" value={metaDesc} onChange={setMetaDesc} rows={2} placeholder="Apply for Singapore Visa online. Fast processing in 3–5 days…" />
                <LineList label="Keywords (SEO)" value={keywords} onChange={setKeywords} placeholder="e.g. singapore visa for indians" />
                <div className="visa-checkbox-row">
                  <Chk label="Active (visible on website)" checked={isActive} onChange={setIsActive} />
                </div>
                <LineList label="Footer Notes (below pricing cards)" value={footerNotes} onChange={setFooterNotes}
                  placeholder="e.g. Document pickup charges extra" />
              </div>
            )}

            {/* ── About ────────────────────────────────────────────────── */}
            {tab === 'about' && (
              <div className="visa-stack-16">
                <F label="Section Heading" value={aboutTitle} onChange={setAboutTitle} placeholder="Singapore Visa for Indians" />
                <div>
                  <label className="visa-field-label">About Paragraphs</label>
                  <div className="visa-stack6-mt6">
                    {aboutParagraphs.map((p, i) => (
                      <div key={i} className="visa-para-row">
                        <textarea value={p} rows={3} placeholder="Paragraph text…"
                          onChange={e => setAboutParagraphs(ps => ps.map((x,j) => j===i ? e.target.value : x))}
                          className="visa-field-input visa-field-flex visa-field-textarea" />
                        <button onClick={() => setAboutParagraphs(ps => ps.filter((_,j) => j!==i))} className="visa-btn-remove">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setAboutParagraphs(ps => [...ps, ''])} className="visa-btn-add">+ Add Paragraph</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Visa Types ────────────────────────────────────────────── */}
            {tab === 'types' && (
              <div className="visa-stack-12">
                <p className="visa-hint">Each card shows as a pricing table on the visa page.</p>
                {visaTypes.map((t, i) => (
                  <div key={i} className="visa-card">
                    <div className="visa-row-mb10">
                      <span className="visa-label-blue">Visa Type {i+1}</span>
                      <button onClick={() => setVisaTypes(vt => vt.filter((_,j) => j!==i))} className="visa-btn-remove">✕ Remove</button>
                    </div>
                    <div className="visa-grid2-10">
                      <F label="Visa Type Name" value={t.name} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Singapore Tourist Visa" />
                      <F label="Processing Time" value={t.processing_time} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, processing_time:v} : x))} placeholder="3-5 working days" />
                      <F label="Stay Period" value={t.stay_period} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, stay_period:v} : x))} placeholder="Up to 30 days" />
                      <F label="Validity" value={t.validity} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, validity:v} : x))} placeholder="Discretion of the Embassy" />
                      <F label="Visa Fee" value={t.visa_fee} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, visa_fee:v} : x))} placeholder="INR 2,100/-" />
                      <F label="Service Charge" value={t.service_charge} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, service_charge:v} : x))} placeholder="INR 1,000/-" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setVisaTypes(vt => [...vt, { name:'', processing_time:'', stay_period:'', validity:'', visa_fee:'', service_charge:'' }])} className="visa-btn-add">+ Add Visa Type</button>
              </div>
            )}

            {/* ── Docs & FAQs ────────────────────────────────────────────── */}
            {tab === 'docs' && (
              <div className="visa-stack-20">
                <div>
                  <label className="visa-field-label">Document Sections (Accordion)</label>
                  <p className="visa-hint-sub">Each section becomes an expandable accordion on the page.</p>
                  <div className="visa-stack12-mt6">
                    {docSections.map((sec, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-gap8-mb10">
                          <input value={sec.title} placeholder="Section heading e.g. Must Have Documents"
                            onChange={e => setDocSections(ds => ds.map((x,j) => j===i ? {...x, title:e.target.value} : x))}
                            className="visa-field-input visa-field-flex visa-field-bold" />
                          <button onClick={() => setDocSections(ds => ds.filter((_,j) => j!==i))} className="visa-btn-remove">✕</button>
                        </div>
                        {sec.items.map((item, k) => (
                          <div key={k} className="visa-item-row-mb6">
                            <input value={item} placeholder="Document requirement…"
                              onChange={e => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items: x.items.map((it,l) => l===k ? e.target.value : it)} : x))}
                              className="visa-field-input visa-field-flex" />
                            <button onClick={() => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items: x.items.filter((_,l) => l!==k)} : x))} className="visa-btn-remove">✕</button>
                          </div>
                        ))}
                        <button onClick={() => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items:[...x.items,'']} : x))} className="visa-btn-add visa-btn-add--sm">+ Add Document</button>
                      </div>
                    ))}
                    <button onClick={() => setDocSections(ds => [...ds, { title:'', items:[] }])} className="visa-btn-add">+ Add Section</button>
                  </div>
                </div>

                <div>
                  <label className="visa-field-label">FAQs</label>
                  <div className="visa-stack10-mt6">
                    {faqs.map((f, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-mb8">
                          <span className="visa-label-dark-sm">FAQ {i+1}</span>
                          <button onClick={() => setFaqs(fs => fs.filter((_,j) => j!==i))} className="visa-btn-remove">✕ Remove</button>
                        </div>
                        <F label="Question" value={f.question} onChange={v => setFaqs(fs => fs.map((x,j) => j===i ? {...x, question:v} : x))} placeholder="e.g. Do Indians need a visa for Singapore?" />
                        <TA label="Answer" value={f.answer} rows={3} onChange={v => setFaqs(fs => fs.map((x,j) => j===i ? {...x, answer:v} : x))} placeholder="Answer text…" />
                      </div>
                    ))}
                    <button onClick={() => setFaqs(fs => [...fs, { question:'', answer:'' }])} className="visa-btn-add">+ Add FAQ</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Process & Info ─────────────────────────────────────────── */}
            {tab === 'process' && (
              <div className="visa-stack-20">
                <div>
                  <label className="visa-field-label">Application Process Steps</label>
                  <div className="visa-stack8-mt6">
                    {steps.map((s, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-mb8">
                          <span className="visa-label-blue">Step {s.step_number || i+1}</span>
                          <button onClick={() => setSteps(ss => ss.filter((_,j) => j!==i))} className="visa-btn-remove">✕ Remove</button>
                        </div>
                        <div className="visa-grid-step">
                          <F label="Step #" value={String(s.step_number)} type="number"
                            onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, step_number:Number(v)||i+1} : x))} />
                          <F label="Title" value={s.title}
                            onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, title:v} : x))} placeholder="e.g. Fill the Application" />
                        </div>
                        <TA label="Description" value={s.description} rows={2}
                          onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, description:v} : x))} placeholder="What happens in this step…" />
                      </div>
                    ))}
                    <button onClick={() => setSteps(ss => [...ss, { step_number: ss.length+1, title:'', description:'' }])} className="visa-btn-add">+ Add Step</button>
                  </div>
                </div>

                <div>
                  <label className="visa-field-label">Why Choose Us</label>
                  <div className="visa-stack8-mt6">
                    {whyUs.map((w, i) => (
                      <div key={i} className="visa-grid-why">
                        <input value={w.title} placeholder="Point title" onChange={e => setWhyUs(ws => ws.map((x,j) => j===i ? {...x, title:e.target.value} : x))} className="visa-field-input" />
                        <input value={w.description} placeholder="Brief description" onChange={e => setWhyUs(ws => ws.map((x,j) => j===i ? {...x, description:e.target.value} : x))} className="visa-field-input" />
                        <button onClick={() => setWhyUs(ws => ws.filter((_,j) => j!==i))} className="visa-btn-remove">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setWhyUs(ws => [...ws, { title:'', description:'' }])} className="visa-btn-add">+ Add Point</button>
                  </div>
                </div>

                <div>
                  <label className="visa-field-label">Page Banners / CTAs</label>
                  <div className="visa-stack8-mt6">
                    {banners.map((b, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-mb8">
                          <span className="visa-label-dark">Banner {i+1}</span>
                          <button onClick={() => setBanners(bs => bs.filter((_,j) => j!==i))} className="visa-btn-remove">✕</button>
                        </div>
                        <div className="visa-grid2-8">
                          <F label="Banner Text" value={b.text} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, text:v} : x))} placeholder="Detailed Visa Process…" />
                          <F label="Button Label" value={b.button_label} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, button_label:v} : x))} placeholder="Click Here" />
                          <F label="Link / URL" value={b.link} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, link:v} : x))} placeholder="/visa/singapore-visa#process" />
                          <F label="Background Colour" value={b.bg_color} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, bg_color:v} : x))} placeholder="#8B0000" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setBanners(bs => [...bs, { text:'', link:'', bg_color:'#1a3a5c', button_label:'' }])} className="visa-btn-add">+ Add Banner</button>
                  </div>
                </div>

                <div>
                  <label className="visa-field-label">Embassy Information</label>
                  <div className="visa-grid2-10-mt6">
                    <F label="City" value={embassy.city} onChange={v => setEmbassy(e => ({...e, city:v}))} placeholder="New Delhi" />
                    <F label="Phone" value={embassy.phone} onChange={v => setEmbassy(e => ({...e, phone:v}))} placeholder="+91-11-4149-8000" />
                    <div className="visa-span-2"><F label="Address" value={embassy.address} onChange={v => setEmbassy(e => ({...e, address:v}))} placeholder="E-6, Chandragupta Marg, New Delhi" /></div>
                    <F label="Email" value={embassy.email} onChange={v => setEmbassy(e => ({...e, email:v}))} placeholder="contact@embassy.gov" />
                    <F label="Website" value={embassy.website} onChange={v => setEmbassy(e => ({...e, website:v}))} placeholder="https://…" />
                    <div className="visa-span-2"><F label="Timing" value={embassy.timing} onChange={v => setEmbassy(e => ({...e, timing:v}))} placeholder="Mon–Fri, 9:00 AM – 5:00 PM" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Team & Attractions ─────────────────────────────────────── */}
            {tab === 'team' && (
              <div className="visa-stack-20">
                <div>
                  <label className="visa-field-label">Visa Experts Team</label>
                  <div className="visa-stack8-mt6">
                    {experts.map((e, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-mb8">
                          <span className="visa-label-dark">Expert {i+1}</span>
                          <button onClick={() => setExperts(es => es.filter((_,j) => j!==i))} className="visa-btn-remove">✕ Remove</button>
                        </div>
                        <div className="visa-grid2-8">
                          <F label="Name" value={e.name} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Kulsum Thakur" />
                          <F label="Role / Title" value={e.role} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, role:v} : x))} placeholder="Visa Officer" />
                          <F label="Years of Experience" value={e.experience_years} type="number" onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, experience_years:v} : x))} placeholder="3" />
                          <F label="Photo URL" value={e.photo_url} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, photo_url:v} : x))} placeholder="https://…" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setExperts(es => [...es, { name:'', role:'Visa Officer', experience_years:'', photo_url:'' }])} className="visa-btn-add">+ Add Expert</button>
                  </div>
                </div>

                <div>
                  <label className="visa-field-label">Tourist Attractions</label>
                  <div className="visa-stack8-mt6">
                    {attractions.map((a, i) => (
                      <div key={i} className="visa-card">
                        <div className="visa-row-mb8">
                          <span className="visa-label-dark">Attraction {i+1}</span>
                          <button onClick={() => setAttractions(as => as.filter((_,j) => j!==i))} className="visa-btn-remove">✕ Remove</button>
                        </div>
                        <div className="visa-grid2-8">
                          <F label="Name" value={a.name} onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Marina Bay Sands" />
                          <F label="Image URL" value={a.image_url} onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, image_url:v} : x))} placeholder="https://…" />
                        </div>
                        <TA label="Description" value={a.description} rows={2}
                          onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, description:v} : x))} placeholder="Iconic resort with rooftop infinity pool…" />
                      </div>
                    ))}
                    <button onClick={() => setAttractions(as => [...as, { name:'', image_url:'', description:'' }])} className="visa-btn-add">+ Add Attraction</button>
                  </div>
                </div>
              </div>
            )}
          </>}
        </div>

        <div className="visa-modal-footer">
          {err ? <span className="visa-modal-err">{err}</span> : <span className="visa-flex-1" />}
          <button onClick={onClose} className="visa-btn-footer visa-btn-footer--cancel">Cancel</button>
          <button onClick={save} disabled={saving||loading} className="visa-btn-footer visa-btn-footer--save">
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Field primitives ─────────────────────────────────────────────────────────
function F({ label, value, onChange, type='text', placeholder }: { label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string }) {
  return <div><label className="visa-field-label">{label}</label><input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="visa-field-input" /></div>
}
function TA({ label, value, onChange, rows=4, placeholder }: { label:string; value:string; onChange:(v:string)=>void; rows?:number; placeholder?:string }) {
  return <div><label className="visa-field-label">{label}</label><textarea value={value} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="visa-field-input visa-field-textarea" /></div>
}
function Chk({ label, checked, onChange }: { label:string; checked:boolean; onChange:(v:boolean)=>void }) {
  return <label className="visa-chk-label"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="visa-chk-input" />{label}</label>
}
function LineList({ label, value, onChange, placeholder }: { label:string; value:string[]; onChange:(v:string[])=>void; placeholder?:string }) {
  return (
    <div>
      <label className="visa-field-label">{label}</label>
      <div className="visa-linelist-wrap">
        {value.map((item, i) => (
          <div key={i} className="visa-linelist-row">
            <input value={item} placeholder={placeholder} onChange={e => onChange(value.map((x,j) => j===i ? e.target.value : x))} className="visa-field-input visa-field-flex" />
            <button onClick={() => onChange(value.filter((_,j) => j!==i))} className="visa-btn-remove">✕</button>
          </div>
        ))}
        <button onClick={() => onChange([...value, ''])} className="visa-btn-add">+ Add</button>
      </div>
    </div>
  )
}
