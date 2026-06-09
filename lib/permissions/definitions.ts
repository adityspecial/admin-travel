// Central permission definitions for all three portals.
// UI reads this to render the module/permission grid.
// Backend reads this to validate permission keys.

export type Portal = 'super_admin' | 'biz' | 'partner'

export interface PermissionDef {
  key:         string   // e.g. 'book_flight'
  label:       string   // e.g. 'Book Flight'
  description: string
  dangerous?:  boolean  // shown with warning highlight
}

export interface ModuleDef {
  key:         string
  label:       string
  icon:        string   // emoji
  permissions: PermissionDef[]
}

// ── SUPER ADMIN modules ───────────────────────────────────────────

export const SUPER_ADMIN_MODULES: ModuleDef[] = [
  {
    key: 'booking', label: 'Booking Module', icon: '✈️',
    permissions: [
      { key: 'book_flight',       label: 'Book Flight',       description: 'Search and book flights for customers' },
      { key: 'book_hotel',        label: 'Book Hotel',        description: 'Search and book hotels' },
      { key: 'book_bus',          label: 'Book Bus',          description: 'Search and book bus tickets' },
      { key: 'book_fixed_flight', label: 'Book Fixed Flight', description: 'Book fixed departure (Nexus/FareGuide) flights' },
      { key: 'cancel_booking',    label: 'Cancel Booking',    description: 'Cancel any booking on the platform', dangerous: true },
      { key: 'modify_booking',    label: 'Modify Booking',    description: 'Modify passenger/date details' },
      { key: 'issue_refund',      label: 'Issue Refund',      description: 'Trigger Razorpay refund', dangerous: true },
      { key: 'view_all_bookings', label: 'View All Bookings', description: 'See every booking across all users' },
      { key: 'view_pnr',          label: 'View PNR',          description: 'View airline PNR and booking reference' },
      { key: 'download_ticket',   label: 'Download Ticket',   description: 'Download e-ticket PDF' },
    ],
  },
  {
    key: 'partner', label: 'Partner Module', icon: '🤝',
    permissions: [
      { key: 'view_agents',    label: 'View Agents',      description: 'List and search all partner agents' },
      { key: 'edit_agent',     label: 'Edit Agent',       description: 'Update agent profile and commission' },
      { key: 'ban_agent',      label: 'Ban Agent',        description: 'Suspend or ban a partner agent', dangerous: true },
      { key: 'verify_kyc',     label: 'Verify KYC',       description: 'Approve agent KYC documents' },
      { key: 'set_commission', label: 'Set Commission',   description: 'Change agent commission percentage' },
      { key: 'view_wallet',    label: 'View Wallet',      description: 'See agent wallet balance and transactions' },
      { key: 'process_payout', label: 'Process Payout',   description: 'Trigger wallet payout to agent', dangerous: true },
      { key: 'view_bookings',  label: 'View Agent Bookings', description: 'See all bookings made by agents' },
    ],
  },
  {
    key: 'corporate', label: 'Corporate Module', icon: '🏢',
    permissions: [
      { key: 'view_orgs',      label: 'View Organisations', description: 'List all corporate organisations' },
      { key: 'create_org',     label: 'Create Org',         description: 'Onboard a new corporate organisation' },
      { key: 'edit_org',       label: 'Edit Org',           description: 'Edit org details and caps' },
      { key: 'delete_org',     label: 'Delete Org',         description: 'Permanently delete an organisation', dangerous: true },
      { key: 'set_policy',     label: 'Set Policy',         description: 'Override org travel policy caps' },
      { key: 'view_members',   label: 'View Members',       description: 'See all members in any org' },
      { key: 'manage_members', label: 'Manage Members',     description: 'Add/remove/role-change org members', dangerous: true },
      { key: 'view_spend',     label: 'View Spend',         description: 'See org-level spend dashboard' },
      { key: 'view_approvals', label: 'View Approvals',     description: 'See all pending approval requests' },
    ],
  },
  {
    key: 'finance', label: 'Finance Module', icon: '💰',
    permissions: [
      { key: 'view_payments',     label: 'View Payments',     description: 'See all Razorpay payment records' },
      { key: 'process_refund',    label: 'Process Refund',    description: 'Initiate refund via Razorpay', dangerous: true },
      { key: 'manual_adjustment', label: 'Manual Adjustment', description: 'Manually adjust wallet/ledger balance', dangerous: true },
      { key: 'view_ledger',       label: 'View Ledger',       description: 'Full transaction ledger access' },
      { key: 'view_commissions',  label: 'View Commissions',  description: 'See agent commission records' },
      { key: 'process_payout',    label: 'Process Payout',    description: 'Approve and trigger agent payouts', dangerous: true },
      { key: 'view_wallet',       label: 'View Wallet',       description: 'View any user or agent wallet' },
      { key: 'manage_rules',      label: 'Manage Rules',      description: 'Set commission and markup rules' },
      { key: 'view_revenue',      label: 'View Revenue',      description: 'Platform-wide revenue dashboard' },
    ],
  },
  {
    key: 'user', label: 'User Module', icon: '👤',
    permissions: [
      { key: 'view_users',    label: 'View Users',     description: 'List and search all B2C users' },
      { key: 'edit_profile',  label: 'Edit Profile',   description: 'Edit user profile details' },
      { key: 'ban_user',      label: 'Ban User',       description: 'Suspend or ban a B2C user', dangerous: true },
      { key: 'view_bookings', label: 'View Bookings',  description: "See a user's booking history" },
      { key: 'login_as',      label: 'Login As User',  description: 'Impersonate a user for support', dangerous: true },
      { key: 'delete_user',   label: 'Delete User',    description: 'Permanently delete a user account', dangerous: true },
      { key: 'approve_kyc',   label: 'Approve KYC',    description: 'Approve user KYC documents' },
      { key: 'view_wallet',   label: 'View Wallet',    description: "View user's wallet balance" },
    ],
  },
  {
    key: 'content', label: 'Content Module', icon: '📢',
    permissions: [
      { key: 'manage_promos',       label: 'Manage Promos',        description: 'Create/edit/delete promo codes' },
      { key: 'manage_banners',      label: 'Manage Banners',       description: 'Home screen banner management' },
      { key: 'manage_packages',     label: 'Manage Packages',      description: 'Curated holiday packages' },
      { key: 'manage_destinations', label: 'Manage Destinations',  description: 'Popular destinations and content' },
      { key: 'edit_fixed_flights',  label: 'Edit Fixed Flights',   description: 'Manage Nexus/FareGuide featured routes' },
      { key: 'manage_markup',       label: 'Manage Markup',        description: 'Set price markup on all bookings', dangerous: true },
    ],
  },
  {
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
      { key: 'view_revenue',          label: 'View Revenue',         description: 'Platform revenue dashboard' },
      { key: 'view_bookings_report',  label: 'Bookings Report',      description: 'All bookings with filters' },
      { key: 'view_agent_report',     label: 'Agent Report',         description: 'Per-agent performance report' },
      { key: 'view_org_report',       label: 'Corporate Report',     description: 'Per-org spend and travel report' },
      { key: 'view_geo_report',       label: 'Geo Report',           description: 'Booking geography heatmap' },
      { key: 'export_csv',            label: 'Export CSV',           description: 'Download reports as CSV' },
    ],
  },
  {
    key: 'risk', label: 'Risk Module', icon: '🛡️',
    permissions: [
      { key: 'view_flags',         label: 'View Flags',         description: 'See fraud/risk flagged transactions' },
      { key: 'manage_ip_block',    label: 'Manage IP Block',    description: 'Block/unblock IP addresses', dangerous: true },
      { key: 'view_logs',          label: 'View Logs',          description: 'Access system and API logs' },
      { key: 'device_fingerprint', label: 'Device Fingerprint', description: 'View device fingerprint data' },
      { key: 'view_suspicious',    label: 'View Suspicious',    description: 'Suspicious activity dashboard' },
      { key: 'block_user',         label: 'Block User',         description: 'Emergency block any user', dangerous: true },
    ],
  },
  {
    key: 'system', label: 'System Module', icon: '⚙️',
    permissions: [
      { key: 'manage_roles',       label: 'Manage Roles',       description: 'Create and edit admin roles', dangerous: true },
      { key: 'manage_permissions', label: 'Manage Permissions', description: 'Edit the permission matrix', dangerous: true },
      { key: 'maintenance_mode',   label: 'Maintenance Mode',   description: 'Toggle platform maintenance mode', dangerous: true },
      { key: 'manage_settings',    label: 'Manage Settings',    description: 'Platform-wide configuration', dangerous: true },
      { key: 'view_audit_log',     label: 'View Audit Log',     description: 'Full admin action audit trail' },
      { key: 'manage_api_keys',    label: 'Manage API Keys',    description: 'TekTravels/TBO/Razorpay key management', dangerous: true },
    ],
  },
]

// ── BIZ (Corporate) modules ───────────────────────────────────────

export const BIZ_MODULES: ModuleDef[] = [
  {
    key: 'travel', label: 'Travel Module', icon: '✈️',
    permissions: [
      { key: 'book_flight',         label: 'Book Flight',         description: 'Book flights within policy cap' },
      { key: 'book_hotel',          label: 'Book Hotel',          description: 'Book hotels within policy cap' },
      { key: 'book_bus',            label: 'Book Bus',            description: 'Book bus tickets' },
      { key: 'book_fixed_flight',   label: 'Book Fixed Flight',   description: 'Book fixed departure flights' },
      { key: 'book_international',  label: 'Book International',  description: 'Book international flights' },
      { key: 'book_business_class', label: 'Book Business Class', description: 'Allowed to book business class seats' },
      { key: 'book_first_class',    label: 'Book First Class',    description: 'Allowed to book first class seats' },
      { key: 'self_approve',        label: 'Self Approve',        description: 'Approve own bookings without manager', dangerous: true },
    ],
  },
  {
    key: 'team', label: 'Team Module', icon: '👥',
    permissions: [
      { key: 'invite_member',       label: 'Invite Member',       description: 'Send invite to new team member' },
      { key: 'remove_member',       label: 'Remove Member',       description: 'Remove a member from the org', dangerous: true },
      { key: 'edit_member',         label: 'Edit Member',         description: 'Edit member profile and department' },
      { key: 'change_role',         label: 'Change Role',         description: 'Change a member role', dangerous: true },
      { key: 'view_all_members',    label: 'View All Members',    description: 'See full org member list' },
      { key: 'manage_departments',  label: 'Manage Departments',  description: 'Create/edit departments' },
      { key: 'manage_cost_centers', label: 'Manage Cost Centers', description: 'Create/edit cost centers' },
    ],
  },
  {
    key: 'approval', label: 'Approval Module', icon: '✅',
    permissions: [
      { key: 'approve_own_dept',  label: 'Approve Own Dept',  description: 'Approve trips for own department only' },
      { key: 'approve_all',       label: 'Approve All',       description: 'Approve any trip in the org' },
      { key: 'reject_booking',    label: 'Reject Booking',    description: 'Reject and return a travel request' },
      { key: 'view_pending',      label: 'View Pending',      description: 'See all pending approval requests' },
      { key: 'set_auto_approve',  label: 'Set Auto-Approve',  description: 'Configure auto-approval rules' },
      { key: 'view_history',      label: 'View History',      description: 'See approval history log' },
    ],
  },
  {
    key: 'policy', label: 'Policy Module', icon: '📋',
    permissions: [
      { key: 'set_flight_cap',      label: 'Set Flight Cap',      description: 'Change max ₹ per flight booking' },
      { key: 'set_hotel_cap',       label: 'Set Hotel Cap',       description: 'Change max ₹ per hotel night' },
      { key: 'set_advance_days',    label: 'Set Advance Days',    description: 'Set how far in advance bookings allowed' },
      { key: 'set_allowed_class',   label: 'Set Allowed Class',   description: 'Restrict allowed cabin classes' },
      { key: 'require_purpose',     label: 'Require Purpose',     description: 'Force business purpose on all trips' },
      { key: 'require_cost_center', label: 'Require Cost Center', description: 'Force cost center selection' },
    ],
  },
  {
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
      { key: 'view_own_trips',    label: 'View Own Trips',    description: 'See own booking history only' },
      { key: 'view_team_trips',   label: 'View Team Trips',   description: "See own department's trips" },
      { key: 'view_all_trips',    label: 'View All Trips',    description: 'See all trips across the org' },
      { key: 'view_spend_report', label: 'View Spend Report', description: 'Org-wide spend analytics' },
      { key: 'view_dept_report',  label: 'View Dept Report',  description: 'Department-level spend breakdown' },
      { key: 'export_csv',        label: 'Export CSV',        description: 'Download reports as CSV' },
    ],
  },
  {
    key: 'finance', label: 'Finance Module', icon: '💰',
    permissions: [
      { key: 'view_invoices',    label: 'View Invoices',    description: 'Download booking invoices' },
      { key: 'view_gst_reports', label: 'View GST Reports', description: 'GST-compliant expense reports' },
      { key: 'view_wallet',      label: 'View Wallet',      description: 'See org prepaid wallet balance' },
    ],
  },
]

// ── PARTNER modules ───────────────────────────────────────────────

export const PARTNER_MODULES: ModuleDef[] = [
  {
    key: 'booking', label: 'Booking Module', icon: '✈️',
    permissions: [
      { key: 'book_flight',        label: 'Book Flight',        description: 'Book flights for customers' },
      { key: 'book_hotel',         label: 'Book Hotel',         description: 'Book hotels for customers' },
      { key: 'book_bus',           label: 'Book Bus',           description: 'Book bus tickets' },
      { key: 'book_fixed_flight',  label: 'Book Fixed Flight',  description: 'Book Nexus/FareGuide fixed flights' },
      { key: 'book_international', label: 'Book International', description: 'Book international flights' },
      { key: 'cancel_booking',     label: 'Cancel Booking',     description: 'Cancel a customer booking', dangerous: true },
      { key: 'view_pnr',           label: 'View PNR',           description: 'See airline PNR details' },
      { key: 'download_ticket',    label: 'Download Ticket',    description: 'Download e-ticket PDF' },
    ],
  },
  {
    key: 'customer', label: 'Customer Module', icon: '👤',
    permissions: [
      { key: 'add_customer',           label: 'Add Customer',            description: 'Create new customer profile' },
      { key: 'edit_customer',          label: 'Edit Customer',           description: 'Update customer details' },
      { key: 'view_customers',         label: 'View Customers',          description: 'See full customer list' },
      { key: 'view_customer_bookings', label: 'View Customer Bookings',  description: "See customer's booking history" },
      { key: 'delete_customer',        label: 'Delete Customer',         description: 'Remove a customer profile', dangerous: true },
    ],
  },
  {
    key: 'sub_agent', label: 'Sub-Agent Module', icon: '🤝',
    permissions: [
      { key: 'invite_sub_agent',      label: 'Invite Sub-Agent',      description: 'Add sub-agent under your account' },
      { key: 'remove_sub_agent',      label: 'Remove Sub-Agent',      description: 'Remove a sub-agent', dangerous: true },
      { key: 'set_commission',        label: 'Set Commission',        description: 'Set sub-agent commission %' },
      { key: 'view_sub_bookings',     label: 'View Sub Bookings',     description: "See sub-agent's bookings" },
      { key: 'view_sub_earnings',     label: 'View Sub Earnings',     description: "See sub-agent's earnings" },
      { key: 'override_permissions',  label: 'Override Permissions',  description: 'Grant/revoke individual sub-agent permissions', dangerous: true },
    ],
  },
  {
    key: 'finance', label: 'Finance Module', icon: '💰',
    permissions: [
      { key: 'view_wallet',        label: 'View Wallet',        description: 'See wallet balance' },
      { key: 'request_payout',     label: 'Request Payout',     description: 'Request withdrawal to bank' },
      { key: 'view_commissions',   label: 'View Commissions',   description: 'See commission breakdown' },
      { key: 'view_ledger',        label: 'View Ledger',        description: 'Full transaction ledger' },
      { key: 'view_sub_earnings',  label: 'View Sub Earnings',  description: "See sub-agents' earnings" },
    ],
  },
  {
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
      { key: 'view_own_bookings',    label: 'View Own Bookings',   description: 'Own booking history' },
      { key: 'view_team_bookings',   label: 'View Team Bookings',  description: "All sub-agents' bookings" },
      { key: 'view_earnings_report', label: 'Earnings Report',     description: 'Commission and earnings analytics' },
      { key: 'export_csv',           label: 'Export CSV',          description: 'Download reports as CSV' },
    ],
  },
]

// Lookup helpers
export const MODULES_BY_PORTAL: Record<Portal, ModuleDef[]> = {
  super_admin: SUPER_ADMIN_MODULES,
  biz:         BIZ_MODULES,
  partner:     PARTNER_MODULES,
}

export function getAllPermissionKeys(portal: Portal): string[] {
  return MODULES_BY_PORTAL[portal].flatMap(m => m.permissions.map(p => `${m.key}.${p.key}`))
}

export function isValidPermission(portal: Portal, module: string, permission: string): boolean {
  const mod = MODULES_BY_PORTAL[portal].find(m => m.key === module)
  if (!mod) return false
  return mod.permissions.some(p => p.key === permission)
}
