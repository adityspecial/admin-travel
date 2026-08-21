'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { AppPopup } from '@/components/ui/AppPopup'
import { AppInput } from '@/components/ui/AppInput'
import { Wrench, CheckCircle2, PauseCircle, Plus, Pencil, Trash2 } from 'lucide-react'

type Scope = 'global' | 'biz_org' | 'sa_agent'

interface Rule {
  id: string
  airline_code: string
  scope: Scope
  scope_id: string | null
  is_active: boolean
  notes: string | null
  created_at: string
}

interface Org   { id: string; name: string }
interface Agent { id: string; agency_name: string }

const EMPTY_FORM = { airlineCode: '', scope: 'global' as Scope, scopeId: '', notes: '' }

export default function ManualFulfillmentPage() {
  const [rules,   setRules]   = useState<Rule[]>([])
  const [orgs,    setOrgs]    = useState<Org[]>([])
  const [agents,  setAgents]  = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string | null>(null)

  const [showForm, setShowForm]     = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formSaving, setFormSaving] = useState(false)
  const [formError,  setFormError]  = useState('')

  function load() {
    setLoading(true)
    adminFetch('/api/admin/super/manual-fulfillment-rules')
      .then(d => setRules(d.rules ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    adminFetch('/api/admin/super/orgs').then(d => setOrgs(d.orgs ?? [])).catch(() => {})
    adminFetch('/api/admin/super/agents').then(d => setAgents(d.agents ?? [])).catch(() => {})
  }, [])

  function scopeLabel(r: Rule) {
    if (r.scope === 'global') return 'All (global)'
    if (r.scope === 'biz_org') return orgs.find(o => o.id === r.scope_id)?.name ?? 'Unknown org'
    return agents.find(a => a.id === r.scope_id)?.agency_name ?? 'Unknown agent'
  }

  async function toggleActive(r: Rule) {
    setSaving(r.id)
    await adminFetch('/api/admin/super/manual-fulfillment-rules', {
      method: 'PATCH', body: JSON.stringify({ id: r.id, isActive: !r.is_active }),
    })
    setRules(prev => prev.map(x => x.id === r.id ? { ...x, is_active: !r.is_active } : x))
    setSaving(null)
  }

  async function handleDelete(r: Rule) {
    if (!window.confirm(`Stop diverting ${r.airline_code} (${scopeLabel(r)}) to manual fulfillment?`)) return
    await adminFetch('/api/admin/super/manual-fulfillment-rules', { method: 'DELETE', body: JSON.stringify({ id: r.id }) })
    setRules(prev => prev.filter(x => x.id !== r.id))
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormSaving(true); setFormError('')
    try {
      const res = await adminFetch('/api/admin/super/manual-fulfillment-rules', {
        method: 'POST',
        body: JSON.stringify({
          airlineCode: form.airlineCode.trim().toUpperCase(),
          scope: form.scope,
          scopeId: form.scope === 'global' ? undefined : form.scopeId,
          notes: form.notes.trim() || undefined,
        }),
      })
      setRules(prev => [...prev, res.rule])
      setShowForm(false)
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to save rule')
    }
    setFormSaving(false)
  }

  const activeCount = rules.filter(r => r.is_active).length
  const pausedCount = rules.length - activeCount

  const columns: ColumnDef<Rule>[] = [
    { key: 'airline_code', header: 'Airline', render: (r) => <span className="data-table-code-pill">{r.airline_code}</span> },
    {
      key: 'scope', header: 'Applies To',
      render: (r) => <span className={`badge ${r.scope === 'global' ? 'badge-blue' : 'badge-gray'}`}>{scopeLabel(r)}</span>,
    },
    { key: 'notes', header: 'Notes', render: (r) => r.notes ? <span className="data-table-muted-cell">{r.notes}</span> : '—' },
    {
      key: 'is_active', header: 'Status',
      render: (r) => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>{r.is_active ? 'Active' : 'Paused'}</span>,
    },
    {
      key: 'actions', header: 'Action',
      render: (r) => (
        <div className="data-table-actions">
          <button
            type="button" className="data-table-btn data-table-btn-edit"
            disabled={saving === r.id}
            onClick={() => toggleActive(r)}
          >
            {saving === r.id ? '…' : r.is_active ? 'Pause' : 'Activate'}
          </button>
          <button type="button" className="data-table-btn data-table-btn-danger" onClick={() => handleDelete(r)}>
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <h2>Manual Fulfillment</h2>
        <span className="topbar-meta">{activeCount} active rules</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> Add Rule
        </button>
      </div>

      <div className="admin-content">
        <div className="page-stack">
          <div className="stat-grid">
            <StatCard Icon={Wrench} label="Total Rules" value={rules.length} sub="Airline + scope flags" badge="All" />
            <StatCard Icon={CheckCircle2} label="Active" value={activeCount} sub="Currently diverting bookings" badge="Live" iconBg="#f0fdf4" iconColor="#0d9488" badgeBg="#ccfbf1" badgeColor="#0f766e" />
            <StatCard Icon={PauseCircle} label="Paused" value={pausedCount} sub="Not diverting bookings" badge="Inactive" iconBg="#f8fafc" iconColor="#64748b" badgeBg="#f1f5f9" badgeColor="#475569" />
          </div>

          <DataTable
            title="Manual Fulfillment Rules"
            subtitle="When a booking's airline matches an active rule here, it's diverted to staff for manual booking through a negotiated fare instead of going through the live provider API."
            columns={columns}
            data={rules}
            loading={loading}
            emptyMessage="No manual-fulfillment rules set."
            keyExtractor={(r) => r.id}
          />
        </div>
      </div>

      <AppPopup
        isOpen={showForm}
        title="Add Manual Fulfillment Rule"
        icon={<Wrench size={22} strokeWidth={2.2} />}
        iconTone="orange"
        maxWidth={440}
        onClose={() => setShowForm(false)}
      >
        {formError && <div className="login-error">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="agents-edit-grid">
            <AppInput
              label="Airline Code"
              placeholder="e.g. 6E"
              required
              value={form.airlineCode}
              onChange={e => setForm(f => ({ ...f, airlineCode: e.target.value.toUpperCase() }))}
            />

            <div className="app-input-group">
              <label className="app-input-label">Applies To</label>
              <select
                className="app-input"
                value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value as Scope, scopeId: '' }))}
              >
                <option value="global">Everyone (global)</option>
                <option value="biz_org">A specific corporate org</option>
                <option value="sa_agent">A specific mypartner agent</option>
              </select>
            </div>

            {form.scope === 'biz_org' && (
              <div className="app-input-group">
                <label className="app-input-label">Organization</label>
                <select className="app-input" required value={form.scopeId} onChange={e => setForm(f => ({ ...f, scopeId: e.target.value }))}>
                  <option value="" disabled>Select an org…</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}

            {form.scope === 'sa_agent' && (
              <div className="app-input-group">
                <label className="app-input-label">Agent</label>
                <select className="app-input" required value={form.scopeId} onChange={e => setForm(f => ({ ...f, scopeId: e.target.value }))}>
                  <option value="" disabled>Select an agent…</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.agency_name}</option>)}
                </select>
              </div>
            )}

            <div className="app-input-group">
              <label className="app-input-label">Notes (optional)</label>
              <textarea
                className="app-input"
                rows={2}
                placeholder="e.g. Negotiated corporate fare via 6E portal"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="app-popup-footer">
            <button type="button" className="confirm-modal-btn confirm-modal-btn-cancel" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="confirm-modal-btn confirm-modal-btn-success" disabled={formSaving}>
              {formSaving ? 'Saving…' : 'Create Rule'}
            </button>
          </div>
        </form>
      </AppPopup>
    </div>
  )
}
