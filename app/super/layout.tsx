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
  Briefcase,
  Palmtree,
  ClipboardList,
  FileCheck,
  Megaphone,
  Send,
  Tag,
  CreditCard,
  BadgePercent,
  KeyRound,
  UserCog,
  ScrollText,
  AlertTriangle,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

interface NavLink { href: string; label: string; Icon: any }
interface NavGroup { label: string; Icon: any; children: NavLink[] }
type NavEntry = NavLink | NavGroup
function isGroup(entry: NavEntry): entry is NavGroup { return 'children' in entry }

const NAV: NavEntry[] = [
  { href: '/super',              label: 'Dashboard',              Icon: LayoutDashboard },
  { href: '/super/orgs',         label: 'Organisations',          Icon: Building2 },
  { href: '/super/agents',       label: 'myPartner Agents',       Icon: Users },
  { href: '/super/partners',     label: 'Partner Admins',         Icon: ShieldCheck },
  { href: '/super/corporate-admins', label: 'Corporate Admins',   Icon: Briefcase },
  { href: '/super/users',        label: 'All Members',            Icon: UserCheck },
  {
    label: 'Partner Tiers', Icon: TrendingUp,
    children: [
      { href: '/super/partner-tiers',            label: 'Tier Settings',   Icon: TrendingUp },
      { href: '/super/partner-tier-promotions',  label: 'Tier Promotions', Icon: AlertTriangle },
    ],
  },
  // { href: '/super/fixed-flights',label: 'Fixed Departures',       Icon: Plane },
  // { href: '/super/fareguide',    label: 'FareGuide Fixed Flights',Icon: Ticket },
  {
    label: 'Booking', Icon: ClipboardList,
    children: [
      { href: '/super/bookings',           label: 'All Bookings',       Icon: ClipboardList },
      { href: '/super/duplicate-bookings', label: 'Duplicate Bookings', Icon: AlertTriangle },
      { href: '/super/pnr-health',         label: 'PNR Health',         Icon: AlertTriangle },
    ],
  },
  {
    label: 'Errors', Icon: AlertTriangle,
    children: [
      { href: '/super/booking-failures', label: 'Failed Bookings',     Icon: AlertTriangle },
      { href: '/super/provider-errors',  label: 'Provider API Errors', Icon: AlertTriangle },
      { href: '/super/webhook-events',   label: 'Webhook Events',      Icon: ScrollText },
    ],
  },
  {
    label: 'Content', Icon: Megaphone,
    children: [
      { href: '/super/packages',     label: 'Holiday Packages',     Icon: Palmtree },
      { href: '/super/visa',         label: 'Visa Pages',           Icon: FileCheck },
      { href: '/super/featured-content', label: 'Featured Content', Icon: Megaphone },
      { href: '/super/notifications', label: 'Notification Center', Icon: Send },
    ],
  },
  {
    label: 'Promos', Icon: Tag,
    children: [
      { href: '/super/promos',             label: 'Promo Codes',     Icon: Tag },
      { href: '/super/reports/promo-burn', label: 'Promo Cash Burn', Icon: BadgePercent },
    ],
  },
  {
    label: 'Disputes', Icon: AlertTriangle,
    children: [
      { href: '/super/disputes',         label: 'Disputes',       Icon: AlertTriangle },
      { href: '/super/booking-disputes', label: 'Booking Disputes', Icon: AlertTriangle },
      { href: '/super/biz-approval-disputes', label: 'Corporate Disputes', Icon: AlertTriangle },
    ],
  },
  {
    label: 'Payments', Icon: CreditCard,
    children: [
      { href: '/super/payments', label: 'Razorpay Payments', Icon: CreditCard },
      { href: '/super/refunds',  label: 'Refund Aging',      Icon: CreditCard },
      { href: '/super/consumer', label: 'Fee Settings',      Icon: BadgePercent },
    ],
  },
  {
    label: 'System', Icon: UserCog,
    children: [
      { href: '/super/staff',       label: 'Staff',       Icon: UserCog },
      { href: '/super/permissions', label: 'Permissions', Icon: KeyRound },
      { href: '/super/audit-log',   label: 'Audit Log',   Icon: ScrollText },
      { href: '/super/company',     label: 'Company Settings', Icon: Building2 },
    ],
  },
]

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const checked = useRef(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  // A group starts open if the current page is one of its own children, so
  // deep-linking straight to e.g. /super/pnr-health doesn't land on a
  // sidebar that looks like nothing is selected.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const entry of NAV) {
      if (isGroup(entry) && entry.children.some(c => c.href === pathname)) initial.add(entry.label)
    }
    return initial
  })
  function toggleGroup(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

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
          {NAV.map((item) => {
            if (isGroup(item)) {
              const isOpen = openGroups.has(item.label)
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className="nav-link nav-link-plain"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    data-tooltip={item.label}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <item.Icon size={15} strokeWidth={2} />
                      </span>
                      <span className="nav-link-text">{item.label}</span>
                    </span>
                    <span className="nav-link-text">{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
                  </button>
                  {isOpen && item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`nav-link ${pathname === child.href ? 'active' : ''}`}
                      style={{ paddingLeft: 34 }}
                      data-tooltip={child.label}
                    >
                      <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <child.Icon size={13} strokeWidth={2} />
                      </span>
                      <span className="nav-link-text">{child.label}</span>
                    </Link>
                  ))}
                </div>
              )
            }
            return (
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
            )
          })}
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
