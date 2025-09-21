import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ComplianceService } from './compliance.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * Scheduled task to run data retention cleanup daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledDataRetentionCleanup() {
    this.logger.log('Starting scheduled data retention cleanup');

    try {
      const result = await this.complianceService.executeDataRetentionCleanup();

      this.logger.log(
        `Data retention cleanup completed: ${result.deletedRecords} records deleted across ${result.policies.length} tables`,
      );

      // Log any errors
      if (result.errors.length > 0) {
        this.logger.error(`Data retention cleanup errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Scheduled data retention cleanup failed', error);
    }
  }

  /**
   * Scheduled task to check retention policies weekly and send alerts
   */
  @Cron(CronExpression.EVERY_WEEK)
  async checkRetentionPolicyCompliance() {
    this.logger.log('Checking data retention policy compliance');

    try {
      const policies = await this.complianceService.getDataRetentionPolicies();
      const now = new Date();
      const alerts = [];

      for (const policy of policies) {
        // Check if next cleanup is overdue
        if (policy.nextCleanup < now) {
          alerts.push({
            policy: policy.tableName,
            issue: 'Cleanup overdue',
            dueDate: policy.nextCleanup,
            daysOverdue: Math.floor(
              (now.getTime() - policy.nextCleanup.getTime()) / (1000 * 60 * 60 * 24),
            ),
          });
        }

        // Check if retention period is too short (less than 1 year for patient data)
        if (policy.dataCategory === 'PATIENT_DATA' && policy.retentionPeriod < 365) {
          alerts.push({
            policy: policy.tableName,
            issue: 'Retention period too short for patient data',
            currentPeriod: policy.retentionPeriod,
            recommendedMinimum: 2555, // 7 years
          });
        }
      }

      if (alerts.length > 0) {
        this.logger.warn(`Data retention policy alerts: ${alerts.length} issues found`, { alerts });

        // In a real implementation, this would send alerts to administrators
        // await this.notificationService.sendAlert('DATA_RETENTION_ALERT', { alerts });
      } else {
        this.logger.log('All data retention policies are compliant');
      }
    } catch (error) {
      this.logger.error('Failed to check retention policy compliance', error);
    }
  }

  /**
   * Manual trigger for data retention cleanup (for testing/admin purposes)
   */
  async manualRetentionCleanup(): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      this.logger.log('Manual data retention cleanup triggered');

      const result = await this.complianceService.executeDataRetentionCleanup();

      this.logger.log(
        `Manual data retention cleanup completed: ${Object.values(result.deletedRecords).reduce((sum, count) => sum + count, 0)} records deleted`,
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      this.logger.error('Manual data retention cleanup failed', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get retention cleanup schedule and status
   */
  async getRetentionScheduleStatus() {
    try {
      const policies = await this.complianceService.getDataRetentionPolicies();
      const retentionLogs = await this.complianceService.getDataRetentionLogs({
        limit: 10, // Last 10 cleanup operations
      });

      const now = new Date();
      const scheduleStatus = policies.map(policy => ({
        tableName: policy.tableName,
        retentionPeriod: policy.retentionPeriod,
        lastCleanup: policy.lastCleanup,
        nextCleanup: policy.nextCleanup,
        daysUntilNextCleanup: Math.max(
          0,
          Math.floor((policy.nextCleanup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        ),
        isOverdue: policy.nextCleanup < now,
        dataCategory: policy.dataCategory,
        autoDelete: policy.autoDelete,
      }));

      return {
        schedule: scheduleStatus,
        recentActivity: retentionLogs.logs,
        nextScheduledRun: this.getNextScheduledRun(),
        totalRecordsDeleted: retentionLogs.logs.reduce((sum, log) => sum + 1, 0), // This is approximate
      };
    } catch (error) {
      this.logger.error('Failed to get retention schedule status', error);
      throw error;
    }
  }

  /**
   * Get next scheduled run time (2 AM daily)
   */
  private getNextScheduledRun(): Date {
    const now = new Date();
    const nextRun = new Date(now);

    // Set to 2 AM today
    nextRun.setHours(2, 0, 0, 0);

    // If it's already past 2 AM today, set to tomorrow
    if (now.getHours() >= 2) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Validate retention policy configuration
   */
  async validateRetentionPolicies(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const policies = await this.complianceService.getDataRetentionPolicies();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for missing policies for critical tables
      const criticalTables = [
        'medical_records',
        'lab_tests',
        'radiology_tests',
        'prescriptions',
        'bills',
        'emergency_visits',
      ];

      const existingTables = policies.map(p => p.tableName);
      const missingTables = criticalTables.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        issues.push(`Missing retention policies for critical tables: ${missingTables.join(', ')}`);
        recommendations.push('Create retention policies for all critical data tables');
      }

      // Check retention periods
      for (const policy of policies) {
        if (policy.dataCategory === 'PATIENT_DATA' && policy.retentionPeriod < 2555) {
          // Less than 7 years
          issues.push(
            `${policy.tableName}: Patient data retention period (${policy.retentionPeriod} days) is shorter than HIPAA minimum (7 years)`,
          );
          recommendations.push(
            `Increase retention period for ${policy.tableName} to at least 2555 days (7 years)`,
          );
        }

        if (policy.dataCategory === 'FINANCIAL' && policy.retentionPeriod < 2555) {
          // Less than 7 years
          issues.push(
            `${policy.tableName}: Financial data retention period (${policy.retentionPeriod} days) is shorter than regulatory requirements`,
          );
          recommendations.push(`Review and extend retention period for ${policy.tableName}`);
        }
      }

      // Check for auto-delete on sensitive data
      const autoDeleteSensitive = policies.filter(
        p => p.autoDelete && (p.dataCategory === 'PATIENT_DATA' || p.dataCategory === 'FINANCIAL'),
      );

      if (autoDeleteSensitive.length > 0) {
        issues.push(
          `Auto-delete enabled for sensitive data tables: ${autoDeleteSensitive.map(p => p.tableName).join(', ')}`,
        );
        recommendations.push(
          'Consider manual review process for sensitive data deletion to ensure compliance',
        );
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to validate retention policies', error);
      throw error;
    }
  }
}
