'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase, adminFetch } from '@/lib/api'

type OpenMenu = 'company' | 'travel' | null

export default function BizAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const checked  = useRef(false)
  const [open,  setOpen]  = useState<OpenMenu>(null)
  const [email, setEmail] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const prevPending = useRef<number | null>(null)

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
      if (parsed.role !== 'biz') {
        router.replace(parsed.role === 'super' ? '/super' : '/login')
        return
      }
      setEmail(parsed.email ?? '')
    } catch { router.replace('/login') }
  }, [])

  useEffect(() => {
    function poll() {
      const token = sessionStorage.getItem('admin_dev_token')
      if (!token) return
      adminFetch('/api/admin/biz/approvals?status=pending')
        .then(d => {
          const count = (d.approvals ?? []).length
          if (prevPending.current !== null && count > prevPending.current) {
            const diff = count - prevPending.current
            setToast(`${diff} new approval request${diff > 1 ? 's' : ''} received`)
            setTimeout(() => setToast(null), 6000)
          }
          prevPending.current = count
          setPendingCount(count)
        })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 30000)
    return () => clearInterval(id)
  }, [])

  async function logout() {
    sessionStorage.removeItem('admin_dev_token')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const displayName = email
    ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

  const is = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top navbar ── */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 54, gap: 0 }}>

          {/* Logo */}
          <Link href="/biz" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', marginRight: 28, flexShrink: 0 }}>
            <span style={{ background: '#E31E24', color: '#fff', fontWeight: 900, fontSize: 13, padding: '2px 6px', borderRadius: 4, letterSpacing: '-0.3px' }}>my</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: '#1a1a2e', marginLeft: 2 }}>Biz</span>
            <span style={{ color: '#E31E24', fontWeight: 900, fontSize: 16, margin: '0 1px' }}> .</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>Admin</span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'stretch', flex: 1, height: 54 }}>
            <NavLink href="/biz" label="Dashboard" active={pathname === '/biz'} />

            {/* Company & Employees */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
              onMouseEnter={() => setOpen('company')} onMouseLeave={() => setOpen(null)}>
              <NavLink href="#" label="Company & Employees" active={is('/biz/company') || is('/biz/members') || is('/biz/cost-centers') || is('/biz/permissions')} dropdown />
              {open === 'company' && (
                <DropMenu onClose={() => setOpen(null)} items={[
                  { label: 'Company Details', href: '/biz/company'      },
                  { label: 'Employees',       href: '/biz/members'      },
                  { label: 'Cost Centers',    href: '/biz/cost-centers' },
                  { label: 'Permissions',     href: '/biz/permissions'  },
                ]} />
              )}
            </div>

            <NavLink href="/biz/wallet" label="myBiz Wallet" active={is('/biz/wallet')} />

            {/* Travel Management */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
              onMouseEnter={() => setOpen('travel')} onMouseLeave={() => setOpen(null)}>
              <NavLink href="#" label="Travel Management" active={
                is('/biz/reports') || is('/biz/invoices') || is('/biz/policy') ||
                is('/biz/approvals') || is('/biz/auto-approval') ||
                is('/biz/blackout-dates') || is('/biz/promos') || is('/biz/visa-enquiries')
              } dropdown />
              {open === 'travel' && (
                <DropMenu onClose={() => setOpen(null)} items={[
                  { label: 'Manage Bookings',    href: '/biz/approvals',     badge: pendingCount > 0 ? String(pendingCount) : undefined },
                  { label: 'Visa Enquiries',     href: '/biz/visa-enquiries' },
                  { label: 'Travel Reports',     href: '/biz/reports'        },
                  { label: 'Travel Invoices',    href: '/biz/invoices'       },
                  { label: 'Travel Policy',      href: '/biz/policy'         },
                  { label: 'Auto-Approval Rules',href: '/biz/auto-approval'  },
                  { label: 'Blackout Dates',     href: '/biz/blackout-dates' },
                  { label: 'Promo Codes',        href: '/biz/promos'         },
                ]} />
              )}
            </div>

            <NavLink href="/biz/notifications" label="Notifications" active={is('/biz/notifications')} />
            <NavLink href="/biz/support"       label="Support"       active={is('/biz/support')}       />
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            {/* Bell notification */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => router.push('/biz/approvals')}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -6,
                  background: '#E31E24', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  borderRadius: '50%', width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
              )}
            </div>

            <Link href="/" style={{
              padding: '6px 14px', borderRadius: 6, border: '1.5px solid #2563EB',
              color: '#2563EB', fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>myBiz Home</Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#E31E24', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>{initials}</div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Hey {displayName}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{email}</div>
              </div>
              <button onClick={logout} title="Sign out" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', fontSize: 16, padding: '4px', lineHeight: 1,
              }}>↩</button>
            </div>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main>{children}</main>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 24, zIndex: 9999,
          background: '#1a1a2e', color: '#fff',
          padding: '14px 18px', borderRadius: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          maxWidth: 320,
        }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ flex: 1 }}>{toast}</span>
          <button onClick={() => { setToast(null); router.push('/biz/approvals') }}
            style={{ fontSize: 12, color: '#E31E24', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            View →
          </button>
          <button onClick={() => setToast(null)}
            style={{ fontSize: 14, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function NavLink({ href, label, active, dropdown }: {
  href: string; label: string; active: boolean; dropdown?: boolean
}) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '0 14px', height: '100%',
      fontSize: 13, fontWeight: active ? 700 : 500,
      color: active ? '#E31E24' : '#374151',
      textDecoration: 'none', whiteSpace: 'nowrap',
      borderBottom: active ? '2.5px solid #E31E24' : '2.5px solid transparent',
      transition: 'color 0.15s',
    }}>
      {label}
      {dropdown && <span style={{ fontSize: 9, marginTop: 1, opacity: 0.6 }}>▾</span>}
    </Link>
  )
}

function DropMenu({ items, onClose }: { items: { label: string; href: string; badge?: string }[]; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0,
      background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
      minWidth: 200, zIndex: 300, padding: '6px 0',
    }}>
      {items.map(item => (
        <Link key={item.href} href={item.href} onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          color: '#374151', textDecoration: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {item.label}
          {item.badge && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 3,
              background: '#E31E24', color: '#fff', letterSpacing: '0.03em',
            }}>{item.badge}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
