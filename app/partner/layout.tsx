'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase, adminFetch } from '@/lib/api'
import { RouteLoader } from '@/components/ui/RouteLoader'
import {
  LayoutDashboard, Network, Ticket, Users, Layers,
  BarChart3, ArrowDownToLine, FileText, Shield, LogOut, Tag, Globe,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Gift,
} from 'lucide-react'

const NAV = [
  { href: '/partner',              label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/partner/sub-agents',   label: 'Sub-Agents',  Icon: Network         },
  { href: '/partner/bookings',     label: 'Bookings',    Icon: Ticket          },
  { href: '/partner/visa-enquiries', label: 'Visa Enquiries', Icon: Globe      },
  { href: '/partner/customers',    label: 'Customers',   Icon: Users           },
  { href: '/partner/markups',      label: 'Markups',     Icon: Layers          },
  { href: '/partner/promos',        label: 'Promo Codes', Icon: Tag             },
  { href: '/partner/earnings',     label: 'Earnings',    Icon: BarChart3       },
  { href: '/partner/payouts',      label: 'Payouts',     Icon: ArrowDownToLine },
  { href: '/partner/reports',      label: 'Reports',     Icon: FileText        },
  { href: '/partner/permissions',  label: 'Permissions', Icon: Shield          },
]

export default function PartnerAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const checked  = useRef(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [promoBalance, setPromoBalance] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const token = sessionStorage.getItem('admin_dev_token')
    if (!token) { router.replace('/login'); return }
    try {
      const dot = token.lastIndexOf('.')
      if (dot === -1) { router.replace('/login'); return }
      const payload = token.slice(0, dot)
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )
      const parsed = JSON.parse(json)
      if (parsed.role !== 'partner') {
        router.replace(parsed.role === 'super' ? '/super' : parsed.role === 'biz' ? '/biz' : '/login')
      }
    } catch { router.replace('/login') }
  }, [])

  useEffect(() => {
    adminFetch('/api/admin/partner/promo-cash')
      .then(d => setPromoBalance(d.balance ?? 0))
      .catch(() => {})
  }, [])

  async function logout() {
    sessionStorage.removeItem('admin_dev_token')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar partner-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            <h1>myPartner</h1>
            <span>Agent Admin</span>
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

        {/* Promo cash meter — small balance chip, hidden when there's nothing to show */}
        {!!promoBalance && (
          <Link
            href="/partner"
            data-tooltip="Promo cash balance"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '0 12px 12px', padding: '8px 10px',
              borderRadius: 8, background: 'rgba(34,197,94,0.12)',
              color: '#16A34A', fontSize: 12.5, fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <Gift size={14} strokeWidth={2.2} />
            {!isCollapsed && <span>₹{promoBalance.toLocaleString('en-IN')} Promo Cash</span>}
          </Link>
        )}

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              data-tooltip={item.label}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon size={14} strokeWidth={2} />
              </span>
              <span className="nav-link-text">{item.label}</span>
            </Link>
          ))}
          <div className="nav-section" style={{ marginTop: 16 }}>Account</div>
          <button className="nav-link nav-link-plain" onClick={logout} data-tooltip="Sign Out">
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={14} strokeWidth={2} />
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
