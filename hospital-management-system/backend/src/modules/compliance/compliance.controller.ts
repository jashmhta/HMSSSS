import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/prisma.service';
import {
  ComplianceService,
  ComplianceCheck,
  AuditLogEntry,
  DataRetentionPolicy,
} from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import {
  AccessMonitoringService,
  AccessPattern,
  SuspiciousActivity,
} from './access-monitoring.service';
import { ComplianceDashboardService, ComplianceDashboard } from './compliance-dashboard.service';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('compliance')
@UseGuards(RolesGuard)
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);

  constructor(
    private readonly complianceService: ComplianceService,
    private readonly dataRetentionService: DataRetentionService,
    private readonly accessMonitoringService: AccessMonitoringService,
    private readonly dashboardService: ComplianceDashboardService,
  ) {}

  @Get('report')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get comprehensive compliance report' })
  @ApiResponse({
    status: 200,
    description: 'Compliance report generated successfully',
    schema: {
      type: 'object',
      properties: {
        overallStatus: { type: 'string', enum: ['COMPLIANT', 'NON_COMPLIANT', 'AT_RISK'] },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string', enum: ['HIPAA', 'GDPR', 'GENERAL'] },
              status: { type: 'string', enum: ['PASS', 'FAIL', 'WARNING'] },
              severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              details: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            warnings: { type: 'number' },
          },
        },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getComplianceReport() {
    try {
      // Try to get stored compliance checks first, then run fresh checks if needed
      let storedChecks = await this.complianceService.getStoredComplianceChecks();

      // If no stored checks or they're older than 1 hour, run fresh checks
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const hasRecentChecks = storedChecks.some(check => check.lastChecked > oneHourAgo);

      if (!hasRecentChecks || storedChecks.length === 0) {
        this.logger.log('Running fresh compliance checks - no recent stored checks found');
        storedChecks = await this.complianceService.runComplianceChecks();
        await this.complianceService.storeComplianceCheckResults(storedChecks);
      }

      // Generate report from stored checks
      const summary = {
        total: storedChecks.length,
        passed: storedChecks.filter(c => c.status === 'PASS').length,
        failed: storedChecks.filter(c => c.status === 'FAIL').length,
        warnings: storedChecks.filter(c => c.status === 'WARNING').length,
      };

      const overallStatus =
        summary.failed > 0 ? 'NON_COMPLIANT' : summary.warnings > 2 ? 'AT_RISK' : 'COMPLIANT';

      const report = {
        overallStatus,
        checks: storedChecks,
        summary,
        generatedAt: new Date(),
        source: hasRecentChecks ? 'cached' : 'fresh',
      };

      // Log compliance report generation
      await this.complianceService.logAuditEvent({
        userId: 'system', // In real implementation, get from request context
        action: 'COMPLIANCE_REPORT_GENERATED',
        resource: 'compliance',
        resourceId: 'report',
        details: {
          overallStatus: report.overallStatus,
          totalChecks: report.summary.total,
          passedChecks: report.summary.passed,
          failedChecks: report.summary.failed,
          source: report.source,
        },
        complianceFlags: ['HIPAA', 'GDPR'],
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to generate compliance report', error);
      throw new HttpException(
        'Failed to generate compliance report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('checks')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Run and get all compliance checks' })
  @ApiResponse({
    status: 200,
    description: 'Compliance checks executed successfully',
    type: [ComplianceCheck],
  })
  async runComplianceChecks(): Promise<ComplianceCheck[]> {
    try {
      const checks = await this.complianceService.runComplianceChecks();

      // Store compliance check results
      await this.complianceService.storeComplianceCheckResults(checks);

      // Log compliance check execution
      await this.complianceService.logAuditEvent({
        userId: 'system',
        action: 'COMPLIANCE_CHECKS_EXECUTED',
        resource: 'compliance',
        resourceId: 'checks',
        details: {
          checksExecuted: checks.length,
          failedChecks: checks.filter(c => c.status === 'FAIL').length,
          warningChecks: checks.filter(c => c.status === 'WARNING').length,
        },
        complianceFlags: ['HIPAA', 'GDPR'],
      });

      return checks;
    } catch (error) {
      this.logger.error('Failed to run compliance checks', error);
      throw new HttpException('Failed to run compliance checks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('retention-policies')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get data retention policies' })
  @ApiResponse({
    status: 200,
    description: 'Data retention policies retrieved successfully',
    type: [DataRetentionPolicy],
  })
  async getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    try {
      return await this.complianceService.getDataRetentionPolicies();
    } catch (error) {
      this.logger.error('Failed to get data retention policies', error);
      throw new HttpException(
        'Failed to get data retention policies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('retention-cleanup')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Execute data retention cleanup (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Data retention cleanup executed successfully',
    schema: {
      type: 'object',
      properties: {
        policies: { type: 'array' },
        deletedRecords: { type: 'object' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async executeDataRetentionCleanup() {
    try {
      const result = await this.complianceService.executeDataRetentionCleanup();

      // Log data retention cleanup
      await this.complianceService.logAuditEvent({
        userId: 'system',
        action: 'DATA_RETENTION_CLEANUP_EXECUTED',
        resource: 'compliance',
        resourceId: 'retention-cleanup',
        details: {
          policiesProcessed: result.policies.length,
          totalDeletedRecords: Object.values(result.deletedRecords).reduce(
            (sum, count) => sum + count,
            0,
          ),
          errors: result.errors.length,
        },
        complianceFlags: ['GDPR', 'DATA_RETENTION'],
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to execute data retention cleanup', error);
      throw new HttpException(
        'Failed to execute data retention cleanup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hipaa-status')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get HIPAA compliance status' })
  @ApiResponse({
    status: 200,
    description: 'HIPAA compliance status retrieved successfully',
  })
  async getHIPAAStatus() {
    try {
      const allChecks = await this.complianceService.runComplianceChecks();
      const hipaaChecks = allChecks.filter(check => check.category === 'HIPAA');

      const summary = {
        total: hipaaChecks.length,
        passed: hipaaChecks.filter(c => c.status === 'PASS').length,
        failed: hipaaChecks.filter(c => c.status === 'FAIL').length,
        warnings: hipaaChecks.filter(c => c.status === 'WARNING').length,
        criticalIssues: hipaaChecks.filter(c => c.severity === 'CRITICAL').length,
      };

      const status =
        summary.failed > 0
          ? 'NON_COMPLIANT'
          : summary.criticalIssues > 0
            ? 'CRITICAL_ISSUES'
            : summary.warnings > 0
              ? 'WARNINGS_PRESENT'
              : 'COMPLIANT';

      return {
        status,
        summary,
        checks: hipaaChecks,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get HIPAA status', error);
      throw new HttpException(
        'Failed to get HIPAA compliance status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('gdpr-status')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get GDPR compliance status' })
  @ApiResponse({
    status: 200,
    description: 'GDPR compliance status retrieved successfully',
  })
  async getGDPRStatus() {
    try {
      const allChecks = await this.complianceService.runComplianceChecks();
      const gdprChecks = allChecks.filter(check => check.category === 'GDPR');

      const summary = {
        total: gdprChecks.length,
        passed: gdprChecks.filter(c => c.status === 'PASS').length,
        failed: gdprChecks.filter(c => c.status === 'FAIL').length,
        warnings: gdprChecks.filter(c => c.status === 'WARNING').length,
        criticalIssues: gdprChecks.filter(c => c.severity === 'CRITICAL').length,
      };

      const status =
        summary.failed > 0
          ? 'NON_COMPLIANT'
          : summary.criticalIssues > 0
            ? 'CRITICAL_ISSUES'
            : summary.warnings > 0
              ? 'WARNINGS_PRESENT'
              : 'COMPLIANT';

      return {
        status,
        summary,
        checks: gdprChecks,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get GDPR status', error);
      throw new HttpException(
        'Failed to get GDPR compliance status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('audit-log')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Log audit event manually' })
  @ApiResponse({
    status: 201,
    description: 'Audit event logged successfully',
  })
  async logAuditEvent(@Body() auditData: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    try {
      // Validate required fields
      if (!auditData.userId || !auditData.action || !auditData.resource || !auditData.resourceId) {
        throw new HttpException('Missing required audit log fields', HttpStatus.BAD_REQUEST);
      }

      await this.complianceService.logAuditEvent(auditData);

      return {
        message: 'Audit event logged successfully',
        loggedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to log audit event', error);
      throw new HttpException('Failed to log audit event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  async getAuditLogs(
    @Param('userId') userId?: string,
    @Param('action') action?: string,
    @Param('resource') resource?: string,
    @Param('startDate') startDate?: string,
    @Param('endDate') endDate?: string,
    @Param('limit') limit?: string,
    @Param('offset') offset?: string,
  ) {
    try {
      const options: any = {};

      if (userId) options.userId = userId;
      if (action) options.action = action;
      if (resource) options.resource = resource;
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      return await this.complianceService.getAuditLogs(options);
    } catch (error) {
      this.logger.error('Failed to get audit logs', error);
      throw new HttpException('Failed to get audit logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('data-access-log/:userId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get data access log for a user' })
  @ApiResponse({
    status: 200,
    description: 'Data access log retrieved successfully',
  })
  async getDataAccessLog(@Param('userId') userId: string) {
    try {
      // Get audit logs for this user with PHI access flags
      const auditLogs = await this.complianceService.getAuditLogs({
        userId,
        complianceFlags: ['HIPAA', 'PHI_ACCESS'],
        limit: 100,
      });

      return {
        userId,
        accessLog: auditLogs.logs,
        total: auditLogs.total,
        summary: auditLogs.summary,
      };
    } catch (error) {
      this.logger.error('Failed to get data access log', error);
      throw new HttpException('Failed to get data access log', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('data-retention-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get data retention logs' })
  @ApiResponse({
    status: 200,
    description: 'Data retention logs retrieved successfully',
  })
  async getDataRetentionLogs(
    @Param('tableName') tableName?: string,
    @Param('startDate') startDate?: string,
    @Param('endDate') endDate?: string,
    @Param('limit') limit?: string,
    @Param('offset') offset?: string,
  ) {
    try {
      const options: any = {};

      if (tableName) options.tableName = tableName;
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      return await this.complianceService.getDataRetentionLogs(options);
    } catch (error) {
      this.logger.error('Failed to get data retention logs', error);
      throw new HttpException(
        'Failed to get data retention logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('retention/manual-cleanup')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Manually trigger data retention cleanup (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Manual data retention cleanup executed successfully',
  })
  async manualRetentionCleanup() {
    try {
      const result = await this.dataRetentionService.manualRetentionCleanup();

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Log manual cleanup execution
      await this.complianceService.logAuditEvent({
        userId: 'system',
        action: 'MANUAL_RETENTION_CLEANUP_EXECUTED',
        resource: 'compliance',
        resourceId: 'retention-cleanup',
        details: {
          recordsDeleted: Object.values(result.result.deletedRecords).reduce(
            (sum, count) => sum + count,
            0,
          ),
          tablesProcessed: result.result.policies.length,
          errors: result.result.errors.length,
        },
        complianceFlags: ['GDPR', 'DATA_RETENTION'],
      });

      return result.result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to execute manual retention cleanup', error);
      throw new HttpException(
        'Failed to execute manual retention cleanup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('retention/schedule-status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get data retention schedule and status' })
  @ApiResponse({
    status: 200,
    description: 'Data retention schedule status retrieved successfully',
  })
  async getRetentionScheduleStatus() {
    try {
      return await this.dataRetentionService.getRetentionScheduleStatus();
    } catch (error) {
      this.logger.error('Failed to get retention schedule status', error);
      throw new HttpException(
        'Failed to get retention schedule status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('retention/validate-policies')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Validate data retention policy configuration' })
  @ApiResponse({
    status: 200,
    description: 'Data retention policies validated successfully',
  })
  async validateRetentionPolicies() {
    try {
      return await this.dataRetentionService.validateRetentionPolicies();
    } catch (error) {
      this.logger.error('Failed to validate retention policies', error);
      throw new HttpException(
        'Failed to validate retention policies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('access/patterns/:userId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get access patterns for a user' })
  @ApiResponse({
    status: 200,
    description: 'Access patterns retrieved successfully',
  })
  async getAccessPatterns(
    @Param('userId') userId: string,
    @Param('timeWindow') timeWindow?: string,
  ): Promise<AccessPattern[]> {
    try {
      const timeWindowMinutes = timeWindow ? parseInt(timeWindow) : 60;
      return await this.accessMonitoringService.getAccessPatterns(userId, timeWindowMinutes);
    } catch (error) {
      this.logger.error('Failed to get access patterns', error);
      throw new HttpException('Failed to get access patterns', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('access/alerts')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get active security alerts' })
  @ApiResponse({
    status: 200,
    description: 'Security alerts retrieved successfully',
  })
  async getActiveAlerts(): Promise<SuspiciousActivity[]> {
    try {
      return await this.accessMonitoringService.getActiveAlerts();
    } catch (error) {
      this.logger.error('Failed to get active alerts', error);
      throw new HttpException('Failed to get active alerts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('access/alerts/:alertId/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Resolve a security alert' })
  @ApiResponse({
    status: 200,
    description: 'Alert resolved successfully',
  })
  async resolveAlert(@Param('alertId') alertId: string, @Body('resolution') resolution: string) {
    try {
      if (!resolution || resolution.trim().length === 0) {
        throw new HttpException('Resolution description is required', HttpStatus.BAD_REQUEST);
      }

      await this.accessMonitoringService.resolveAlert(alertId, resolution);

      return {
        message: 'Alert resolved successfully',
        alertId,
        resolvedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to resolve alert', error);
      throw new HttpException('Failed to resolve alert', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('access/metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get security metrics and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
  })
  async getSecurityMetrics(@Param('timeWindow') timeWindow?: string) {
    try {
      const timeWindowHours = timeWindow ? parseInt(timeWindow) : 24;
      return await this.accessMonitoringService.getSecurityMetrics(timeWindowHours);
    } catch (error) {
      this.logger.error('Failed to get security metrics', error);
      throw new HttpException('Failed to get security metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('access/monitor')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Manually trigger access monitoring for testing' })
  @ApiResponse({
    status: 200,
    description: 'Access monitoring triggered successfully',
  })
  async monitorAccess(
    @Body()
    accessData: {
      userId: string;
      action: string;
      resource: string;
      resourceId: string;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
    },
  ) {
    try {
      await this.accessMonitoringService.monitorAccess(accessData);

      return {
        message: 'Access monitoring completed',
        monitoredAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to monitor access', error);
      throw new HttpException('Failed to monitor access', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('security-dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get security and compliance dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Security dashboard data retrieved successfully',
  })
  async getSecurityDashboard() {
    try {
      // Try to get stored compliance checks first, then run fresh checks if needed
      let storedChecks = await this.complianceService.getStoredComplianceChecks();

      // If no stored checks or they're older than 1 hour, run fresh checks
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const hasRecentChecks = storedChecks.some(check => check.lastChecked > oneHourAgo);

      if (!hasRecentChecks || storedChecks.length === 0) {
        this.logger.log('Running fresh compliance checks - no recent stored checks found');
        storedChecks = await this.complianceService.runComplianceChecks();
        await this.complianceService.storeComplianceCheckResults(storedChecks);
      }

      // Generate report from stored checks
      const summary = {
        total: storedChecks.length,
        passed: storedChecks.filter(c => c.status === 'PASS').length,
        failed: storedChecks.filter(c => c.status === 'FAIL').length,
        warnings: storedChecks.filter(c => c.status === 'WARNING').length,
      };

      const overallStatus =
        summary.failed > 0 ? 'NON_COMPLIANT' : summary.warnings > 2 ? 'AT_RISK' : 'COMPLIANT';

      const report = {
        overallStatus,
        checks: storedChecks,
        summary,
        generatedAt: new Date(),
        source: hasRecentChecks ? 'cached' : 'fresh',
      };

      // Get retention schedule status
      const retentionStatus = await this.dataRetentionService.getRetentionScheduleStatus();

      // Get recent audit activity
      const recentAudits = await this.complianceService.getAuditLogs({
        limit: 10,
      });

      // Get security metrics
      const securityMetrics = await this.accessMonitoringService.getSecurityMetrics(24);

      // Get active alerts
      const activeAlerts = await this.accessMonitoringService.getActiveAlerts();

      // Log compliance report generation
      await this.complianceService.logAuditEvent({
        userId: 'system', // In real implementation, get from request context
        action: 'COMPLIANCE_REPORT_GENERATED',
        resource: 'compliance',
        resourceId: 'report',
        details: {
          overallStatus: report.overallStatus,
          totalChecks: report.summary.total,
          passedChecks: report.summary.passed,
          failedChecks: report.summary.failed,
          source: report.source,
        },
        complianceFlags: ['HIPAA', 'GDPR'],
      });

      return {
        compliance: report,
        retention: retentionStatus,
        audit: {
          recentActivity: recentAudits.logs,
          summary: recentAudits.summary,
        },
        security: {
          metrics: securityMetrics,
          activeAlerts: activeAlerts,
          alertCount: activeAlerts.length,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report', error);
      throw new HttpException(
        'Failed to get security dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get comprehensive compliance dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Compliance dashboard generated successfully',
  })
  async getComplianceDashboard(): Promise<ComplianceDashboard> {
    try {
      return await this.dashboardService.generateDashboard();
    } catch (error) {
      this.logger.error('Failed to generate compliance dashboard', error);
      throw new HttpException(
        'Failed to generate compliance dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard/widgets')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get dashboard widgets data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard widgets data retrieved successfully',
  })
  async getDashboardWidgets() {
    try {
      return await this.dashboardService.getDashboardWidgets();
    } catch (error) {
      this.logger.error('Failed to get dashboard widgets', error);
      throw new HttpException(
        'Failed to get dashboard widgets data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard/export')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Export dashboard data for reporting' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data exported successfully',
  })
  async exportDashboardData(@Param('format') format?: string) {
    try {
      const exportFormat = format === 'csv' ? 'csv' : 'json';
      return await this.dashboardService.exportDashboardData(exportFormat);
    } catch (error) {
      this.logger.error('Failed to export dashboard data', error);
      throw new HttpException('Failed to export dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
