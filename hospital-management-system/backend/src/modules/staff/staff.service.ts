/*[object Object]*/
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class StaffService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  // Doctor Management
  /**
   *
   */
  async createDoctor(data: {
    userId: string;
    licenseNumber: string;
    specialization: string;
    department: string;
    experienceYears?: number;
    qualifications?: string[];
    schedule?: any;
    isAvailable?: boolean;
    createdBy?: string;
  }) {
    // Check if user already exists as doctor
    const existingDoctor = await this.prisma.doctor.findUnique({
      where: { userId: data.userId },
    });

    if (existingDoctor) {
      throw new ConflictException('User is already registered as a doctor');
    }

    // Check license number uniqueness
    const existingLicense = await this.prisma.doctor.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    return this.prisma.doctor.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        department: data.department,
        experienceYears: data.experienceYears || 0,
        qualifications: data.qualifications || [],
        schedule: data.schedule,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
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

  /**
   *
   */
  async getDoctors(
    page: number = 1,
    limit: number = 10,
    specialization?: string,
    department?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (specialization) {
      where.specialization = { contains: specialization };
    }
    if (department) {
      where.department = { contains: department };
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
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
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data: doctors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
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
          where: {
            appointmentDate: {
              gte: new Date(),
            },
          },
          orderBy: { appointmentDate: 'asc' },
          take: 5,
        },
        surgeries: {
          where: {
            scheduledDate: {
              gte: new Date(),
            },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  /**
   *
   */
  async updateDoctor(
    id: string,
    data: Partial<{
      licenseNumber: string;
      specialization: string;
      department: string;
      experienceYears: number;
      qualifications: string[];
      schedule: any;
      isAvailable: boolean;
      updatedBy?: string;
    }>,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check license number uniqueness if being updated
    if (data.licenseNumber && data.licenseNumber !== doctor.licenseNumber) {
      const existingLicense = await this.prisma.doctor.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    return this.prisma.doctor.update({
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

  /**
   *
   */
  async deleteDoctor(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if doctor has active appointments or surgeries
    const activeAppointments = await this.prisma.appointment.count({
      where: {
        doctorId: id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        appointmentDate: { gte: new Date() },
      },
    });

    if (activeAppointments > 0) {
      throw new ConflictException('Cannot delete doctor with active appointments');
    }

    return this.prisma.doctor.delete({
      where: { id },
    });
  }

  // Nurse Management
  /**
   *
   */
  async createNurse(data: {
    userId: string;
    licenseNumber: string;
    department: string;
    shift: string;
    createdBy?: string;
  }) {
    const existingNurse = await this.prisma.nurse.findUnique({
      where: { userId: data.userId },
    });

    if (existingNurse) {
      throw new ConflictException('User is already registered as a nurse');
    }

    const existingLicense = await this.prisma.nurse.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    return this.prisma.nurse.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        department: data.department,
        shift: data.shift as any,
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

  /**
   *
   */
  async getNurses(page: number = 1, limit: number = 10, department?: string, shift?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (department) {
      where.department = { contains: department };
    }
    if (shift) {
      where.shift = shift;
    }

    const [nurses, total] = await Promise.all([
      this.prisma.nurse.findMany({
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
      this.prisma.nurse.count({ where }),
    ]);

    return {
      data: nurses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getNurseById(id: string) {
    const nurse = await this.prisma.nurse.findUnique({
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
      },
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    return nurse;
  }

  /**
   *
   */
  async updateNurse(
    id: string,
    data: Partial<{
      licenseNumber: string;
      department: string;
      shift: string;
      updatedBy?: string;
    }>,
  ) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id },
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    if (data.licenseNumber && data.licenseNumber !== nurse.licenseNumber) {
      const existingLicense = await this.prisma.nurse.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    return this.prisma.nurse.update({
      where: { id },
      data: {
        ...data,
        shift: data.shift as any,
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

  /**
   *
   */
  async deleteNurse(id: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id },
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    return this.prisma.nurse.delete({
      where: { id },
    });
  }

  // Similar methods for Receptionist, LabTechnician, Pharmacist, Admin
  // I'll implement them concisely

  /**
   *
   */
  async createReceptionist(data: { userId: string; department: string; createdBy?: string }) {
    const existing = await this.prisma.receptionist.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new ConflictException('User is already registered as a receptionist');
    }

    return this.prisma.receptionist.create({
      data: {
        userId: data.userId,
        department: data.department,
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

  /**
   *
   */
  async getReceptionists(page: number = 1, limit: number = 10, department?: string) {
    const skip = (page - 1) * limit;
    const where = department ? { department: { contains: department } } : {};

    const [receptionists, total] = await Promise.all([
      this.prisma.receptionist.findMany({
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
      this.prisma.receptionist.count({ where }),
    ]);

    return {
      data: receptionists,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getReceptionistById(id: string) {
    const receptionist = await this.prisma.receptionist.findUnique({
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
      },
    });

    if (!receptionist) {
      throw new NotFoundException('Receptionist not found');
    }

    return receptionist;
  }

  /**
   *
   */
  async updateReceptionist(
    id: string,
    data: Partial<{
      department: string;
      updatedBy?: string;
    }>,
  ) {
    const receptionist = await this.prisma.receptionist.findUnique({
      where: { id },
    });

    if (!receptionist) {
      throw new NotFoundException('Receptionist not found');
    }

    return this.prisma.receptionist.update({
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

  /**
   *
   */
  async deleteReceptionist(id: string) {
    const receptionist = await this.prisma.receptionist.findUnique({
      where: { id },
    });

    if (!receptionist) {
      throw new NotFoundException('Receptionist not found');
    }

    return this.prisma.receptionist.delete({
      where: { id },
    });
  }

  // Lab Technician methods
  /**
   *
   */
  async createLabTechnician(data: {
    userId: string;
    licenseNumber: string;
    specialties?: string[];
    createdBy?: string;
  }) {
    const existing = await this.prisma.labTechnician.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new ConflictException('User is already registered as a lab technician');
    }

    const existingLicense = await this.prisma.labTechnician.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    return this.prisma.labTechnician.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        specialties: data.specialties || [],
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

  /**
   *
   */
  async getLabTechnicians(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [technicians, total] = await Promise.all([
      this.prisma.labTechnician.findMany({
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
      this.prisma.labTechnician.count(),
    ]);

    return {
      data: technicians,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getLabTechnicianById(id: string) {
    const technician = await this.prisma.labTechnician.findUnique({
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
      },
    });

    if (!technician) {
      throw new NotFoundException('Lab technician not found');
    }

    return technician;
  }

  /**
   *
   */
  async updateLabTechnician(
    id: string,
    data: Partial<{
      licenseNumber: string;
      specialties: string[];
      updatedBy?: string;
    }>,
  ) {
    const technician = await this.prisma.labTechnician.findUnique({
      where: { id },
    });

    if (!technician) {
      throw new NotFoundException('Lab technician not found');
    }

    if (data.licenseNumber && data.licenseNumber !== technician.licenseNumber) {
      const existingLicense = await this.prisma.labTechnician.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    return this.prisma.labTechnician.update({
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

  /**
   *
   */
  async deleteLabTechnician(id: string) {
    const technician = await this.prisma.labTechnician.findUnique({
      where: { id },
    });

    if (!technician) {
      throw new NotFoundException('Lab technician not found');
    }

    return this.prisma.labTechnician.delete({
      where: { id },
    });
  }

  // Pharmacist methods
  /**
   *
   */
  async createPharmacist(data: { userId: string; licenseNumber: string; createdBy?: string }) {
    const existing = await this.prisma.pharmacist.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new ConflictException('User is already registered as a pharmacist');
    }

    const existingLicense = await this.prisma.pharmacist.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    return this.prisma.pharmacist.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
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

  /**
   *
   */
  async getPharmacists(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [pharmacists, total] = await Promise.all([
      this.prisma.pharmacist.findMany({
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
      this.prisma.pharmacist.count(),
    ]);

    return {
      data: pharmacists,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getPharmacistById(id: string) {
    const pharmacist = await this.prisma.pharmacist.findUnique({
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
      },
    });

    if (!pharmacist) {
      throw new NotFoundException('Pharmacist not found');
    }

    return pharmacist;
  }

  /**
   *
   */
  async updatePharmacist(
    id: string,
    data: Partial<{
      licenseNumber: string;
      updatedBy?: string;
    }>,
  ) {
    const pharmacist = await this.prisma.pharmacist.findUnique({
      where: { id },
    });

    if (!pharmacist) {
      throw new NotFoundException('Pharmacist not found');
    }

    if (data.licenseNumber && data.licenseNumber !== pharmacist.licenseNumber) {
      const existingLicense = await this.prisma.pharmacist.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    return this.prisma.pharmacist.update({
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

  /**
   *
   */
  async deletePharmacist(id: string) {
    const pharmacist = await this.prisma.pharmacist.findUnique({
      where: { id },
    });

    if (!pharmacist) {
      throw new NotFoundException('Pharmacist not found');
    }

    return this.prisma.pharmacist.delete({
      where: { id },
    });
  }

  // Admin methods
  /**
   *
   */
  async createAdmin(data: {
    userId: string;
    department: string;
    permissions?: string[];
    createdBy?: string;
  }) {
    const existing = await this.prisma.admin.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw new ConflictException('User is already registered as an admin');
    }

    return this.prisma.admin.create({
      data: {
        userId: data.userId,
        department: data.department,
        permissions: data.permissions || [],
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

  /**
   *
   */
  async getAdmins(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      this.prisma.admin.findMany({
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
      this.prisma.admin.count(),
    ]);

    return {
      data: admins,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getAdminById(id: string) {
    const admin = await this.prisma.admin.findUnique({
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
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  /**
   *
   */
  async updateAdmin(
    id: string,
    data: Partial<{
      department: string;
      permissions: string[];
      updatedBy?: string;
    }>,
  ) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.prisma.admin.update({
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

  /**
   *
   */
  async deleteAdmin(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.prisma.admin.delete({
      where: { id },
    });
  }

  // Staff Statistics
  /**
   *
   */
  async getStaffStats() {
    const [
      totalDoctors,
      totalNurses,
      totalReceptionists,
      totalLabTechnicians,
      totalPharmacists,
      totalAdmins,
      activeDoctors,
      activeNurses,
    ] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.nurse.count(),
      this.prisma.receptionist.count(),
      this.prisma.labTechnician.count(),
      this.prisma.pharmacist.count(),
      this.prisma.admin.count(),
      this.prisma.doctor.count({ where: { isAvailable: true } }),
      this.prisma.nurse.count(),
    ]);

    return {
      total:
        totalDoctors +
        totalNurses +
        totalReceptionists +
        totalLabTechnicians +
        totalPharmacists +
        totalAdmins,
      breakdown: {
        doctors: { total: totalDoctors, active: activeDoctors },
        nurses: { total: totalNurses, active: activeNurses },
        receptionists: { total: totalReceptionists },
        labTechnicians: { total: totalLabTechnicians },
        pharmacists: { total: totalPharmacists },
        admins: { total: totalAdmins },
      },
    };
  }

  // Bulk operations
  /**
   *
   */
  async bulkCreateStaff(staff: any[], createdBy: string) {
    const results = [];
    const errors = [];

    for (const staffMember of staff) {
      try {
        let result;
        switch (staffMember.role) {
          case 'DOCTOR':
            result = await this.createDoctor({ ...staffMember, createdBy });
            break;
          case 'NURSE':
            result = await this.createNurse({ ...staffMember, createdBy });
            break;
          case 'RECEPTIONIST':
            result = await this.createReceptionist({ ...staffMember, createdBy });
            break;
          case 'LAB_TECHNICIAN':
            result = await this.createLabTechnician({ ...staffMember, createdBy });
            break;
          case 'PHARMACIST':
            result = await this.createPharmacist({ ...staffMember, createdBy });
            break;
          case 'ADMIN':
            result = await this.createAdmin({ ...staffMember, createdBy });
            break;
          default:
            throw new Error(`Invalid role: ${staffMember.role}`);
        }
        results.push(result);
      } catch (error) {
        errors.push({
          staffMember,
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}
