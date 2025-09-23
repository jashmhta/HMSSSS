/*[object Object]*/
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  doctorId?: string;
  patientId?: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  departmentBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  monthlyTrend: Array<{ month: string; revenue: number }>;
  topServices: Array<{ service: string; revenue: number; count: number }>;
}

export interface OPDAnalytics {
  totalVisits: number;
  averageWaitTime: number;
  departmentWiseVisits: Record<string, number>;
  doctorPerformance: Array<{
    doctorId: string;
    doctorName: string;
    visitsCount: number;
    averageConsultationTime: number;
  }>;
  peakHours: Array<{ hour: number; visits: number }>;
  patientSatisfaction: number;
}

export interface IPDAnalytics {
  totalAdmissions: number;
  averageLengthOfStay: number;
  bedOccupancyRate: number;
  departmentWiseAdmissions: Record<string, number>;
  dischargeOutcomes: Record<string, number>;
  readmissionRate: number;
  mortalityRate: number;
}

export interface OccupancyAnalytics {
  overallOccupancy: number;
  wardWiseOccupancy: Record<string, number>;
  bedUtilization: Array<{
    bedId: string;
    occupancyDays: number;
    totalDays: number;
    utilizationRate: number;
  }>;
  peakOccupancyHours: Array<{ hour: number; occupancy: number }>;
}

/**
 *
 */
@Injectable()
export class ReportsService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  // Patient Reports
  /**
   *
   */
  async getPatientDemographics(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const patients = await this.prisma.patient.findMany({
      where,
      select: {
        gender: true,
        dateOfBirth: true,
        bloodType: true,
        createdAt: true,
      },
    });

    // Age distribution
    const ageGroups = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
    };

    // Gender distribution
    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
    };

    // Blood type distribution
    const bloodTypeDistribution = {
      'A+': 0,
      'A-': 0,
      'B+': 0,
      'B-': 0,
      'AB+': 0,
      'AB-': 0,
      'O+': 0,
      'O-': 0,
    };

    patients.forEach(patient => {
      // Age calculation
      const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;

      // Gender
      if (patient.gender === 'MALE') genderDistribution.male++;
      else if (patient.gender === 'FEMALE') genderDistribution.female++;
      else genderDistribution.other++;

      // Blood type
      if (patient.bloodType) {
        const bloodType = patient.bloodType.replace('_', '');
        bloodTypeDistribution[bloodType] = (bloodTypeDistribution[bloodType] || 0) + 1;
      }
    });

    return {
      totalPatients: patients.length,
      ageDistribution: ageGroups,
      genderDistribution,
      bloodTypeDistribution,
    };
  }

  /**
   *
   */
  async getPatientRegistrationTrends(period: string = 'monthly', year?: number) {
    const currentYear = year || new Date().getFullYear();
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(currentYear, month - 1, 1);
      const endDate = new Date(currentYear, month, 0, 23, 59, 59);

      const count = await this.prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      monthlyData.push({
        month: startDate.toLocaleString('default', { month: 'long' }),
        year: currentYear,
        count,
      });
    }

    return {
      period,
      year: currentYear,
      data: monthlyData,
    };
  }

  // Appointment Reports
  /**
   *
   */
  async getAppointmentSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = new Date(startDate);
      if (endDate) where.appointmentDate.lte = new Date(endDate);
    }

    const [
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'SCHEDULED' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
    ]);

    const completionRate =
      totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
        : '0.00';

    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      completionRate: `${completionRate}%`,
    };
  }

  /**
   *
   */
  async getDoctorUtilization(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = new Date(startDate);
      if (endDate) where.appointmentDate.lte = new Date(endDate);
    }

    const doctors = await this.prisma.doctor.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        appointments: {
          where,
          select: {
            status: true,
            appointmentDate: true,
          },
        },
      },
    });

    const utilizationData = doctors.map(doctor => {
      const totalAppointments = doctor.appointments.length;
      const completedAppointments = doctor.appointments.filter(
        apt => apt.status === 'COMPLETED',
      ).length;

      const utilizationRate =
        totalAppointments > 0
          ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
          : '0.00';

      return {
        doctorId: doctor.id,
        doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
        totalAppointments,
        completedAppointments,
        utilizationRate: `${utilizationRate}%`,
      };
    });

    return utilizationData.sort(
      (a, b) => parseFloat(b.utilizationRate) - parseFloat(a.utilizationRate),
    );
  }

  // Revenue Reports
  /**
   *
   */
  async getRevenueSummary(startDate?: string, endDate?: string, groupBy: string = 'monthly') {
    const where: any = { status: 'PAID' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bills = await this.prisma.bill.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const groupedData = {};

    bills.forEach(bill => {
      let key;
      switch (groupBy) {
        case 'monthly': {
          key = bill.createdAt.toISOString().slice(0, 7); // YYYY-MM

          break;
        }
        case 'daily': {
          key = bill.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD

          break;
        }
        case 'yearly': {
          key = bill.createdAt.getFullYear().toString();

          break;
        }
        // No default
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += parseFloat(bill.totalAmount.toString());
    });

    const totalRevenue = bills.reduce(
      (sum, bill) => sum + parseFloat(bill.totalAmount.toString()),
      0,
    );

    return {
      totalRevenue,
      groupBy,
      data: Object.entries(groupedData).map(([period, amount]) => ({
        period,
        revenue: amount,
      })),
    };
  }

  /**
   *
   */
  async getDepartmentRevenue(startDate?: string, endDate?: string) {
    // This would require linking bills to departments
    // For now, return a placeholder structure
    return {
      message: 'Department revenue report - requires bill department mapping',
      data: [],
    };
  }

  /**
   *
   */
  async getPaymentMethodsDistribution(startDate?: string, endDate?: string) {
    const where: any = { status: 'PAID' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bills = await this.prisma.bill.findMany({
      where,
      select: {
        paymentMethod: true,
        totalAmount: true,
      },
    });

    const distribution = {};
    let totalAmount = 0;

    bills.forEach(bill => {
      const method = bill.paymentMethod || 'CASH';
      if (!distribution[method]) {
        distribution[method] = { count: 0, amount: 0 };
      }
      distribution[method].count++;
      distribution[method].amount += parseFloat(bill.totalAmount.toString());
      totalAmount += parseFloat(bill.totalAmount.toString());
    });

    return {
      totalAmount,
      distribution: Object.entries(distribution).map(([method, data]: [string, any]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: ((data.amount / totalAmount) * 100).toFixed(2) + '%',
      })),
    };
  }

  // Laboratory Reports
  /**
   *
   */
  async getLabTestStatistics(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.orderedDate = {};
      if (startDate) where.orderedDate.gte = new Date(startDate);
      if (endDate) where.orderedDate.lte = new Date(endDate);
    }

    const [totalTests, completedTests, pendingTests, cancelledTests] = await Promise.all([
      this.prisma.labTest.count({ where }),
      this.prisma.labTest.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.labTest.count({ where: { ...where, status: 'ORDERED' } }),
      this.prisma.labTest.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    const completionRate =
      totalTests > 0 ? ((completedTests / totalTests) * 100).toFixed(2) : '0.00';

    return {
      totalTests,
      completedTests,
      pendingTests,
      cancelledTests,
      completionRate: `${completionRate}%`,
    };
  }

  /**
   *
   */
  async getLabTurnaroundTime(startDate?: string, endDate?: string) {
    const tests = await this.prisma.labTest.findMany({
      where: {
        status: 'COMPLETED',
        orderedDate: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        testCatalog: {
          select: {
            testName: true,
          },
        },
        results: {
          select: {
            performedDate: true,
          },
          orderBy: {
            performedDate: 'desc',
          },
          take: 1,
        },
      },
    });

    const turnaroundTimes = tests
      .filter(test => test.results.length > 0)
      .map(test => {
        const orderedTime = new Date(test.orderedDate).getTime();
        const resultTime = new Date(test.results[0].performedDate).getTime();
        const hours = (resultTime - orderedTime) / (1000 * 60 * 60);
        return {
          testName: test.testCatalog.testName,
          turnaroundHours: Math.round(hours * 100) / 100,
        };
      });

    const averageTurnaround =
      turnaroundTimes.length > 0
        ? turnaroundTimes.reduce((sum, test) => sum + test.turnaroundHours, 0) /
          turnaroundTimes.length
        : 0;

    return {
      averageTurnaroundHours: Math.round(averageTurnaround * 100) / 100,
      testCount: tests.length,
      turnaroundTimes: turnaroundTimes.slice(0, 10), // Top 10
    };
  }

  // Pharmacy Reports
  /**
   *
   */
  async getPharmacyDispensingReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.dispensedDate = {};
      if (startDate) where.dispensedDate.gte = new Date(startDate);
      if (endDate) where.dispensedDate.lte = new Date(endDate);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
      },
      include: {
        medication: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    const medicationStats = {};
    prescriptions.forEach(prescription => {
      const medName = prescription.medication.name;
      if (!medicationStats[medName]) {
        medicationStats[medName] = {
          name: medName,
          category: prescription.medication.category,
          totalDispensed: 0,
          prescriptionCount: 0,
        };
      }
      medicationStats[medName].totalDispensed += prescription.quantity;
      medicationStats[medName].prescriptionCount++;
    });

    return {
      totalPrescriptions: prescriptions.length,
      medications: Object.values(medicationStats).sort(
        (a: any, b: any) => b.totalDispensed - a.totalDispensed,
      ),
    };
  }

  // OT/Surgery Reports
  /**
   *
   */
  async getSurgeryStatistics(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [totalSurgeries, completedSurgeries, cancelledSurgeries, emergencySurgeries] =
      await Promise.all([
        this.prisma.surgery.count({ where }),
        this.prisma.surgery.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.surgery.count({ where: { ...where, status: 'CANCELLED' } }),
        this.prisma.surgery.count({ where: { ...where, priority: 'EMERGENCY' } }),
      ]);

    const successRate =
      totalSurgeries > 0 ? ((completedSurgeries / totalSurgeries) * 100).toFixed(2) : '0.00';

    return {
      totalSurgeries,
      completedSurgeries,
      cancelledSurgeries,
      emergencySurgeries,
      successRate: `${successRate}%`,
    };
  }

  /**
   *
   */
  async getOTUtilization(startDate?: string, endDate?: string) {
    // This would require OT schedule data
    return {
      message: 'OT utilization report - requires OT schedule implementation',
      data: [],
    };
  }

  // Emergency Department Reports
  /**
   *
   */
  async getEmergencyTriageStats(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.arrivalDate = {};
      if (startDate) where.arrivalDate.gte = new Date(startDate);
      if (endDate) where.arrivalDate.lte = new Date(endDate);
    }

    const visits = await this.prisma.emergencyVisit.findMany({
      where,
      select: {
        triageLevel: true,
        disposition: true,
      },
    });

    const triageStats = {
      LEVEL_1: 0,
      LEVEL_2: 0,
      LEVEL_3: 0,
      LEVEL_4: 0,
      LEVEL_5: 0,
    };

    const dispositionStats = {
      DISCHARGED: 0,
      ADMITTED: 0,
      TRANSFERRED: 0,
      LEFT_AGAINST_ADVICE: 0,
      EXPIRED: 0,
    };

    visits.forEach(visit => {
      triageStats[visit.triageLevel]++;
      dispositionStats[visit.disposition]++;
    });

    return {
      totalVisits: visits.length,
      triageDistribution: triageStats,
      dispositionDistribution: dispositionStats,
    };
  }

  // Inventory Reports
  /**
   *
   */
  async getInventoryStockLevels() {
    const medications = await this.prisma.medication.findMany({
      where: { isActive: true },
      select: {
        name: true,
        stockQuantity: true,
        reorderLevel: true,
        unitPrice: true,
        category: true,
      },
    });

    const stockLevels = medications.map(med => ({
      name: med.name,
      category: med.category,
      currentStock: med.stockQuantity,
      reorderLevel: med.reorderLevel,
      status:
        med.stockQuantity === 0
          ? 'OUT_OF_STOCK'
          : med.stockQuantity <= med.reorderLevel
            ? 'LOW_STOCK'
            : 'IN_STOCK',
      value: med.stockQuantity * parseFloat(med.unitPrice.toString()),
    }));

    return {
      totalItems: medications.length,
      stockLevels: stockLevels.sort((a, b) => a.currentStock - b.currentStock),
    };
  }

  /**
   *
   */
  async getInventoryExpiryAlerts(days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const medications = await this.prisma.medication.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      select: {
        name: true,
        expiryDate: true,
        stockQuantity: true,
        batchNumber: true,
      },
    });

    return {
      alertDays: days,
      expiringItems: medications
        .map(med => ({
          name: med.name,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          currentStock: med.stockQuantity,
          daysUntilExpiry: Math.ceil(
            (new Date(med.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          ),
        }))
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    };
  }

  // Staff Performance Reports
  /**
   *
   */
  async getStaffPerformanceReport(startDate?: string, endDate?: string) {
    // This would aggregate data from various staff activities
    return {
      message: 'Staff performance report - requires activity tracking implementation',
      data: [],
    };
  }

  // Dashboard Summary
  /**
   *
   */
  async getDashboardSummary() {
    const [totalPatients, todayAppointments, pendingBills, lowStockItems, todaySurgeries] =
      await Promise.all([
        this.prisma.patient.count(),
        this.prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        this.prisma.bill.count({ where: { status: 'PENDING' } }),
        this.prisma.medication.count({
          where: {
            isActive: true,
            stockQuantity: {
              lte: this.prisma.medication.fields.reorderLevel,
            },
          },
        }),
        this.prisma.surgery.count({
          where: {
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ]);

    return {
      totalPatients,
      todayAppointments,
      pendingBills,
      lowStockItems,
      todaySurgeries,
      timestamp: new Date().toISOString(),
    };
  }

  // Custom Report Generation
  /**
   *
   */
  async generateCustomReport(type: string, filters: any, startDate?: string, endDate?: string) {
    // This would be a flexible report generator
    // For now, return a placeholder
    return {
      type,
      filters,
      dateRange: { startDate, endDate },
      message: 'Custom report generation - requires implementation based on report type',
      data: [],
    };
  }
}
