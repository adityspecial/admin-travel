'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  Shield,
  Wallet,
  Plane,
  Ticket,
  ClipboardList,
  Globe,
  FileText,
  Receipt,
  Settings,
  Calendar,
  Tag,
  Bell,
  Headphones,
  ChevronDown,
  LogOut,
  Home,
} from 'lucide-react'
import './navbar.css'

export interface NavSubItem {
  label: string
  href: string
  Icon?: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
}

export interface NavItem {
  label: string
  href: string
  Icon?: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
  subItems?: NavSubItem[]
}

export interface NavbarProps {
  brandLogo?: {
    badge: string
    title: string
    subtitle: string
    href: string
  }
  /** Org logo image URL from the DB. Falls back to the text brand badge when empty. */
  logoUrl?: string
  navItems?: NavItem[]
  userEmail?: string
  pendingCount?: number
  walletBalance?: number
  walletHref?: string
  notificationsHref?: string
  homeHref?: string
  onLogout?: () => void
}

export default function Navbar({
  brandLogo = {
    badge: 'Yatra',
    title: 'Biz',
    subtitle: 'Admin',
    href: '/biz',
  },
  logoUrl,
  navItems,
  userEmail = '',
  pendingCount = 0,
  walletBalance,
  walletHref = '/biz/wallet',
  notificationsHref = '/biz/notifications',
  homeHref = '/',
  onLogout,
}: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [openProfile, setOpenProfile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const indicatorRef = useRef<HTMLDivElement>(null)

  // Default nav configuration for Biz Admin if custom navItems not provided
  const items: NavItem[] = navItems || [
    {
      label: 'Dashboard',
      href: '/biz',
      Icon: LayoutDashboard,
    },
    {
      label: 'Company & Employees',
      href: '/biz/company',
      Icon: Building2,
      subItems: [
        { label: 'Company Details', href: '/biz/company', Icon: Building2 },
        { label: 'Employees', href: '/biz/members', Icon: Users },
        { label: 'Cost Centers', href: '/biz/cost-centers', Icon: Layers },
        { label: 'Permissions', href: '/biz/permissions', Icon: Shield },
      ],
    },
    {
      label: 'Wallet',
      href: '/biz/wallet',
      Icon: Wallet,
    },
    {
      label: 'Travel Management',
      href: '/biz/approvals',
      Icon: Plane,
      subItems: [
        {
          label: 'Manage Bookings',
          href: '/biz/approvals',
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
          Icon: Ticket,
        },
        { label: 'All Bookings', href: '/biz/bookings', Icon: ClipboardList },
        { label: 'Visa Enquiries', href: '/biz/visa-enquiries', Icon: Globe },
        { label: 'Travel Reports', href: '/biz/reports', Icon: FileText },
        { label: 'Travel Invoices', href: '/biz/invoices', Icon: Receipt },
        { label: 'Travel Policy', href: '/biz/policy', Icon: Shield },
        { label: 'Auto-Approval Rules', href: '/biz/auto-approval', Icon: Settings },
        { label: 'Blackout Dates', href: '/biz/blackout-dates', Icon: Calendar },
        { label: 'Promo Codes', href: '/biz/promos', Icon: Tag },
      ],
    },
    {
      label: 'Notifications',
      href: '/biz/notifications',
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      Icon: Bell,
    },
    {
      label: 'Support',
      href: '/biz/support',
      Icon: Headphones,
    },
  ]

  // Determine active index (default to 0 if unmatched or on root)
  const activeIndex = (() => {
    const foundIndex = items.findIndex((item) => {
      // 1. Exact match on main item href
      if (item.href !== '#' && pathname === item.href) return true

      // 2. Exact or sub-route match inside subItems
      if (item.subItems) {
        if (item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
          return true
        }
      }

      // 3. Sub-route match on main item href (excluding root '/biz')
      if (item.href !== '#' && item.href !== '/biz' && pathname.startsWith(item.href + '/')) {
        return true
      }

      return false
    })

    return foundIndex >= 0 ? foundIndex : 0
  })()

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle Click Outside Profile Popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Move Sliding Indicator
  const moveIndicator = (index: number) => {
    const item = itemRefs.current[index]
    const indicator = indicatorRef.current
    if (!item || !indicator) return

    const menu = item.closest('.navs-menu') as HTMLElement
    if (!menu) return

    const menuRect = menu.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    indicator.style.width = `${itemRect.width}px`
    indicator.style.transform = `translateX(${itemRect.left - menuRect.left}px)`
    indicator.style.opacity = '1'
  }

  useEffect(() => {
    const update = () => {
      const index = hoveredIndex !== null ? hoveredIndex : activeIndex
      if (index >= 0 && itemRefs.current[index]) {
        requestAnimationFrame(() => moveIndicator(index))
      }
    }

    update()
    const timer = setTimeout(update, 50)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', update)
    }
  }, [pathname, hoveredIndex, activeIndex])

  // Profile details
  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Admin User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'AD'

  return (
    <>
      <div className="nav-spacer" />
      <nav className={`navs ${isScrolled ? 'scrolled' : ''}`}>
        {/* Brand / Logo */}
        <Link href={brandLogo.href} className="nav-brand">
          {logoUrl ? (
            <img src={logoUrl} alt={brandLogo.title} className="brand-logo-img" />
          ) : (
            <>
              <span className="brand-badge">{brandLogo.badge}</span>
              <span className="brand-title">{brandLogo.title}</span>
            </>
          )}
          {/* <span className="brand-dot">.</span>
          <span className="brand-subtitle">{brandLogo.subtitle}</span> */}
        </Link>

        {/* Center Desktop Navigation Menu */}
        <div className="navs-menu" onMouseLeave={() => setHoveredIndex(null)}>
          <div ref={indicatorRef} className="indicators" />

          {items.map((item, index) => {
            const isActive =
              (item.href !== '#' && (pathname === item.href || pathname.startsWith(item.href + '/'))) ||
              (item.subItems && item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')))
            const currentIndex = hoveredIndex !== null ? hoveredIndex : activeIndex
            const hasIndicator = index === currentIndex

            return (
              <div
                key={item.label}
                className="navs-item-wrap"
                onMouseEnter={() => {
                  setHoveredIndex(index)
                  if (item.subItems) setActiveDropdown(index)
                }}
                onMouseLeave={() => {
                  if (item.subItems) setActiveDropdown(null)
                }}
              >
                <Link
                  href={item.href === '#' ? item.subItems?.[0]?.href || '#' : item.href}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  className={`navs-item ${hasIndicator ? 'has-indicator' : ''} ${isActive ? 'active' : ''}`}
                >
                  {item.Icon && <item.Icon size={16} />}
                  <span>{item.label}</span>
                  {item.badge && <span className="navs-item-badge">{item.badge}</span>}
                  {item.subItems && (
                    <ChevronDown
                      size={14}
                      style={{
                        transform: activeDropdown === index ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  )}
                </Link>

                {/* Submenu Dropdown */}
                {item.subItems && activeDropdown === index && (
                  <div className="nav-dropdown">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="nav-dropdown-item"
                          onClick={() => setActiveDropdown(null)}
                          style={isSubActive ? { color: 'var(--nav-brand)', background: 'var(--nav-brand-light)' } : undefined}
                        >
                          <div className="nav-dropdown-item-left">
                            {sub.Icon && <sub.Icon size={15} />}
                            <span>{sub.label}</span>
                          </div>
                          {sub.badge && <span className="nav-dropdown-badge">{sub.badge}</span>}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right Section / Actions */}
        <div className="nav-right">
          {/* Wallet Chip if balance provided */}
          {walletBalance !== undefined && (
            <Link
              href={walletHref}
              className={`wallet-chip ${pathname.startsWith(walletHref) ? 'active_out' : ''}`}
            >
              <Wallet size={15} strokeWidth={2.2} />
              <span>₹{walletBalance.toLocaleString('en-IN')}</span>
            </Link>
          )}


          {/* Profile Dropdown Popover */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              className="profile-cta"
              onClick={() => setOpenProfile((v) => !v)}
              title="User profile"
            >
              <div className="profile-avatar">{initials}</div>
              <span className="profile-name">{displayName}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: openProfile ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
            </button>

            {openProfile && (
              <div className="profile-popover">
                <div className="popover-header">
                  <div className="popover-header-name">{displayName}</div>
                  <div className="popover-header-email">{userEmail || 'Administrator'}</div>
                </div>

                <div className="popover-divider" />

                <Link
                  href={homeHref}
                  className="popover-item"
                  onClick={() => setOpenProfile(false)}
                >
                  <Home size={15} />
                  <span>Corporate Home</span>
                </Link>

                <div className="popover-divider" />

                {onLogout && (
                  <button
                    className="popover-item danger"
                    onClick={() => {
                      setOpenProfile(false)
                      onLogout()
                    }}
                  >
                    <LogOut size={15} color="#DC2626" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className={`mobile-btn ${mobileOpen ? 'active' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'active' : ''}`}>
        {items.map((item) => {
          const isActive =
            (item.href !== '#' && (pathname === item.href || pathname.startsWith(item.href + '/'))) ||
            (item.subItems && item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')))

          return (
            <div key={item.label}>
              {item.subItems ? (
                <>
                  <div className="mobile-header">{item.label}</div>
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`mobile-sub-link ${pathname === sub.href ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{sub.label}</span>
                      {sub.badge && <span className="nav-dropdown-badge">{sub.badge}</span>}
                    </Link>
                  ))}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-dropdown-badge">{item.badge}</span>}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
