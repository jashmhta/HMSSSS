/*[object Object]*/
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../database/prisma.service';

import { ComplianceService } from './compliance.service';

export interface AccessPattern {
  userId: string;
  resource: string;
  action: string;
  count: number;
  timeWindow: number; // minutes
  firstAccess: Date;
  lastAccess: Date;
  ipAddresses: string[];
  userAgents: string[];
}

export interface SuspiciousActivity {
  id: string;
  type:
    | 'UNUSUAL_ACCESS_PATTERN'
    | 'MULTIPLE_FAILED_LOGINS'
    | 'AFTER_HOURS_ACCESS'
    | 'UNAUTHORIZED_RESOURCE_ACCESS'
    | 'DATA_EXPORT_ANOMALY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  description: string;
  details: Record<string, any>;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

/**
 *
 */
@Injectable()
export class AccessMonitoringService {
  private readonly logger = new Logger(AccessMonitoringService.name);
  private readonly alertThresholds = {
    failedLoginsPerHour: 5,
    unusualAccessPatterns: 10,
    afterHoursAccess: true,
    unauthorizedAccess: true,
  };

  /**
   *
   */
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Monitor access patterns in real-time
   */
  async monitorAccess(accessData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }): Promise<void> {
    try {
      // Log the access first
      await this.complianceService.logAuditEvent({
        userId: accessData.userId,
        action: accessData.action,
        resource: accessData.resource,
        resourceId: accessData.resourceId,
        ipAddress: accessData.ipAddress,
        userAgent: accessData.userAgent,
        details: {
          success: accessData.success,
          monitoring: true,
        },
        complianceFlags: this.getComplianceFlags(accessData.resource, accessData.action),
      });

      // Check for suspicious patterns
      const suspiciousActivities = await this.detectSuspiciousActivity(accessData);

      // Alert on suspicious activities
      for (const activity of suspiciousActivities) {
        await this.createAlert(activity);
      }
    } catch (error) {
      this.logger.error('Failed to monitor access', error);
    }
  }

  /**
   * Scheduled task to analyze access patterns hourly
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeAccessPatterns() {
    this.logger.log('Analyzing access patterns for suspicious activity');

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Analyze failed login attempts
      await this.analyzeFailedLogins(oneHourAgo);

      // Analyze unusual access patterns
      await this.analyzeUnusualPatterns(oneHourAgo);

      // Analyze after-hours access
      await this.analyzeAfterHoursAccess(oneHourAgo);

      // Clean up old alerts (older than 30 days)
      await this.cleanupOldAlerts();
    } catch (error) {
      this.logger.error('Failed to analyze access patterns', error);
    }
  }

  /**
   * Get access patterns for a user within a time window
   */
  async getAccessPatterns(
    userId: string,
    timeWindowMinutes: number = 60,
  ): Promise<AccessPattern[]> {
    try {
      const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Group by resource and action
      const patterns: { [key: string]: AccessPattern } = {};

      for (const log of auditLogs) {
        const key = `${log.resource}:${log.action}`;

        if (!patterns[key]) {
          patterns[key] = {
            userId,
            resource: log.resource,
            action: log.action,
            count: 0,
            timeWindow: timeWindowMinutes,
            firstAccess: log.timestamp,
            lastAccess: log.timestamp,
            ipAddresses: [],
            userAgents: [],
          };
        }

        patterns[key].count = (patterns[key].count || 0) + 1;
        patterns[key].lastAccess = log.timestamp;

        if (log.ipAddress && !patterns[key].ipAddresses.includes(log.ipAddress)) {
          patterns[key].ipAddresses.push(log.ipAddress);
        }

        if (log.userAgent && !patterns[key].userAgents.includes(log.userAgent)) {
          patterns[key].userAgents.push(log.userAgent);
        }
      }

      return Object.values(patterns);
    } catch (error) {
      this.logger.error('Failed to get access patterns', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<SuspiciousActivity[]> {
    // In a real implementation, this would query an alerts table
    // For now, return mock data structure
    return [];
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    try {
      // In a real implementation, this would update an alerts table
      this.logger.log(`Alert ${alertId} resolved: ${resolution}`);

      // Log the resolution
      await this.complianceService.logAuditEvent({
        userId: 'system',
        action: 'ALERT_RESOLVED',
        resource: 'compliance',
        resourceId: alertId,
        details: { resolution },
        complianceFlags: ['SECURITY'],
      });
    } catch (error) {
      this.logger.error('Failed to resolve alert', error);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeWindowHours: number = 24): Promise<{
    totalAccess: number;
    failedLogins: number;
    suspiciousActivities: number;
    uniqueUsers: number;
    topResources: Array<{ resource: string; count: number }>;
    alertsBySeverity: Record<string, number>;
  }> {
    try {
      const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

      const [totalAccess, failedLogins, uniqueUsersResult, resourceStats] = await Promise.all([
        this.prisma.auditLog.count({
          where: { timestamp: { gte: startTime } },
        }),
        this.prisma.auditLog.count({
          where: {
            action: 'LOGIN_FAILED',
            timestamp: { gte: startTime },
          },
        }),
        this.prisma.auditLog.findMany({
          where: { timestamp: { gte: startTime } },
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.auditLog.groupBy({
          by: ['resource'],
          where: { timestamp: { gte: startTime } },
          _count: { resource: true },
          orderBy: { _count: { resource: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalAccess,
        failedLogins,
        suspiciousActivities: 0, // Would query alerts table
        uniqueUsers: uniqueUsersResult.length,
        topResources: resourceStats.map(stat => ({
          resource: stat.resource,
          count: stat._count.resource,
        })),
        alertsBySeverity: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        }, // Would query alerts table
      };
    } catch (error) {
      this.logger.error('Failed to get security metrics', error);
      throw error;
    }
  }

  // Private methods

  /**
   *
   */
  private getComplianceFlags(resource: string, action: string): string[] {
    const flags: string[] = [];

    // Add HIPAA flags for patient data access
    if (['patients', 'medical_records', 'lab_tests', 'radiology_tests'].includes(resource)) {
      flags.push('HIPAA', 'PHI_ACCESS');
    }

    // Add GDPR flags for personal data
    if (
      ['users', 'patients'].includes(resource) &&
      ['CREATE', 'UPDATE', 'DELETE'].includes(action)
    ) {
      flags.push('GDPR');
    }

    // Add security flags for auth operations
    if (['LOGIN', 'LOGOUT', 'LOGIN_FAILED'].includes(action)) {
      flags.push('SECURITY');
    }

    return flags;
  }

  /**
   *
   */
  private async detectSuspiciousActivity(accessData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }): Promise<SuspiciousActivity[]> {
    const activities: SuspiciousActivity[] = [];

    // Check for failed login patterns
    if (accessData.action === 'LOGIN_FAILED') {
      const recentFailedLogins = await this.getRecentFailedLogins(accessData.userId, 60); // Last hour

      if (recentFailedLogins >= this.alertThresholds.failedLoginsPerHour) {
        activities.push({
          id: `failed-logins-${accessData.userId}-${Date.now()}`,
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          userId: accessData.userId,
          description: `Multiple failed login attempts: ${recentFailedLogins} in the last hour`,
          details: {
            failedAttempts: recentFailedLogins,
            timeWindow: '1 hour',
            ipAddress: accessData.ipAddress,
          },
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }

    // Check for unusual access patterns
    if (accessData.success && this.isSensitiveResource(accessData.resource)) {
      const patterns = await this.getAccessPatterns(accessData.userId, 60);
      const sensitiveAccess = patterns.filter(p => this.isSensitiveResource(p.resource));

      if (sensitiveAccess.length >= this.alertThresholds.unusualAccessPatterns) {
        activities.push({
          id: `unusual-pattern-${accessData.userId}-${Date.now()}`,
          type: 'UNUSUAL_ACCESS_PATTERN',
          severity: 'MEDIUM',
          userId: accessData.userId,
          description: `Unusual access pattern: ${sensitiveAccess.length} sensitive resource accesses in the last hour`,
          details: {
            accessPatterns: sensitiveAccess.map(p => ({
              resource: p.resource,
              count: p.count,
              timeWindow: p.timeWindow,
            })),
          },
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }

    // Check for after-hours access
    if (this.alertThresholds.afterHoursAccess && this.isAfterHours()) {
      activities.push({
        id: `after-hours-${accessData.userId}-${Date.now()}`,
        type: 'AFTER_HOURS_ACCESS',
        severity: 'LOW',
        userId: accessData.userId,
        description: `Access during non-business hours: ${accessData.action} on ${accessData.resource}`,
        details: {
          action: accessData.action,
          resource: accessData.resource,
          currentTime: new Date().toISOString(),
          ipAddress: accessData.ipAddress,
        },
        detectedAt: new Date(),
        resolved: false,
      });
    }

    return activities;
  }

  /**
   *
   */
  private async getRecentFailedLogins(userId: string, minutes: number): Promise<number> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);

    return await this.prisma.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        timestamp: { gte: startTime },
      },
    });
  }

  /**
   *
   */
  private isSensitiveResource(resource: string): boolean {
    const sensitiveResources = [
      'patients',
      'medical_records',
      'lab_tests',
      'radiology_tests',
      'prescriptions',
      'bills',
      'users',
    ];

    return sensitiveResources.includes(resource);
  }

  /**
   *
   */
  private isAfterHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Business hours: Monday-Friday, 8 AM - 6 PM
    return day >= 1 && day <= 5 && (hour < 8 || hour >= 18);
  }

  /**
   *
   */
  private async createAlert(activity: SuspiciousActivity): Promise<void> {
    try {
      // In a real implementation, this would insert into an alerts table
      this.logger.warn(`SECURITY ALERT: ${activity.description}`, {
        type: activity.type,
        severity: activity.severity,
        userId: activity.userId,
        details: activity.details,
      });

      // Log the alert creation
      await this.complianceService.logAuditEvent({
        userId: 'system',
        action: 'SECURITY_ALERT_CREATED',
        resource: 'compliance',
        resourceId: activity.id,
        details: {
          alertType: activity.type,
          severity: activity.severity,
          description: activity.description,
        },
        complianceFlags: ['SECURITY', 'ALERT'],
      });

      // In a real implementation, this would also:
      // - Send email notifications to security team
      // - Create incident tickets
      // - Trigger automated responses (e.g., temporary account lockout)
    } catch (error) {
      this.logger.error('Failed to create alert', error);
    }
  }

  /**
   *
   */
  private async analyzeFailedLogins(since: Date): Promise<void> {
    try {
      const failedLoginStats = await this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          action: 'LOGIN_FAILED',
          timestamp: { gte: since },
        },
        _count: { userId: true },
        having: {
          userId: {
            _count: {
              gte: this.alertThresholds.failedLoginsPerHour,
            },
          },
        },
      });

      for (const stat of failedLoginStats) {
        const alert: SuspiciousActivity = {
          id: `bulk-failed-logins-${stat.userId}-${Date.now()}`,
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          userId: stat.userId,
          description: `Bulk failed login attempts: ${stat._count.userId} failed attempts since ${since.toISOString()}`,
          details: {
            failedAttempts: stat._count.userId,
            timeWindow: '1 hour',
          },
          detectedAt: new Date(),
          resolved: false,
        };

        await this.createAlert(alert);
      }
    } catch (error) {
      this.logger.error('Failed to analyze failed logins', error);
    }
  }

  /**
   *
   */
  private async analyzeUnusualPatterns(since: Date): Promise<void> {
    try {
      // Get users with high access frequency to sensitive resources
      const highAccessUsers = await this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          resource: { in: ['patients', 'medical_records', 'lab_tests', 'radiology_tests'] },
          timestamp: { gte: since },
          success: true,
        },
        _count: { userId: true },
        having: {
          userId: {
            _count: {
              gte: this.alertThresholds.unusualAccessPatterns,
            },
          },
        },
      });

      for (const user of highAccessUsers) {
        const patterns = await this.getAccessPatterns(user.userId, 60);

        const alert: SuspiciousActivity = {
          id: `high-access-frequency-${user.userId}-${Date.now()}`,
          type: 'UNUSUAL_ACCESS_PATTERN',
          severity: 'MEDIUM',
          userId: user.userId,
          description: `High frequency access to sensitive data: ${user._count.userId} accesses in the last hour`,
          details: {
            accessCount: user._count.userId,
            patterns: patterns.filter(p => this.isSensitiveResource(p.resource)),
          },
          detectedAt: new Date(),
          resolved: false,
        };

        await this.createAlert(alert);
      }
    } catch (error) {
      this.logger.error('Failed to analyze unusual patterns', error);
    }
  }

  /**
   *
   */
  private async analyzeAfterHoursAccess(since: Date): Promise<void> {
    if (!this.alertThresholds.afterHoursAccess) return;

    try {
      const afterHoursAccess = await this.prisma.auditLog.findMany({
        where: {
          timestamp: { gte: since },
          // This would need more complex logic to determine after-hours
          // For now, we'll skip this analysis
        },
      });

      // Implementation would check timestamps and create alerts for after-hours access
    } catch (error) {
      this.logger.error('Failed to analyze after-hours access', error);
    }
  }

  /**
   *
   */
  private async cleanupOldAlerts(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // In a real implementation, this would delete old resolved alerts
      this.logger.log(`Cleaning up alerts older than ${thirtyDaysAgo.toISOString()}`);
    } catch (error) {
      this.logger.error('Failed to cleanup old alerts', error);
    }
  }
}
