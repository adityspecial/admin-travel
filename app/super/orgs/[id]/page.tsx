'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/api'
import { AppInput } from '@/components/ui/AppInput'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Building2, Hash, Globe, Plane, Bed, ShieldCheck, FileText, ArrowLeft, Trash2, Save, Check, Users, Calendar, Activity, UserX, Car, Stamp, Package, Wallet, Gift } from 'lucide-react'

const ROLES = ['employee', 'manager', 'admin']

export default function EditOrgPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [org,            setOrg]            = useState<any>(null)
  const [members,        setMembers]        = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState('')
  const [deleting,       setDeleting]       = useState(false)
  const [showDeleteModal,setShowDeleteModal] = useState(false)

  const [confirmMember, setConfirmMember]   = useState<{ id: string; email: string } | null>(null)
  const [removeLoading, setRemoveLoading]   = useState(false)

  const [health, setHealth] = useState<{ bookingsThisMonth: number; walletBalance: number; pendingApprovals: number; activeMembers: number } | null>(null)
  const [escalationReason, setEscalationReason] = useState('')
  const [savingEscalation, setSavingEscalation] = useState(false)

  const [walletBalance, setWalletBalance]   = useState<number | null>(null)
  const [topupAmount,   setTopupAmount]     = useState('')
  const [topupDesc,     setTopupDesc]       = useState('')
  const [toppingUp,     setToppingUp]       = useState(false)
  const [topupError,    setTopupError]      = useState('')
  const [topupSuccess,  setTopupSuccess]    = useState(false)

  function loadWallet() {
    adminFetch('/api/admin/biz/wallet', { orgId: id })
      .then(d => setWalletBalance(d.balance ?? 0))
      .catch(() => {})
  }

  const [promoBalance, setPromoBalance] = useState<number | null>(null)
  const [promoTxns,    setPromoTxns]    = useState<any[]>([])
  const [promoAmount,  setPromoAmount]  = useState('')
  const [promoDesc,    setPromoDesc]    = useState('')
  const [promoBusy,    setPromoBusy]    = useState(false)
  const [promoError,   setPromoError]   = useState('')
  const [promoSuccess, setPromoSuccess] = useState(false)

  function loadPromoCash() {
    adminFetch(`/api/admin/super/orgs/${id}/promo-cash`)
      .then(d => { setPromoBalance(d.balance ?? 0); setPromoTxns(d.transactions ?? []) })
      .catch(() => {})
  }

  async function handlePromoCredit(e: React.FormEvent) {
    e.preventDefault()
    setPromoError(''); setPromoSuccess(false)
    const amount = Number(promoAmount)
    if (!amount || amount <= 0) { setPromoError('Enter a positive amount'); return }
    setPromoBusy(true)
    try {
      const d = await adminFetch(`/api/admin/super/orgs/${id}/promo-cash`, {
        method: 'POST',
        body: JSON.stringify({ amount, description: promoDesc || undefined }),
      })
      setPromoBalance(d.newBalance)
      setPromoTxns(prev => [{ id: crypto.randomUUID(), type: 'credit', amount, description: promoDesc, created_at: new Date().toISOString() }, ...prev])
      setPromoAmount(''); setPromoDesc('')
      setPromoSuccess(true)
      setTimeout(() => setPromoSuccess(false), 3000)
    } catch (err: any) {
      setPromoError(err.message ?? 'Credit failed')
    } finally {
      setPromoBusy(false)
    }
  }

  const [form, setForm] = useState({
    name:          '',
    org_code:      '',
    domain:        '',
    flight_cap:           '',
    international_flight_cap: '',
    hotel_cap:            '',
    international_hotel_cap: '',
    insurance_cap:        '',
    cab_cap:              '',
    visa_cap:             '',
    package_cap:          '',
    flight_cap_buffer:    '',
    hotel_cap_buffer:     '',
    insurance_cap_buffer: '',
    cab_cap_buffer:       '',
    visa_cap_buffer:      '',
    package_cap_buffer:   '',
    gst_number:    '',
    credit_limit:  '',
    promo_rate_type:     'percentage',
    promo_rate_value:    '',
    promo_validity_days: '',
    is_active:     true,
  })

  const [noticeSending, setNoticeSending] = useState(false)
  const [noticeSent,    setNoticeSent]    = useState(false)
  const [noticeError,   setNoticeError]   = useState('')

  async function sendCreditNotice() {
    setNoticeSending(true); setNoticeError(''); setNoticeSent(false)
    try {
      await adminFetch(`/api/admin/super/orgs/${id}/credit-notice`, { method: 'POST' })
      setNoticeSent(true)
      setTimeout(() => setNoticeSent(false), 3000)
    } catch (err: any) {
      setNoticeError(err.message ?? 'Failed to send notice')
    } finally {
      setNoticeSending(false)
    }
  }

  useEffect(() => {
    adminFetch(`/api/admin/super/orgs/${id}`)
      .then(d => {
        setOrg(d.org)
        setMembers(d.org.biz_members ?? [])
        setForm({
          name:          d.org.name ?? '',
          org_code:      d.org.org_code ?? '',
          domain:        d.org.domain ?? '',
          flight_cap:           String(d.org.flight_cap           ?? 10000),
          international_flight_cap: String(d.org.international_flight_cap ?? 30000),
          hotel_cap:            String(d.org.hotel_cap            ?? 5000),
          international_hotel_cap: String(d.org.international_hotel_cap ?? 15000),
          insurance_cap:        String(d.org.insurance_cap        ?? 3000),
          cab_cap:              String(d.org.cab_cap              ?? 3000),
          visa_cap:             String(d.org.visa_cap             ?? 8000),
          package_cap:          String(d.org.package_cap          ?? 25000),
          flight_cap_buffer:    String(d.org.flight_cap_buffer    ?? 0),
          hotel_cap_buffer:     String(d.org.hotel_cap_buffer     ?? 0),
          insurance_cap_buffer: String(d.org.insurance_cap_buffer ?? 0),
          cab_cap_buffer:       String(d.org.cab_cap_buffer       ?? 0),
          visa_cap_buffer:      String(d.org.visa_cap_buffer      ?? 0),
          package_cap_buffer:   String(d.org.package_cap_buffer   ?? 0),
          gst_number:    d.org.gst_number ?? '',
          credit_limit:  String(d.org.credit_limit ?? 0),
          promo_rate_type:     d.org.promo_rate_type ?? 'percentage',
          promo_rate_value:    String(d.org.promo_rate_value ?? 0),
          promo_validity_days: String(d.org.promo_validity_days ?? 90),
          is_active:     d.org.is_active  ?? true,
        })
      })
      .catch(() => setError('Organisation not found'))
      .finally(() => setLoading(false))
    loadWallet()
    loadPromoCash()
    adminFetch(`/api/admin/super/orgs/${id}/health`).then(setHealth).catch(() => {})
  }, [id]) // eslint-disable-line

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const d = await adminFetch(`/api/admin/super/orgs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name:         form.name,
          orgCode:      form.org_code,
          domain:       form.domain || null,
          flightCap:    Number(form.flight_cap),
          internationalFlightCap: Number(form.international_flight_cap),
          hotelCap:     Number(form.hotel_cap),
          internationalHotelCap: Number(form.international_hotel_cap),
          insuranceCap: Number(form.insurance_cap),
          cabCap:       Number(form.cab_cap),
          visaCap:      Number(form.visa_cap),
          packageCap:   Number(form.package_cap),
          flightCapBuffer:    Number(form.flight_cap_buffer),
          hotelCapBuffer:     Number(form.hotel_cap_buffer),
          insuranceCapBuffer: Number(form.insurance_cap_buffer),
          cabCapBuffer:       Number(form.cab_cap_buffer),
          visaCapBuffer:      Number(form.visa_cap_buffer),
          packageCapBuffer:   Number(form.package_cap_buffer),
          gstNumber:    form.gst_number || null,
          creditLimit:  Number(form.credit_limit),
          promoRateType:     form.promo_rate_type,
          promoRateValue:    Number(form.promo_rate_value),
          promoValidityDays: Number(form.promo_validity_days),
          isActive:     form.is_active,
        }),
      })
      setOrg(d.org)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDeleteOrg() {
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/super/orgs/${id}`, { method: 'DELETE' })
      router.replace('/super/orgs')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    setTopupError(''); setTopupSuccess(false)
    const amount = Number(topupAmount)
    if (!amount || amount <= 0) { setTopupError('Enter a positive amount'); return }
    setToppingUp(true)
    try {
      const d = await adminFetch('/api/admin/biz/wallet', {
        method: 'POST',
        orgId: id,
        body: JSON.stringify({ amount, description: topupDesc || undefined }),
      })
      setWalletBalance(d.newBalance)
      setTopupAmount(''); setTopupDesc('')
      setTopupSuccess(true)
      setTimeout(() => setTopupSuccess(false), 3000)
    } catch (err: any) {
      setTopupError(err.message ?? 'Top-up failed')
    } finally {
      setToppingUp(false)
    }
  }

  async function toggleEscalation(escalate: boolean) {
    setSavingEscalation(true)
    try {
      const d = await adminFetch(`/api/admin/super/orgs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ escalated: escalate, escalationReason: escalationReason || undefined }),
      })
      setOrg(d.org)
      if (!escalate) setEscalationReason('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEscalation(false)
    }
  }

  async function changeMemberRole(memberId: string, role: string) {
    await adminFetch(`/api/admin/biz/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      orgId: id,
    }).catch(() => {})
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
  }

  async function handleConfirmRemoveMember() {
    if (!confirmMember) return
    setRemoveLoading(true)
    try {
      await adminFetch(`/api/admin/biz/members/${confirmMember.id}`, { method: 'DELETE', orgId: id })
      setMembers(prev => prev.filter(m => m.id !== confirmMember.id))
      setConfirmMember(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemoveLoading(false)
    }
  }

  const memberColumns: ColumnDef<any>[] = [
    {
      key: 'work_email',
      header: 'Email',
      render: (m) => <span className="data-table-cell-bold">{m.work_email}</span>,
    },
    {
      key: 'dept',
      header: 'Department',
      render: (m) => <span className="data-table-muted-cell">{m.dept ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => (
        <select
          value={m.role}
          onChange={(e) => changeMemberRole(m.id, e.target.value)}
          className="orgs-role-select"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (m) => (
        <span className="data-table-muted-cell orgs-joined-cell">
          {new Date(m.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <button
          type="button"
          className="data-table-btn data-table-btn-danger"
          onClick={() => setConfirmMember({ id: m.id, email: m.work_email })}
        >
          <UserX size={12} />
          <span>Remove</span>
        </button>
      ),
    },
  ]

  if (loading) return <div className="admin-content"><p className="orgs-loading-text">Loading organisation details…</p></div>

  return (
    <div>
      <div className="admin-topbar">
        <div className="orgs-header-left">
          <button
            className="btn btn-ghost btn-sm orgs-btn-icon-gap"
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <h2>Edit Organisation</h2>
        </div>
        <div className="orgs-header-actions">
          <button
            className="btn btn-sm orgs-btn-delete"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            <Trash2 size={14} />
            <span>Delete Org</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="login-error orgs-mb-16">{error}</div>}
        {saved && (
          <div className="orgs-success-banner orgs-mb-16">
            <Check size={16} />
            <span>Changes saved successfully.</span>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Edit form */}
          <form className="explore-admin-section" onSubmit={handleSave}>
            <div className="dashboard-card-header orgs-card-header-mb20">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-blue">
                  <Building2 size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Organisation Details</h3>
                  <p className="dashboard-card-subtitle">Configure company settings, caps, and access policies</p>
                </div>
              </div>
            </div>

            <AppInput
              label="Company Name"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Acme Corporation"
              icon={<Building2 size={16} />}
            />

            <AppInput
              label="Org Code"
              required
              value={form.org_code}
              onChange={e => setForm(f => ({ ...f, org_code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              maxLength={12}
              placeholder="IITDH9597"
              helperText="Internal reference only — auto-generated, not used to join anymore."
              icon={<Hash size={16} />}
            />

            <AppInput
              label="Google Workspace Domain"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value.toLowerCase().trim() }))}
              placeholder="iitdh.ac.in"
              helperText="Employees signing in with a Google Workspace account on this domain join here automatically."
              icon={<Globe size={16} />}
            />

            <div className="orgs-caps-grid">
              <AppInput
                label="Flight Cap (₹ per trip)"
                type="number"
                min="0"
                value={form.flight_cap}
                onChange={e => setForm(f => ({ ...f, flight_cap: e.target.value }))}
                placeholder="10000"
                icon={<Plane size={15} />}
              />
              <AppInput
                label="International Flight Cap (₹ per trip)"
                type="number"
                min="0"
                value={form.international_flight_cap}
                onChange={e => setForm(f => ({ ...f, international_flight_cap: e.target.value }))}
                placeholder="30000"
                icon={<Globe size={15} />}
              />
              <AppInput
                label="Hotel Cap (₹ per night)"
                type="number"
                min="0"
                value={form.hotel_cap}
                onChange={e => setForm(f => ({ ...f, hotel_cap: e.target.value }))}
                placeholder="5000"
                icon={<Bed size={15} />}
              />
              <AppInput
                label="International Hotel Cap (₹ per night)"
                type="number"
                min="0"
                value={form.international_hotel_cap}
                onChange={e => setForm(f => ({ ...f, international_hotel_cap: e.target.value }))}
                placeholder="15000"
                icon={<Globe size={15} />}
              />
              <AppInput
                label="Insurance Cap (₹ per policy)"
                type="number"
                min="0"
                value={form.insurance_cap}
                onChange={e => setForm(f => ({ ...f, insurance_cap: e.target.value }))}
                placeholder="3000"
                icon={<ShieldCheck size={15} />}
              />
              <AppInput
                label="Cab Cap (₹ per trip)"
                type="number"
                min="0"
                value={form.cab_cap}
                onChange={e => setForm(f => ({ ...f, cab_cap: e.target.value }))}
                placeholder="3000"
                icon={<Car size={15} />}
              />
              <AppInput
                label="Visa Cap (₹ per application)"
                type="number"
                min="0"
                value={form.visa_cap}
                onChange={e => setForm(f => ({ ...f, visa_cap: e.target.value }))}
                placeholder="8000"
                icon={<Stamp size={15} />}
              />
              <AppInput
                label="Package Cap (₹ per booking)"
                type="number"
                min="0"
                value={form.package_cap}
                onChange={e => setForm(f => ({ ...f, package_cap: e.target.value }))}
                placeholder="25000"
                icon={<Package size={15} />}
              />
            </div>

            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '12px 0 8px' }}>
                Approval buffers — a booking exceeding its cap by up to this amount still books without approval.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <AppInput
                  label="Flight Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.flight_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, flight_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<Plane size={15} />}
                />
                <AppInput
                  label="Hotel Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.hotel_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, hotel_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<Bed size={15} />}
                />
                <AppInput
                  label="Insurance Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.insurance_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, insurance_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<ShieldCheck size={15} />}
                />
                <AppInput
                  label="Cab Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.cab_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, cab_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<Car size={15} />}
                />
                <AppInput
                  label="Visa Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.visa_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, visa_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<Stamp size={15} />}
                />
                <AppInput
                  label="Package Buffer (₹)"
                  type="number"
                  min="0"
                  value={form.package_cap_buffer}
                  onChange={e => setForm(f => ({ ...f, package_cap_buffer: e.target.value }))}
                  placeholder="0"
                  icon={<Package size={15} />}
                />
              </div>
            </div>

            <AppInput
              label="GST Number"
              value={form.gst_number}
              onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))}
              placeholder="22AAAAA0000A1Z5"
              icon={<FileText size={16} />}
            />

            <AppInput
              label="Credit Limit (₹)"
              type="number"
              min="0"
              step="1000"
              value={form.credit_limit}
              onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
              placeholder="0"
              helperText="Wallet balance may go negative down to this amount — an overdraft on top of the prepaid wallet."
              icon={<Wallet size={16} />}
            />

            <div className="orgs-caps-grid">
              <div className="app-input-group">
                <label className="app-input-label">Promo Cash Rate Type</label>
                <select
                  value={form.promo_rate_type}
                  onChange={e => setForm(f => ({ ...f, promo_rate_type: e.target.value }))}
                  className="app-input"
                >
                  <option value="percentage">% of booking value</option>
                  <option value="flat">Flat ₹ per booking</option>
                </select>
              </div>
              <AppInput
                label={form.promo_rate_type === 'flat' ? 'Promo Cash (₹ per booking)' : 'Promo Cash (% of booking)'}
                type="number"
                min="0"
                step="0.5"
                value={form.promo_rate_value}
                onChange={e => setForm(f => ({ ...f, promo_rate_value: e.target.value }))}
                helperText="0 disables promo cash for this org"
              />
              <AppInput
                label="Promo Cash Validity (days)"
                type="number"
                min="1"
                value={form.promo_validity_days}
                onChange={e => setForm(f => ({ ...f, promo_validity_days: e.target.value }))}
                helperText="Each credited amount expires this many days after being awarded"
              />
            </div>

            <div className="app-input-group orgs-checkbox-row">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="orgs-checkbox"
              />
              <label htmlFor="is_active" className="orgs-checkbox-label">
                Organisation is active
              </label>
            </div>

            <div className="orgs-form-actions">
              <button
                className="btn btn-primary orgs-btn-save"
                type="submit"
                disabled={saving}
              >
                <Save size={15} />
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
              <button
                className="btn btn-ghost orgs-btn-cancel-pad"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Escalation flag */}
          <div className="explore-admin-section" style={{ padding: 20, marginBottom: 24, background: org?.escalated ? '#FEF2F2' : undefined, border: org?.escalated ? '1.5px solid #FCA5A5' : undefined }}>
            {org?.escalated ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>⚠ Escalated — needs urgent attention</div>
                  {org.escalation_reason && <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 4 }}>{org.escalation_reason}</div>}
                  {org.escalated_at && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Flagged {new Date(org.escalated_at).toLocaleString('en-IN')}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" disabled={savingEscalation} onClick={() => toggleEscalation(false)}>
                  Clear Escalation
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={escalationReason} onChange={e => setEscalationReason(e.target.value)}
                  placeholder="Reason (optional)"
                  style={{ flex: 1, minWidth: 200, padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                />
                <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }} disabled={savingEscalation} onClick={() => toggleEscalation(true)}>
                  Flag as Escalated
                </button>
              </div>
            )}
          </div>

          {/* Org Health — single view for whoever's checking on this org */}
          {health && (
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-head"><div className="stat-num">{health.bookingsThisMonth}</div></div>
                <div className="stat-label">Bookings This Month</div>
              </div>
              <div className="stat-card">
                <div className="stat-head"><div className="stat-num">₹{health.walletBalance.toLocaleString('en-IN')}</div></div>
                <div className="stat-label">Wallet Balance</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-head"><div className="stat-num">{health.pendingApprovals}</div></div>
                <div className="stat-label">Pending Approvals</div>
              </div>
              <div className="stat-card teal">
                <div className="stat-head"><div className="stat-num">{health.activeMembers}</div></div>
                <div className="stat-label">Active Members</div>
              </div>
            </div>
          )}

          {/* Org stats */}
          <div className="explore-admin-section orgs-panel-pad24">
            <div className="dashboard-card-header orgs-card-header-mb16">
              <div className="dashboard-card-title-group">
                <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                  <Activity size={19} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="dashboard-card-title">Info</h3>
                  <p className="dashboard-card-subtitle">Overview of members and creation metadata</p>
                </div>
              </div>
            </div>

            {[
              {
                label: 'Members',
                icon: Users,
                value: `${members.length} members`,
              },
              {
                label: 'Status',
                icon: Activity,
                value: (
                  <span className={`data-table-status-pill ${org?.is_active ? 'active' : 'inactive'}`}>
                    {org?.is_active ? '● Active' : '● Inactive'}
                  </span>
                ),
              },
              {
                label: 'Created',
                icon: Calendar,
                value: org?.created_at ? new Date(org.created_at).toLocaleDateString('en-IN') : '—',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="orgs-info-row"
              >
                <div className="orgs-info-row-left">
                  <row.icon size={15} color="#64748b" />
                  <span className="orgs-info-label">{row.label}</span>
                </div>
                <span className="orgs-info-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet — super-admin manual top-up. Same POST /api/admin/biz/wallet
            the org's own admin uses (super tokens bypass the org-level
            topup_wallet gate in requireOrgAdminPermission) — this is for
            when an org's own top-up fails and support needs to credit it
            directly, not a separate wallet system. */}
        <div className="explore-admin-section" style={{ padding: 24, marginTop: 24 }}>
          <div className="dashboard-card-header" style={{ marginBottom: 16 }}>
            <div className="dashboard-card-title-group">
              <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                <Wallet size={19} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="dashboard-card-title">Wallet</h3>
                <p className="dashboard-card-subtitle">Manual top-up for when the org's own top-up fails</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Current Balance</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: walletBalance !== null && walletBalance < 0 ? '#DC2626' : '#0f172a' }}>
              {walletBalance === null ? '—' : `₹${walletBalance.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Credit Limit</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              ₹{Number(form.credit_limit || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Available to Spend</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>
              ₹{((walletBalance ?? 0) + Number(form.credit_limit || 0)).toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" disabled={noticeSending} onClick={sendCreditNotice}>
              {noticeSending ? 'Sending…' : 'Send Credit Notice Email'}
            </button>
            {noticeSent && <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 700 }}>✓ Sent</span>}
            {noticeError && <span style={{ color: '#DC2626', fontSize: 13 }}>{noticeError}</span>}
          </div>

          <form onSubmit={handleTopup} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
              Amount (₹)
              <input type="number" min="1" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, width: 140 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
              Description (optional)
              <input value={topupDesc} onChange={e => setTopupDesc(e.target.value)} placeholder="e.g. Failed self-serve top-up, credited manually"
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, width: 320 }} />
            </label>
            <button className="btn btn-primary btn-sm" type="submit" disabled={toppingUp}>
              {toppingUp ? 'Crediting…' : 'Credit Wallet'}
            </button>
            {topupSuccess && <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 700 }}>✓ Credited</span>}
          </form>
          {topupError && <div style={{ marginTop: 8, color: '#DC2626', fontSize: 13 }}>{topupError}</div>}
        </div>

        {/* Promo Cash — corporate-side mirror of the agent promo cash panel */}
        <div className="explore-admin-section" style={{ padding: 24, marginTop: 24 }}>
          <div className="dashboard-card-header" style={{ marginBottom: 16 }}>
            <div className="dashboard-card-title-group">
              <div className="dashboard-card-icon-icon dashboard-card-icon-teal">
                <Gift size={19} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="dashboard-card-title">Promo Cash</h3>
                <p className="dashboard-card-subtitle">Auto-awarded per booking (rate configured above) + manual credits</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Promo Cash Balance</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
              {promoBalance === null ? '—' : `₹${promoBalance.toLocaleString('en-IN')}`}
            </span>
          </div>

          <form onSubmit={handlePromoCredit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
              Amount (₹)
              <input type="number" min="1" value={promoAmount} onChange={e => setPromoAmount(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, width: 140 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
              Description (optional)
              <input value={promoDesc} onChange={e => setPromoDesc(e.target.value)} placeholder="e.g. Manual promo bonus"
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, width: 320 }} />
            </label>
            <button className="btn btn-primary btn-sm" type="submit" disabled={promoBusy}>
              {promoBusy ? 'Crediting…' : 'Credit Promo Cash'}
            </button>
            {promoSuccess && <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 700 }}>✓ Credited</span>}
          </form>
          {promoError && <div style={{ marginTop: 8, color: '#DC2626', fontSize: 13 }}>{promoError}</div>}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 8 }}>
              Recent Transactions
            </div>
            {promoTxns.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94A3B8' }}>No promo cash transactions yet.</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {promoTxns.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B' }}>
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      {' · '}{t.type}{t.description ? ` — ${t.description}` : ''}
                    </span>
                    <strong style={{ color: t.type === 'credit' ? '#15803D' : '#DC2626' }}>
                      {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Members DataTable */}
        <div className="orgs-mt-24">
          <DataTable
            title={`Members (${members.length})`}
            subtitle="Users linked to this organisation"
            columns={memberColumns}
            data={members}
            loading={false}
            emptyMessage="No members enrolled in this organisation yet."
            keyExtractor={(m) => m.id}
          />
        </div>
      </div>

      {/* Confirm Delete Org Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Organisation Deletion"
        tone="danger"
        confirmLabel="Yes, Delete Organisation"
        loading={deleting}
        message={
          <span>
            Are you sure you want to delete organisation <strong>{org?.name}</strong>? This action is permanent and cannot be undone.
          </span>
        }
        onConfirm={handleConfirmDeleteOrg}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Confirm Remove Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmMember)}
        title="Confirm Member Removal"
        tone="danger"
        confirmLabel="Yes, Remove Member"
        loading={removeLoading}
        message={
          confirmMember ? (
            <span>
              Are you sure you want to remove <strong>{confirmMember.email}</strong> from this organisation?
            </span>
          ) : null
        }
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setConfirmMember(null)}
      />
    </div>
  )
}
