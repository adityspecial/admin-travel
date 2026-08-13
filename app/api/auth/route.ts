import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { isRateLimited } from '@/lib/rateLimit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

if (!process.env.ADMIN_SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET env var is required')
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET
const TOKEN_TTL_MS   = 24 * 60 * 60 * 1000 // 24 hours

// ── HMAC-SHA256 token (must match backend/lib/supabase/adminAuth.ts) ──────────
function signToken(email: string, role: string, iat: number, orgId?: string | null): string {
  const payload = Buffer.from(JSON.stringify({
    email, role,
    ...(orgId ? { orgId } : {}),
    iat,
    exp: iat + TOKEN_TTL_MS,
  })).toString('base64url')
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

// ── POST /api/auth ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
           ?? req.headers.get('x-real-ip')
           ?? '127.0.0.1'

  if (await isRateLimited(ip, { windowSec: 15 * 60, max: 5 })) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': String(15 * 60) } },
    )
  }

  const { email, password, force } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const normalised = email.trim().toLowerCase()

  const { data: adminUser, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, password_hash, org_id, current_session_iat, is_active')
    .eq('email', normalised)
    .single()

  if (error || !adminUser) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const { data: valid, error: rpcErr } = await supabaseAdmin.rpc('check_admin_password', {
    p_hash:     adminUser.password_hash,
    p_password: password,
  })

  if (rpcErr || !valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (adminUser.is_active === false) {
    return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 })
  }

  // Another login is already active (its token hasn't naturally expired yet)
  // — ask before silently kicking it out, unless the caller already confirmed.
  const existingSessionLive = !!adminUser.current_session_iat
    && adminUser.current_session_iat + TOKEN_TTL_MS > Date.now()
  if (existingSessionLive && !force) {
    return NextResponse.json({ error: 'already_logged_in', conflict: true }, { status: 409 })
  }

  let agentId: string | null = null
  if (adminUser.role === 'partner') {
    const { data: link } = await supabaseAdmin
      .from('partner_agent_admins')
      .select('agent_id')
      .eq('admin_id', adminUser.id)
      .maybeSingle()
    agentId = link?.agent_id ?? null
  }

  const iat = Date.now()
  await supabaseAdmin.from('admin_users').update({ current_session_iat: iat }).eq('id', adminUser.id)

  return NextResponse.json({
    token: signToken(normalised, adminUser.role, iat, adminUser.org_id),
    role: adminUser.role,
    orgId: adminUser.org_id ?? null,
    agentId,
  })
}
