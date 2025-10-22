// Front-end RBAC utilities (framework-agnostic)
// Use these helpers to render role-correct menus, guard routes/components, and build queries.

export type Role =
  | 'admin'                // System admin
  | 'blood_bank_admin'     // Blood bank admin
  | 'blood_bank_staff'     // Blood bank staff
  | 'hospital_staff'       // Hospital staff
  | 'donor';               // Donor

export type Resource =
  | 'organizations'
  | 'profiles'
  | 'inventory'
  | 'requests'
  | 'transfers'
  | 'donors'
  | 'donations'
  | 'audit'
  | 'community';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type Scope = 'self' | 'org' | 'assigned' | 'system';
export type PermissionKey = `${Resource}:${Action}:${Scope}`;

export const rolePermissions: Record<Role, readonly PermissionKey[]> = {
  // System admin: manages organizations, profiles, and system-level data
  admin: [
    'organizations:manage:system',
    'profiles:read:system',
    'profiles:update:system',
    'inventory:read:system',
    'requests:read:system',
    'transfers:read:system',
    'donors:read:system',
    'audit:read:system'
  ],

  // Blood bank admin: everything blood bank staff can do + manage team
  blood_bank_admin: [
    'inventory:read:org',
    'inventory:create:org',
    'inventory:update:org',
    'requests:read:org',     // receive requests from hospitals
    'requests:update:org',   // approve/reject requests
    'transfers:read:org',    // outgoing transfers to hospitals
    'transfers:update:org',  // fulfill/dispatch transfers
    'donors:read:org',
    'donors:update:org',
    'donations:read:org',
    'profiles:read:org',     // manage blood bank team
    'profiles:update:org'
  ],

  blood_bank_staff: [
    'inventory:read:org',
    'inventory:create:org',
    'inventory:update:org',
    'requests:read:org',     // receive requests from hospitals
    'requests:update:org',   // approve/reject requests
    'transfers:read:org',    // outgoing transfers to hospitals
    'transfers:update:org',  // fulfill/dispatch transfers
    'donors:read:org',
    'donors:update:org',
    'donations:read:org'
  ],

  hospital_staff: [
    'requests:read:org',     // their hospital's requests
    'requests:create:org',   // create new blood requests
    'requests:update:org',   // update their requests
    'transfers:read:org',    // incoming transfers from blood banks
    'transfers:create:org',  // initiate transfer requests
    'inventory:read:org',    // their hospital inventory
    'inventory:update:org'   // manage received blood
  ],

  donor: [
    'donors:read:self',
    'donors:update:self',
    'donations:read:self',
    'community:read:org',
    'community:create:self'
  ]
} as const;

export function can(role: Role, permission: PermissionKey): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Simple guard that checks any of the given permissions.
export function canAny(role: Role, permissions: readonly PermissionKey[]): boolean {
  return permissions.some((p) => can(role, p));
}

// Menu model and builder
export type MenuItem = { key: string; label: string; href?: string; children?: readonly MenuItem[] };

const adminMenu: readonly MenuItem[] = [
  { key: 'orgs', label: 'Organizations', children: [
    { key: 'hospitals', label: 'Hospitals', href: '/admin/hospitals' },
    { key: 'blood-banks', label: 'Blood Banks', href: '/admin/blood-banks' },
    { key: 'facilities', label: 'Facilities', href: '/admin/facilities' }
  ] },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'settings', label: 'Settings', href: '/admin/settings' }
] as const;

const bankAdminMenu: readonly MenuItem[] = [
  { key: 'inventory', label: 'Inventory', href: '/bank/inventory' },
  { key: 'requests', label: 'Requests', href: '/bank/requests' },
  { key: 'transfers', label: 'Transfers', href: '/bank/transfers' },
  { key: 'donors', label: 'Donors', href: '/bank/donors' },
  { key: 'team', label: 'Team', href: '/bank/users' }
] as const;

const bankStaffMenu: readonly MenuItem[] = [
  { key: 'inventory', label: 'Inventory', href: '/bank/inventory' },
  { key: 'requests', label: 'Requests', href: '/bank/requests' },
  { key: 'transfers', label: 'Transfers', href: '/bank/transfers' },
  { key: 'donors', label: 'Donors', href: '/bank/donors' }
] as const;

const hospitalMenu: readonly MenuItem[] = [
  { key: 'requests', label: 'Requests', href: '/hospital/requests' },
  { key: 'inventory', label: 'Inventory', href: '/hospital/inventory' },
  { key: 'history', label: 'Request History', href: '/hospital/requests/history' }
] as const;

const donorMenu: readonly MenuItem[] = [
  { key: 'profile', label: 'My Profile', href: '/donor/profile' },
  { key: 'history', label: 'Donation History', href: '/donor/history' },
  { key: 'community', label: 'Community', href: '/donor/community' }
] as const;

export function menuFor(role: Role): readonly MenuItem[] {
  switch (role) {
    case 'admin':
      return adminMenu;
    case 'blood_bank_admin':
      return bankAdminMenu;
    case 'blood_bank_staff':
      return bankStaffMenu;
    case 'hospital_staff':
      return hospitalMenu;
    case 'donor':
      return donorMenu;
    default:
      return [];
  }
}

// Route guard helper (framework-agnostic). Example usage in your router beforeEnter hook.
export function guardRoute(role: Role, required: readonly PermissionKey[]): boolean {
  return canAny(role, required);
}

// Field masking helper for donor PII on the client (UI-only; backend still enforces with RLS)
export type Donor = {
  name?: string; email?: string; phone?: string; address?: string; dob?: string;
  blood_type?: string; eligibility_status?: string;
  [k: string]: unknown;
};

export function donorSummaryForHospital(d: Donor): Donor {
  return {
    blood_type: d.blood_type,
    eligibility_status: d.eligibility_status
  };
}

// Convenience: required permissions per page/route (use in your router config)
export const routePermissions: Record<string, readonly PermissionKey[]> = {
  '/admin/hospitals': ['organizations:manage:system'],
  '/admin/blood-banks': ['organizations:manage:system'],
  '/admin/facilities': ['organizations:manage:system'],
  '/admin/users': ['profiles:read:system'],

  '/bank/inventory': ['inventory:read:org'],
  '/bank/audit': ['inventory:read:org'],
  '/bank/requests': ['requests:read:org'],
  '/bank/transfers': ['transfers:read:org'],
  '/bank/donors': ['donors:read:org'],
  '/bank/users': ['profiles:read:org'],

  '/hospital/requests': ['requests:read:org'],
  '/hospital/inventory': ['inventory:read:org'],
  '/hospital/requests/history': ['requests:read:org'],

  '/donor/profile': ['donors:read:self'],
  '/donor/history': ['donations:read:self'],
  '/donor/community': ['community:read:org']
} as const;

// Example: gate a route
// if (!guardRoute(currentUserRole, routePermissions[location.pathname] ?? [])) redirect('/403');
