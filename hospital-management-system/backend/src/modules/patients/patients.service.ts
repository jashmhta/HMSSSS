import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * Register a new patient with comprehensive validation
   */
  async registerNewPatient(data: {
    // User account data
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    // Patient specific data
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodType?:
      | 'A_POSITIVE'
      | 'A_NEGATIVE'
      | 'B_POSITIVE'
      | 'B_NEGATIVE'
      | 'AB_POSITIVE'
      | 'AB_NEGATIVE'
      | 'O_POSITIVE'
      | 'O_NEGATIVE';
    emergencyContact?: string;
    emergencyPhone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
      expiryDate: Date;
    };
    medicalHistory?: {
      conditions: string[];
      surgeries: string[];
      familyHistory: string[];
    };
    allergies?: string[];
    currentMedications?: string[];
    // Registration metadata
    registeredBy: string; // User ID of staff registering
    registrationType: 'SELF' | 'STAFF' | 'EMERGENCY';
  }) {
    // Validate age (must be 18+ for self-registration, no restriction for staff)
    const age = this.calculateAge(data.dateOfBirth);
    if (data.registrationType === 'SELF' && age < 18) {
      throw new BadRequestException('Patients under 18 must be registered by staff');
    }

    // Check for existing user with same email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate unique MRN (Medical Record Number)
    const mrn = await this.generateMRN();

    // Create user account
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: this.generateTemporaryPassword(), // Temporary password
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'PATIENT',
        isActive: true,
        createdBy: data.registeredBy,
      },
    });

    // Create patient record
    const patient = await this.prisma.patient.create({
      data: {
        userId: user.id,
        mrn,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        insuranceInfo: data.insuranceInfo,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies || [],
        currentMedications: data.currentMedications || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Log audit event for patient registration
    await this.complianceService.logAuditEvent({
      userId: data.registeredBy,
      action: 'PATIENT_REGISTERED',
      resource: 'patients',
      resourceId: patient.id,
      details: {
        registrationType: data.registrationType,
        mrn: mrn,
        patientName: `${data.firstName} ${data.lastName}`,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return {
      ...patient,
      temporaryPassword:
        data.registrationType === 'STAFF' ? this.generateTemporaryPassword() : undefined,
    };
  }

  /**
   * Handle returning patient check-in
   */
  async checkInReturningPatient(
    mrn: string,
    checkInData: {
      checkedInBy: string;
      purpose: 'CONSULTATION' | 'FOLLOW_UP' | 'PROCEDURE' | 'EMERGENCY';
      department?: string;
      priority?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    },
  ) {
    // Find patient by MRN
    const patient = await this.prisma.patient.findUnique({
      where: { mrn },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found with this MRN');
    }

    if (!patient.user.isActive) {
      throw new BadRequestException('Patient account is inactive');
    }

    // Log check-in event
    await this.complianceService.logAuditEvent({
      userId: checkInData.checkedInBy,
      action: 'PATIENT_CHECKED_IN',
      resource: 'patients',
      resourceId: patient.id,
      details: {
        purpose: checkInData.purpose,
        department: checkInData.department,
        priority: checkInData.priority,
        mrn: mrn,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return {
      patient,
      checkInTime: new Date(),
      checkInData,
    };
  }

  /**
   * Update patient information with validation
   */
  async updatePatientInfo(
    patientId: string,
    updateData: Partial<{
      // User data
      firstName: string;
      lastName: string;
      phone: string;
      // Patient data
      bloodType: string;
      emergencyContact: string;
      emergencyPhone: string;
      address: any;
      insuranceInfo: any;
      medicalHistory: any;
      allergies: string[];
      currentMedications: string[];
    }>,
    updatedBy: string,
  ) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Prepare update data
    const userUpdate: any = {};
    const patientUpdate: any = {};

    if (updateData.firstName) userUpdate.firstName = updateData.firstName;
    if (updateData.lastName) userUpdate.lastName = updateData.lastName;
    if (updateData.phone) userUpdate.phone = updateData.phone;

    if (updateData.bloodType) patientUpdate.bloodType = updateData.bloodType;
    if (updateData.emergencyContact) patientUpdate.emergencyContact = updateData.emergencyContact;
    if (updateData.emergencyPhone) patientUpdate.emergencyPhone = updateData.emergencyPhone;
    if (updateData.address) patientUpdate.address = updateData.address;
    if (updateData.insuranceInfo) patientUpdate.insuranceInfo = updateData.insuranceInfo;
    if (updateData.medicalHistory) patientUpdate.medicalHistory = updateData.medicalHistory;
    if (updateData.allergies) patientUpdate.allergies = updateData.allergies;
    if (updateData.currentMedications)
      patientUpdate.currentMedications = updateData.currentMedications;

    // Update in transaction
    const result = await this.prisma.$transaction(async tx => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: patient.userId },
          data: { ...userUpdate, updatedBy },
        });
      }

      const updatedPatient = await tx.patient.update({
        where: { id: patientId },
        data: { ...patientUpdate, updatedAt: new Date() },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      return updatedPatient;
    });

    // Log update event
    await this.complianceService.logAuditEvent({
      userId: updatedBy,
      action: 'PATIENT_INFO_UPDATED',
      resource: 'patients',
      resourceId: patientId,
      details: {
        updatedFields: Object.keys({ ...userUpdate, ...patientUpdate }),
        mrn: patient.mrn,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return result;
  }

  /**
   * Search patients with advanced filtering
   */
  async searchPatients(searchCriteria: {
    query?: string; // Search by name, email, MRN, phone
    mrn?: string;
    dateOfBirth?: Date;
    gender?: string;
    bloodType?: string;
    insuranceProvider?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (searchCriteria.mrn) {
      where.mrn = searchCriteria.mrn;
    }

    if (searchCriteria.dateOfBirth) {
      where.dateOfBirth = searchCriteria.dateOfBirth;
    }

    if (searchCriteria.gender) {
      where.gender = searchCriteria.gender;
    }

    if (searchCriteria.bloodType) {
      where.bloodType = searchCriteria.bloodType;
    }

    if (searchCriteria.insuranceProvider) {
      where.insuranceInfo = {
        path: ['provider'],
        string_contains: searchCriteria.insuranceProvider,
      };
    }

    if (searchCriteria.query) {
      where.OR = [
        { mrn: { contains: searchCriteria.query, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: searchCriteria.query, mode: 'insensitive' } },
              { lastName: { contains: searchCriteria.query, mode: 'insensitive' } },
              { email: { contains: searchCriteria.query, mode: 'insensitive' } },
              { phone: { contains: searchCriteria.query, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isActive: true,
            },
          },
        },
        take: searchCriteria.limit || 20,
        skip: searchCriteria.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      patients,
      total,
      limit: searchCriteria.limit || 20,
      offset: searchCriteria.offset || 0,
    };
  }

  /**
   * Get patient medical history summary
   */
  async getPatientMedicalSummary(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        appointments: {
          take: 10,
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        medicalRecords: {
          take: 5,
          orderBy: { visitDate: 'desc' },
        },
        labTests: {
          take: 10,
          orderBy: { orderedDate: 'desc' },
          where: { status: 'COMPLETED' },
        },
        radiologyTests: {
          take: 10,
          orderBy: { orderedDate: 'desc' },
          where: { status: 'COMPLETED' },
        },
        prescriptions: {
          take: 5,
          orderBy: { prescribedDate: 'desc' },
          include: {
            medication: {
              select: { name: true, strength: true },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: `${patient.user.firstName} ${patient.user.lastName}`,
        dateOfBirth: patient.dateOfBirth,
        age: this.calculateAge(patient.dateOfBirth),
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
      },
      recentAppointments: patient.appointments,
      recentMedicalRecords: patient.medicalRecords,
      recentLabTests: patient.labTests,
      recentRadiologyTests: patient.radiologyTests,
      activePrescriptions: patient.prescriptions.filter(p => p.status === 'ACTIVE'),
    };
  }

  // Helper methods

  private async generateMRN(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count({
      where: {
        mrn: {
          startsWith: year.toString(),
        },
      },
    });

    return `${year}${(count + 1).toString().padStart(6, '0')}`;
  }

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  // Legacy method for backward compatibility
  async create(data: {
    userId: string;
    mrn: string;
    dateOfBirth: Date;
    gender: string;
    bloodType?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    address?: any;
    insuranceInfo?: any;
    medicalHistory?: any;
    allergies?: string[];
    currentMedications?: string[];
  }) {
    return this.prisma.patient.create({
      data: {
        userId: data.userId,
        mrn: data.mrn,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as any,
        bloodType: data.bloodType as any,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        insuranceInfo: data.insuranceInfo,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies || [],
        currentMedications: data.currentMedications || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { mrn: { contains: search } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        appointments: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { appointmentDate: 'desc' },
          take: 5,
        },
        medicalRecords: {
          orderBy: { visitDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(
    id: string,
    data: Partial<{
      emergencyContact: string;
      emergencyPhone: string;
      address: any;
      insuranceInfo: any;
      medicalHistory: any;
      allergies: string[];
      currentMedications: string[];
    }>,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.patient.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.patient.delete({
      where: { id },
    });
  }

  async getPatientStats() {
    const [totalPatients, activePatients, todayAppointments] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.patient.count({
        where: {
          user: { isActive: true },
        },
      }),
      this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      totalPatients,
      activePatients,
      todayAppointments,
    };
  }
}
