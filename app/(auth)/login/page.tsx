'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConflict, setShowConflict] = useState(false)

  async function attemptLogin(force: boolean) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, ...(force ? { force: true } : {}) }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 409 && data.conflict) {
        setShowConflict(true)
        setLoading(false)
        return
      }
      setError(data.error ?? 'Invalid credentials')
      setLoading(false)
      return
    }

    sessionStorage.setItem('admin_dev_token', data.token)
    if (data.role === 'partner' && data.agentId) {
      sessionStorage.setItem('partner_agent_id', data.agentId)
    }
    const redirect = data.role === 'super' ? '/super' : data.role === 'partner' ? '/partner' : '/biz'
    window.location.href = redirect
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShowConflict(false)
    try {
      await attemptLogin(false)
    } catch {
      setError('Connection error. Is the backend running?')
      setLoading(false)
    }
  }

  async function confirmLogoutOtherDevice() {
    setLoading(true)
    setShowConflict(false)
    try {
      await attemptLogin(true)
    } catch {
      setError('Connection error. Is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <h1>AirDunia</h1>
          <p>Colorful admin access for super and company teams</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@airdunia.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      {showConflict && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 26px', maxWidth: 380, width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800, color: '#111827' }}>Already signed in elsewhere</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>
              This account is signed in on another device or browser. Signing in here will log that session out. Continue?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowConflict(false); setLoading(false) }}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogoutOtherDevice}
                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Log out other device & continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
