'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/api'

const NAV = [
  { href: '/super',              label: 'Dashboard',             icon: 'DB' },
  { href: '/super/orgs',         label: 'Organisations',         icon: 'OR' },
  { href: '/super/agents',       label: 'myPartner Agents',      icon: 'AG' },
  { href: '/super/partners',     label: 'Partner Admins',        icon: 'PA' },
  { href: '/super/users',        label: 'All Members',           icon: 'MB' },
  { href: '/super/fixed-flights',label: 'Fixed Departures',      icon: 'FD' },
  { href: '/super/fareguide',    label: 'FareGuide Fixed Flights',icon: 'FG' },
  { href: '/super/packages',       label: 'Holiday Packages',      icon: '🌍' },
  { href: '/super/visa',           label: 'Visa Pages',            icon: '🛂' },
  { href: '/super/featured-content', label: 'Featured Content',    icon: '📢' },
  { href: '/super/promos',        label: 'Promo Codes',           icon: 'CP' },
  { href: '/super/payments',     label: 'Razorpay Payments',     icon: '💳' },
  { href: '/super/consumer',     label: 'Fee Settings',          icon: '₹'  },
  { href: '/super/permissions',  label: 'Permissions',           icon: '🔐' },
  { href: '/super/audit-log',    label: 'Audit Log',             icon: '📜' },
]

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const checked = useRef(false)

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
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>AirDunia</h1>
          <span>Super Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Platform</div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="nav-section" style={{ marginTop: 16 }}>Account</div>
          <button className="nav-link nav-link-plain" onClick={logout}>
            <span className="nav-icon">SO</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
