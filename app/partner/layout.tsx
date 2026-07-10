'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/api'
import {
  LayoutDashboard, Network, Ticket, Users, Layers,
  BarChart3, ArrowDownToLine, FileText, Shield, LogOut, Tag,
} from 'lucide-react'

const NAV = [
  { href: '/partner',              label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/partner/sub-agents',   label: 'Sub-Agents',  Icon: Network         },
  { href: '/partner/bookings',     label: 'Bookings',    Icon: Ticket          },
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

  async function logout() {
    sessionStorage.removeItem('admin_dev_token')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar partner-sidebar">
        <div className="sidebar-logo">
          <h1>myPartner</h1>
          <span>Agent Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Manage</div>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon size={14} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="nav-section" style={{ marginTop: 16 }}>Account</div>
          <button className="nav-link nav-link-plain" onClick={logout}>
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={14} strokeWidth={2} />
            </span>
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
