export const ROUTES = {
  splash: "/splash",
  login: "/login",
  register: "/register",
  donorRegistration: "/donor-registration",

  // Dashboards
  adminDashboard: "/admin-dashboard",
  bloodBankDashboard: "/bloodbank-dashboard",
  hospitalDashboard: "/hospital-dashboard",

  // Common authenticated routes
  notifications: "/notifications",
  settings: "/settings",
  profile: "/profile",
  accountSettings: "/account-settings",

  // Inventory
  inventory: "/inventory",
  addInventory: "/add-inventory",

  // Donors
  donors: "/donors",
  DonorList: "/registered-donors",
  DonorDetails: "/donor/:id",

  // Requests / Transfers
  newRequest: "/new-request",
  transferStatus: "/transfer-status",       // Blood Requests page
  transferRequest: "/transfer-request",     // Create new transfer
  requestDetails: "/request-details/:id",   // View request details
  orderTracking: "/order-tracking",         // NEW: Track Orders page
  approveRequests: "/approve-requests",     // NEW: Approve Requests page

  // Analytics & System
  analytics: "/analytics",
  systemHealth: "/system-health",

  // Admin-only
  UserManagement: "/user-management",
  Blood_banks: "/blood-banks",
  Bloodtypes: "/blood-types",
};
