'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch, supabase } from '@/lib/api'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import './company.css'
import {
  Building2,
  Image as ImageIcon,
  ShieldCheck,
  MapPin,
  KeyRound,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Upload,
  Copy,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Zap,
  Plane,
  BedDouble,
  Car,
  Stamp,
  Package,
  Sliders,
} from 'lucide-react'

// key/bufferKey match the PATCH body field names backend/app/api/admin/biz/policy/route.ts's
// CAP_FIELDS expects; column/bufferColumn match what GET actually returns (snake_case).
const CAP_ROWS: { key: string; bufferKey: string; column: string; bufferColumn: string; label: string; unit: string; icon: any }[] = [
  { key: 'flightCap',    bufferKey: 'flightCapBuffer',    column: 'flight_cap',    bufferColumn: 'flight_cap_buffer',    label: 'Domestic Flight Cap', unit: 'per trip', icon: Plane },
  // Shares flightCapBuffer/flight_cap_buffer with the domestic row above —
  // one approval buffer for both, only the cap amount differs. The buffer
  // grid below dedupes by bufferKey so this doesn't render a second buffer input.
  { key: 'internationalFlightCap', bufferKey: 'flightCapBuffer', column: 'international_flight_cap', bufferColumn: 'flight_cap_buffer', label: 'International Flight Cap', unit: 'per trip', icon: Plane },
  { key: 'hotelCap',     bufferKey: 'hotelCapBuffer',     column: 'hotel_cap',     bufferColumn: 'hotel_cap_buffer',     label: 'Hotel Cap',     unit: 'per night',       icon: BedDouble },
  { key: 'insuranceCap', bufferKey: 'insuranceCapBuffer', column: 'insurance_cap', bufferColumn: 'insurance_cap_buffer', label: 'Insurance Cap', unit: 'per policy',      icon: ShieldCheck },
  { key: 'cabCap',       bufferKey: 'cabCapBuffer',       column: 'cab_cap',       bufferColumn: 'cab_cap_buffer',       label: 'Cab Cap',       unit: 'per trip',        icon: Car },
  { key: 'visaCap',      bufferKey: 'visaCapBuffer',      column: 'visa_cap',      bufferColumn: 'visa_cap_buffer',      label: 'Visa Cap',      unit: 'per application', icon: Stamp },
  { key: 'packageCap',   bufferKey: 'packageCapBuffer',   column: 'package_cap',   bufferColumn: 'package_cap_buffer',   label: 'Package Cap',   unit: 'per booking',     icon: Package },
]

interface Identifier {
  id: string
  number: string
  alias: string | null
  address: string | null
  is_hq: boolean
}

interface Address {
  id: string
  label: string
  address: string
  city: string | null
}

// GSTN / Udyam / NGO registration numbers: uppercase letters, digits, hyphens only.
const ID_NUMBER_REGEX = /^[A-Z0-9-]{6,20}$/

export default function CompanyDetailsPage() {
  const [policy, setPolicy] = useState<any>(null)
  const [identifiers, setIdentifiers] = useState<Identifier[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', gstNumber: '', panNumber: '', cin: '' })
  const [capsEditing, setCapsEditing] = useState(false)
  const [capsForm, setCapsForm] = useState<Record<string, string>>({})
  const [savingCaps, setSavingCaps] = useState(false)
  const [addingId, setAddingId] = useState(false)
  const [idForm, setIdForm] = useState({ number: '', alias: '', address: '', is_hq: false })
  const [idFormError, setIdFormError] = useState('')
  const [deleteIdTarget, setDeleteIdTarget] = useState<Identifier | null>(null)
  const [deletingId, setDeletingId] = useState(false)
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({ label: '', address: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/biz/policy'),
      adminFetch('/api/admin/biz/identifiers'),
      adminFetch('/api/admin/biz/addresses'),
    ])
      .then(([p, ids, addrs]) => {
        setPolicy(p.policy)
        setEditForm({
          name: p.policy?.name ?? '', gstNumber: p.policy?.gst_number ?? '',
          panNumber: p.policy?.pan_number ?? '', cin: p.policy?.cin ?? '',
        })
        setLogoUrl(p.policy?.logo_url ?? '')
        setCapsForm(Object.fromEntries(
          CAP_ROWS.flatMap(r => [
            [r.key, String(p.policy?.[r.column] ?? 0)],
            [r.bufferKey, String(p.policy?.[r.bufferColumn] ?? 0)],
          ])
        ))
        setIdentifiers(ids.identifiers ?? [])
        setAddresses(addrs.addresses ?? [])
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  async function addIdentifier() {
    if (!idForm.number.trim()) {
      setIdFormError('Identification number is required.')
      return
    }
    if (!ID_NUMBER_REGEX.test(idForm.number)) {
      setIdFormError('Identification number must be 6-20 uppercase letters/digits (hyphens allowed).')
      return
    }
    setIdFormError('')
    try {
      const d = await adminFetch('/api/admin/biz/identifiers', {
        method: 'POST',
        body: JSON.stringify({ number: idForm.number, alias: idForm.alias, address: idForm.address, is_hq: idForm.is_hq }),
      })
      setIdentifiers((prev) => [...prev, d.identifier])
      setIdForm({ number: '', alias: '', address: '', is_hq: false })
      setAddingId(false)
      showNotification('New identifier added successfully.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function confirmRemoveIdentifier() {
    if (!deleteIdTarget) return
    setDeletingId(true)
    try {
      await adminFetch('/api/admin/biz/identifiers', { method: 'DELETE', body: JSON.stringify({ id: deleteIdTarget.id }) })
      setIdentifiers((prev) => prev.filter((i) => i.id !== deleteIdTarget.id))
      showNotification('Identifier removed.')
      setDeleteIdTarget(null)
    } catch (e: any) {
      setError(e.message)
    }
    setDeletingId(false)
  }

  async function addAddress() {
    if (!addrForm.label.trim() || !addrForm.address.trim()) return
    try {
      const d = await adminFetch('/api/admin/biz/addresses', {
        method: 'POST',
        body: JSON.stringify({ label: addrForm.label, address: addrForm.address, city: addrForm.city }),
      })
      setAddresses((prev) => [...prev, d.address])
      setAddrForm({ label: '', address: '', city: '' })
      setAddingAddr(false)
      showNotification('New address saved.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function removeAddress(id: string) {
    try {
      await adminFetch('/api/admin/biz/addresses', { method: 'DELETE', body: JSON.stringify({ id }) })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      showNotification('Address deleted.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function saveCaps() {
    setSavingCaps(true)
    setError('')
    try {
      const body = Object.fromEntries(
        CAP_ROWS.flatMap(r => [[r.key, Number(capsForm[r.key] ?? 0)], [r.bufferKey, Number(capsForm[r.bufferKey] ?? 0)]])
      )
      const d = await adminFetch('/api/admin/biz/policy', { method: 'PATCH', body: JSON.stringify(body) })
      setPolicy(d.policy)
      showNotification('Booking caps updated successfully.')
      setCapsEditing(false)
    } catch (e: any) {
      setError(e.message)
    }
    setSavingCaps(false)
  }

  async function savePolicy() {
    setSaving(true)
    setError('')
    try {
      const d = await adminFetch('/api/admin/biz/policy', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name, gstNumber: editForm.gstNumber,
          panNumber: editForm.panNumber, cin: editForm.cin,
        }),
      })
      setPolicy(d.policy)
      showNotification('Company profile updated successfully.')
      setEditing(false)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo image must be under 2 MB.')
      return
    }
    setLogoUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `biz-logos/${policy?.org_code ?? 'org'}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const {
        data: { publicUrl },
      } = supabase.storage.from('public-assets').getPublicUrl(path)
      await adminFetch('/api/admin/biz/policy', { method: 'PATCH', body: JSON.stringify({ logoUrl: publicUrl }) })
      setLogoUrl(publicUrl)
      showNotification('Company logo updated successfully.')
    } catch (e: any) {
      setError(e.message)
    }
    setLogoUploading(false)
  }

  async function removeLogo() {
    try {
      await adminFetch('/api/admin/biz/policy', { method: 'PATCH', body: JSON.stringify({ logoUrl: null }) })
      setLogoUrl('')
      showNotification('Company logo removed.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  function generateApiKey() {
    const key = `mb_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
    setApiKey(key)
    showNotification('Expense API Key generated.')
  }

  function copyApiKey() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  function showNotification(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div className="cp-page">
      <div className="company-page-container">
        {/* Breadcrumb Navigation */}
        <div className="cp-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="cp-breadcrumb-active">Company Profile & Settings</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="cp-hero-glow" />

          <div className="cp-hero-content">
            <div className="cp-hero-left">
              {/* Logo / Badge */}
              <div className="cp-hero-logo">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="cp-hero-logo-img" />
                ) : (
                  <Building2 size={30} />
                )}
              </div>

              <div>
                <h1 className="cp-hero-title">
                  {policy?.name ?? 'Company Account'} <Sparkles size={18} color="#F59E0B" />
                </h1>
                <div className="cp-hero-badges">
                  <span className="cp-hero-pill">
                    Org Code: {policy?.org_code ?? '—'}
                  </span>
                  <span className="cp-hero-pill-active">
                    <span className="cp-hero-pill-dot" /> Active Corporate Workspace
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="cp-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="cp-alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="cp-loading">
            Loading company profile...
          </div>
        ) : (
          <>
            {/* 1. Company General Details Section */}
            <section className="section-card">
              <div className="cp-section-header">
                <div className="cp-section-header-left">
                  <div className="cp-section-icon cp-section-icon--blue">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="cp-section-title">Company Information</h2>
                    <span className="cp-section-subtitle">Primary organization identity & corporate code</span>
                  </div>
                </div>

                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn-secondary">
                    <Edit3 size={14} /> Edit Details
                  </button>
                ) : (
                  <div className="cp-btn-row">
                    <button onClick={savePolicy} disabled={saving} className="btn-primary">
                      <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="cp-field-grid-a">
                <div>
                  <label className="cp-field-label">
                    Company Name
                  </label>
                  {editing ? (
                    <input
                      className="input-field"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Acme Corporation"
                    />
                  ) : (
                    <div className="cp-readonly-value">
                      {policy?.name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="cp-field-label">
                    Organization Code (Org Code)
                  </label>
                  <div className="cp-readonly-value cp-readonly-value--mono">
                    {policy?.org_code || '—'}
                  </div>
                </div>

                <div>
                  <label className="cp-field-label">GSTIN</label>
                  {editing ? (
                    <input
                      className="input-field"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. 06AADCM5146R1ZZ"
                    />
                  ) : (
                    <div className="cp-readonly-value cp-readonly-value--mono">{policy?.gst_number || '—'}</div>
                  )}
                </div>

                <div>
                  <label className="cp-field-label">PAN</label>
                  {editing ? (
                    <input
                      className="input-field"
                      value={editForm.panNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. AADCM5146R"
                    />
                  ) : (
                    <div className="cp-readonly-value cp-readonly-value--mono">{policy?.pan_number || '—'}</div>
                  )}
                </div>

                <div>
                  <label className="cp-field-label">CIN</label>
                  {editing ? (
                    <input
                      className="input-field"
                      value={editForm.cin}
                      onChange={(e) => setEditForm((f) => ({ ...f, cin: e.target.value.toUpperCase() }))}
                      placeholder="e.g. U63040HR2000PTC090846"
                    />
                  ) : (
                    <div className="cp-readonly-value cp-readonly-value--mono">{policy?.cin || '—'}</div>
                  )}
                </div>
              </div>
            </section>

            {/* 1b. Booking Caps & Approval Buffers Section */}
            <section className="section-card">
              <div className="cp-section-header">
                <div className="cp-section-header-left">
                  <div className="cp-section-icon cp-section-icon--blue">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h2 className="cp-section-title">Booking Caps &amp; Approval Buffers</h2>
                    <span className="cp-section-subtitle">Per-booking spending limits by product, and how far a booking can exceed the cap before requiring approval</span>
                  </div>
                </div>

                {!capsEditing ? (
                  <button onClick={() => setCapsEditing(true)} className="btn-secondary">
                    <Edit3 size={14} /> Edit Caps
                  </button>
                ) : (
                  <div className="cp-btn-row">
                    <button onClick={saveCaps} disabled={savingCaps} className="btn-primary">
                      <Check size={14} /> {savingCaps ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setCapsEditing(false)} className="btn-secondary">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="cp-field-grid-a">
                {CAP_ROWS.map(r => {
                  const Icon = r.icon
                  return (
                    <div key={r.key}>
                      <label className="cp-field-label">
                        <Icon size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                        {r.label} (₹ {r.unit})
                      </label>
                      {capsEditing ? (
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          value={capsForm[r.key] ?? '0'}
                          onChange={(e) => setCapsForm((f) => ({ ...f, [r.key]: e.target.value }))}
                        />
                      ) : (
                        <div className="cp-readonly-value">
                          ₹{Number(policy?.[r.column] ?? 0).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="cp-field-label" style={{ marginTop: 20, marginBottom: 10 }}>
                Approval buffers — a booking exceeding its cap by up to this amount still books without approval.
              </div>
              <div className="cp-field-grid-a">
                {CAP_ROWS.filter((r, i) => CAP_ROWS.findIndex(x => x.bufferKey === r.bufferKey) === i).map(r => {
                  const Icon = r.icon
                  return (
                    <div key={r.bufferKey}>
                      <label className="cp-field-label">
                        <Icon size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                        {r.label.replace(' Cap', '')} Buffer (₹)
                      </label>
                      {capsEditing ? (
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          value={capsForm[r.bufferKey] ?? '0'}
                          onChange={(e) => setCapsForm((f) => ({ ...f, [r.bufferKey]: e.target.value }))}
                        />
                      ) : (
                        <div className="cp-readonly-value">
                          ₹{Number(policy?.[r.bufferColumn] ?? 0).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 2. Company Brand Logo Section */}
            <section className="section-card">
              <div className="cp-section-header-simple">
                <div className="cp-section-icon cp-section-icon--red">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 className="cp-section-title">Company Brand Logo</h2>
                  <span className="cp-section-subtitle">Displayed on corporate travel invoices and approval receipts</span>
                </div>
              </div>

              <div className="cp-logo-row">
                {/* Logo Preview Box */}
                <div className="cp-logo-preview">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company logo" className="cp-logo-preview-img" />
                  ) : (
                    <div className="cp-logo-empty">
                      <ImageIcon size={24} className="cp-logo-empty-icon" />
                      <div className="cp-logo-empty-text">NO LOGO</div>
                    </div>
                  )}
                </div>

                {/* Upload Actions */}
                <div className="cp-upload-col">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} className="cp-hidden-input" />
                  <div className="cp-upload-btn-row">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="btn-primary"
                    >
                      <Upload size={14} /> {logoUploading ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                    </button>

                    {logoUrl && (
                      <button
                        onClick={removeLogo}
                        className="cp-btn-remove-logo"
                      >
                        <Trash2 size={14} /> Remove Logo
                      </button>
                    )}
                  </div>
                  <span className="cp-hint-text">Supported: PNG, JPG, or SVG · Recommended transparent background · Max 2 MB</span>
                </div>
              </div>
            </section>

            {/* 3. Company Identifiers & GSTN Section */}
            <section className="section-card">
              <div className="cp-section-header cp-section-header--wrap">
                <div className="cp-section-header-left">
                  <div className="cp-section-icon cp-section-icon--green">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="cp-section-title">Tax & Legal Identifiers (GSTN / Udyam)</h2>
                    <span className="cp-section-subtitle">Add company GSTN Number, Udyam ID or NGO Registration for tax claims</span>
                  </div>
                </div>

                <button onClick={() => { setIdFormError(''); setAddingId(true) }} className="btn-primary">
                  <Plus size={15} /> Add New ID
                </button>
              </div>

              {/* Form Modal/Collapsible Box */}
              {addingId && (
                <div className="cp-inline-box">
                  <h4 className="cp-inline-box-title">Add Tax Identifier</h4>
                  <div className="cp-field-grid-b">
                    <div>
                      <label className="cp-field-label-sm">
                        Identification Number *
                      </label>
                      <input
                        className="input-field"
                        value={idForm.number}
                        onChange={(e) =>
                          setIdForm((f) => ({ ...f, number: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20) }))
                        }
                        maxLength={20}
                        placeholder="e.g. 07AABCY2296G1Z5"
                      />
                    </div>
                    <div>
                      <label className="cp-field-label-sm">
                        Address Alias
                      </label>
                      <input
                        className="input-field"
                        value={idForm.alias}
                        onChange={(e) =>
                          setIdForm((f) => ({ ...f, alias: e.target.value.replace(/[^a-zA-Z0-9\s/,.-]/g, '').slice(0, 60) }))
                        }
                        maxLength={60}
                        placeholder="e.g. Headquarter / Ground Floor"
                      />
                    </div>
                    <div>
                      <label className="cp-field-label-sm">
                        Billing Address
                      </label>
                      <input
                        className="input-field"
                        value={idForm.address}
                        onChange={(e) =>
                          setIdForm((f) => ({ ...f, address: e.target.value.replace(/[^a-zA-Z0-9\s#&/,.-]/g, '').slice(0, 150) }))
                        }
                        maxLength={150}
                        placeholder="e.g. New Delhi, India - 110030"
                      />
                    </div>
                  </div>

                  {idFormError && (
                    <div className="cp-form-error">{idFormError}</div>
                  )}

                  <div className="cp-checkbox-row">
                    <input
                      type="checkbox"
                      id="hq-check"
                      checked={idForm.is_hq}
                      onChange={(e) => setIdForm((f) => ({ ...f, is_hq: e.target.checked }))}
                      className="cp-checkbox"
                    />
                    <label htmlFor="hq-check" className="cp-checkbox-label">
                      Mark as Primary Headquarter Address
                    </label>
                  </div>

                  <div className="cp-btn-row-gap10">
                    <button onClick={addIdentifier} className="btn-primary">
                      <Check size={14} /> Save Identifier
                    </button>
                    <button onClick={() => { setAddingId(false); setIdFormError('') }} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="cp-table-wrap">
                <table className="cp-table">
                  <thead>
                    <tr className="cp-thead-row">
                      {['IDENTIFICATION NUMBER', 'ALIAS', 'BILLING ADDRESS', 'ACTIONS'].map((h) => (
                        <th key={h} className="cp-th">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {identifiers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="cp-empty-td">
                          No identifiers added yet. Click <strong>+ Add New ID</strong> to record tax numbers.
                        </td>
                      </tr>
                    ) : (
                      identifiers.map((id) => (
                        <tr key={id.id} className="cp-tr">
                          <td className="cp-td-id-number">{id.number}</td>
                          <td className="cp-td-muted">{id.alias || '—'}</td>
                          <td className="cp-td-muted">
                            <div className="cp-address-row">
                              <span>{id.address || '—'}</span>
                              {id.is_hq && (
                                <span className="cp-hq-badge">
                                  HEADQUARTER
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="cp-td-actions">
                            <button
                              onClick={() => setDeleteIdTarget(id)}
                              className="cp-btn-delete-link"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Frequently Travelled Addresses Section */}
            <section className="section-card">
              <div className="cp-section-header cp-section-header--wrap">
                <div className="cp-section-header-left">
                  <div className="cp-section-icon cp-section-icon--orange">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="cp-section-title">Frequently Travelled Addresses</h2>
                    <span className="cp-section-subtitle">Save common office branches and hotel addresses for quick employee booking</span>
                  </div>
                </div>

                <button onClick={() => setAddingAddr(true)} className="btn-primary">
                  <Plus size={15} /> Add Address
                </button>
              </div>

              {/* Add Address Form */}
              {addingAddr && (
                <div className="cp-inline-box">
                  <h4 className="cp-inline-box-title">Save Frequent Location</h4>
                  <div className="cp-field-grid-c">
                    <div>
                      <label className="cp-field-label-sm">Label *</label>
                      <input
                        className="input-field"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="e.g. Bangalore Branch Office"
                      />
                    </div>
                    <div>
                      <label className="cp-field-label-sm">Full Address *</label>
                      <input
                        className="input-field"
                        value={addrForm.address}
                        onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="e.g. 123 MG Road, Indiranagar"
                      />
                    </div>
                    <div>
                      <label className="cp-field-label-sm">City</label>
                      <input
                        className="input-field"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="e.g. Bengaluru"
                      />
                    </div>
                  </div>
                  <div className="cp-btn-row-gap10">
                    <button onClick={addAddress} className="btn-primary">
                      <Check size={14} /> Save Location
                    </button>
                    <button onClick={() => setAddingAddr(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Address Cards Grid */}
              {addresses.length === 0 && !addingAddr ? (
                <div className="cp-empty-msg">
                  No saved addresses. Click <strong>+ Add Address</strong> to save frequent office locations.
                </div>
              ) : (
                <div className="cp-address-grid">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className="cp-address-card"
                    >
                      <div className="cp-address-card-left">
                        <div className="cp-address-icon">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <h4 className="cp-address-title">{a.label}</h4>
                          <p className="cp-address-text">
                            {a.address}
                            {a.city ? `, ${a.city}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAddress(a.id)}
                        className="cp-btn-delete-icon"
                        title="Delete Address"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Expenses Integration Key Generation Section */}
            <section className="section-card">
              <div className="cp-section-header-simple">
                <div className="cp-section-icon cp-section-icon--purple">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="cp-section-title">Company Expenses API Key Generation</h2>
                  <span className="cp-section-subtitle">Integrate third-party expense management software (SAP, Concur, Zoho) with corporate travel</span>
                </div>
              </div>

              <p className="cp-api-desc">
                Generate secure corporate API authorization keys to automatically export booking receipts, employee spend data, and invoice statements.
              </p>

              {!apiKey ? (
                <button onClick={generateApiKey} className="btn-primary">
                  <Zap size={15} /> Generate API Key
                </button>
              ) : (
                <div className="cp-key-box">
                  <label className="cp-field-label">
                    Generated Corporate Live API Secret Key:
                  </label>
                  <div className="cp-key-row">
                    <input
                      className="input-field cp-key-input"
                      readOnly
                      value={apiKey}
                    />
                    <button onClick={copyApiKey} className="btn-secondary cp-flex-shrink-0">
                      <Copy size={14} /> {keyCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <span className="cp-key-warning">
                    ⚠️ Keep this API key secure. Do not share it in publicly accessible code repositories.
                  </span>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteIdTarget)}
        title="Delete Tax Identifier"
        message={`Are you sure you want to delete "${deleteIdTarget?.number}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={deletingId}
        onConfirm={confirmRemoveIdentifier}
        onCancel={() => setDeleteIdTarget(null)}
      />
    </div>
  )
}
