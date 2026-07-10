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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:720, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Edit Visa Page</h2>
            {pageTitle && <p style={{ margin:'2px 0 0', fontSize:12, color:'#6B7280' }}>{pageTitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9CA3AF' }}>✕</button>
        </div>

        <div style={{ display:'flex', borderBottom:'1px solid #E5E7EB', overflowX:'auto', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding:'10px 15px', border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap',
              fontSize:13, fontWeight: tab===t.id ? 700 : 500,
              color: tab===t.id ? '#2563EB' : '#6B7280',
              borderBottom: tab===t.id ? '2px solid #2563EB' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#6B7280' }}>Loading…</div> : <>

            {/* ── Hero & SEO ──────────────────────────────────────────── */}
            {tab === 'hero' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <F label="Country" value={country} onChange={setCountry} placeholder="Singapore" />
                  <F label="Page Title" value={title} onChange={setTitle} placeholder="Singapore Visa" />
                  <F label="Processing Time" value={processingTime} onChange={setProcessingTime} placeholder="3 to 5 Working Days" />
                  <F label="Visa Fee Display" value={visaFee} onChange={setVisaFee} placeholder="₹2,100/-" />
                  <F label="Sort Order" value={sortOrder} onChange={setSortOrder} type="number" />
                  <F label="Sample Visa Image URL" value={sampleVisaUrl} onChange={setSampleVisaUrl} placeholder="https://…" />
                </div>
                <F label="Hero Background Image URL" value={heroImage} onChange={setHeroImage} placeholder="https://…" />
                {heroImage && <img src={heroImage} alt="" style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, border:'1px solid #E5E7EB' }} />}
                <TA label="Meta Description (SEO)" value={metaDesc} onChange={setMetaDesc} rows={2} placeholder="Apply for Singapore Visa online. Fast processing in 3–5 days…" />
                <LineList label="Keywords (SEO)" value={keywords} onChange={setKeywords} placeholder="e.g. singapore visa for indians" />
                <div style={{ display:'flex', alignItems:'center', gap:24, paddingTop:4 }}>
                  <Chk label="Active (visible on website)" checked={isActive} onChange={setIsActive} />
                </div>
                <LineList label="Footer Notes (below pricing cards)" value={footerNotes} onChange={setFooterNotes}
                  placeholder="e.g. Document pickup charges extra" />
              </div>
            )}

            {/* ── About ────────────────────────────────────────────────── */}
            {tab === 'about' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <F label="Section Heading" value={aboutTitle} onChange={setAboutTitle} placeholder="Singapore Visa for Indians" />
                <div>
                  <label style={lbl}>About Paragraphs</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {aboutParagraphs.map((p, i) => (
                      <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                        <textarea value={p} rows={3} placeholder="Paragraph text…"
                          onChange={e => setAboutParagraphs(ps => ps.map((x,j) => j===i ? e.target.value : x))}
                          style={{ ...inp(), flex:1, resize:'vertical', lineHeight:1.5 }} />
                        <button onClick={() => setAboutParagraphs(ps => ps.filter((_,j) => j!==i))} style={rmBtn()}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setAboutParagraphs(ps => [...ps, ''])} style={addBtn()}>+ Add Paragraph</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Visa Types ────────────────────────────────────────────── */}
            {tab === 'types' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280' }}>Each card shows as a pricing table on the visa page.</p>
                {visaTypes.map((t, i) => (
                  <div key={i} style={card()}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#2563EB' }}>Visa Type {i+1}</span>
                      <button onClick={() => setVisaTypes(vt => vt.filter((_,j) => j!==i))} style={rmBtn()}>✕ Remove</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <F label="Visa Type Name" value={t.name} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Singapore Tourist Visa" />
                      <F label="Processing Time" value={t.processing_time} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, processing_time:v} : x))} placeholder="3-5 working days" />
                      <F label="Stay Period" value={t.stay_period} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, stay_period:v} : x))} placeholder="Up to 30 days" />
                      <F label="Validity" value={t.validity} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, validity:v} : x))} placeholder="Discretion of the Embassy" />
                      <F label="Visa Fee" value={t.visa_fee} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, visa_fee:v} : x))} placeholder="INR 2,100/-" />
                      <F label="Service Charge" value={t.service_charge} onChange={v => setVisaTypes(vt => vt.map((x,j) => j===i ? {...x, service_charge:v} : x))} placeholder="INR 1,000/-" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setVisaTypes(vt => [...vt, { name:'', processing_time:'', stay_period:'', validity:'', visa_fee:'', service_charge:'' }])} style={addBtn()}>+ Add Visa Type</button>
              </div>
            )}

            {/* ── Docs & FAQs ────────────────────────────────────────────── */}
            {tab === 'docs' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <label style={lbl}>Document Sections (Accordion)</label>
                  <p style={{ margin:'2px 0 8px', fontSize:11, color:'#9CA3AF' }}>Each section becomes an expandable accordion on the page.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:6 }}>
                    {docSections.map((sec, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
                          <input value={sec.title} placeholder="Section heading e.g. Must Have Documents"
                            onChange={e => setDocSections(ds => ds.map((x,j) => j===i ? {...x, title:e.target.value} : x))}
                            style={{ ...inp(), flex:1, fontWeight:600 }} />
                          <button onClick={() => setDocSections(ds => ds.filter((_,j) => j!==i))} style={rmBtn()}>✕</button>
                        </div>
                        {sec.items.map((item, k) => (
                          <div key={k} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6 }}>
                            <input value={item} placeholder="Document requirement…"
                              onChange={e => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items: x.items.map((it,l) => l===k ? e.target.value : it)} : x))}
                              style={{ ...inp(), flex:1 }} />
                            <button onClick={() => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items: x.items.filter((_,l) => l!==k)} : x))} style={rmBtn()}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => setDocSections(ds => ds.map((x,j) => j===i ? {...x, items:[...x.items,'']} : x))} style={{ ...addBtn(), fontSize:12, padding:'5px 10px' }}>+ Add Document</button>
                      </div>
                    ))}
                    <button onClick={() => setDocSections(ds => [...ds, { title:'', items:[] }])} style={addBtn()}>+ Add Section</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>FAQs</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:6 }}>
                    {faqs.map((f, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>FAQ {i+1}</span>
                          <button onClick={() => setFaqs(fs => fs.filter((_,j) => j!==i))} style={rmBtn()}>✕ Remove</button>
                        </div>
                        <F label="Question" value={f.question} onChange={v => setFaqs(fs => fs.map((x,j) => j===i ? {...x, question:v} : x))} placeholder="e.g. Do Indians need a visa for Singapore?" />
                        <TA label="Answer" value={f.answer} rows={3} onChange={v => setFaqs(fs => fs.map((x,j) => j===i ? {...x, answer:v} : x))} placeholder="Answer text…" />
                      </div>
                    ))}
                    <button onClick={() => setFaqs(fs => [...fs, { question:'', answer:'' }])} style={addBtn()}>+ Add FAQ</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Process & Info ─────────────────────────────────────────── */}
            {tab === 'process' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <label style={lbl}>Application Process Steps</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#2563EB' }}>Step {s.step_number || i+1}</span>
                          <button onClick={() => setSteps(ss => ss.filter((_,j) => j!==i))} style={rmBtn()}>✕ Remove</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'60px 1fr', gap:10, marginBottom:8 }}>
                          <F label="Step #" value={String(s.step_number)} type="number"
                            onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, step_number:Number(v)||i+1} : x))} />
                          <F label="Title" value={s.title}
                            onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, title:v} : x))} placeholder="e.g. Fill the Application" />
                        </div>
                        <TA label="Description" value={s.description} rows={2}
                          onChange={v => setSteps(ss => ss.map((x,j) => j===i ? {...x, description:v} : x))} placeholder="What happens in this step…" />
                      </div>
                    ))}
                    <button onClick={() => setSteps(ss => [...ss, { step_number: ss.length+1, title:'', description:'' }])} style={addBtn()}>+ Add Step</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Why Choose Us</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {whyUs.map((w, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 2fr auto', gap:8, alignItems:'center' }}>
                        <input value={w.title} placeholder="Point title" onChange={e => setWhyUs(ws => ws.map((x,j) => j===i ? {...x, title:e.target.value} : x))} style={inp()} />
                        <input value={w.description} placeholder="Brief description" onChange={e => setWhyUs(ws => ws.map((x,j) => j===i ? {...x, description:e.target.value} : x))} style={inp()} />
                        <button onClick={() => setWhyUs(ws => ws.filter((_,j) => j!==i))} style={rmBtn()}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setWhyUs(ws => [...ws, { title:'', description:'' }])} style={addBtn()}>+ Add Point</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Page Banners / CTAs</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {banners.map((b, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Banner {i+1}</span>
                          <button onClick={() => setBanners(bs => bs.filter((_,j) => j!==i))} style={rmBtn()}>✕</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          <F label="Banner Text" value={b.text} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, text:v} : x))} placeholder="Detailed Visa Process…" />
                          <F label="Button Label" value={b.button_label} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, button_label:v} : x))} placeholder="Click Here" />
                          <F label="Link / URL" value={b.link} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, link:v} : x))} placeholder="/visa/singapore-visa#process" />
                          <F label="Background Colour" value={b.bg_color} onChange={v => setBanners(bs => bs.map((x,j) => j===i ? {...x, bg_color:v} : x))} placeholder="#8B0000" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setBanners(bs => [...bs, { text:'', link:'', bg_color:'#1a3a5c', button_label:'' }])} style={addBtn()}>+ Add Banner</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Embassy Information</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:6 }}>
                    <F label="City" value={embassy.city} onChange={v => setEmbassy(e => ({...e, city:v}))} placeholder="New Delhi" />
                    <F label="Phone" value={embassy.phone} onChange={v => setEmbassy(e => ({...e, phone:v}))} placeholder="+91-11-4149-8000" />
                    <div style={{ gridColumn:'1/-1' }}><F label="Address" value={embassy.address} onChange={v => setEmbassy(e => ({...e, address:v}))} placeholder="E-6, Chandragupta Marg, New Delhi" /></div>
                    <F label="Email" value={embassy.email} onChange={v => setEmbassy(e => ({...e, email:v}))} placeholder="contact@embassy.gov" />
                    <F label="Website" value={embassy.website} onChange={v => setEmbassy(e => ({...e, website:v}))} placeholder="https://…" />
                    <div style={{ gridColumn:'1/-1' }}><F label="Timing" value={embassy.timing} onChange={v => setEmbassy(e => ({...e, timing:v}))} placeholder="Mon–Fri, 9:00 AM – 5:00 PM" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Team & Attractions ─────────────────────────────────────── */}
            {tab === 'team' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <label style={lbl}>Visa Experts Team</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {experts.map((e, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Expert {i+1}</span>
                          <button onClick={() => setExperts(es => es.filter((_,j) => j!==i))} style={rmBtn()}>✕ Remove</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          <F label="Name" value={e.name} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Kulsum Thakur" />
                          <F label="Role / Title" value={e.role} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, role:v} : x))} placeholder="Visa Officer" />
                          <F label="Years of Experience" value={e.experience_years} type="number" onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, experience_years:v} : x))} placeholder="3" />
                          <F label="Photo URL" value={e.photo_url} onChange={v => setExperts(es => es.map((x,j) => j===i ? {...x, photo_url:v} : x))} placeholder="https://…" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setExperts(es => [...es, { name:'', role:'Visa Officer', experience_years:'', photo_url:'' }])} style={addBtn()}>+ Add Expert</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Tourist Attractions</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {attractions.map((a, i) => (
                      <div key={i} style={card()}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Attraction {i+1}</span>
                          <button onClick={() => setAttractions(as => as.filter((_,j) => j!==i))} style={rmBtn()}>✕ Remove</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          <F label="Name" value={a.name} onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, name:v} : x))} placeholder="Marina Bay Sands" />
                          <F label="Image URL" value={a.image_url} onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, image_url:v} : x))} placeholder="https://…" />
                        </div>
                        <TA label="Description" value={a.description} rows={2}
                          onChange={v => setAttractions(as => as.map((x,j) => j===i ? {...x, description:v} : x))} placeholder="Iconic resort with rooftop infinity pool…" />
                      </div>
                    ))}
                    <button onClick={() => setAttractions(as => [...as, { name:'', image_url:'', description:'' }])} style={addBtn()}>+ Add Attraction</button>
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

// ── Shared style helpers ───────────────────────────────────────────────────────
const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }
const inp = (): React.CSSProperties => ({
  width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:8,
  fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit',
})
function card(): React.CSSProperties {
  return { border:'1px solid #E5E7EB', borderRadius:10, padding:14 }
}
function addBtn(): React.CSSProperties {
  return { background:'#EFF6FF', color:'#2563EB', border:'1px solid #BFDBFE', borderRadius:8, cursor:'pointer', padding:'7px 14px', fontSize:13, fontWeight:600, fontFamily:'inherit', alignSelf:'flex-start' }
}
function rmBtn(): React.CSSProperties {
  return { background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:12, fontWeight:600, fontFamily:'inherit', padding:'2px 6px' }
}
function footerBtn(color: string): React.CSSProperties {
  return { background:color, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', padding:'9px 20px', fontSize:14, fontWeight:600, fontFamily:'inherit' }
}
function F({ label, value, onChange, type='text', placeholder }: { label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string }) {
  return <div><label style={lbl}>{label}</label><input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inp()} /></div>
}
function TA({ label, value, onChange, rows=4, placeholder }: { label:string; value:string; onChange:(v:string)=>void; rows?:number; placeholder?:string }) {
  return <div><label style={lbl}>{label}</label><textarea value={value} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...inp(), resize:'vertical', lineHeight:1.5 }} /></div>
}
function Chk({ label, checked, onChange }: { label:string; checked:boolean; onChange:(v:boolean)=>void }) {
  return <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:500 }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width:16, height:16 }} />{label}</label>
}
function LineList({ label, value, onChange, placeholder }: { label:string; value:string[]; onChange:(v:string[])=>void; placeholder?:string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
        {value.map((item, i) => (
          <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input value={item} placeholder={placeholder} onChange={e => onChange(value.map((x,j) => j===i ? e.target.value : x))} style={{ ...inp(), flex:1 }} />
            <button onClick={() => onChange(value.filter((_,j) => j!==i))} style={rmBtn()}>✕</button>
          </div>
        ))}
        <button onClick={() => onChange([...value, ''])} style={addBtn()}>+ Add</button>
      </div>
    </div>
  )
}
