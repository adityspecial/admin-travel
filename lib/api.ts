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

export async function adminFetch(
  path: string,
  options: RequestInit & { agentId?: string; orgId?: string } = {},
) {
  const devToken = typeof window !== 'undefined' ? sessionStorage.getItem(DEV_TOKEN_KEY) : null
  const { data: { session } } = await supabase.auth.getSession()
  const token = devToken ?? session?.access_token ?? ''

  const { agentId, orgId: explicitOrgId, ...fetchOptions } = options as any

  // Auto-extract orgId from token for biz admin routes
  let orgId = explicitOrgId
  if (!orgId && devToken) {
    const decoded = decodeTokenPayload(devToken)
    if (decoded.role === 'biz' && decoded.orgId) {
      orgId = decoded.orgId
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
