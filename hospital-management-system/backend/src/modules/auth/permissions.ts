// Role-Based Access Control Permissions
export enum Permission {
  // Patient Management
  PATIENT_CREATE = 'patient:create',
  PATIENT_READ = 'patient:read',
  PATIENT_UPDATE = 'patient:update',
  PATIENT_DELETE = 'patient:delete',
  PATIENT_VIEW_ALL = 'patient:view_all',

  // Appointment Management
  APPOINTMENT_CREATE = 'appointment:create',
  APPOINTMENT_READ = 'appointment:read',
  APPOINTMENT_UPDATE = 'appointment:update',
  APPOINTMENT_CANCEL = 'appointment:cancel',
  APPOINTMENT_VIEW_ALL = 'appointment:view_all',

  // Medical Records
  MEDICAL_RECORD_CREATE = 'medical_record:create',
  MEDICAL_RECORD_READ = 'medical_record:read',
  MEDICAL_RECORD_UPDATE = 'medical_record:update',
  MEDICAL_RECORD_VIEW_ALL = 'medical_record:view_all',

  // Pharmacy
  PHARMACY_PRESCRIBE = 'pharmacy:prescribe',
  PHARMACY_DISPENSE = 'pharmacy:dispense',
  PHARMACY_INVENTORY_MANAGE = 'pharmacy:inventory_manage',
  PHARMACY_VIEW_ALL = 'pharmacy:view_all',

  // Laboratory
  LAB_TEST_ORDER = 'lab:test_order',
  LAB_TEST_UPDATE = 'lab:test_update',
  LAB_TEST_VIEW_ALL = 'lab:test_view_all',
  LAB_INVENTORY_MANAGE = 'lab:inventory_manage',

  // Radiology
  RADIOLOGY_ORDER = 'radiology:order',
  RADIOLOGY_UPDATE = 'radiology:update',
  RADIOLOGY_VIEW_ALL = 'radiology:view_all',

  // Billing
  BILLING_READ = 'billing:read',
  BILLING_CREATE = 'billing:create',
  BILLING_UPDATE = 'billing:update',
  BILLING_VIEW_ALL = 'billing:view_all',
  BILLING_APPLY_DISCOUNT = 'billing:apply_discount',

  // Emergency
  EMERGENCY_ACCESS = 'emergency:access',
  EMERGENCY_UPDATE = 'emergency:update',
  EMERGENCY_DISCHARGE = 'emergency:discharge',

  // Blood Bank
  BLOOD_BANK_DONATE = 'blood_bank:donate',
  BLOOD_BANK_REQUEST = 'blood_bank:request',
  BLOOD_BANK_MANAGE = 'blood_bank:manage',

  // Staff Management
  STAFF_MANAGE = 'staff:manage',
  STAFF_VIEW_ALL = 'staff:view_all',

  // Reports & Analytics
  REPORTS_VIEW = 'reports:view',
  REPORTS_GENERATE = 'reports:generate',
  ANALYTICS_VIEW = 'analytics:view',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  AUDIT_LOG_VIEW = 'audit:view',
}

// Role definitions with permissions
export const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_DELETE,
    Permission.PATIENT_VIEW_ALL,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_VIEW_ALL,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.MEDICAL_RECORD_VIEW_ALL,
    Permission.PHARMACY_PRESCRIBE,
    Permission.PHARMACY_DISPENSE,
    Permission.PHARMACY_INVENTORY_MANAGE,
    Permission.PHARMACY_VIEW_ALL,
    Permission.LAB_TEST_ORDER,
    Permission.LAB_TEST_UPDATE,
    Permission.LAB_TEST_VIEW_ALL,
    Permission.LAB_INVENTORY_MANAGE,
    Permission.RADIOLOGY_ORDER,
    Permission.RADIOLOGY_UPDATE,
    Permission.RADIOLOGY_VIEW_ALL,
    Permission.BILLING_CREATE,
    Permission.BILLING_UPDATE,
    Permission.BILLING_VIEW_ALL,
    Permission.BILLING_APPLY_DISCOUNT,
    Permission.EMERGENCY_ACCESS,
    Permission.EMERGENCY_UPDATE,
    Permission.EMERGENCY_DISCHARGE,
    Permission.BLOOD_BANK_DONATE,
    Permission.BLOOD_BANK_REQUEST,
    Permission.BLOOD_BANK_MANAGE,
    Permission.STAFF_MANAGE,
    Permission.STAFF_VIEW_ALL,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    Permission.ANALYTICS_VIEW,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_BACKUP,
    Permission.AUDIT_LOG_VIEW,
  ],

  ADMIN: [
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.PATIENT_VIEW_ALL,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_VIEW_ALL,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.MEDICAL_RECORD_VIEW_ALL,
    Permission.PHARMACY_PRESCRIBE,
    Permission.PHARMACY_DISPENSE,
    Permission.PHARMACY_INVENTORY_MANAGE,
    Permission.PHARMACY_VIEW_ALL,
    Permission.LAB_TEST_ORDER,
    Permission.LAB_TEST_UPDATE,
    Permission.LAB_TEST_VIEW_ALL,
    Permission.LAB_INVENTORY_MANAGE,
    Permission.RADIOLOGY_ORDER,
    Permission.RADIOLOGY_UPDATE,
    Permission.RADIOLOGY_VIEW_ALL,
    Permission.BILLING_CREATE,
    Permission.BILLING_UPDATE,
    Permission.BILLING_VIEW_ALL,
    Permission.BILLING_APPLY_DISCOUNT,
    Permission.EMERGENCY_ACCESS,
    Permission.EMERGENCY_UPDATE,
    Permission.EMERGENCY_DISCHARGE,
    Permission.BLOOD_BANK_DONATE,
    Permission.BLOOD_BANK_REQUEST,
    Permission.BLOOD_BANK_MANAGE,
    Permission.STAFF_MANAGE,
    Permission.STAFF_VIEW_ALL,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    Permission.ANALYTICS_VIEW,
    Permission.AUDIT_LOG_VIEW,
  ],

  DOCTOR: [
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.MEDICAL_RECORD_CREATE,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.PHARMACY_PRESCRIBE,
    Permission.LAB_TEST_ORDER,
    Permission.RADIOLOGY_ORDER,
    Permission.EMERGENCY_ACCESS,
    Permission.EMERGENCY_UPDATE,
    Permission.REPORTS_VIEW,
  ],

  NURSE: [
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.APPOINTMENT_READ,
    Permission.MEDICAL_RECORD_READ,
    Permission.MEDICAL_RECORD_UPDATE,
    Permission.PHARMACY_DISPENSE,
    Permission.LAB_TEST_UPDATE,
    Permission.EMERGENCY_ACCESS,
    Permission.EMERGENCY_UPDATE,
    Permission.EMERGENCY_DISCHARGE,
  ],

  RECEPTIONIST: [
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ,
    Permission.PATIENT_UPDATE,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.BILLING_CREATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
  ],

  LAB_TECHNICIAN: [
    Permission.LAB_TEST_ORDER,
    Permission.LAB_TEST_UPDATE,
    Permission.LAB_TEST_VIEW_ALL,
    Permission.LAB_INVENTORY_MANAGE,
    Permission.PATIENT_READ,
  ],

  PHARMACIST: [
    Permission.PHARMACY_PRESCRIBE,
    Permission.PHARMACY_DISPENSE,
    Permission.PHARMACY_INVENTORY_MANAGE,
    Permission.PHARMACY_VIEW_ALL,
    Permission.PATIENT_READ,
  ],

  PATIENT: [
    Permission.PATIENT_READ,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_CANCEL,
    Permission.MEDICAL_RECORD_READ,
    Permission.BILLING_READ,
  ],
};

// Helper functions
/**
 *
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

/**
 *
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}
