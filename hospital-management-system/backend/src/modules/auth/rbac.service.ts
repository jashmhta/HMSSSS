/*[object Object]*/
import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

/**
 *
 */
@Injectable()
export class RBACService {
  private readonly rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.SUPERADMIN]: [
      // All permissions
      {
        id: 'all',
        name: 'All Access',
        resource: '*',
        action: '*',
        description: 'Full system access',
      },
    ],
    [UserRole.ADMIN]: [
      // User management
      {
        id: 'users.create',
        name: 'Create Users',
        resource: 'users',
        action: 'create',
        description: 'Create new user accounts',
      },
      {
        id: 'users.read',
        name: 'Read Users',
        resource: 'users',
        action: 'read',
        description: 'View user information',
      },
      {
        id: 'users.update',
        name: 'Update Users',
        resource: 'users',
        action: 'update',
        description: 'Modify user information',
      },
      {
        id: 'users.delete',
        name: 'Delete Users',
        resource: 'users',
        action: 'delete',
        description: 'Delete user accounts',
      },

      // Patient management
      {
        id: 'patients.create',
        name: 'Create Patients',
        resource: 'patients',
        action: 'create',
        description: 'Register new patients',
      },
      {
        id: 'patients.read',
        name: 'Read Patients',
        resource: 'patients',
        action: 'read',
        description: 'View patient records',
      },
      {
        id: 'patients.update',
        name: 'Update Patients',
        resource: 'patients',
        action: 'update',
        description: 'Modify patient information',
      },
      {
        id: 'patients.delete',
        name: 'Delete Patients',
        resource: 'patients',
        action: 'delete',
        description: 'Delete patient records',
      },

      // Appointments
      {
        id: 'appointments.create',
        name: 'Create Appointments',
        resource: 'appointments',
        action: 'create',
        description: 'Schedule appointments',
      },
      {
        id: 'appointments.read',
        name: 'Read Appointments',
        resource: 'appointments',
        action: 'read',
        description: 'View appointments',
      },
      {
        id: 'appointments.update',
        name: 'Update Appointments',
        resource: 'appointments',
        action: 'update',
        description: 'Modify appointments',
      },
      {
        id: 'appointments.delete',
        name: 'Delete Appointments',
        resource: 'appointments',
        action: 'delete',
        description: 'Cancel appointments',
      },

      // Medical records
      {
        id: 'medical_records.create',
        name: 'Create Medical Records',
        resource: 'medical_records',
        action: 'create',
        description: 'Create medical records',
      },
      {
        id: 'medical_records.read',
        name: 'Read Medical Records',
        resource: 'medical_records',
        action: 'read',
        description: 'View medical records',
      },
      {
        id: 'medical_records.update',
        name: 'Update Medical Records',
        resource: 'medical_records',
        action: 'update',
        description: 'Modify medical records',
      },

      // Billing
      {
        id: 'bills.create',
        name: 'Create Bills',
        resource: 'bills',
        action: 'create',
        description: 'Create patient bills',
      },
      {
        id: 'bills.read',
        name: 'Read Bills',
        resource: 'bills',
        action: 'read',
        description: 'View patient bills',
      },
      {
        id: 'bills.update',
        name: 'Update Bills',
        resource: 'bills',
        action: 'update',
        description: 'Modify patient bills',
      },
      {
        id: 'bills.discount',
        name: 'Apply Discounts',
        resource: 'bills',
        action: 'discount',
        description: 'Apply discounts to bills',
      },

      // Reports
      {
        id: 'reports.read',
        name: 'Read Reports',
        resource: 'reports',
        action: 'read',
        description: 'View system reports',
      },

      // Compliance
      {
        id: 'compliance.read',
        name: 'Read Compliance',
        resource: 'compliance',
        action: 'read',
        description: 'View compliance reports',
      },
    ],
    [UserRole.DOCTOR]: [
      // Patient records (own patients)
      {
        id: 'patients.read_own',
        name: 'Read Own Patients',
        resource: 'patients',
        action: 'read_own',
        description: 'View own patients',
      },
      {
        id: 'patients.update_own',
        name: 'Update Own Patients',
        resource: 'patients',
        action: 'update_own',
        description: 'Update own patients',
      },

      // Appointments
      {
        id: 'appointments.create',
        name: 'Create Appointments',
        resource: 'appointments',
        action: 'create',
        description: 'Schedule appointments',
      },
      {
        id: 'appointments.read',
        name: 'Read Appointments',
        resource: 'appointments',
        action: 'read',
        description: 'View appointments',
      },
      {
        id: 'appointments.update',
        name: 'Update Appointments',
        resource: 'appointments',
        action: 'update',
        description: 'Modify appointments',
      },

      // Medical records
      {
        id: 'medical_records.create',
        name: 'Create Medical Records',
        resource: 'medical_records',
        action: 'create',
        description: 'Create medical records',
      },
      {
        id: 'medical_records.read',
        name: 'Read Medical Records',
        resource: 'medical_records',
        action: 'read',
        description: 'View medical records',
      },
      {
        id: 'medical_records.update',
        name: 'Update Medical Records',
        resource: 'medical_records',
        action: 'update',
        description: 'Modify medical records',
      },

      // Prescriptions
      {
        id: 'prescriptions.create',
        name: 'Create Prescriptions',
        resource: 'prescriptions',
        action: 'create',
        description: 'Create prescriptions',
      },
      {
        id: 'prescriptions.read',
        name: 'Read Prescriptions',
        resource: 'prescriptions',
        action: 'read',
        description: 'View prescriptions',
      },
      {
        id: 'prescriptions.update',
        name: 'Update Prescriptions',
        resource: 'prescriptions',
        action: 'update',
        description: 'Modify prescriptions',
      },

      // Lab and radiology orders
      {
        id: 'lab_tests.create',
        name: 'Order Lab Tests',
        resource: 'lab_tests',
        action: 'create',
        description: 'Order laboratory tests',
      },
      {
        id: 'radiology_tests.create',
        name: 'Order Radiology Tests',
        resource: 'radiology_tests',
        action: 'create',
        description: 'Order radiology tests',
      },

      // IPD management
      {
        id: 'ipd_admissions.create',
        name: 'Admit Patients',
        resource: 'ipd_admissions',
        action: 'create',
        description: 'Admit patients to IPD',
      },
      {
        id: 'ipd_admissions.read',
        name: 'Read IPD Admissions',
        resource: 'ipd_admissions',
        action: 'read',
        description: 'View IPD admissions',
      },
      {
        id: 'ipd_admissions.update',
        name: 'Update IPD Admissions',
        resource: 'ipd_admissions',
        action: 'update',
        description: 'Update IPD admissions',
      },
      {
        id: 'progress_notes.create',
        name: 'Create Progress Notes',
        resource: 'progress_notes',
        action: 'create',
        description: 'Create progress notes',
      },

      // Emergency access
      {
        id: 'emergency.read',
        name: 'Read Emergency',
        resource: 'emergency',
        action: 'read',
        description: 'Access emergency records',
      },
      {
        id: 'emergency.update',
        name: 'Update Emergency',
        resource: 'emergency',
        action: 'update',
        description: 'Update emergency records',
      },
    ],
    [UserRole.NURSE]: [
      // Patient care
      {
        id: 'patients.read',
        name: 'Read Patients',
        resource: 'patients',
        action: 'read',
        description: 'View patient information',
      },
      {
        id: 'vital_signs.create',
        name: 'Record Vital Signs',
        resource: 'vital_signs',
        action: 'create',
        description: 'Record patient vital signs',
      },
      {
        id: 'vital_signs.read',
        name: 'Read Vital Signs',
        resource: 'vital_signs',
        action: 'read',
        description: 'View vital signs',
      },

      // Nursing notes
      {
        id: 'nursing_notes.create',
        name: 'Create Nursing Notes',
        resource: 'nursing_notes',
        action: 'create',
        description: 'Create nursing notes',
      },
      {
        id: 'nursing_notes.read',
        name: 'Read Nursing Notes',
        resource: 'nursing_notes',
        action: 'read',
        description: 'View nursing notes',
      },

      // IPD management
      {
        id: 'ipd_admissions.read',
        name: 'Read IPD Admissions',
        resource: 'ipd_admissions',
        action: 'read',
        description: 'View IPD admissions',
      },
      {
        id: 'beds.update',
        name: 'Update Bed Status',
        resource: 'beds',
        action: 'update',
        description: 'Update bed availability',
      },

      // Appointments
      {
        id: 'appointments.read',
        name: 'Read Appointments',
        resource: 'appointments',
        action: 'read',
        description: 'View appointments',
      },

      // Emergency access
      {
        id: 'emergency.read',
        name: 'Read Emergency',
        resource: 'emergency',
        action: 'read',
        description: 'Access emergency records',
      },
      {
        id: 'emergency.update',
        name: 'Update Emergency',
        resource: 'emergency',
        action: 'update',
        description: 'Update emergency records',
      },
    ],
    [UserRole.RECEPTIONIST]: [
      // Patient registration
      {
        id: 'patients.create',
        name: 'Register Patients',
        resource: 'patients',
        action: 'create',
        description: 'Register new patients',
      },
      {
        id: 'patients.read',
        name: 'Read Patients',
        resource: 'patients',
        action: 'read',
        description: 'View patient information',
      },
      {
        id: 'patients.update',
        name: 'Update Patients',
        resource: 'patients',
        action: 'update',
        description: 'Update patient information',
      },

      // Appointments
      {
        id: 'appointments.create',
        name: 'Create Appointments',
        resource: 'appointments',
        action: 'create',
        description: 'Schedule appointments',
      },
      {
        id: 'appointments.read',
        name: 'Read Appointments',
        resource: 'appointments',
        action: 'read',
        description: 'View appointments',
      },
      {
        id: 'appointments.update',
        name: 'Update Appointments',
        resource: 'appointments',
        action: 'update',
        description: 'Modify appointments',
      },

      // Billing
      {
        id: 'bills.read',
        name: 'Read Bills',
        resource: 'bills',
        action: 'read',
        description: 'View patient bills',
      },
      {
        id: 'payments.create',
        name: 'Process Payments',
        resource: 'payments',
        action: 'create',
        description: 'Process patient payments',
      },

      // OPD queue
      {
        id: 'opd_queue.read',
        name: 'Read OPD Queue',
        resource: 'opd_queue',
        action: 'read',
        description: 'View OPD queue',
      },
      {
        id: 'opd_queue.update',
        name: 'Update OPD Queue',
        resource: 'opd_queue',
        action: 'update',
        description: 'Update queue status',
      },
    ],
    [UserRole.LAB_TECHNICIAN]: [
      // Lab tests
      {
        id: 'lab_tests.read',
        name: 'Read Lab Tests',
        resource: 'lab_tests',
        action: 'read',
        description: 'View lab test orders',
      },
      {
        id: 'lab_tests.update',
        name: 'Update Lab Tests',
        resource: 'lab_tests',
        action: 'update',
        description: 'Update lab test results',
      },

      // Patients (limited)
      {
        id: 'patients.read_limited',
        name: 'Read Patient Names',
        resource: 'patients',
        action: 'read_limited',
        description: 'View patient names for tests',
      },
    ],
    [UserRole.PHARMACIST]: [
      // Pharmacy management
      {
        id: 'medications.read',
        name: 'Read Medications',
        resource: 'medications',
        action: 'read',
        description: 'View medication inventory',
      },
      {
        id: 'medications.update',
        name: 'Update Medications',
        resource: 'medications',
        action: 'update',
        description: 'Update medication stock',
      },

      // Prescriptions
      {
        id: 'prescriptions.read',
        name: 'Read Prescriptions',
        resource: 'prescriptions',
        action: 'read',
        description: 'View prescriptions',
      },
      {
        id: 'prescriptions.update',
        name: 'Update Prescriptions',
        resource: 'prescriptions',
        action: 'update',
        description: 'Dispense medications',
      },

      // Patients (limited)
      {
        id: 'patients.read_limited',
        name: 'Read Patient Names',
        resource: 'patients',
        action: 'read_limited',
        description: 'View patient names for prescriptions',
      },
    ],
    [UserRole.PATIENT]: [
      // Own records
      {
        id: 'own_records.read',
        name: 'Read Own Records',
        resource: 'own_records',
        action: 'read',
        description: 'View own medical records',
      },
      {
        id: 'own_appointments.read',
        name: 'Read Own Appointments',
        resource: 'own_appointments',
        action: 'read',
        description: 'View own appointments',
      },
      {
        id: 'own_appointments.create',
        name: 'Create Own Appointments',
        resource: 'own_appointments',
        action: 'create',
        description: 'Book own appointments',
      },
      {
        id: 'own_bills.read',
        name: 'Read Own Bills',
        resource: 'own_bills',
        action: 'read',
        description: 'View own bills',
      },
      {
        id: 'own_reports.read',
        name: 'Read Own Reports',
        resource: 'own_reports',
        action: 'read',
        description: 'View own test reports',
      },
    ],
  };

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has permission for specific action on resource
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    // Superadmin has all permissions
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    const userPermissions = this.rolePermissions[user.role] || [];

    // Check for exact permission match
    const hasExactPermission = userPermissions.some(
      perm =>
        (perm.resource === resource || perm.resource === '*') &&
        (perm.action === action || perm.action === '*'),
    );

    if (hasExactPermission) {
      return true;
    }

    // Check for special permissions (e.g., read_own for doctors)
    if (action.includes('_own') || action.includes('_limited')) {
      return userPermissions.some(
        perm => perm.resource === resource && perm.action.includes(action.split('_')[1]),
      );
    }

    return false;
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return this.rolePermissions[role] || [];
  }

  /**
   * Get all available roles with their permissions
   */
  getAllRoles(): RolePermissions[] {
    return Object.values(UserRole).map(role => ({
      role,
      permissions: this.rolePermissions[role] || [],
      description: this.getRoleDescription(role),
    }));
  }

  /**
   * Check if user can access specific patient data
   */
  async canAccessPatientData(userId: string, patientId: string, action: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    // Superadmin and admin can access all patient data
    if (user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    // Doctors can access their own patients
    if (user.role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (doctor) {
        // Check if doctor has treated this patient
        const hasAccess = await this.prisma.medicalRecord.findFirst({
          where: {
            patientId,
            doctorId: doctor.id,
          },
        });

        if (hasAccess) {
          return true;
        }

        // Check if doctor has upcoming appointments with this patient
        const upcomingAppointment = await this.prisma.appointment.findFirst({
          where: {
            patientId,
            doctorId: doctor.id,
            appointmentDate: {
              gte: new Date(),
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
          },
        });

        if (upcomingAppointment) {
          return true;
        }
      }
    }

    // Nurses can access patients in their care
    if (user.role === UserRole.NURSE) {
      // Check if patient has current appointments or medical records
      const currentAppointment = await this.prisma.appointment.findFirst({
        where: {
          patientId,
          appointmentDate: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (currentAppointment) {
        return true;
      }
    }

    // Patients can only access their own data
    if (user.role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });

      return patient?.id === patientId;
    }

    // Lab technicians and pharmacists have limited access
    if (user.role === UserRole.LAB_TECHNICIAN || user.role === UserRole.PHARMACIST) {
      // Check if they have active orders for this patient
      if (user.role === UserRole.LAB_TECHNICIAN) {
        const activeTest = await this.prisma.labTest.findFirst({
          where: {
            patientId,
            status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] },
          },
        });
        if (activeTest) return true;
      }

      if (user.role === UserRole.PHARMACIST) {
        const activePrescription = await this.prisma.prescription.findFirst({
          where: {
            patientId,
            status: 'ACTIVE',
          },
        });
        if (activePrescription) return true;
      }
    }

    return false;
  }

  /**
   * Validate action against business rules
   */
  async validateBusinessRules(
    userId: string,
    action: string,
    resource: string,
    data?: any,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Business rule: Only doctors can prescribe controlled substances
    if (action === 'create' && resource === 'prescriptions' && data?.controlled) {
      if (user.role !== UserRole.DOCTOR) {
        throw new ForbiddenException('Only doctors can prescribe controlled substances');
      }
    }

    // Business rule: Only admin can apply discounts over 20%
    if (action === 'discount' && resource === 'bills' && data?.discountPercent > 20) {
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
        throw new ForbiddenException('Discounts over 20% require admin approval');
      }
    }

    // Business rule: Emergency access for critical situations
    if (resource === 'emergency' && data?.priority === 'CRITICAL') {
      // Allow broader access for critical emergencies
      return;
    }

    // Business rule: After-hours access restrictions
    if (
      this.isAfterHours() &&
      !(
        user.role === UserRole.DOCTOR ||
        user.role === UserRole.NURSE ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPERADMIN
      )
    ) {
      throw new ForbiddenException('Access restricted during non-business hours');
    }
  }

  /**
   * Get role hierarchy (for escalation)
   */
  getRoleHierarchy(): Record<UserRole, number> {
    return {
      [UserRole.SUPERADMIN]: 100,
      [UserRole.ADMIN]: 80,
      [UserRole.DOCTOR]: 60,
      [UserRole.NURSE]: 40,
      [UserRole.RECEPTIONIST]: 30,
      [UserRole.LAB_TECHNICIAN]: 20,
      [UserRole.PHARMACIST]: 20,
      [UserRole.PATIENT]: 10,
    };
  }

  /**
   * Check if user can escalate privileges
   */
  canEscalatePrivilege(fromRole: UserRole, toRole: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[toRole] > hierarchy[fromRole];
  }

  // Private helper methods

  /**
   *
   */
  private getRoleDescription(role: UserRole): string {
    const descriptions = {
      [UserRole.SUPERADMIN]: 'Full system access and control',
      [UserRole.ADMIN]: 'Administrative access to all hospital functions',
      [UserRole.DOCTOR]: 'Medical professional with patient care access',
      [UserRole.NURSE]: 'Nursing staff with patient care access',
      [UserRole.RECEPTIONIST]: 'Front desk and patient coordination',
      [UserRole.LAB_TECHNICIAN]: 'Laboratory testing and results',
      [UserRole.PHARMACIST]: 'Pharmacy management and dispensing',
      [UserRole.PATIENT]: 'Patient access to own records',
    };

    return descriptions[role] || 'Unknown role';
  }

  /**
   *
   */
  private isAfterHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Business hours: Monday-Friday 8 AM - 8 PM
    return day >= 1 && day <= 5 && (hour < 8 || hour > 20);
  }
}
