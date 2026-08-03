'use client'
import { useEffect, useRef, useState } from 'react'
import { adminFetch, supabase } from '@/lib/api'

interface Identifier { id: string; number: string; alias: string | null; address: string | null; is_hq: boolean }
interface Address    { id: string; label: string; address: string; city: string | null }

const INP = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' as const, boxSizing: 'border-box' as const }

export default function CompanyDetailsPage() {
  const [policy,      setPolicy]      = useState<any>(null)
  const [identifiers, setIdentifiers] = useState<Identifier[]>([])
  const [addresses,   setAddresses]   = useState<Address[]>([])
  const [loading,     setLoading]     = useState(true)
  const [editing,     setEditing]     = useState(false)
  const [editForm,    setEditForm]    = useState({ name: '', orgCode: '' })
  const [addingId,    setAddingId]    = useState(false)
  const [idForm,      setIdForm]      = useState({ number: '', alias: '', address: '', is_hq: false })
  const [addingAddr,  setAddingAddr]  = useState(false)
  const [addrForm,    setAddrForm]    = useState({ label: '', address: '', city: '' })
  const [saving,      setSaving]      = useState(false)
  const [success,     setSuccess]     = useState('')
  const [error,       setError]       = useState('')
  const [logoUrl,     setLogoUrl]     = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/policy'),
      adminFetch('/api/admin/biz/identifiers'),
      adminFetch('/api/admin/biz/addresses'),
    ]).then(([p, ids, addrs]) => {
      setPolicy(p.policy)
      setEditForm({ name: p.policy?.name ?? '', orgCode: p.policy?.org_code ?? '' })
      setLogoUrl(p.policy?.logo_url ?? '')
      setIdentifiers(ids.identifiers ?? [])
      setAddresses(addrs.addresses ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addIdentifier() {
    if (!idForm.number.trim()) return
    try {
      const d = await adminFetch('/api/admin/biz/identifiers', {
        method: 'POST',
        body: JSON.stringify({ number: idForm.number, alias: idForm.alias, address: idForm.address, is_hq: idForm.is_hq }),
      })
      setIdentifiers(prev => [...prev, d.identifier])
      setIdForm({ number: '', alias: '', address: '', is_hq: false })
      setAddingId(false)
    } catch (e: any) { setError(e.message) }
  }

  async function removeIdentifier(id: string) {
    await adminFetch('/api/admin/biz/identifiers', { method: 'DELETE', body: JSON.stringify({ id }) })
    setIdentifiers(prev => prev.filter(i => i.id !== id))
  }

  async function addAddress() {
    if (!addrForm.label.trim() || !addrForm.address.trim()) return
    try {
      const d = await adminFetch('/api/admin/biz/addresses', {
        method: 'POST',
        body: JSON.stringify({ label: addrForm.label, address: addrForm.address, city: addrForm.city }),
      })
      setAddresses(prev => [...prev, d.address])
      setAddrForm({ label: '', address: '', city: '' })
      setAddingAddr(false)
    } catch (e: any) { setError(e.message) }
  }

  async function removeAddress(id: string) {
    await adminFetch('/api/admin/biz/addresses', { method: 'DELETE', body: JSON.stringify({ id }) })
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  async function savePolicy() {
    if (!editForm.orgCode.trim()) { setError('Org code is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const d = await adminFetch('/api/admin/biz/policy', {
        method: 'PATCH',
        body: JSON.stringify({ name: editForm.name, orgCode: editForm.orgCode, gstNumber: policy?.gst_number }),
      })
      setPolicy(d.policy)
      setSuccess('Company details saved.')
      setEditing(false)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2 MB.'); return }
    setLogoUploading(true); setError('')
    try {
      const ext  = file.name.split('.').pop()
      const path = `biz-logos/${policy?.org_code ?? 'org'}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(path)
      await adminFetch('/api/admin/biz/policy', { method: 'PATCH', body: JSON.stringify({ logoUrl: publicUrl }) })
      setLogoUrl(publicUrl)
      setSuccess('Logo updated.')
    } catch (e: any) { setError(e.message) }
    setLogoUploading(false)
  }

  async function removeLogo() {
    try {
      await adminFetch('/api/admin/biz/policy', { method: 'PATCH', body: JSON.stringify({ logoUrl: null }) })
      setLogoUrl('')
      setSuccess('Logo removed.')
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <>
            {/* Company Info */}
            <section id="info" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>
                    {editing ? (
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        style={{ fontSize: 20, fontWeight: 800, border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '4px 10px', outline: 'none' }} />
                    ) : (policy?.name ?? '—')}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Org Code:
                    {editing ? (
                      <input value={editForm.orgCode} onChange={e => setEditForm(f => ({ ...f, orgCode: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                        maxLength={12}
                        style={{ fontSize: 13, fontWeight: 700, border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '2px 8px', outline: 'none', width: 140 }} />
                    ) : (
                      <code style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{policy?.org_code ?? '—'}</code>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {editing ? (
                    <>
                      <button onClick={savePolicy} disabled={saving} style={{ fontSize: 13, color: '#E31E24', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(false)} style={{ fontSize: 13, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Edit Company Details
                    </button>
                  )}
                </div>
              </div>
              {error   && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</div>}
              {success && <div style={{ color: '#16A34A', fontSize: 12, marginTop: 8 }}>{success}</div>}
            </section>

            {/* Company Logo */}
            <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 4, height: 20, background: '#E31E24', borderRadius: 2 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Company Logo</div>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
                Appears on invoices and documents generated by myBiz. Recommended: PNG/SVG, max 2 MB, white or transparent background.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Preview */}
                <div style={{
                  width: 120, height: 80, borderRadius: 10, border: '2px dashed #E5E7EB',
                  background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {logoUrl
                    ? <img src={logoUrl} alt="Company logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 11, color: '#D1D5DB', fontWeight: 700 }}>NO LOGO</span>
                  }
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    style={{ padding: '8px 20px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: logoUploading ? 'default' : 'pointer', opacity: logoUploading ? 0.6 : 1 }}>
                    {logoUploading ? 'Uploading…' : logoUrl ? '↑ Replace Logo' : '↑ Upload Logo'}
                  </button>
                  {logoUrl && (
                    <button onClick={removeLogo} style={{ padding: '8px 20px', background: '#F9FAFB', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      Remove Logo
                    </button>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG or SVG · Max 2 MB</div>
                </div>
              </div>
            </section>

            {/* Company Identifiers */}
            <section id="identifiers" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 20, background: '#E31E24', borderRadius: 2 }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Company Identifier Number/ID</div>
                </div>
                <button onClick={() => setAddingId(true)} style={{ padding: '8px 18px', border: '1.5px solid #E31E24', color: '#E31E24', background: 'transparent', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  + ADD NEW
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Add your company's GSTN Number / Udyam ID / NGO ID</div>

              {addingId && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 18, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <Fld label="Identification Number *" value={idForm.number} onChange={v => setIdForm(f => ({ ...f, number: v }))} placeholder="07AABCY2296G1Z5" />
                    <Fld label="Address Alias"           value={idForm.alias}  onChange={v => setIdForm(f => ({ ...f, alias: v }))}  placeholder="HQ / GROUND FLOOR" />
                    <Fld label="Billing Address"         value={idForm.address} onChange={v => setIdForm(f => ({ ...f, address: v }))} placeholder="New Delhi, India - 110030" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                      <input type="checkbox" id="hq" checked={idForm.is_hq} onChange={e => setIdForm(f => ({ ...f, is_hq: e.target.checked }))} />
                      <label htmlFor="hq" style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mark as Headquarter</label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={addIdentifier} style={{ padding: '8px 18px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save</button>
                    <button onClick={() => setAddingId(false)} style={{ padding: '8px 18px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['IDENTIFICATION NUMBER', 'ADDRESS ALIAS', 'BILLING ADDRESS', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {identifiers.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '24px 12px', fontSize: 13, color: '#9CA3AF' }}>No identifiers added yet. Click + ADD NEW.</td></tr>
                  ) : identifiers.map(id => (
                    <tr key={id.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 800, fontSize: 14 }}>{id.number}</td>
                      <td style={{ padding: '14px 12px', fontSize: 13 }}>{id.alias ?? '—'}</td>
                      <td style={{ padding: '14px 12px', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {id.address ?? '—'}
                          {id.is_hq && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#1a1a2e', color: '#fff', letterSpacing: '0.03em' }}>HEADQUARTER</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 13, whiteSpace: 'nowrap' as const }}>
                        <span style={{ color: '#E31E24', cursor: 'pointer', fontWeight: 600 }} onClick={() => removeIdentifier(id.id)}>Delete</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Frequently Travelled Addresses */}
            <section id="addresses" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 20, background: '#E31E24', borderRadius: 2 }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Frequently Travelled Addresses</div>
                </div>
                <button onClick={() => setAddingAddr(true)} style={{ padding: '8px 18px', border: '1.5px solid #E31E24', color: '#E31E24', background: 'transparent', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  + ADD NEW
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Save common office/hotel addresses to speed up booking.</div>

              {addingAddr && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 18, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <Fld label="Label *"   value={addrForm.label}   onChange={v => setAddrForm(f => ({ ...f, label: v }))}   placeholder="Head Office" />
                    <Fld label="Address *" value={addrForm.address} onChange={v => setAddrForm(f => ({ ...f, address: v }))} placeholder="123 MG Road, Bangalore" />
                    <Fld label="City"      value={addrForm.city}    onChange={v => setAddrForm(f => ({ ...f, city: v }))}    placeholder="Bangalore" />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={addAddress} style={{ padding: '8px 18px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save</button>
                    <button onClick={() => setAddingAddr(false)} style={{ padding: '8px 18px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              )}

              {addresses.length === 0 && !addingAddr ? (
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>No addresses saved yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {addresses.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{a.label}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{a.address}{a.city ? `, ${a.city}` : ''}</div>
                      </div>
                      <span style={{ color: '#E31E24', cursor: 'pointer', fontWeight: 600, fontSize: 13 }} onClick={() => removeAddress(a.id)}>Delete</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Expenses Key Generation */}
            <section id="expenses" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 4, height: 20, background: '#E31E24', borderRadius: 2 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Company Expenses Key Generation</div>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Generate API keys to integrate expense management software with myBiz.</div>
              <button style={{ padding: '10px 22px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Generate Key
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function Fld({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}
