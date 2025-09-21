import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface DateRange {
  from: Date;
  to: Date;
}

interface LabAnalytics {
  overview: {
    totalTests: number;
    completedTests: number;
    pendingTests: number;
    cancelledTests: number;
    averageTurnaroundTime: number;
    testVolumeChange: number; // percentage
  };
  byDepartment: Array<{
    department: string;
    totalTests: number;
    completedTests: number;
    averageTAT: number;
    percentage: number;
  }>;
  byTestType: Array<{
    testName: string;
    testCode: string;
    volume: number;
    averageTAT: number;
    rejectionRate: number;
  }>;
  qualityMetrics: {
    qcPassRate: number;
    errorRate: number;
    rejectionRate: number;
    criticalValueAlerts: number;
  };
  performance: {
    dailyVolume: Array<{ date: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    technicianWorkload: Array<{ technician: string; tests: number; avgTAT: number }>;
  };
  trends: {
    testVolumeTrend: Array<{ date: string; count: number }>;
    tatTrend: Array<{ date: string; avgTAT: number }>;
    qualityTrend: Array<{ date: string; passRate: number }>;
  };
}

@Injectable()
export class LabAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive lab analytics
   */
  async getLabAnalytics(dateRange?: DateRange): Promise<LabAnalytics> {
    const range = dateRange || this.getDefaultDateRange();

    const [overview, byDepartment, byTestType, qualityMetrics, performance, trends] =
      await Promise.all([
        this.getOverviewMetrics(range),
        this.getDepartmentAnalytics(range),
        this.getTestTypeAnalytics(range),
        this.getQualityMetrics(range),
        this.getPerformanceMetrics(range),
        this.getTrendsData(range),
      ]);

    return {
      overview,
      byDepartment,
      byTestType,
      qualityMetrics,
      performance,
      trends,
    };
  }

  /**
   * Get overview metrics
   */
  private async getOverviewMetrics(range: DateRange): Promise<LabAnalytics['overview']> {
    const [currentStats, previousStats] = await Promise.all([
      this.getTestStats(range),
      this.getTestStats(this.getPreviousPeriod(range)),
    ]);

    const testVolumeChange =
      previousStats.total > 0
        ? ((currentStats.total - previousStats.total) / previousStats.total) * 100
        : 0;

    return {
      totalTests: currentStats.total,
      completedTests: currentStats.completed,
      pendingTests: currentStats.pending,
      cancelledTests: currentStats.cancelled,
      averageTurnaroundTime: currentStats.avgTAT,
      testVolumeChange: Math.round(testVolumeChange * 100) / 100,
    };
  }

  /**
   * Get department-wise analytics
   */
  private async getDepartmentAnalytics(range: DateRange): Promise<LabAnalytics['byDepartment']> {
    const departmentStats = await this.prisma.labTest.groupBy({
      by: ['testCatalog'],
      where: {
        orderedDate: {
          gte: range.from,
          lte: range.to,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get department info and TAT for each test catalog
    const departmentData = await Promise.all(
      departmentStats.map(async stat => {
        const testCatalog = await this.prisma.labTestCatalog.findUnique({
          where: { id: stat.testCatalog },
          select: { department: true, testName: true },
        });

        const completedTests = await this.prisma.labTest.findMany({
          where: {
            testCatalogId: stat.testCatalog,
            status: 'COMPLETED',
            orderedDate: {
              gte: range.from,
              lte: range.to,
            },
          },
          include: {
            results: {
              orderBy: { performedDate: 'desc' },
              take: 1,
            },
          },
        });

        const avgTAT = this.calculateAverageTAT(completedTests);

        return {
          department: testCatalog?.department || 'UNKNOWN',
          testCatalogId: stat.testCatalog,
          totalTests: stat._count.id,
          completedTests: completedTests.length,
          averageTAT: avgTAT,
        };
      }),
    );

    // Group by department
    const departmentGroups = departmentData.reduce(
      (acc, item) => {
        if (!acc[item.department]) {
          acc[item.department] = {
            department: item.department,
            totalTests: 0,
            completedTests: 0,
            averageTAT: 0,
            tatSum: 0,
            tatCount: 0,
          };
        }

        acc[item.department].totalTests += item.totalTests;
        acc[item.department].completedTests += item.completedTests;

        if (item.averageTAT > 0) {
          acc[item.department].tatSum += item.averageTAT * item.completedTests;
          acc[item.department].tatCount += item.completedTests;
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate final averages and percentages
    const totalTests = Object.values(departmentGroups).reduce(
      (sum: number, dept: any) => sum + dept.totalTests,
      0,
    );

    return Object.values(departmentGroups).map((dept: any) => ({
      department: dept.department,
      totalTests: dept.totalTests,
      completedTests: dept.completedTests,
      averageTAT: dept.tatCount > 0 ? Math.round(dept.tatSum / dept.tatCount) : 0,
      percentage: totalTests > 0 ? Math.round((dept.totalTests / totalTests) * 100) : 0,
    }));
  }

  /**
   * Get test type analytics
   */
  private async getTestTypeAnalytics(range: DateRange): Promise<LabAnalytics['byTestType']> {
    const testStats = await this.prisma.labTest.groupBy({
      by: ['testCatalogId'],
      where: {
        orderedDate: {
          gte: range.from,
          lte: range.to,
        },
      },
      _count: {
        id: true,
      },
    });

    const testAnalytics = await Promise.all(
      testStats.map(async stat => {
        const testCatalog = await this.prisma.labTestCatalog.findUnique({
          where: { id: stat.testCatalogId },
          select: { testName: true, testCode: true },
        });

        const completedTests = await this.prisma.labTest.findMany({
          where: {
            testCatalogId: stat.testCatalogId,
            status: 'COMPLETED',
            orderedDate: {
              gte: range.from,
              lte: range.to,
            },
          },
          include: {
            results: {
              orderBy: { performedDate: 'desc' },
              take: 1,
            },
          },
        });

        const rejectedTests = await this.prisma.labTest.count({
          where: {
            testCatalogId: stat.testCatalogId,
            status: 'REJECTED',
            orderedDate: {
              gte: range.from,
              lte: range.to,
            },
          },
        });

        const avgTAT = this.calculateAverageTAT(completedTests);
        const rejectionRate = stat._count.id > 0 ? (rejectedTests / stat._count.id) * 100 : 0;

        return {
          testName: testCatalog?.testName || 'Unknown',
          testCode: testCatalog?.testCode || 'Unknown',
          volume: stat._count.id,
          averageTAT: avgTAT,
          rejectionRate: Math.round(rejectionRate * 100) / 100,
        };
      }),
    );

    return testAnalytics.sort((a, b) => b.volume - a.volume);
  }

  /**
   * Get quality metrics
   */
  private async getQualityMetrics(range: DateRange): Promise<LabAnalytics['qualityMetrics']> {
    const [qcResults, totalTests, rejectedTests, criticalValues] = await Promise.all([
      this.prisma.labQualityControl.count({
        where: {
          performedDate: {
            gte: range.from,
            lte: range.to,
          },
          status: 'PASS',
        },
      }),
      this.prisma.labTest.count({
        where: {
          orderedDate: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      this.prisma.labTest.count({
        where: {
          status: 'REJECTED',
          orderedDate: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      this.prisma.labResult.count({
        where: {
          flag: { in: ['CRITICAL_HIGH', 'CRITICAL_LOW'] },
          performedDate: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
    ]);

    const totalQC = await this.prisma.labQualityControl.count({
      where: {
        performedDate: {
          gte: range.from,
          lte: range.to,
        },
      },
    });

    return {
      qcPassRate: totalQC > 0 ? Math.round((qcResults / totalQC) * 100) : 0,
      errorRate: totalTests > 0 ? Math.round((rejectedTests / totalTests) * 100) : 0,
      rejectionRate: totalTests > 0 ? Math.round((rejectedTests / totalTests) * 100) : 0,
      criticalValueAlerts: criticalValues,
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(range: DateRange): Promise<LabAnalytics['performance']> {
    const [dailyVolume, hourlyDistribution, technicianWorkload] = await Promise.all([
      this.getDailyVolume(range),
      this.getHourlyDistribution(range),
      this.getTechnicianWorkload(range),
    ]);

    return {
      dailyVolume,
      hourlyDistribution,
      technicianWorkload,
    };
  }

  /**
   * Get trends data
   */
  private async getTrendsData(range: DateRange): Promise<LabAnalytics['trends']> {
    const [testVolumeTrend, tatTrend, qualityTrend] = await Promise.all([
      this.getTestVolumeTrend(range),
      this.getTATTrend(range),
      this.getQualityTrend(range),
    ]);

    return {
      testVolumeTrend,
      tatTrend,
      qualityTrend,
    };
  }

  /**
   * Helper: Get test statistics
   */
  private async getTestStats(range: DateRange): Promise<{
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    avgTAT: number;
  }> {
    const [total, completed, pending, cancelled, avgTAT] = await Promise.all([
      this.prisma.labTest.count({
        where: {
          orderedDate: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.labTest.count({
        where: {
          status: 'COMPLETED',
          orderedDate: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.labTest.count({
        where: {
          status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'RECEIVED', 'IN_PROGRESS'] },
          orderedDate: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.labTest.count({
        where: {
          status: { in: ['CANCELLED', 'REJECTED'] },
          orderedDate: { gte: range.from, lte: range.to },
        },
      }),
      this.calculateOverallTAT(range),
    ]);

    return { total, completed, pending, cancelled, avgTAT };
  }

  /**
   * Helper: Calculate average TAT
   */
  private calculateAverageTAT(tests: any[]): number {
    if (tests.length === 0) return 0;

    const totalTAT = tests.reduce((sum, test) => {
      if (test.results.length > 0) {
        const tat = test.results[0].performedDate.getTime() - test.orderedDate.getTime();
        return sum + tat / (1000 * 60 * 60); // Convert to hours
      }
      return sum;
    }, 0);

    return Math.round(totalTAT / tests.length);
  }

  /**
   * Helper: Calculate overall TAT
   */
  private async calculateOverallTAT(range: DateRange): Promise<number> {
    const completedTests = await this.prisma.labTest.findMany({
      where: {
        status: 'COMPLETED',
        orderedDate: { gte: range.from, lte: range.to },
      },
      include: {
        results: {
          orderBy: { performedDate: 'desc' },
          take: 1,
        },
      },
    });

    return this.calculateAverageTAT(completedTests);
  }

  /**
   * Helper: Get daily volume
   */
  private async getDailyVolume(range: DateRange): Promise<Array<{ date: string; count: number }>> {
    const dailyStats = await this.prisma.labTest.groupBy({
      by: ['orderedDate'],
      where: {
        orderedDate: { gte: range.from, lte: range.to },
      },
      _count: { id: true },
      orderBy: { orderedDate: 'asc' },
    });

    return dailyStats.map(stat => ({
      date: stat.orderedDate.toISOString().split('T')[0],
      count: stat._count.id,
    }));
  }

  /**
   * Helper: Get hourly distribution
   */
  private async getHourlyDistribution(
    range: DateRange,
  ): Promise<Array<{ hour: number; count: number }>> {
    const hourlyStats = await this.prisma.$queryRaw`
      SELECT
        EXTRACT(hour from "orderedDate") as hour,
        COUNT(*) as count
      FROM "lab_tests"
      WHERE "orderedDate" >= ${range.from} AND "orderedDate" <= ${range.to}
      GROUP BY EXTRACT(hour from "orderedDate")
      ORDER BY hour
    `;

    return (hourlyStats as any[]).map(stat => ({
      hour: parseInt(stat.hour),
      count: parseInt(stat.count),
    }));
  }

  /**
   * Helper: Get technician workload
   */
  private async getTechnicianWorkload(
    range: DateRange,
  ): Promise<Array<{ technician: string; tests: number; avgTAT: number }>> {
    const technicianStats = await this.prisma.labResult.groupBy({
      by: ['performedBy'],
      where: {
        performedDate: { gte: range.from, lte: range.to },
      },
      _count: { id: true },
    });

    const technicianData = await Promise.all(
      technicianStats.map(async stat => {
        const technicianTests = await this.prisma.labTest.findMany({
          where: {
            results: {
              some: {
                performedBy: stat.performedBy,
                performedDate: { gte: range.from, lte: range.to },
              },
            },
          },
          include: {
            results: {
              where: { performedBy: stat.performedBy },
              orderBy: { performedDate: 'desc' },
              take: 1,
            },
          },
        });

        const avgTAT = this.calculateAverageTAT(technicianTests);

        return {
          technician: stat.performedBy,
          tests: stat._count.id,
          avgTAT,
        };
      }),
    );

    return technicianData.sort((a, b) => b.tests - a.tests);
  }

  /**
   * Helper: Get test volume trend
   */
  private async getTestVolumeTrend(
    range: DateRange,
  ): Promise<Array<{ date: string; count: number }>> {
    return this.getDailyVolume(range);
  }

  /**
   * Helper: Get TAT trend
   */
  private async getTATTrend(range: DateRange): Promise<Array<{ date: string; avgTAT: number }>> {
    const dailyTAT = [];

    for (let date = new Date(range.from); date <= range.to; date.setDate(date.getDate() + 1)) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const completedTests = await this.prisma.labTest.findMany({
        where: {
          status: 'COMPLETED',
          orderedDate: { gte: dayStart, lte: dayEnd },
        },
        include: {
          results: {
            orderBy: { performedDate: 'desc' },
            take: 1,
          },
        },
      });

      const avgTAT = this.calculateAverageTAT(completedTests);

      dailyTAT.push({
        date: date.toISOString().split('T')[0],
        avgTAT,
      });
    }

    return dailyTAT;
  }

  /**
   * Helper: Get quality trend
   */
  private async getQualityTrend(
    range: DateRange,
  ): Promise<Array<{ date: string; passRate: number }>> {
    const dailyQuality = [];

    for (let date = new Date(range.from); date <= range.to; date.setDate(date.getDate() + 1)) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const qcResults = await this.prisma.labQualityControl.findMany({
        where: {
          performedDate: { gte: dayStart, lte: dayEnd },
        },
      });

      const passCount = qcResults.filter(r => r.status === 'PASS').length;
      const passRate = qcResults.length > 0 ? (passCount / qcResults.length) * 100 : 0;

      dailyQuality.push({
        date: date.toISOString().split('T')[0],
        passRate: Math.round(passRate),
      });
    }

    return dailyQuality;
  }

  /**
   * Helper: Get default date range (last 30 days)
   */
  private getDefaultDateRange(): DateRange {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    return { from, to };
  }

  /**
   * Helper: Get previous period for comparison
   */
  private getPreviousPeriod(range: DateRange): DateRange {
    const diff = range.to.getTime() - range.from.getTime();
    const from = new Date(range.from.getTime() - diff);
    const to = new Date(range.from.getTime() - 1);

    return { from, to };
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(dateRange?: DateRange): Promise<any> {
    const analytics = await this.getLabAnalytics(dateRange);

    return {
      ...analytics,
      exportedAt: new Date().toISOString(),
      dateRange,
    };
  }
}
