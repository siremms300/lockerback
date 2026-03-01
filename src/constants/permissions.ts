// src/constants/permissions.ts
export const Permissions = {
  // Location permissions
  VIEW_LOCATIONS: 'locations:view',
  CREATE_LOCATION: 'locations:create',
  EDIT_LOCATION: 'locations:edit',
  DELETE_LOCATION: 'locations:delete',
  
  // Parcel permissions
  VIEW_PARCELS: 'parcels:view',
  CREATE_PARCEL: 'parcels:create',
  EDIT_PARCEL: 'parcels:edit',
  DELETE_PARCEL: 'parcels:delete',
  
  // Driver permissions
  VIEW_DRIVERS: 'drivers:view',
  CREATE_DRIVER: 'drivers:create',
  EDIT_DRIVER: 'drivers:edit',
  DELETE_DRIVER: 'drivers:delete',
  
  // Customer permissions
  VIEW_CUSTOMERS: 'customers:view',
  CREATE_CUSTOMER: 'customers:create',
  EDIT_CUSTOMER: 'customers:edit',
  DELETE_CUSTOMER: 'customers:delete',
  
  // Billing permissions
  VIEW_BILLING: 'billing:view',
  MANAGE_BILLING: 'billing:manage',
  
  // Analytics permissions
  VIEW_ANALYTICS: 'analytics:view',
  
  // Settings permissions
  VIEW_SETTINGS: 'settings:view',
  EDIT_SETTINGS: 'settings:edit',
  
  // User management (admin only)
  MANAGE_USERS: 'users:manage',
  MANAGE_ROLES: 'roles:manage',
}

// Role-based permission sets
export const RolePermissions = {
  admin: Object.values(Permissions), // All permissions
  
  merchant: [
    Permissions.VIEW_PARCELS,
    Permissions.CREATE_PARCEL,
    Permissions.EDIT_PARCEL,
    Permissions.DELETE_PARCEL,
    Permissions.VIEW_LOCATIONS,
    Permissions.VIEW_DRIVERS,
    Permissions.VIEW_CUSTOMERS,
    Permissions.CREATE_CUSTOMER,
    Permissions.EDIT_CUSTOMER,
    Permissions.VIEW_BILLING,
    Permissions.VIEW_ANALYTICS,
    Permissions.VIEW_SETTINGS,
    Permissions.EDIT_SETTINGS,
  ],
  
  viewer: [
    Permissions.VIEW_PARCELS,
    Permissions.VIEW_LOCATIONS,
    Permissions.VIEW_DRIVERS,
    Permissions.VIEW_CUSTOMERS,
    Permissions.VIEW_BILLING,
    Permissions.VIEW_ANALYTICS,
    Permissions.VIEW_SETTINGS,
  ]
}