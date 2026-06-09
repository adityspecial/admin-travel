# AirDunia — Admin Portal

Next.js 15 internal admin portal with three separate role-based sections: **Super Admin** (platform-wide), **myBiz Admin** (company/corporate travel), and **myPartner Admin** (travel agent management).

**Port:** `3001`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Auth | Custom JWT-based session (`admin_dev_token` in `sessionStorage`) |
| Styling | Custom CSS design system (`app/globals.css`) |
| Icons | Lucide React |
| Backend API | AirDunia Backend (`NEXT_PUBLIC_BACKEND_URL`) |

---

## Project Structure

```
admin/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Admin login — issues role-scoped JWT
│   ├── biz/                        # myBiz Admin (company travel admin)
│   │   ├── layout.tsx              # Role guard (biz) + sidebar nav
│   │   ├── page.tsx                # Dashboard — stats + recent activity
│   │   ├── members/page.tsx        # Organisation members — roles, departments
│   │   ├── approvals/page.tsx      # Trip approval workflow
│   │   ├── policy/page.tsx         # Travel policy rules
│   │   ├── cost-centers/page.tsx   # Cost center management
│   │   ├── auto-approval/page.tsx  # Auto-approval rules
│   │   ├── blackout-dates/page.tsx # Travel blackout date configuration
│   │   ├── wallet/page.tsx         # Company wallet + transaction history
│   │   ├── reports/page.tsx        # Booking + GMV reports with Excel export
│   │   ├── notifications/page.tsx  # Admin notification feed
│   │   └── permissions/page.tsx    # Role-based access control
│   ├── partner/                    # myPartner Admin (agent admin view)
│   │   ├── layout.tsx              # Role guard (partner) + sidebar nav
│   │   ├── page.tsx                # Agent dashboard — wallet, commissions
│   │   ├── bookings/page.tsx       # Agent's booking list with search + filters
│   │   ├── sub-agents/page.tsx     # Sub-agent network management
│   │   ├── customers/page.tsx      # Agent CRM view
│   │   ├── markups/page.tsx        # Fare markup configuration
│   │   ├── earnings/page.tsx       # Commission ledger + monthly chart
│   │   ├── payouts/page.tsx        # Payout request management
│   │   ├── reports/page.tsx        # Revenue + booking reports
│   │   └── permissions/page.tsx    # Agent access control
│   └── super/                      # Super Admin (platform-wide)
│       ├── layout.tsx              # Role guard (super) + sidebar nav
│       ├── page.tsx                # Platform dashboard — overall stats
│       ├── agents/page.tsx         # All partner agents — edit tier, commission, wallet top-up
│       ├── orgs/                   # Business organisations
│       │   ├── page.tsx            # Org list — activate / deactivate
│       │   ├── new/page.tsx        # Create new organisation
│       │   └── [id]/page.tsx       # Org detail + member count + settings
│       ├── partners/page.tsx       # Partner admin accounts — create + list
│       ├── users/page.tsx          # All members across all organisations
│       ├── fixed-flights/page.tsx  # Fixed departure (charter) management
│       ├── fareguide/page.tsx      # FareGuide sector management
│       └── permissions/page.tsx    # Super admin permissions
├── components/
│   └── Pagination.tsx              # Shared pagination component + usePagination hook
└── lib/
    ├── api.ts                      # adminFetch() — attaches admin_dev_token header
    └── excel.ts                    # Excel export helper
```

---

## Three Portals

### `/super` — Super Admin
Full platform visibility. Can:
- View and manage all partner agents (edit tier, commission %, credit limit, wallet top-up)
- Create / activate / deactivate business organisations
- Create partner admin accounts (link to agent)
- View all members across all organisations
- Manage fixed departure tours and FareGuide sectors

### `/biz` — myBiz Admin
Company travel administrator. Can:
- Manage organisation members (role, department)
- Configure travel policy (max flight fare, hotel star rating, advance booking days)
- Process trip approval requests (approve / reject with comments)
- Set up cost centers, auto-approval rules, blackout dates
- View company wallet balance and transactions
- Generate booking reports

### `/partner` — myPartner Admin
Senior agent with admin access. Can:
- View all bookings made by self and sub-agents
- Manage sub-agents in their network
- View and manage customer CRM
- Configure fare markups per service type
- Track commission earnings and request payouts
- Generate revenue reports with Excel export

---

## Authentication

The admin portal uses a custom lightweight JWT stored in `sessionStorage` under the key `admin_dev_token`. The token payload contains `{ role: 'super' | 'biz' | 'partner' }`.

Each portal's layout.tsx has a role guard:
```ts
// Only allows 'super' role into /super
// Redirects to /login or appropriate portal if wrong role
```

The `adminFetch()` utility in `lib/api.ts` automatically attaches this token as an `Authorization: Bearer` header to all API calls.

---

## Pagination

All list pages use the shared `Pagination` component and `usePagination` hook from `components/Pagination.tsx`.

```tsx
const { slice: pageItems, page, setPage, total } = usePagination(filteredItems, 20)

// In render:
<table>
  {pageItems.map(item => ...)}
</table>
<Pagination total={total} page={page} perPage={20} onPage={setPage} />
```

The hook automatically resets to page 1 when the filtered list changes (e.g. after a search query update).

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_MYPARTNER_URL=http://localhost:3002   # Used for deep-link buttons
```

---

## Running Locally

```bash
npm install
npm run dev    # runs on port 3001
```

**Prerequisites:**
- Backend running on port 3000
- Admin user with appropriate role in Supabase

---

## Excel Reports

Reports pages (partner/reports, biz/reports) support Excel export using the `downloadExcel()` helper in `lib/excel.ts`. The function takes a filename and an array of sheet definitions:

```ts
downloadExcel('AirDunia-Report-2026', [
  {
    name: 'Summary',
    headers: ['Metric', 'Value'],
    rows: [['Total GMV', 1500000], ['Commission', 75000]],
  },
  {
    name: 'Monthly Breakdown',
    headers: ['Month', 'Bookings', 'GMV'],
    rows: data.monthly.map(m => [m.month, m.count, m.gmv]),
  },
])
```
