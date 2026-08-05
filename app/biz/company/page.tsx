'use client'

import React, { useEffect, useRef, useState } from 'react'
import { adminFetch, supabase } from '@/lib/api'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
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
} from 'lucide-react'

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
  const [editForm, setEditForm] = useState({ name: '', orgCode: '' })
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
        setEditForm({ name: p.policy?.name ?? '', orgCode: p.policy?.org_code ?? '' })
        setLogoUrl(p.policy?.logo_url ?? '')
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

  async function savePolicy() {
    if (!editForm.orgCode.trim()) {
      setError('Org code is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const d = await adminFetch('/api/admin/biz/policy', {
        method: 'PATCH',
        body: JSON.stringify({ name: editForm.name, orgCode: editForm.orgCode, gstNumber: policy?.gst_number }),
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
    <div style={{ minHeight: 'calc(100vh - 54px)', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .company-page-container {
          margin: 0 auto;
          padding: 32px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .hero-banner-box {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
          border-radius: 24px;
          padding: 32px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px -10px rgba(49, 46, 129, 0.25);
        }
        .section-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E5E7EB;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .input-field:focus {
          border-color: var(--accent, #E31E24);
          box-shadow: 0 0 0 3px rgba(227, 30, 36, 0.1);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: linear-gradient(135deg, var(--accent, #E31E24) 0%, #B91C1C 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px var(--accent, rgba(227, 30, 36, 0.25));
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(227, 30, 36, 0.35);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: #F3F4F6;
          color: '#374151';
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        @media (max-width: 1024px) {
          .company-page-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .company-page-container {
            padding: 16px 12px 28px;
          }
          .hero-banner-box {
            padding: 20px;
            border-radius: 18px;
          }
          .section-card {
            padding: 18px 16px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="company-page-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Company Profile & Settings</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(227, 30, 36, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Logo / Badge */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                  overflow: 'hidden',
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                ) : (
                  <Building2 size={30} />
                )}
              </div>

              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {policy?.name ?? 'Company Account'} <Sparkles size={18} color="#F59E0B" />
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.15)', padding: '2px 10px', borderRadius: '99px', fontWeight: 700 }}>
                    Org Code: {policy?.org_code ?? '—'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 10px', borderRadius: '99px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> Active Corporate Workspace
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#047857',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF', fontSize: '14px', fontWeight: 600 }}>
            Loading company profile...
          </div>
        ) : (
          <>
            {/* 1. Company General Details Section */}
            <section className="section-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Company Information</h2>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Primary organization identity & corporate code</span>
                  </div>
                </div>

                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn-secondary">
                    <Edit3 size={14} /> Edit Details
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={savePolicy} disabled={saving} className="btn-primary">
                      <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '6px' }}>
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
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', padding: '10px 14px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6' }}>
                      {policy?.name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '6px' }}>
                    Organization Code (Org Code)
                  </label>
                  {editing ? (
                    <input
                      className="input-field"
                      value={editForm.orgCode}
                      onChange={(e) => setEditForm((f) => ({ ...f, orgCode: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                      maxLength={12}
                      placeholder="e.g. ACME2026"
                    />
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', padding: '10px 14px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6', fontFamily: 'monospace' }}>
                      {policy?.org_code || '—'}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Company Brand Logo Section */}
            <section className="section-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#FEF2F2',
                    color: '#E31E24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Company Brand Logo</h2>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Displayed on corporate travel invoices and approval receipts</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '20px' }}>
                {/* Logo Preview Box */}
                <div
                  style={{
                    width: '140px',
                    height: '90px',
                    borderRadius: '14px',
                    border: '2px dashed #D1D5DB',
                    background: '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      <ImageIcon size={24} style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '10.5px', fontWeight: 700 }}>NO LOGO</div>
                    </div>
                  )}
                </div>

                {/* Upload Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                        style={{
                          padding: '10px 18px',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Trash2 size={14} /> Remove Logo
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>Supported: PNG, JPG, or SVG · Recommended transparent background · Max 2 MB</span>
                </div>
              </div>
            </section>

            {/* 3. Company Identifiers & GSTN Section */}
            <section className="section-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#ECFDF5',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Tax & Legal Identifiers (GSTN / Udyam)</h2>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Add company GSTN Number, Udyam ID or NGO Registration for tax claims</span>
                  </div>
                </div>

                <button onClick={() => { setIdFormError(''); setAddingId(true) }} className="btn-primary">
                  <Plus size={15} /> Add New ID
                </button>
              </div>

              {/* Form Modal/Collapsible Box */}
              {addingId && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>Add Tax Identifier</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
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
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
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
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
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
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', marginBottom: '14px' }}>{idFormError}</div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="hq-check"
                      checked={idForm.is_hq}
                      onChange={(e) => setIdForm((f) => ({ ...f, is_hq: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#E31E24', cursor: 'pointer' }}
                    />
                    <label htmlFor="hq-check" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      Mark as Primary Headquarter Address
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      {['IDENTIFICATION NUMBER', 'ALIAS', 'BILLING ADDRESS', 'ACTIONS'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {identifiers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px 14px', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                          No identifiers added yet. Click <strong>+ Add New ID</strong> to record tax numbers.
                        </td>
                      </tr>
                    ) : (
                      identifiers.map((id) => (
                        <tr key={id.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '14px', fontWeight: 800, fontSize: '13.5px', color: '#111827' }}>{id.number}</td>
                          <td style={{ padding: '14px', fontSize: '13px', color: '#4B5563' }}>{id.alias || '—'}</td>
                          <td style={{ padding: '14px', fontSize: '13px', color: '#4B5563' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{id.address || '—'}</span>
                              {id.is_hq && (
                                <span style={{ fontSize: '10px', fontWeight: 800, background: '#312E81', color: '#ffffff', padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.03em' }}>
                                  HEADQUARTER
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <button
                              onClick={() => setDeleteIdTarget(id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#DC2626',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#FFF7ED',
                      color: '#F97316',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Frequently Travelled Addresses</h2>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Save common office branches and hotel addresses for quick employee booking</span>
                  </div>
                </div>

                <button onClick={() => setAddingAddr(true)} className="btn-primary">
                  <Plus size={15} /> Add Address
                </button>
              </div>

              {/* Add Address Form */}
              {addingAddr && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>Save Frequent Location</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Label *</label>
                      <input
                        className="input-field"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="e.g. Bangalore Branch Office"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Full Address *</label>
                      <input
                        className="input-field"
                        value={addrForm.address}
                        onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="e.g. 123 MG Road, Indiranagar"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>City</label>
                      <input
                        className="input-field"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="e.g. Bengaluru"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
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
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                  No saved addresses. Click <strong>+ Add Address</strong> to save frequent office locations.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '16px',
                        background: '#F9FAFB',
                        borderRadius: '14px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin size={16} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{a.label}</h4>
                          <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                            {a.address}
                            {a.city ? `, ${a.city}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAddress(a.id)}
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#F5F3FF',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Company Expenses API Key Generation</h2>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Integrate third-party expense management software (SAP, Concur, Zoho) with corporate travel</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#4B5563', marginTop: '12px', marginBottom: '20px', lineHeight: 1.5 }}>
                Generate secure corporate API authorization keys to automatically export booking receipts, employee spend data, and invoice statements.
              </p>

              {!apiKey ? (
                <button onClick={generateApiKey} className="btn-primary">
                  <Zap size={15} /> Generate API Key
                </button>
              ) : (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '16px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '6px' }}>
                    Generated Corporate Live API Secret Key:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      className="input-field"
                      readOnly
                      value={apiKey}
                      style={{ fontFamily: 'monospace', fontWeight: 800, background: '#ffffff', color: '#111827' }}
                    />
                    <button onClick={copyApiKey} className="btn-secondary" style={{ flexShrink: 0 }}>
                      <Copy size={14} /> {keyCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#E31E24', fontWeight: 600, display: 'block', marginTop: '8px' }}>
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
