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
      { key: 'cancel_booking',    label: 'Cancel Booking',    description: 'Cancel any booking on the platform', dangerous: true },
      { key: 'modify_booking',    label: 'Modify Booking',    description: 'Modify passenger/date details' },
      { key: 'view_all_bookings', label: 'View All Bookings', description: 'See every booking across all users' },
      { key: 'view_pnr',          label: 'View PNR',          description: 'View airline PNR and booking reference' },
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
    ],
  },
  {
    key: 'corporate', label: 'Corporate Module', icon: '🏢',
    permissions: [
      { key: 'view_orgs',      label: 'View Organisations', description: 'List all corporate organisations' },
      { key: 'create_org',     label: 'Create Org',         description: 'Onboard a new corporate organisation' },
      { key: 'edit_org',       label: 'Edit Org',           description: 'Edit org details and caps' },
      { key: 'delete_org',     label: 'Delete Org',         description: 'Permanently delete an organisation', dangerous: true },
      { key: 'view_members',   label: 'View Members',       description: 'See all members in any org' },
      { key: 'manage_members', label: 'Manage Members',     description: 'Add/remove/role-change org members', dangerous: true },
      { key: 'view_spend',     label: 'View Spend',         description: 'See org-level spend dashboard' },
      { key: 'view_approvals', label: 'View Approvals',     description: 'See all pending approval requests' },
      { key: 'view_trip_requests', label: 'View Trip Requests', description: 'See all raised trip requests across orgs' },
      { key: 'toggle_active',  label: 'Toggle Org Active',  description: "Flip an org's active/inactive kill-switch", dangerous: true },
      { key: 'override_cap',   label: 'Override Cap',       description: "Directly override an org's cap/buffer as a logged emergency action", dangerous: true },
      { key: 'view_policy_audit_log', label: 'View Policy Audit Log', description: 'See who changed which org cap/buffer, and when' },
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
      { key: 'manage_markup',     label: 'Manage Markup',     description: 'Set price markup on all bookings', dangerous: true },
      { key: 'manage_disputes',   label: 'Manage Disputes',   description: 'Handle Razorpay chargebacks, approval disputes, and booking disputes', dangerous: true },
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
      { key: 'edit_fixed_flights',  label: 'Edit Fixed Flights',   description: 'Manage Nexus/FareGuide featured routes' },
      { key: 'manage_visa',         label: 'Manage Visa Pages',    description: 'Create/edit visa content pages and respond to visa enquiries' },
      { key: 'manage_offline_hotels', label: 'Manage Offline Hotels', description: 'Manage direct tie-up hotel inventory (add/edit hotels, rooms, rates)' },
      { key: 'manage_offline_hotel_bookings', label: 'Manage Offline Hotel Bookings', description: 'Review pending offline hotel booking requests and confirm/reject them' },
      { key: 'manage_traveller_stories', label: 'Manage Traveller Stories', description: 'Review and approve/reject user-submitted travel stories' },
    ],
  },
  {
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
      { key: 'view_revenue',          label: 'View Revenue',         description: 'Platform revenue dashboard' },
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
      { key: 'manage_admin_staff', label: 'Manage Admin Staff', description: 'Assign/remove which AirDunia staff manage which orgs', dangerous: true },
      { key: 'view_provider_health', label: 'View Provider Health', description: 'Monitor supplier API errors, webhook delivery, and PNR sync health' },
      { key: 'resolve_provider_issues', label: 'Resolve Provider Issues', description: 'Resolve PNR mismatches and failed bookings', dangerous: true },
    ],
  },
  {
    key: 'notification', label: 'Notification Module', icon: '📣',
    permissions: [
      { key: 'send_notification', label: 'Send Notification', description: 'Email a targeted message to one org, one agent, or all B2C users' },
    ],
  },
]

// ── BIZ (Corporate) modules ───────────────────────────────────────

export const BIZ_MODULES: ModuleDef[] = [
  {
    key: 'travel', label: 'Travel Module', icon: '✈️',
    permissions: [
      { key: 'book_flight',         label: 'Book Flight',         description: 'Book flights within policy cap (oneway, roundtrip, or multicity)' },
      { key: 'book_hotel',          label: 'Book Hotel',          description: 'Book hotels within policy cap' },
      { key: 'book_bus',            label: 'Book Bus',            description: 'Book bus tickets' },
      { key: 'book_cab',            label: 'Book Cab',            description: 'Book cabs within policy cap' },
      { key: 'book_insurance',      label: 'Book Insurance',      description: 'Purchase travel insurance' },
      { key: 'book_fixed_flight',   label: 'Book Fixed Flight',   description: 'Book fixed-departure/alt-source flights (Nexus, FareGuide, AirIQ, Kafila)' },
      { key: 'book_package',        label: 'Book Package',        description: 'Book holiday packages' },
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
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
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
      { key: 'view_wallet',      label: 'View Wallet',      description: 'See org prepaid wallet balance' },
      { key: 'use_wallet',       label: 'Use Wallet',       description: 'Pay for bookings using the org prepaid wallet' },
    ],
  },
  {
    // Governs an AirDunia staff member assigned to manage ONE org via
    // admin/biz/* (targetType 'admin_staff') — distinct from the modules
    // above, which govern the org's OWN employees (targetType 'biz_member').
    // withBizAdmin previously granted unrestricted access to everything
    // under admin/biz/* once you were assigned to an org; this is the first
    // real granularity on top of that.
    key: 'org_admin', label: 'Org Admin Module', icon: '🛠️',
    permissions: [
      { key: 'edit_caps',           label: 'Edit Caps',            description: 'Edit flight/hotel/cab/visa/package/insurance caps + buffers' },
      { key: 'edit_travel_policy',  label: 'Edit Travel Policy',   description: 'Edit approval tiers, colleague-booking rule, cabin/addon restrictions' },
      { key: 'manage_members',      label: 'Manage Members',       description: "Invite/remove/change role of the org's employees", dangerous: true },
      { key: 'view_wallet',         label: 'View Wallet',          description: 'See org wallet balance/transactions' },
      { key: 'topup_wallet',        label: 'Top Up Wallet',        description: 'Add funds to the org wallet', dangerous: true },
      { key: 'view_approvals',      label: 'View Approvals',       description: "See the org's approval queue" },
      { key: 'decide_approvals',    label: 'Decide Approvals',     description: "Approve/reject on the org's behalf", dangerous: true },
      { key: 'edit_company',        label: 'Edit Company',         description: 'Edit org name/GST/logo/org_code' },
      { key: 'manage_promos',       label: 'Manage Promos',        description: 'Create/edit org-scoped promo codes' },
      { key: 'manage_cost_centers', label: 'Manage Cost Centers',  description: 'Create/edit cost centers and trip tags' },
      { key: 'respond_support',     label: 'Respond to Support',   description: "Respond to the org's support requests" },
      { key: 'view_bookings',       label: 'View Bookings',        description: "View the org's real bookings across flight/hotel/cab/insurance" },
      { key: 'view_reports',        label: 'View Reports',         description: "View the org's spend analytics and reports" },
      { key: 'manage_disputes',     label: 'Manage Disputes',      description: "View and raise disputes on the org's bookings" },
      { key: 'view_invoices',       label: 'View Invoices',        description: "View and download the org's GST invoices" },
      { key: 'manage_permissions',  label: 'Manage Permissions',   description: "Manage the org's own employee permission roles and access levels", dangerous: true },
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
      { key: 'book_cab',           label: 'Book Cab',           description: 'Book cabs for customers' },
      { key: 'book_fixed_flight',  label: 'Book Fixed Flight',  description: 'Book Nexus/FareGuide fixed flights' },
      { key: 'book_international', label: 'Book International', description: 'Book international flights' },
      { key: 'cancel_booking',     label: 'Cancel Booking',     description: 'Cancel a customer booking', dangerous: true },
      { key: 'view_pnr',           label: 'View PNR',           description: 'See airline PNR details' },
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
      { key: 'override_permissions',  label: 'Override Permissions',  description: 'Grant/revoke individual sub-agent permissions', dangerous: true },
    ],
  },
  {
    key: 'finance', label: 'Finance Module', icon: '💰',
    permissions: [
      { key: 'view_wallet',        label: 'View Wallet',        description: 'See wallet balance' },
      { key: 'request_payout',     label: 'Request Payout',     description: 'Request withdrawal to bank' },
      { key: 'view_ledger',        label: 'View Ledger',        description: 'Full transaction ledger' },
      { key: 'view_sub_earnings',  label: 'View Sub Earnings',  description: "See sub-agents' earnings" },
    ],
  },
  {
    key: 'report', label: 'Report Module', icon: '📊',
    permissions: [
      { key: 'view_team_bookings',   label: 'View Team Bookings',  description: "All sub-agents' bookings" },
      { key: 'view_earnings_report', label: 'Earnings Report',     description: 'Commission and earnings analytics' },
      { key: 'export_csv',           label: 'Export CSV',          description: 'Download reports as CSV' },
    ],
  },
  {
    // Governs an AirDunia/agency staffer assigned to manage ONE partner
    // agency via admin/partner/* (targetType 'agent_admin', linked through
    // partner_agent_admins) — distinct from the modules above, which govern
    // the agency's own self-service capabilities (targetType 'partner_agent').
    // withPartnerAdmin previously granted unrestricted access to everything
    // under admin/partner/* once assigned to an agency; this is the first
    // real granularity on top of that.
    key: 'agent_admin', label: 'Partner Admin Module', icon: '🛠️',
    permissions: [
      { key: 'manage_sub_agents',      label: 'Manage Sub-Agents',      description: "Edit a sub-agent's tier, commission, credit limit, or status" },
      { key: 'view_wallet',            label: 'View Wallet',            description: 'See the agency wallet balance/transactions' },
      { key: 'view_payouts',           label: 'View Payouts',           description: 'See payout requests' },
      { key: 'decide_payouts',         label: 'Decide Payouts',         description: 'Approve, reject, or mark a payout as paid', dangerous: true },
      { key: 'view_customers',         label: 'View Customers',         description: "See the agency's customer list" },
      { key: 'manage_markups',         label: 'Manage Markups',         description: 'Edit markup rates for this agency' },
      { key: 'manage_promo_cash',      label: 'Manage Promo Cash',      description: 'Credit promotional funds to the agency wallet', dangerous: true },
      { key: 'manage_promos',          label: 'Manage Promos',          description: "Create/edit the agency's promo codes" },
      { key: 'respond_visa_enquiries', label: 'Respond to Visa Enquiries', description: 'Update status on visa enquiries from this agency and its sub-agents' },
      { key: 'view_bookings',          label: 'View Bookings',          description: 'See all bookings from this agency and its sub-agents' },
      { key: 'view_earnings',          label: 'View Earnings',          description: 'See the agency dashboard, commission ledger, and GMV/earnings reports' },
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
