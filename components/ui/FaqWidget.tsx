'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircleQuestion, X, Send, Search, CheckCheck,
  UserCheck, XCircle, FileText, Phone, Clock,
  Users, Building2, BarChart3, AlertTriangle,
  IndianRupee, Ticket, UserPlus, Wallet,
  type LucideIcon,
} from 'lucide-react'
import { adminFetch } from '@/lib/api'
import './FaqWidget.css'

type Portal = 'super' | 'biz' | 'partner'
type Category = 'Bookings' | 'Payments' | 'Users & Roles' | 'Reports' | 'Policies'

interface Intent {
  id: string
  label: string
  keywords: string[]
  category: Category
  icon: LucideIcon
  answer?: string
}

interface Message {
  id: number
  sender: 'bot' | 'user'
  text: string
  time: string
}

const STATIC_BY_PORTAL: Record<Portal, Intent[]> = {
  biz: [
    { id: 'approve', label: 'How do I approve a pending booking?', keywords: ['how do i approve', 'approve a booking', 'approve or reject'], category: 'Bookings', icon: UserCheck, answer: 'Go to Approvals, open the request, and click Approve or Reject. You can leave a note for the requester.' },
    { id: 'failed',  label: 'Where do I find failed or cancelled bookings?', keywords: ['failed booking', 'cancelled booking', 'where do i find'], category: 'Bookings', icon: XCircle, answer: 'The Bookings tab lists every booking with a status filter — switch it to Cancelled or Failed.' },
    { id: 'policy',  label: "How do I edit an org's policy or spend caps?", keywords: ['policy', 'spend cap', 'edit org'], category: 'Policies', icon: FileText, answer: "Go to that org's Policy Settings tab to change flight/hotel caps and approval rules." },
    { id: 'contact', label: 'Who do I contact for a payment/reconciliation issue?', keywords: ['payment issue', 'reconciliation', 'who do i contact'], category: 'Payments', icon: Phone, answer: 'Escalate to the finance/ops team on the #payments-ops Slack channel or email ops@airdunia.in.' },
  ],
  super: [
    { id: 'roles',   label: 'How do I manage staff roles and permissions?', keywords: ['staff roles', 'permissions', 'manage admins'], category: 'Users & Roles', icon: Users, answer: 'Go to Super Admin → Users to add/remove admins and set their role permissions.' },
    { id: 'onboard', label: 'How do I onboard a new organisation?', keywords: ['onboard', 'new organisation', 'new org'], category: 'Users & Roles', icon: Building2, answer: 'Go to Org Management → New Org, fill in company details, and assign an initial admin.' },
    { id: 'reports', label: 'Where do I find system-wide reports?', keywords: ['system-wide report', 'where do i find reports', 'revenue report'], category: 'Reports', icon: BarChart3, answer: 'The Stats/Reports section under Super Admin covers bookings, revenue, and org activity across the platform.' },
    { id: 'contact', label: 'Who do I contact for a payment/reconciliation issue?', keywords: ['payment issue', 'reconciliation', 'who do i contact'], category: 'Payments', icon: Phone, answer: 'Escalate to the finance/ops team on the #payments-ops Slack channel or email ops@airdunia.in.' },
  ],
  partner: [
    { id: 'commission', label: "How do I check a partner's commission?", keywords: ['commission', 'check a partner'], category: 'Payments', icon: IndianRupee, answer: 'Go to Partner Admin → Earnings to see commission breakdowns per agent/org.' },
    { id: 'issue',      label: 'Where do I resolve a partner booking issue?', keywords: ['booking issue', 'resolve a partner'], category: 'Bookings', icon: Ticket, answer: 'Open the booking under Partner Admin → Bookings — you can view provider status and escalate from there.' },
    { id: 'agent',      label: 'How do I add or edit a partner agent?', keywords: ['add a partner agent', 'edit a partner agent', 'add or edit'], category: 'Users & Roles', icon: UserPlus, answer: 'Go to Partner Admin → Agents to manage agent accounts and their assigned orgs.' },
    { id: 'contact',    label: 'Who do I contact for a payment/reconciliation issue?', keywords: ['payment issue', 'reconciliation', 'who do i contact'], category: 'Payments', icon: Phone, answer: 'Escalate to the finance/ops team on the #payments-ops Slack channel or email ops@airdunia.in.' },
  ],
}

const REAL_INTENT: Record<Portal, { id: string; label: string; keywords: string[]; category: Category; icon: LucideIcon }> = {
  biz:     { id: 'pending-count', label: 'How many pending approvals are there?', keywords: ['how many approval', 'how many pending', 'approvals count'], category: 'Bookings', icon: Clock },
  super:   { id: 'failed-today',  label: 'How many bookings failed today?',       keywords: ['failed today', 'bookings failed today', 'how many failed'], category: 'Bookings', icon: AlertTriangle },
  partner: { id: 'payouts',       label: 'How much is pending in payouts?',        keywords: ['pending payout', 'payouts pending', 'payout amount'], category: 'Payments', icon: Wallet },
}

async function fetchRealAnswer(portal: Portal): Promise<string> {
  if (portal === 'biz') {
    const d = await adminFetch('/api/admin/biz/approvals?status=all').catch(() => ({ approvals: [] }))
    const n = (d.approvals ?? []).filter((a: any) => a.status === 'pending').length
    return n === 0 ? 'No pending approvals right now.' : `There ${n === 1 ? 'is' : 'are'} ${n} pending approval${n === 1 ? '' : 's'}.`
  }
  if (portal === 'super') {
    const d = await adminFetch('/api/admin/super/booking-failures?days=30').catch(() => ({ stats: { today: 0 } }))
    const n = d.stats?.today ?? 0
    return n === 0 ? 'No bookings have failed today.' : `${n} booking${n === 1 ? '' : 's'} failed today.`
  }
  const d = await adminFetch('/api/admin/partner/dashboard').catch(() => ({ pendingPayouts: 0 }))
  const amt = d.pendingPayouts ?? 0
  return `₹${Number(amt).toLocaleString('en-IN')} is currently pending in payouts.`
}

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function greeting(): Message {
  return { id: 0, sender: 'bot', text: 'What do you need help with?', time: nowTime() }
}

export function FaqWidget() {
  const pathname = usePathname() || ''
  const portal: Portal | null = pathname.startsWith('/biz')
    ? 'biz'
    : pathname.startsWith('/partner')
    ? 'partner'
    : pathname.startsWith('/super')
    ? 'super'
    : null

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([greeting()])
  const [inputText, setInputText] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'All' | Category>('All')
  const nextId = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const realCache = useRef<string | undefined>(undefined)

  // Reset per-portal state when the portal changes so questions/answers/
  // filters from one portal never linger into another.
  useEffect(() => {
    setMessages([greeting()])
    nextId.current = 1
    realCache.current = undefined
    setSearch('')
    setActiveCategory('All')
  }, [portal])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const staticIntents = portal ? STATIC_BY_PORTAL[portal] : []
  const realIntent = portal ? REAL_INTENT[portal] : null
  const allIntents = useMemo(
    () => (realIntent ? [...staticIntents, realIntent] : staticIntents),
    [staticIntents, realIntent],
  )
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(allIntents.map(i => i.category)))] as ('All' | Category)[],
    [allIntents],
  )
  const topQuestions = allIntents.slice(0, 4)
  const visibleIntents = allIntents.filter(i => {
    if (activeCategory !== 'All' && i.category !== activeCategory) return false
    if (search && !i.label.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (!portal) return null

  function addMessage(sender: 'bot' | 'user', text: string) {
    const id = nextId.current++
    setMessages(prev => [...prev, { id, sender, text, time: nowTime() }])
    return id
  }

  function updateMessage(id: number, text: string) {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, text } : m)))
  }

  function ask(displayText: string, intentId: string) {
    addMessage('user', displayText)

    if (intentId === realIntent?.id) {
      const already = realCache.current !== undefined
      const botId = addMessage('bot', already ? realCache.current! : 'Checking…')
      if (!already) {
        fetchRealAnswer(portal as Portal).then(text => {
          realCache.current = text
          updateMessage(botId, text)
        })
      }
      return
    }

    const intent = staticIntents.find(i => i.id === intentId)
    addMessage('bot', intent?.answer ?? "Sorry, I don't have an answer for that yet.")
  }

  function matchKeyword(text: string): string | null {
    const lower = text.toLowerCase()
    for (const intent of allIntents) {
      if (intent.keywords.some(k => lower.includes(k))) return intent.id
    }
    return null
  }

  function handleSubmitText() {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    const matched = matchKeyword(text)
    if (matched) {
      ask(text, matched)
    } else {
      addMessage('user', text)
      addMessage('bot', "Sorry, I didn't quite get that — try one of the questions below.")
    }
  }

  return (
    <>
      <button className="faq-widget-toggle-btn" onClick={() => setOpen(o => !o)} title="Help & FAQs">
        {open ? <X size={22} /> : <MessageCircleQuestion size={22} />}
      </button>

      {open && (
        <div className="faq-widget-panel">
          <div className="faq-widget-header">
            <div className="faq-widget-header-left">
              <MessageCircleQuestion size={18} />
              <span>Q &amp; FAQs</span>
            </div>
            <button className="faq-widget-close-btn" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="faq-widget-scroll" ref={scrollRef}>
            <div className="faq-widget-greeting">Hi! How can we help you today?</div>

            <div className="faq-widget-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search FAQs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {!search && (
              <>
                <div className="faq-widget-section-head">Top Questions</div>
                <div className="faq-widget-top-grid">
                  {topQuestions.map(intent => {
                    const Icon = intent.icon
                    return (
                      <button key={intent.id} className="faq-widget-top-card" onClick={() => ask(intent.label, intent.id)}>
                        <Icon size={15} />
                        <span>{intent.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="faq-widget-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`faq-widget-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="faq-widget-chips">
              {visibleIntents.map(intent => (
                <button key={intent.id} className="faq-widget-chip" onClick={() => ask(intent.label, intent.id)}>
                  {intent.label}
                </button>
              ))}
              {visibleIntents.length === 0 && (
                <div className="faq-widget-no-results">No matching questions.</div>
              )}
            </div>

            <div className="faq-widget-thread">
              {messages.map(m => (
                <div key={m.id} className={`faq-widget-bubble-row ${m.sender}`}>
                  <div className={`faq-widget-bubble ${m.sender}`}>{m.text}</div>
                  <div className={`faq-widget-meta ${m.sender}`}>
                    {m.time}
                    {m.sender === 'user' && <CheckCheck size={12} style={{ color: 'var(--accent, #2563eb)' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="faq-widget-input-row">
            <input
              className="faq-widget-input"
              type="text"
              placeholder="Type your question…"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmitText() }}
            />
            <button className="faq-widget-send-btn" onClick={handleSubmitText} aria-label="Send">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default FaqWidget
