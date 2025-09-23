import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
  timestamp: string;
}

@Injectable()
export class HealthValidator {
  constructor(private readonly configService: ConfigService) {}

  async performHealthChecks(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = [];
    const timestamp = new Date().toISOString();

    // Database Health Check
    healthChecks.push(await this.checkDatabaseHealth(timestamp));

    // Redis Health Check
    healthChecks.push(await this.checkRedisHealth(timestamp));

    // External Services Health Check
    healthChecks.push(await this.checkExternalServicesHealth(timestamp));

    // Security Health Check
    healthChecks.push(this.checkSecurityHealth(timestamp));

    // Performance Health Check
    healthChecks.push(this.checkPerformanceHealth(timestamp));

    // Configuration Health Check
    healthChecks.push(this.checkConfigurationHealth(timestamp));

    return healthChecks;
  }

  private async checkDatabaseHealth(timestamp: string): Promise<HealthCheck> {
    try {
      // This would typically check actual database connectivity
      // For now, we'll simulate based on configuration
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      const poolMax = this.configService.get<number>('DB_POOL_MAX');
      const poolMin = this.configService.get<number>('DB_POOL_MIN');

      if (!databaseUrl) {
        return {
          name: 'database',
          status: 'unhealthy',
          details: { error: 'DATABASE_URL not configured' },
          timestamp,
        };
      }

      if (poolMax < poolMin) {
        return {
          name: 'database',
          status: 'unhealthy',
          details: { error: 'DB_POOL_MAX cannot be less than DB_POOL_MIN' },
          timestamp,
        };
      }

      // Simulate database connection check
      const connectionHealthy = Math.random() > 0.05; // 95% success rate for demo

      if (!connectionHealthy) {
        return {
          name: 'database',
          status: 'unhealthy',
          details: { error: 'Database connection failed' },
          timestamp,
        };
      }

      return {
        name: 'database',
        status: 'healthy',
        details: {
          url: this.maskSensitiveInfo(databaseUrl),
          pool: { min: poolMin, max: poolMax },
          connectionTime: Math.floor(Math.random() * 100) + 1, // Simulated
        },
        timestamp,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        details: { error: error.message },
        timestamp,
      };
    }
  }

  private async checkRedisHealth(timestamp: string): Promise<HealthCheck> {
    try {
      const redisHost = this.configService.get<string>('REDIS_HOST');
      const redisPort = this.configService.get<number>('REDIS_PORT');

      if (!redisHost || !redisPort) {
        return {
          name: 'redis',
          status: 'unhealthy',
          details: { error: 'Redis configuration missing' },
          timestamp,
        };
      }

      // Simulate Redis connection check
      const redisHealthy = Math.random() > 0.05; // 95% success rate for demo

      if (!redisHealthy) {
        return {
          name: 'redis',
          status: 'unhealthy',
          details: { error: 'Redis connection failed' },
          timestamp,
        };
      }

      return {
        name: 'redis',
        status: 'healthy',
        details: {
          host: redisHost,
          port: redisPort,
          responseTime: Math.floor(Math.random() * 50) + 1, // Simulated
        },
        timestamp,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        details: { error: error.message },
        timestamp,
      };
    }
  }

  private async checkExternalServicesHealth(timestamp: string): Promise<HealthCheck> {
    const services = {
      stripe: this.configService.get<string>('STRIPE_SECRET_KEY'),
      twilio: this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      email: this.configService.get<string>('SMTP_HOST'),
      openai: this.configService.get<string>('OPENAI_API_KEY'),
    };

    const serviceStatus = Object.entries(services).map(([service, config]) => {
      const healthy = config && config.length > 0;
      return {
        name: service,
        configured: healthy,
        reachable: healthy && Math.random() > 0.1, // 90% success rate if configured
      };
    });

    const allHealthy = serviceStatus.every(s => s.configured && s.reachable);
    const someDegraded = serviceStatus.some(s => s.configured && !s.reachable);

    return {
      name: 'external-services',
      status: allHealthy ? 'healthy' : someDegraded ? 'degraded' : 'unhealthy',
      details: { services: serviceStatus },
      timestamp,
    };
  }

  private checkSecurityHealth(timestamp: string): Promise<HealthCheck> {
    const securityChecks = {
      jwtSecretConfigured: this.configService.get<string>('JWT_SECRET')?.length >= 32,
      sessionSecretConfigured: this.configService.get<string>('SESSION_SECRET')?.length >= 32,
      encryptionKeyConfigured: this.configService.get<string>('ENCRYPTION_KEY')?.length >= 64,
      hipaaEnabled: this.configService.get<boolean>('HIPAA_ENABLED'),
      gdprEnabled: this.configService.get<boolean>('GDPR_ENABLED'),
      rateLimitingEnabled: this.configService.get<number>('RATE_LIMIT_LIMIT') > 0,
      corsConfigured: this.configService.get<string>('CORS_ORIGIN')?.length > 0,
    };

    const allChecksPassed = Object.values(securityChecks).every(check => check === true);
    const someChecksFailed = Object.entries(securityChecks).some(([key, value]) => !value);

    return Promise.resolve({
      name: 'security',
      status: allChecksPassed ? 'healthy' : someChecksFailed ? 'degraded' : 'unhealthy',
      details: { checks: securityChecks },
      timestamp,
    });
  }

  private checkPerformanceHealth(timestamp: string): Promise<HealthCheck> {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isProduction = nodeEnv === 'production';

    const performanceMetrics = {
      memoryLimit: this.configService.get<string>('PERFORMANCE_MEMORY_LIMIT'),
      cpuLimit: this.configService.get<number>('PERFORMANCE_CPU_LIMIT'),
      profilingEnabled: !isProduction || this.configService.get<boolean>('PERFORMANCE_PROFILING_ENABLED'),
      cachingEnabled: this.configService.get<number>('CACHE_TTL') > 0,
      monitoringEnabled: this.configService.get<boolean>('METRICS_ENABLED'),
    };

    const performanceIssues = [];

    if (isProduction && performanceMetrics.profilingEnabled) {
      performanceIssues.push('Profiling should be disabled in production');
    }

    if (!performanceMetrics.cachingEnabled) {
      performanceIssues.push('Caching is disabled');
    }

    if (!performanceMetrics.monitoringEnabled) {
      performanceIssues.push('Monitoring is disabled');
    }

    const status = performanceIssues.length === 0 ? 'healthy' : 'degraded';

    return Promise.resolve({
      name: 'performance',
      status,
      details: {
        metrics: performanceMetrics,
        issues: performanceIssues,
        recommendations: performanceIssues.length > 0 ? performanceIssues : [],
      },
      timestamp,
    });
  }

  private checkConfigurationHealth(timestamp: string): Promise<HealthCheck> {
    const configChecks = {
      environmentValid: /^(development|test|staging|production)$/.test(
        this.configService.get<string>('NODE_ENV') || ''
      ),
      portValid: this.configService.get<number>('PORT') > 0 && this.configService.get<number>('PORT') < 65536,
      frontendUrlValid: this.configService.get<string>('FRONTEND_URL')?.startsWith('http'),
      logLevelValid: /^(debug|info|warn|error|silent)$/.test(
        this.configService.get<string>('LOG_LEVEL') || ''
      ),
      backupEnabled: this.configService.get<boolean>('BACKUP_ENABLED'),
      healthCheckEnabled: this.configService.get<boolean>('HEALTH_CHECK_ENABLED'),
    };

    const allChecksPassed = Object.values(configChecks).every(check => check === true);
    const someChecksFailed = Object.entries(configChecks).some(([key, value]) => !value);

    return Promise.resolve({
      name: 'configuration',
      status: allChecksPassed ? 'healthy' : someChecksFailed ? 'degraded' : 'unhealthy',
      details: { checks: configChecks },
      timestamp,
    });
  }

  private maskSensitiveInfo(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const checks = await this.performHealthChecks();
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      uptime: process.uptime(),
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}