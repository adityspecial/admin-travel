import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? 'airdunia_admin_dev_only'
const TOKEN_TTL_MS   = 24 * 60 * 60 * 1000 // 24 hours

// ── In-memory rate limiter (5 attempts per IP per 15 min) ────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRate(ip: string): { ok: boolean; retryAfter?: number } {
  const now   = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return { ok: true }
  }
  if (entry.count >= 5) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { ok: true }
}

function clearRate(ip: string) { attempts.delete(ip) }

// ── HMAC-SHA256 token (must match backend/lib/supabase/adminAuth.ts) ──────────
function signToken(email: string, role: string, orgId?: string | null): string {
  const payload = Buffer.from(JSON.stringify({
    email, role,
    ...(orgId ? { orgId } : {}),
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  })).toString('base64url')
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

// ── POST /api/auth ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
           ?? req.headers.get('x-real-ip')
           ?? '127.0.0.1'

  const rate = checkRate(ip)
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((rate.retryAfter ?? 900) / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter ?? 900) } },
    )
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const normalised = email.trim().toLowerCase()

  const { data: adminUser, error } = await supabaseAdmin
    .from('admin_users')
    .select('role, password_hash, org_id')
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

  clearRate(ip)
  return NextResponse.json({
    token: signToken(normalised, adminUser.role, adminUser.org_id),
    role: adminUser.role,
    orgId: adminUser.org_id ?? null,
  })
}
