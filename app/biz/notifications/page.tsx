'use client'

import React, { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/api'
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

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string; border: string }> = {
  approval_request: { icon: <Clock size={16} />, bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  approval_decision: { icon: <CheckCircle2 size={16} />, bg: '#ECFDF5', color: '#047857', border: '#6EE7B7' },
  policy_violation: { icon: <ShieldAlert size={16} />, bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  wallet_low: { icon: <Wallet size={16} />, bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  blackout_warning: { icon: <CalendarOff size={16} />, bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' },
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
    <div style={{ minHeight: 'calc(100vh - 54px)', background: '#F5F6FA', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .notify-container {
          max-width: 1080px;
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
        .card-shell {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
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
          box-shadow: 0 6px 18px var(--accent, rgba(227, 30, 36, 0.35));
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .tab-btn {
          padding: 8px 18px;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          background: #ffffff;
          color: #4B5563;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tab-btn.active {
          background: var(--accent, #E31E24);
          color: #ffffff;
          border-color: var(--accent, #E31E24);
          box-shadow: 0 4px 12px var(--accent, rgba(227, 30, 36, 0.25));
        }
        @media (max-width: 1024px) {
          .notify-container {
            padding: 24px 20px 36px;
          }
        }
        @media (max-width: 640px) {
          .notify-container {
            padding: 16px 12px 28px;
          }
          .hero-banner-box {
            padding: 20px;
            border-radius: 18px;
          }
          .card-shell {
            padding: 18px 14px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="notify-container">
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          <span>Admin</span>
          <ChevronRight size={13} color="#9CA3AF" />
          <span style={{ color: 'var(--accent, #E31E24)', fontWeight: 700 }}>Corporate Activity & Alert Feed</span>
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
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <BellRing size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Notifications & Alerts <Sparkles size={18} color="#F59E0B" />
                </h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', margin: 0, fontWeight: 500 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Unread Alerts</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                {unreadCount} Unread
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Total Notifications</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {items.length} Total
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Realtime Sync</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                Live Stream
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar: Segmented Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => { setFilter('all'); setPage(1) }} className={`tab-btn ${filter === 'all' ? 'active' : ''}`}>
              All Notifications
            </button>
            <button onClick={() => { setFilter('unread'); setPage(1) }} className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}>
              Unread Alerts {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Notifications Feed Card */}
        <div className="card-shell" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 600 }}>
              Loading corporate notification feed…
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Bell size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                {filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
              </div>
              <div style={{ fontSize: '13px', color: '#9CA3AF' }}>You have no pending alerts requiring your attention.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {slice.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type] ?? {
                  icon: <Bell size={16} />,
                  bg: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '#93C5FD',
                }
                const isUnread = !n.read_at

                return (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '18px 24px',
                      borderBottom: i < slice.length - 1 ? '1px solid #F3F4F6' : 'none',
                      background: isUnread ? '#FFF7F7' : 'transparent',
                      borderLeft: isUnread ? '3.5px solid var(--accent, #E31E24)' : '3.5px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Icon Badge */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{n.title}</span>
                        <span
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: '99px',
                            padding: '2px 8px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {n.type.replace(/_/g, ' ')}
                        </span>
                        {isUnread && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--accent, #E31E24)',
                              boxShadow: '0 0 0 3px rgba(227, 30, 36, 0.2)',
                            }}
                          />
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>{n.body}</p>

                      <span style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '6px', display: 'block', fontWeight: 500 }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    {/* Mark Read Action */}
                    {isUnread && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11.5px' }}
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
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB',
                    background: page === p ? 'var(--accent, #E31E24)' : '#ffffff',
                    color: page === p ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 800,
                    transition: 'all 0.15s ease',
                  }}
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
