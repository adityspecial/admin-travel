'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, adminFetch } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function BizAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const checked  = useRef(false)
  const [email, setEmail] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [logoUrl, setLogoUrl] = useState('')
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
    adminFetch('/api/admin/biz/policy')
      .then(d => setLogoUrl(d.policy?.logo_url ?? ''))
      .catch(() => {})
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

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'Inter', sans-serif" }}>
      {/* ── New PartnerNavBar-inspired Navbar for Biz ── */}
      <Navbar
        userEmail={email}
        pendingCount={pendingCount}
        logoUrl={logoUrl}
        onLogout={logout}
      />

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
