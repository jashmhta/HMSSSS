import { Injectable, Logger } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessMonitoringService } from './access-monitoring.service';

export interface ComplianceDashboard {
  overview: {
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
    complianceScore: number; // 0-100
    lastUpdated: Date;
    nextScheduledCheck: Date;
  };
  compliance: {
    hipaa: {
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
      score: number;
      criticalIssues: number;
      warnings: number;
      checks: any[];
    };
    gdpr: {
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
      score: number;
      criticalIssues: number;
      warnings: number;
      checks: any[];
    };
    general: {
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
      score: number;
      issues: number;
      checks: any[];
    };
  };
  security: {
    metrics: {
      totalAccess: number;
      failedLogins: number;
      suspiciousActivities: number;
      uniqueUsers: number;
      mfaAdoption: number;
    };
    alerts: {
      active: number;
      critical: number;
      high: number;
      resolved: number;
    };
    topResources: Array<{ resource: string; count: number }>;
  };
  retention: {
    policies: any[];
    nextCleanup: Date;
    overduePolicies: number;
    totalRecordsManaged: number;
  };
  audit: {
    recentActivity: any[];
    summary: {
      totalActions: number;
      uniqueUsers: number;
      dateRange: { start: Date; end: Date };
    };
  };
}

@Injectable()
export class ComplianceDashboardService {
  private readonly logger = new Logger(ComplianceDashboardService.name);

  constructor(
    private readonly complianceService: ComplianceService,
    private readonly dataRetentionService: DataRetentionService,
    private readonly accessMonitoringService: AccessMonitoringService,
  ) {}

  /**
   * Generate comprehensive compliance dashboard
   */
  async generateDashboard(): Promise<ComplianceDashboard> {
    try {
      // Get all data in parallel for performance
      const [complianceReport, retentionStatus, securityMetrics, activeAlerts, recentAudits] =
        await Promise.all([
          this.complianceService.getComplianceReport(),
          this.dataRetentionService.getRetentionScheduleStatus(),
          this.accessMonitoringService.getSecurityMetrics(24),
          this.accessMonitoringService.getActiveAlerts(),
          this.complianceService.getAuditLogs({ limit: 20 }),
        ]);

      // Calculate compliance scores
      const complianceScore = this.calculateComplianceScore(complianceReport);
      const hipaaScore = this.calculateCategoryScore(complianceReport.checks, 'HIPAA');
      const gdprScore = this.calculateCategoryScore(complianceReport.checks, 'GDPR');
      const generalScore = this.calculateCategoryScore(complianceReport.checks, 'GENERAL');

      // Categorize checks
      const hipaaChecks = complianceReport.checks.filter(c => c.category === 'HIPAA');
      const gdprChecks = complianceReport.checks.filter(c => c.category === 'GDPR');
      const generalChecks = complianceReport.checks.filter(c => c.category === 'GENERAL');

      // Calculate statuses
      const hipaaStatus = this.calculateStatus(hipaaChecks);
      const gdprStatus = this.calculateStatus(gdprChecks);
      const generalStatus = this.calculateStatus(generalChecks);

      // Get MFA adoption rate (mock for now)
      const mfaAdoption = await this.getMfaAdoptionRate();

      return {
        overview: {
          overallStatus: complianceReport.overallStatus,
          complianceScore,
          lastUpdated: new Date(),
          nextScheduledCheck: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        },
        compliance: {
          hipaa: {
            status: hipaaStatus,
            score: hipaaScore,
            criticalIssues: hipaaChecks.filter(c => c.severity === 'CRITICAL').length,
            warnings: hipaaChecks.filter(c => c.status === 'WARNING').length,
            checks: hipaaChecks.slice(0, 5), // Top 5 checks
          },
          gdpr: {
            status: gdprStatus,
            score: gdprScore,
            criticalIssues: gdprChecks.filter(c => c.severity === 'CRITICAL').length,
            warnings: gdprChecks.filter(c => c.status === 'WARNING').length,
            checks: gdprChecks.slice(0, 5),
          },
          general: {
            status: generalStatus,
            score: generalScore,
            issues: generalChecks.filter(c => c.status !== 'PASS').length,
            checks: generalChecks.slice(0, 5),
          },
        },
        security: {
          metrics: {
            totalAccess: securityMetrics.totalAccess,
            failedLogins: securityMetrics.failedLogins,
            suspiciousActivities: securityMetrics.suspiciousActivities,
            uniqueUsers: securityMetrics.uniqueUsers,
            mfaAdoption,
          },
          alerts: {
            active: activeAlerts.length,
            critical: activeAlerts.filter(a => a.severity === 'CRITICAL').length,
            high: activeAlerts.filter(a => a.severity === 'HIGH').length,
            resolved: 0, // Would need to query resolved alerts
          },
          topResources: securityMetrics.topResources,
        },
        retention: {
          policies: retentionStatus.schedule,
          nextCleanup: retentionStatus.nextScheduledRun,
          overduePolicies: retentionStatus.schedule.filter(p => p.isOverdue).length,
          totalRecordsManaged: retentionStatus.recentActivity.length,
        },
        audit: {
          recentActivity: recentAudits.logs,
          summary: recentAudits.summary,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance dashboard', error);
      throw error;
    }
  }

  /**
   * Get dashboard widgets data
   */
  async getDashboardWidgets(): Promise<{
    complianceTrend: Array<{ date: string; score: number }>;
    securityIncidents: Array<{ date: string; count: number }>;
    topViolations: Array<{ violation: string; count: number }>;
    retentionStatus: {
      healthy: number;
      warning: number;
      critical: number;
    };
  }> {
    try {
      // Get compliance trend (last 7 days)
      const complianceTrend = await this.getComplianceTrend(7);

      // Get security incidents (last 30 days)
      const securityIncidents = await this.getSecurityIncidents(30);

      // Get top violations
      const topViolations = await this.getTopViolations();

      // Get retention status summary
      const retentionStatus = await this.getRetentionStatusSummary();

      return {
        complianceTrend,
        securityIncidents,
        topViolations,
        retentionStatus,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard widgets', error);
      throw error;
    }
  }

  /**
   * Export dashboard data for reporting
   */
  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      const dashboard = await this.generateDashboard();

      if (format === 'csv') {
        // Convert to CSV format
        return this.convertDashboardToCSV(dashboard);
      }

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to export dashboard data', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateComplianceScore(report: any): number {
    const { passed, failed, warnings, total } = report.summary;

    if (total === 0) return 100;

    // Weight: Pass = 100%, Warning = 50%, Fail = 0%
    const score = (passed * 100 + warnings * 50 + failed * 0) / total;

    return Math.round(score);
  }

  private calculateCategoryScore(checks: any[], category: string): number {
    const categoryChecks = checks.filter(c => c.category === category);

    if (categoryChecks.length === 0) return 100;

    const passed = categoryChecks.filter(c => c.status === 'PASS').length;
    const warnings = categoryChecks.filter(c => c.status === 'WARNING').length;
    const failed = categoryChecks.filter(c => c.status === 'FAIL').length;

    const score = (passed * 100 + warnings * 50 + failed * 0) / categoryChecks.length;

    return Math.round(score);
  }

  private calculateStatus(checks: any[]): 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK' {
    const failed = checks.filter(c => c.status === 'FAIL').length;
    const critical = checks.filter(c => c.severity === 'CRITICAL').length;
    const warnings = checks.filter(c => c.status === 'WARNING').length;

    if (failed > 0 || critical > 0) return 'NON_COMPLIANT';
    if (warnings > 2) return 'AT_RISK';
    return 'COMPLIANT';
  }

  private async getMfaAdoptionRate(): Promise<number> {
    // In a real implementation, this would query the database
    // For now, return a mock value
    return 75; // 75% MFA adoption
  }

  private async getComplianceTrend(days: number): Promise<Array<{ date: string; score: number }>> {
    // In a real implementation, this would query historical compliance data
    // For now, return mock trend data
    const trend = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Mock score with some variation
      const baseScore = 85;
      const variation = Math.random() * 10 - 5; // -5 to +5
      const score = Math.max(0, Math.min(100, Math.round(baseScore + variation)));

      trend.push({
        date: date.toISOString().split('T')[0],
        score,
      });
    }

    return trend;
  }

  private async getSecurityIncidents(
    days: number,
  ): Promise<Array<{ date: string; count: number }>> {
    // In a real implementation, this would query security incident data
    // For now, return mock incident data
    const incidents = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Mock incident count (mostly 0, occasional 1-2)
      const count = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 3);

      incidents.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return incidents;
  }

  private async getTopViolations(): Promise<Array<{ violation: string; count: number }>> {
    // In a real implementation, this would query violation data
    // For now, return mock violation data
    return [
      { violation: 'Password Policy', count: 12 },
      { violation: 'Access Control', count: 8 },
      { violation: 'Data Encryption', count: 5 },
      { violation: 'Audit Logging', count: 3 },
      { violation: 'MFA Compliance', count: 2 },
    ];
  }

  private async getRetentionStatusSummary(): Promise<{
    healthy: number;
    warning: number;
    critical: number;
  }> {
    try {
      const retentionStatus = await this.dataRetentionService.getRetentionScheduleStatus();

      return {
        healthy: retentionStatus.schedule.filter(p => !p.isOverdue).length,
        warning: retentionStatus.schedule.filter(p => p.isOverdue && p.daysUntilNextCleanup < 7)
          .length,
        critical: retentionStatus.schedule.filter(p => p.isOverdue && p.daysUntilNextCleanup >= 7)
          .length,
      };
    } catch (error) {
      this.logger.error('Failed to get retention status summary', error);
      return { healthy: 0, warning: 0, critical: 0 };
    }
  }

  private convertDashboardToCSV(dashboard: ComplianceDashboard): string {
    // Convert dashboard data to CSV format
    // This is a simplified implementation
    const csvData = [
      ['Section', 'Metric', 'Value'],
      ['Overview', 'Overall Status', dashboard.overview.overallStatus],
      ['Overview', 'Compliance Score', dashboard.overview.complianceScore.toString()],
      ['HIPAA', 'Status', dashboard.compliance.hipaa.status],
      ['HIPAA', 'Score', dashboard.compliance.hipaa.score.toString()],
      ['GDPR', 'Status', dashboard.compliance.gdpr.status],
      ['GDPR', 'Score', dashboard.compliance.gdpr.score.toString()],
      ['Security', 'Total Access', dashboard.security.metrics.totalAccess.toString()],
      ['Security', 'Failed Logins', dashboard.security.metrics.failedLogins.toString()],
      ['Security', 'Active Alerts', dashboard.security.alerts.active.toString()],
    ];

    return csvData.map(row => row.join(',')).join('\n');
  }
}
