import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import {
  GenerateReportDto,
  ReportFilterDto,
  PatientReportDto,
  DepartmentReportDto,
  FinancialReportDto,
  InventoryReportDto,
  StaffPerformanceReportDto,
} from './dto/reports.dto';
import { ReportType, ReportFormat, ReportStatus } from './dto/report.enums';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * Generate a report based on type and parameters
   */
  async generateReport(data: GenerateReportDto) {
    const reportData = await this.getReportData(data);

    // Log report generation
    await this.complianceService.logAuditEvent({
      userId: data.generatedBy || 'system',
      action: 'REPORT_GENERATED',
      resource: 'reports',
      resourceId: `report-${Date.now()}`,
      details: {
        reportType: data.reportType,
        format: data.format,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      complianceFlags: ['REPORTING', 'DATA_ACCESS'],
    });

    return {
      reportType: data.reportType,
      format: data.format,
      generatedAt: new Date(),
      data: reportData,
    };
  }

  /**
   * Get report data based on type
   */
  private async getReportData(params: GenerateReportDto): Promise<any> {
    const { reportType, startDate, endDate, department, doctorId, patientId } = params;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    switch (reportType) {
      case ReportType.PATIENT_SUMMARY:
        return this.generatePatientReport(patientId!, start, end);

      case ReportType.DEPARTMENT_PERFORMANCE:
        return this.generateDepartmentReport(department!, start, end);

      case ReportType.FINANCIAL_SUMMARY:
        return this.generateFinancialReport(start, end);

      case ReportType.INVENTORY_STATUS:
        return this.generateInventoryReport();

      case ReportType.STAFF_PERFORMANCE:
        return this.generateStaffPerformanceReport(start, end);

      case ReportType.APPOINTMENT_ANALYTICS:
        return this.generateAppointmentAnalytics(start, end, department, doctorId);

      case ReportType.LAB_RESULTS_SUMMARY:
        return this.generateLabResultsReport(start, end, patientId);

      case ReportType.RADIOLOGY_REPORTS:
        return this.generateRadiologyReports(start, end, patientId);

      case ReportType.PHARMACY_DISPENSATION:
        return this.generatePharmacyReport(start, end);

      case ReportType.EMERGENCY_RESPONSE:
        return this.generateEmergencyReport(start, end);

      case ReportType.SURGERY_OUTCOMES:
        return this.generateSurgeryOutcomesReport(start, end, doctorId);

      case ReportType.IPD_ADMISSION_SUMMARY:
        return this.generateIPDAdmissionReport(start, end);

      case ReportType.BLOOD_BANK_INVENTORY:
        return this.generateBloodBankReport();

      case ReportType.COMPLIANCE_AUDIT:
        return this.generateComplianceAuditReport(start, end);

      default:
        throw new NotFoundException('Report type not supported');
    }
  }

  /**
   * Generate patient summary report
   */
  private async generatePatientReport(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PatientReportDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
        medicalRecords: {
          where: {
            visitDate: { gte: startDate, lte: endDate },
          },
          orderBy: { visitDate: 'desc' },
        },
        prescriptions: {
          where: {
            prescribedDate: { gte: startDate, lte: endDate },
          },
          include: { medication: true },
        },
        labTests: {
          where: {
            orderedDate: { gte: startDate, lte: endDate },
          },
          include: { results: true },
        },
        radiologyTests: {
          where: {
            orderedDate: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      patientId: patient.id,
      patientName: `${patient.user.firstName} ${patient.user.lastName}`,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType || 'Unknown',
      medicalHistory: patient.medicalRecords.map(record => ({
        date: record.visitDate,
        diagnosis: record.diagnosis,
        treatment: record.treatmentPlan,
        notes: record.notes,
      })),
      currentMedications: patient.currentMedications,
      allergies: patient.allergies,
      recentVisits: patient.medicalRecords.slice(0, 10),
      labResults: patient.labTests.flatMap(test => test.results),
      radiologyReports: patient.radiologyTests,
    };
  }

  /**
   * Generate department performance report
   */
  private async generateDepartmentReport(
    department: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DepartmentReportDto> {
    const [appointments, procedures, revenue] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          doctor: { department },
          appointmentDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.surgery.count({
        where: {
          operatingTheater: { type: department as any },
          scheduledDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          patient: {
            appointments: {
              some: {
                doctor: { department },
                appointmentDate: { gte: startDate, lte: endDate },
              },
            },
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      department,
      totalPatients: appointments,
      totalAppointments: appointments,
      totalProcedures: procedures,
      revenue: revenue._sum.amount?.toNumber() || 0,
      averageWaitTime: 0, // Would need actual wait time tracking
      patientSatisfaction: 0, // Would need satisfaction survey data
    };
  }

  /**
   * Generate financial summary report
   */
  private async generateFinancialReport(
    startDate: Date,
    endDate: Date,
  ): Promise<FinancialReportDto> {
    const [revenue, expenses, invoices] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          issuedAt: { gte: startDate, lte: endDate },
          status: 'PAID',
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          issuedAt: { gte: startDate, lte: endDate },
        },
        select: { status: true },
      }),
    ]);

    const totalRevenue = revenue._sum.amount?.toNumber() || 0;
    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const netIncome = totalRevenue - totalExpenses;

    const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
    const outstandingInvoices = invoices.filter(inv => inv.status === 'PENDING').length;

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalExpenses,
      netIncome,
      revenueByDepartment: [], // Would need department-wise revenue calculation
      expenseBreakdown: [], // Would need expense categorization
      outstandingInvoices,
      paidInvoices,
    };
  }

  /**
   * Generate inventory status report
   */
  private async generateInventoryReport(): Promise<InventoryReportDto[]> {
    const medications = await this.prisma.medication.findMany({
      where: { isActive: true },
    });

    return medications.map(med => ({
      itemName: med.name,
      category: med.category || 'General',
      currentStock: med.stockQuantity,
      reorderLevel: med.reorderLevel,
      unitPrice: Number(med.unitPrice),
      totalValue: med.stockQuantity * Number(med.unitPrice),
      lastRestocked: med.updatedAt,
      expiryDate: med.expiryDate || undefined,
      status: med.stockQuantity <= med.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK',
    }));
  }

  /**
   * Generate staff performance report
   */
  private async generateStaffPerformanceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<StaffPerformanceReportDto[]> {
    const doctors = await this.prisma.doctor.findMany({
      include: {
        user: true,
        appointments: {
          where: {
            appointmentDate: { gte: startDate, lte: endDate },
          },
        },
        medicalRecords: {
          where: {
            visitDate: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    return doctors.map(doctor => ({
      staffId: doctor.id,
      staffName: `${doctor.user.firstName} ${doctor.user.lastName}`,
      department: doctor.department,
      role: 'DOCTOR',
      totalPatients: doctor.appointments.length,
      averageRating: 0, // Would need rating system
      completedTasks: doctor.medicalRecords.length,
      pendingTasks: 0, // Would need task tracking
      workingHours: 0, // Would need time tracking
      efficiency: doctor.medicalRecords.length / Math.max(doctor.appointments.length, 1),
    }));
  }

  /**
   * Generate appointment analytics report
   */
  private async generateAppointmentAnalytics(
    startDate: Date,
    endDate: Date,
    department?: string,
    doctorId?: string,
  ) {
    const where: any = {
      appointmentDate: { gte: startDate, lte: endDate },
    };

    if (department) {
      where.doctor = { department };
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const [totalAppointments, completedAppointments, cancelledAppointments, noShows] =
      await Promise.all([
        this.prisma.appointment.count({ where }),
        this.prisma.appointment.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'CANCELLED' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'NO_SHOW' },
        }),
      ]);

    return {
      period: { startDate, endDate },
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShows,
      completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
      department: department || 'All',
      doctorId,
    };
  }

  /**
   * Generate lab results summary report
   */
  private async generateLabResultsReport(startDate: Date, endDate: Date, patientId?: string) {
    const where: any = {
      orderedDate: { gte: startDate, lte: endDate },
    };

    if (patientId) {
      where.patientId = patientId;
    }

    const labTests = await this.prisma.labTest.findMany({
      where,
      include: {
        results: true,
        patient: {
          include: { user: true },
        },
        testCatalog: true,
      },
    });

    return labTests.map(test => ({
      testId: test.id,
      patientName: `${test.patient.user.firstName} ${test.patient.user.lastName}`,
      testName: test.testCatalog?.testName || 'Unknown',
      orderedDate: test.orderedDate,
      status: test.status,
      results: test.results,
      abnormalResults: test.results.filter(result => result.flag !== 'NORMAL'),
    }));
  }

  /**
   * Generate radiology reports
   */
  private async generateRadiologyReports(startDate: Date, endDate: Date, patientId?: string) {
    const where: any = {
      orderedDate: { gte: startDate, lte: endDate },
    };

    if (patientId) {
      where.patientId = patientId;
    }

    const radiologyTests = await this.prisma.radiologyTest.findMany({
      where,
      include: {
        patient: {
          include: { user: true },
        },
        radiologist: {
          include: { user: true },
        },
      },
    });

    return radiologyTests.map(test => ({
      testId: test.id,
      patientName: `${test.patient.user.firstName} ${test.patient.user.lastName}`,
      testName: test.testName,
      modality: test.modality,
      orderedDate: test.orderedDate,
      performedDate: test.performedDate,
      radiologist: test.radiologist
        ? `${test.radiologist.user.firstName} ${test.radiologist.user.lastName}`
        : null,
      findings: test.findings,
      impression: test.impression,
      status: test.status,
    }));
  }

  /**
   * Generate pharmacy dispensation report
   */
  private async generatePharmacyReport(startDate: Date, endDate: Date) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescribedDate: { gte: startDate, lte: endDate },
      },
      include: {
        medication: true,
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    return prescriptions.map(prescription => ({
      prescriptionId: prescription.id,
      patientName: `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`,
      doctorName: `${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
      medication: prescription.medication.name,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      prescribedDate: prescription.prescribedDate,
      dispensedDate: prescription.dispensedDate,
      status: prescription.status,
    }));
  }

  /**
   * Generate emergency response report
   */
  private async generateEmergencyReport(startDate: Date, endDate: Date) {
    const emergencyVisits = await this.prisma.emergencyVisit.findMany({
      where: {
        arrivalDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    const triageStats = {
      LEVEL_1: emergencyVisits.filter(v => v.triageLevel === 'LEVEL_1').length,
      LEVEL_2: emergencyVisits.filter(v => v.triageLevel === 'LEVEL_2').length,
      LEVEL_3: emergencyVisits.filter(v => v.triageLevel === 'LEVEL_3').length,
      LEVEL_4: emergencyVisits.filter(v => v.triageLevel === 'LEVEL_4').length,
      LEVEL_5: emergencyVisits.filter(v => v.triageLevel === 'LEVEL_5').length,
    };

    const dispositionStats = {
      DISCHARGED: emergencyVisits.filter(v => v.disposition === 'DISCHARGED').length,
      ADMITTED: emergencyVisits.filter(v => v.disposition === 'ADMITTED').length,
      TRANSFERRED: emergencyVisits.filter(v => v.disposition === 'TRANSFERRED').length,
      LEFT_AGAINST_ADVICE: emergencyVisits.filter(v => v.disposition === 'LEFT_AGAINST_ADVICE')
        .length,
      EXPIRED: emergencyVisits.filter(v => v.disposition === 'EXPIRED').length,
    };

    return {
      period: { startDate, endDate },
      totalVisits: emergencyVisits.length,
      triageStats,
      dispositionStats,
      averageWaitTime: 0, // Would need actual timing data
      criticalCases: triageStats.LEVEL_1 + triageStats.LEVEL_2,
    };
  }

  /**
   * Generate surgery outcomes report
   */
  private async generateSurgeryOutcomesReport(startDate: Date, endDate: Date, doctorId?: string) {
    const where: any = {
      scheduledDate: { gte: startDate, lte: endDate },
    };

    if (doctorId) {
      where.surgeonId = doctorId;
    }

    const surgeries = await this.prisma.surgery.findMany({
      where,
      include: {
        patient: {
          include: { user: true },
        },
        surgeon: {
          include: { user: true },
        },
        operatingTheater: true,
      },
    });

    const outcomes = {
      SUCCESSFUL: surgeries.filter(s => s.outcome === 'SUCCESSFUL').length,
      COMPLICATIONS: surgeries.filter(s => s.outcome === 'COMPLICATIONS').length,
      UNSUCCESSFUL: surgeries.filter(s => s.outcome === 'UNSUCCESSFUL').length,
      DEATH: surgeries.filter(s => s.outcome === 'DEATH').length,
    };

    return {
      period: { startDate, endDate },
      totalSurgeries: surgeries.length,
      outcomes,
      successRate: surgeries.length > 0 ? (outcomes.SUCCESSFUL / surgeries.length) * 100 : 0,
      complicationRate:
        surgeries.length > 0 ? (outcomes.COMPLICATIONS / surgeries.length) * 100 : 0,
      surgeries: surgeries.map(s => ({
        id: s.id,
        patientName: `${s.patient.user.firstName} ${s.patient.user.lastName}`,
        procedure: s.procedureName,
        surgeon: `${s.surgeon.user.firstName} ${s.surgeon.user.lastName}`,
        date: s.scheduledDate,
        outcome: s.outcome,
        complications: s.complications,
      })),
    };
  }

  /**
   * Generate IPD admission summary report
   */
  private async generateIPDAdmissionReport(startDate: Date, endDate: Date) {
    // Since IPD admissions are stored in MedicalRecord, we need to query accordingly
    const admissions = await this.prisma.medicalRecord.findMany({
      where: {
        notes: { contains: 'IPD_ADMISSION' },
        visitDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    const discharged = admissions.filter(a => a.diagnosis.includes('DISCHARGED')).length;
    const currentlyAdmitted = admissions.length - discharged;

    return {
      period: { startDate, endDate },
      totalAdmissions: admissions.length,
      currentlyAdmitted,
      discharged,
      averageLengthOfStay: 0, // Would need discharge date calculation
      admissionByDepartment: {}, // Would need department classification
    };
  }

  /**
   * Generate blood bank inventory report
   */
  private async generateBloodBankReport() {
    const bloodInventory = await this.prisma.bloodDonation.groupBy({
      by: ['bloodType', 'status'],
      _count: { id: true },
      _sum: { quantity: true },
      where: {
        expiryDate: { gt: new Date() },
      },
    });

    const inventoryByType = bloodInventory.reduce((acc, item) => {
      if (!acc[item.bloodType]) {
        acc[item.bloodType] = {
          bloodType: item.bloodType,
          available: 0,
          quarantined: 0,
          totalVolume: 0,
        };
      }

      if (item.status === 'RELEASED') {
        acc[item.bloodType].available = item._count.id;
        acc[item.bloodType].totalVolume = item._sum.quantity || 0;
      } else if (item.status === 'QUARANTINED') {
        acc[item.bloodType].quarantined = item._count.id;
      }

      return acc;
    }, {} as any);

    return Object.values(inventoryByType);
  }

  /**
   * Generate compliance audit report
   */
  private async generateComplianceAuditReport(startDate: Date, endDate: Date) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    const complianceFlags = auditLogs.flatMap(log => log.complianceFlags);
    const flagCounts = complianceFlags.reduce((acc, flag) => {
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      period: { startDate, endDate },
      totalAuditEvents: auditLogs.length,
      complianceFlagDistribution: flagCounts,
      criticalEvents: auditLogs.filter(log =>
        log.complianceFlags.includes('CRITICAL_PATIENT_DATA'),
      ),
      recentEvents: auditLogs.slice(0, 100),
    };
  }
}
