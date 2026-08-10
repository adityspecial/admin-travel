import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export { supabase }

const DEV_TOKEN_KEY = 'admin_dev_token'

// Decode the HMAC token payload (browser-safe, no Node crypto)
function decodeTokenPayload(token: string): { role?: string; email?: string; orgId?: string } {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return {}
    const payload = token.slice(0, dot)
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    )
    return JSON.parse(json)
  } catch {
    return {}
  }
}

// For endpoints that return a file (CSV export) instead of JSON — adminFetch
// always parses the body as JSON, which would break on a text/csv response.
export async function adminDownload(path: string, filename: string, opts?: { agentId?: string; orgId?: string }) {
  const devToken = typeof window !== 'undefined' ? sessionStorage.getItem(DEV_TOKEN_KEY) : null
  const { data: { session } } = await supabase.auth.getSession()
  const token = devToken ?? session?.access_token ?? ''

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (opts?.agentId) headers['x-agent-id'] = opts.agentId
  if (opts?.orgId) headers['x-org-id'] = opts.orgId

  const res = await fetch(path, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(data.error ?? res.statusText)
  }

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export async function adminFetch(
  path: string,
  options: RequestInit & { agentId?: string; orgId?: string } = {},
) {
  const devToken = typeof window !== 'undefined' ? sessionStorage.getItem(DEV_TOKEN_KEY) : null
  const { data: { session } } = await supabase.auth.getSession()
  const token = devToken ?? session?.access_token ?? ''

  const { agentId: explicitAgentId, orgId: explicitOrgId, ...fetchOptions } = options as any

  // Auto-extract orgId from token for biz admin routes
  let orgId = explicitOrgId
  if (!orgId && devToken) {
    const decoded = decodeTokenPayload(devToken)
    if (decoded.role === 'biz' && decoded.orgId) {
      orgId = decoded.orgId
    }
  }

  // Auto-extract agentId for partner admin routes — same reasoning as orgId
  // above. Unlike orgId, agentId was never embedded in the signed token
  // itself, so it comes from sessionStorage (set at login) instead. Without
  // this, any partner-admin page/component that forgets to pass agentId
  // explicitly (e.g. OverrideEngine) silently loses agent scoping.
  let agentId = explicitAgentId
  if (!agentId && devToken) {
    const decoded = decodeTokenPayload(devToken)
    if (decoded.role === 'partner') {
      agentId = (typeof window !== 'undefined' ? sessionStorage.getItem('partner_agent_id') : null) ?? undefined
    }
  }

  const res = await fetch(path, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token  ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId  ? { 'x-org-id': orgId }               : {}),
      ...(agentId ? { 'x-agent-id': agentId }           : {}),
      ...((fetchOptions.headers as Record<string, string> | undefined) ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}
