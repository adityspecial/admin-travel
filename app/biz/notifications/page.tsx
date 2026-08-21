'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
import './notification.css'
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Wallet,
  CalendarOff,
  Filter,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
  metadata: any
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  approval_request: <Clock size={16} />,
  approval_decision: <CheckCircle2 size={16} />,
  policy_violation: <ShieldAlert size={16} />,
  wallet_low: <Wallet size={16} />,
  wallet_topup: <Wallet size={16} />,
  blackout_warning: <CalendarOff size={16} />,
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const PER = 20

  useEffect(() => {
    load()
  }, [filter])

  function load() {
    setLoading(true)
    adminFetch(`/api/admin/biz/notifications?unread=${filter === 'unread'}`)
      .then((d) => setItems(d.notifications ?? []))
      .finally(() => setLoading(false))
  }

  async function markRead(id: string) {
    await adminFetch('/api/admin/biz/notifications', { method: 'PATCH', body: JSON.stringify({ id }) })
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  }

  async function markAllRead() {
    await adminFetch('/api/admin/biz/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) })
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const unreadCount = items.filter((n) => !n.read_at).length
  const visible = filter === 'unread' ? items.filter((n) => !n.read_at) : items
  const slice = visible.slice((page - 1) * PER, page * PER)
  const pages = Math.ceil(visible.length / PER)

  return (
    <div className="notify-page">
      <div className="notify-container">
        {/* Breadcrumb Navigation */}
        <div className="notify-breadcrumb">
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span className="notify-breadcrumb-active">Corporate Activity & Alert Feed</span>
        </div>

        {/* Hero Header Banner */}
        <div className="hero-banner-box">
          {/* Ambient Glow */}
          <div className="notify-hero-glow" />

          <div className="notify-hero-content">
            <div className="notify-hero-left">
              <div className="notify-hero-icon">
                <BellRing size={28} />
              </div>
              <div>
                <h1 className="notify-hero-title">
                  Notifications & Alerts <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p className="notify-hero-subtitle">
                  Real-time updates on travel approvals, policy violations, wallet thresholds, and blackout warnings.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-primary">
                <CheckCheck size={16} /> Mark All as Read
              </button>
            )}
          </div>

          {/* Quick Metrics Bar Inside Hero */}
          <div className="notify-hero-metrics">
            <div>
              <div className="notify-metric-label">Unread Alerts</div>
              <div className="notify-metric-value notify-metric-value--unread">
                {unreadCount} Unread
              </div>
            </div>
            <div>
              <div className="notify-metric-label">Total Notifications</div>
              <div className="notify-metric-value notify-metric-value--total">
                {items.length} Total
              </div>
            </div>
            <div>
              <div className="notify-metric-label">Realtime Sync</div>
              <div className="notify-metric-value notify-metric-value--live">
                Live Stream
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar: Segmented Tabs */}
        <div className="notify-controls-bar">
          <div className="notify-tabs-wrap">
            <button onClick={() => { setFilter('all'); setPage(1) }} className={`tab-btn ${filter === 'all' ? 'active' : ''}`}>
              All Notifications
            </button>
            <button onClick={() => { setFilter('unread'); setPage(1) }} className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}>
              Unread Alerts {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Notifications Feed Card */}
        <div className="card-shell notify-feed-card">
          {loading ? (
            <div className="notify-loading">
              Loading corporate notification feed…
            </div>
          ) : visible.length === 0 ? (
            <div className="notify-empty">
              <Bell size={36} color="#9CA3AF" className="notify-empty-icon" />
              <div className="notify-empty-title">
                {filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
              </div>
              <div className="notify-empty-sub">You have no pending alerts requiring your attention.</div>
            </div>
          ) : (
            <div className="notify-list">
              {slice.map((n) => {
                const icon = TYPE_ICONS[n.type] ?? <Bell size={16} />
                const isUnread = !n.read_at

                return (
                  <div
                    key={n.id}
                    className={`notify-item notify-item--${n.type} ${isUnread ? 'notify-item--unread' : ''}`}
                  >
                    {/* Icon Badge */}
                    <div className="notify-item-icon">
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="notify-item-content">
                      <div className="notify-item-title-row">
                        <span className="notify-item-title">{n.title}</span>
                        <span className="notify-type-pill">
                          {n.type.replace(/_/g, ' ')}
                        </span>
                        {isUnread && (
                          <span className="notify-unread-dot" />
                        )}
                      </div>

                      <p className="notify-item-body">{n.body}</p>

                      <span className="notify-item-time">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    {/* Mark Read Action */}
                    {isUnread && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="btn-secondary notify-mark-read-btn"
                      >
                        <Check size={12} /> Mark Read
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Bar */}
          {pages > 1 && (
            <div className="notify-pagination-bar">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`notify-page-btn ${page === p ? 'notify-page-btn--active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
