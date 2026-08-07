'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/api'
import { RouteLoader } from '@/components/ui/RouteLoader'

import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
  Plane,
  Ticket,
  Palmtree,
  ClipboardList,
  FileCheck,
  Megaphone,
  Send,
  Tag,
  CreditCard,
  BadgePercent,
  KeyRound,
  ScrollText,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

const NAV = [
  { href: '/super',              label: 'Dashboard',              Icon: LayoutDashboard },
  { href: '/super/orgs',         label: 'Organisations',          Icon: Building2 },
  { href: '/super/agents',       label: 'myPartner Agents',       Icon: Users },
  { href: '/super/partners',     label: 'Partner Admins',         Icon: ShieldCheck },
  { href: '/super/users',        label: 'All Members',            Icon: UserCheck },
  { href: '/super/bookings',     label: 'All Bookings',           Icon: ClipboardList },
  { href: '/super/booking-failures', label: 'Failed Bookings',    Icon: AlertTriangle },
  // { href: '/super/fixed-flights',label: 'Fixed Departures',       Icon: Plane },
  // { href: '/super/fareguide',    label: 'FareGuide Fixed Flights',Icon: Ticket },
  { href: '/super/packages',     label: 'Holiday Packages',       Icon: Palmtree },
  { href: '/super/visa',         label: 'Visa Pages',             Icon: FileCheck },
  { href: '/super/featured-content', label: 'Featured Content',   Icon: Megaphone },
  { href: '/super/notifications', label: 'Notification Center',   Icon: Send },
  { href: '/super/promos',        label: 'Promo Codes',            Icon: Tag },
  { href: '/super/payments',     label: 'Razorpay Payments',      Icon: CreditCard },
  { href: '/super/disputes',     label: 'Disputes',               Icon: AlertTriangle },
  { href: '/super/booking-disputes', label: 'Booking Disputes',   Icon: AlertTriangle },
  { href: '/super/refunds',      label: 'Refund Aging',           Icon: CreditCard },
  { href: '/super/sla',          label: 'SLA Tracker',            Icon: AlertTriangle },
  { href: '/super/duplicate-bookings', label: 'Duplicate Bookings', Icon: AlertTriangle },
  { href: '/super/pnr-health',   label: 'PNR Health',             Icon: AlertTriangle },
  { href: '/super/reports/promo-burn', label: 'Promo Cash Burn',  Icon: BadgePercent },
  { href: '/super/consumer',     label: 'Fee Settings',           Icon: BadgePercent },
  { href: '/super/permissions',  label: 'Permissions',            Icon: KeyRound },
  { href: '/super/audit-log',    label: 'Audit Log',              Icon: ScrollText },
  { href: '/super/webhook-events', label: 'Webhook Events',       Icon: ScrollText },
  { href: '/super/provider-errors', label: 'Provider API Errors', Icon: AlertTriangle },
]

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const checked = useRef(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load saved sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  // ── Role guard: only 'super' tokens may access /super ────────────
  useEffect(() => {
    if (checked.current) return
    checked.current = true

    const token = sessionStorage.getItem('admin_dev_token')
    if (!token) { router.replace('/login'); return }

    try {
      const dot = token.lastIndexOf('.')
      if (dot === -1) { router.replace('/login'); return }

      const payload = token.slice(0, dot)
      // Use atob (browser-safe base64url decode)
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )
      const parsed = JSON.parse(json)

      if (parsed.role !== 'super') {
        router.replace(parsed.role === 'partner' ? '/partner' : parsed.role === 'biz' ? '/biz' : '/login')
      }
    } catch {
      router.replace('/login')
    }
  }, []) // Empty deps — run once only

  async function logout() {
    sessionStorage.removeItem('admin_dev_token')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            <h1>AirDunia</h1>
            <span>Super Admin</span>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => {
              const next = !isCollapsed
              setIsCollapsed(next)
              localStorage.setItem('sidebar_collapsed', String(next))
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="toggle-icon-desktop">
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </span>
            <span className="toggle-icon-mobile">
              {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </span>
          </button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              data-tooltip={item.label}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon size={15} strokeWidth={2} />
              </span>
              <span className="nav-link-text">{item.label}</span>
            </Link>
          ))}
          <div className="nav-section" style={{ marginTop: 16 }}>Account</div>
          <button
            className="nav-link nav-link-plain"
            onClick={logout}
            data-tooltip="Sign Out"
          >
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={15} strokeWidth={2} />
            </span>
            <span className="nav-link-text">Sign Out</span>
          </button>
        </nav>
      </aside>
      <main className="admin-main">
        <RouteLoader />
        {children}
      </main>
    </div>
  )
}
