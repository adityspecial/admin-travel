'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { MessageCircle } from 'lucide-react'

// The number consumer + myBiz + biz-portal package enquiry flows send a
// pre-filled "Request Quote" WhatsApp message to (see lib/packagesEnquiry.ts
// on mobile, EnquiryCard.tsx on biz-portal — both call GET
// /api/packages/whatsapp-number), and the number visa enquiries alert
// automatically on submission (POST /api/visa/enquire). Shown on both the
// Packages and Visa admin pages since it's one shared setting, not two.
// Backend GET/PATCH /api/admin/super/consumer/settings already existed but
// had no admin UI anywhere pointing at it, so this column was never
// actually settable — every enquiry attempt hit a 404 "not configured" error.
export function WhatsAppNumberCard() {
  const [number, setNumber]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    adminFetch('/api/admin/super/consumer/settings')
      .then((d: { settings: { packages_whatsapp_number: string | null } }) => setNumber(d.settings?.packages_whatsapp_number ?? ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    try {
      await adminFetch('/api/admin/super/consumer/settings', {
        method: 'PATCH',
        body: JSON.stringify({ packages_whatsapp_number: number.trim() }),
      })
      setMsg('✓ Saved')
      setTimeout(() => setMsg(''), 4000)
    } catch (e: any) {
      setMsg('Error: ' + (e.message ?? 'Could not save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-card-lucrative" style={{ marginBottom: 16 }}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-title-group">
          <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
            <MessageCircle size={19} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="dashboard-card-title">WhatsApp Enquiry Number</h3>
            <p className="dashboard-card-subtitle">
              Package enquiries (consumer, myBiz mobile, biz-portal) open WhatsApp pre-filled to this number.
              Visa enquiries also alert this number automatically when submitted.
            </p>
          </div>
        </div>
      </div>
      {loading ? (
        <p style={{ padding: '4px 0', color: 'var(--text-soft)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ maxWidth: 260 }}
            placeholder="e.g. +919999999999"
            value={number}
            onChange={e => setNumber(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && (
            <span style={{ fontSize: 13, fontWeight: 700, color: msg.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>
              {msg}
            </span>
          )}
          {!number && !msg && (
            <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>
              Not set — package/visa enquiries will fail until this is saved.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
