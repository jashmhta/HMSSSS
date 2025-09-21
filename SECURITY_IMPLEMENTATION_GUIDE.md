# Hospital Management System Security Implementation Guide

## Overview
This guide provides detailed implementation steps for addressing the security gaps identified in the security assessment report.

## 1. Secure Configuration Management

### 1.1 Kubernetes Secrets Management

```yaml
# Create secure secrets
apiVersion: v1
kind: Secret
metadata:
  name: hms-secrets
  namespace: ultimate-hms
type: Opaque
data:
  # Generate these values using:
  # echo -n 'your-secret' | base64
  database-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  encryption-key: <base64-encoded-256-bit-key>
  redis-password: <base64-encoded-redis-password>
```

### 1.2 Environment Configuration

```typescript
// src/config/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT) || 100,
  },
  mfa: {
    enabled: process.env.MFA_ENABLED === 'true',
    requiredForAdmin: process.env.MFA_REQUIRED_FOR_ADMIN !== 'false',
  },
}));
```

## 2. Enhanced Authentication & Authorization

### 2.1 OAuth 2.0/OIDC Integration with Keycloak

```typescript
// src/modules/auth/strategies/oidc.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oidc';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(private configService: ConfigService) {
    super({
      issuer: configService.get<string>('security.oidc.issuer'),
      clientID: configService.get<string>('security.oidc.clientId'),
      clientSecret: configService.get<string>('security.oidc.clientSecret'),
      callbackURL: configService.get<string>('security.oidc.callbackUrl'),
      scope: 'openid email profile roles',
    });
  }

  async validate(
    issuer: string,
    sub: string,
    profile: any,
    accessToken: string,
    refreshToken: string,
    done: VerifyCallback,
  ) {
    const user = {
      id: sub,
      email: profile.email,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      roles: profile.roles || [],
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
```

### 2.2 Refresh Token Rotation

```typescript
// src/modules/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAccessToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    return {
      token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('security.jwt.expiresIn'),
      }),
      expiresIn: this.configService.get('security.jwt.expiresIn'),
    };
  }

  async generateRefreshToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      jti: this.generateJTI(), // Unique identifier
    };

    return {
      token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('security.jwt.refreshExpiresIn'),
      }),
      expiresIn: this.configService.get('security.jwt.refreshExpiresIn'),
    };
  }

  private generateJTI(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if token is revoked (implement token blacklist)
      const isRevoked = await this.isTokenRevoked(payload.jti);
      if (isRevoked) {
        throw new Error('Token revoked');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private async isTokenRevoked(jti: string): Promise<boolean> {
    // Implement token blacklist check using Redis
    return false;
  }
}
```

### 2.3 Risk-Based Authentication

```typescript
// src/modules/auth/services/risk-assessment.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RiskAssessmentService {
  constructor(private prisma: PrismaService) {}

  async calculateRiskScore(userId: string, context: any): Promise<number> {
    let riskScore = 0;

    // Check IP address reputation
    const ipRisk = await this.checkIPReputation(context.ip);
    riskScore += ipRisk;

    // Check device fingerprint
    const deviceRisk = await this.checkDeviceReputation(userId, context.deviceId);
    riskScore += deviceRisk;

    // Check time-based patterns
    const timeRisk = this.checkTimePattern(userId, context.timestamp);
    riskScore += timeRisk;

    // Check location anomaly
    const locationRisk = await this.checkLocationAnomaly(userId, context.location);
    riskScore += locationRisk;

    return Math.min(riskScore, 100);
  }

  private async checkIPReputation(ip: string): Promise<number> {
    // Implement IP reputation check
    // Could integrate with services like MaxMind, AbuseIPDB, etc.
    return 0;
  }

  private async checkDeviceReputation(userId: string, deviceId: string): Promise<number> {
    // Check if device is recognized
    const knownDevice = await this.prisma.userDevice.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });

    return knownDevice ? 0 : 20;
  }

  private checkTimePattern(userId: string, timestamp: Date): number {
    // Check if login time is unusual for the user
    return 0;
  }

  private async checkLocationAnomaly(userId: string, location: any): Promise<number> {
    // Check if location is unusual
    return 0;
  }

  getAuthMethod(riskScore: number): string {
    if (riskScore >= 70) return 'BLOCK';
    if (riskScore >= 40) return 'MFA_REQUIRED';
    if (riskScore >= 20) return 'PASSWORD_ONLY';
    return 'PASSWORD_ONLY';
  }
}
```

## 3. Enhanced Security Headers

### 3.1 Security Middleware Configuration

```typescript
// src/middleware/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none';",
    );

    // Remove server info
    res.removeHeader('X-Powered-By');

    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  }
}
```

### 3.2 Rate Limiting Enhancement

```typescript
// src/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const endpoint = `${request.method}-${request.route.path}`;

    // Custom rate limits per endpoint
    const rateLimits = {
      'POST-/api/v1/auth/login': { ttl: 60000, limit: 5 },
      'POST-/api/v1/auth/register': { ttl: 60000, limit: 3 },
      'GET-/api/v1/patients': { ttl: 60000, limit: 100 },
      'default': { ttl: 60000, limit: 100 },
    };

    const limit = rateLimits[endpoint] || rateLimits['default'];

    // Implement rate limiting logic
    return this.checkRateLimit(request.ip, limit);
  }

  private async checkRateLimit(ip: string, limit: { ttl: number; limit: number }): Promise<boolean> {
    // Implement Redis-based rate limiting
    return true;
  }
}
```

## 4. Data Protection Enhancement

### 4.1 Column-Level Encryption with Prisma

```typescript
// src/database/encryption-client.ts
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../shared/services/encryption.service';

export class PrismaEncryptionClient extends PrismaClient {
  private encryptionService: EncryptionService;

  constructor(encryptionService: EncryptionService) {
    super();
    this.encryptionService = encryptionService;
  }

  async $onBeforeQuery(params: any) {
    // Encrypt sensitive fields before saving
    if (params.model === 'Patient') {
      if (params.args.data) {
        const sensitiveFields = [
          'phoneNumber',
          'email',
          'address',
          'emergencyContact',
        ];

        sensitiveFields.forEach(field => {
          if (params.args.data[field]) {
            params.args.data[field] = this.encryptionService.encrypt(
              params.args.data[field],
            );
          }
        });
      }
    }
  }

  async $onAfterQuery(params: any, result: any) {
    // Decrypt sensitive fields after reading
    if (params.model === 'Patient') {
      if (Array.isArray(result)) {
        result.forEach(patient => this.decryptPatientData(patient));
      } else if (result) {
        this.decryptPatientData(result);
      }
    }
    return result;
  }

  private decryptPatientData(patient: any) {
    const sensitiveFields = [
      'phoneNumber',
      'email',
      'address',
      'emergencyContact',
    ];

    sensitiveFields.forEach(field => {
      if (patient[field]) {
        try {
          patient[field] = this.encryptionService.decrypt(patient[field]);
        } catch (error) {
          // Field might not be encrypted
          console.warn(`Failed to decrypt ${field} for patient ${patient.id}`);
        }
      }
    });
  }
}
```

### 4.2 Data Masking for Display

```typescript
// src/decorators/mask-data.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const MASK_DATA_KEY = 'maskData';
export const MaskData = (fields: string[]) => SetMetadata(MASK_DATA_KEY, fields);

// src/interceptors/data-masking.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const maskFields = Reflect.getMetadata(
          MASK_DATA_KEY,
          context.getHandler(),
        );

        if (maskFields && data) {
          return this.maskSensitiveData(data, maskFields);
        }
        return data;
      }),
    );
  }

  private maskSensitiveData(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.maskObject(item, fields));
    } else if (typeof data === 'object') {
      return this.maskObject(data, fields);
    }
    return data;
  }

  private maskObject(obj: any, fields: string[]): any {
    const masked = { ...obj };

    fields.forEach(field => {
      if (masked[field]) {
        if (field === 'email') {
          masked[field] = this.maskEmail(masked[field]);
        } else if (field === 'phoneNumber') {
          masked[field] = this.maskPhone(masked[field]);
        } else {
          masked[field] = '***';
        }
      }
    });

    return masked;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }

  private maskPhone(phone: string): string {
    return `***-***-${phone.slice(-4)}`;
  }
}
```

## 5. Security Monitoring & Alerting

### 5.1 Security Metrics with Prometheus

```typescript
// src/metrics/security.metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const securityMetrics = {
  // Authentication metrics
  authAttempts: new Counter({
    name: 'hms_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['status', 'method', 'user_role'],
  }),

  authLatency: new Histogram({
    name: 'hms_auth_duration_seconds',
    help: 'Authentication request duration',
    labelNames: ['method'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),

  // Authorization metrics
  authzDenials: new Counter({
    name: 'hms_authz_denials_total',
    help: 'Total authorization denials',
    labelNames: ['resource', 'action', 'user_role'],
  }),

  // Security events
  securityEvents: new Counter({
    name: 'hms_security_events_total',
    help: 'Total security events',
    labelNames: ['event_type', 'severity'],
  }),

  // Threat detection
  suspiciousActivities: new Gauge({
    name: 'hms_suspicious_activities_current',
    help: 'Current suspicious activities',
    labelNames: ['type'],
  }),

  // Compliance metrics
  complianceViolations: new Counter({
    name: 'hms_compliance_violations_total',
    help: 'Total compliance violations',
    labelNames: ['regulation', 'requirement'],
  }),
};
```

### 5.2 Security Alerting Rules

```yaml
# prometheus-alerts.yaml
groups:
- name: hms.security.alerts
  rules:
  - alert: HighFailedLoginAttempts
    expr: rate(hms_auth_attempts_total{status="failed"}[5m]) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High number of failed login attempts
      description: "{{ $value }} failed login attempts per minute"

  - alert: AuthorizationDenialsSpike
    expr: rate(hms_authz_denials_total[5m]) > 5
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: Spike in authorization denials
      description: "{{ $value }} authorization denials per minute"

  - alert: SecurityEventDetected
    expr: increase(hms_security_events_total{severity="critical"}[1h]) > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: Critical security event detected
      description: "Critical security event: {{ $labels.event_type }}"

  - alert: SuspiciousActivity
    expr: hms_suspicious_activities_current > 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Suspicious activity detected
      description: "{{ $value }} suspicious activities detected"
```

## 6. Compliance Automation

### 6.1 Automated Compliance Checks

```typescript
// src/modules/compliance/services/automated-compliance.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AutomatedComplianceService {
  private readonly logger = new Logger(AutomatedComplianceService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyComplianceChecks() {
    this.logger.log('Running daily compliance checks...');

    await Promise.all([
      this.checkDataRetention(),
      this.checkAccessControls(),
      this.checkEncryptionStatus(),
      this.checkAuditLogs(),
      this.checkBackupStatus(),
    ]);
  }

  private async checkDataRetention() {
    // Check data retention policies
    const expiredRecords = await this.prisma.patient.findMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      },
    });

    // Implement retention policy based on record type
    for (const record of expiredRecords) {
      // Anonymize or delete based on retention policy
    }
  }

  private async checkAccessControls() {
    // Verify RBAC policies
    const usersWithoutRoles = await this.prisma.user.findMany({
      where: {
        role: null,
      },
    });

    if (usersWithoutRoles.length > 0) {
      this.logger.warn(`Found ${usersWithoutRoles.length} users without roles`);
      // Send alert
    }
  }

  private async checkEncryptionStatus() {
    // Verify encryption of sensitive data
    // This would check if all sensitive fields are properly encrypted
  }

  private async checkAuditLogs() {
    // Verify audit log integrity
    const recentLogs = await this.prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentLogs === 0) {
      this.logger.error('No audit logs found in the last 24 hours');
      // Send critical alert
    }
  }

  private async checkBackupStatus() {
    // Verify backup completion and integrity
    // This would integrate with your backup system
  }
}
```

## 7. Incident Response Automation

### 7.1 Automated Incident Response

```typescript
// src/modules/security/services/incident-response.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../shared/services/email.service';
import { SMSService } from '../shared/services/sms.service';

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SMSService,
  ) {}

  async handleSecurityEvent(event: SecurityEvent) {
    // Log the incident
    await this.prisma.securityIncident.create({
      data: {
        type: event.type,
        severity: event.severity,
        description: event.description,
        affectedResources: event.affectedResources,
        timestamp: new Date(),
        status: 'OPEN',
      },
    });

    // Determine response actions
    const actions = this.getResponseActions(event);

    // Execute response actions
    for (const action of actions) {
      await this.executeAction(action);
    }

    // Notify stakeholders
    await this.notifyStakeholders(event);
  }

  private getResponseActions(event: SecurityEvent): ResponseAction[] {
    const actions: ResponseAction[] = [];

    switch (event.type) {
      case 'BRUTE_FORCE_ATTACK':
        actions.push(
          { type: 'BLOCK_IP', target: event.sourceIP },
          { type: 'LOCK_ACCOUNTS', target: event.affectedUsers },
        );
        break;

      case 'DATA_BREACH':
        actions.push(
          { type: 'ISOLATE_SYSTEM', target: event.affectedSystems },
          { type: 'INITIATE_BREACH_RESPONSE', target: 'all' },
        );
        break;

      case 'MALWARE_DETECTED':
        actions.push(
          { type: 'QUARANTINE_SYSTEM', target: event.affectedSystems },
          { type: 'SCAN_NETWORK', target: 'all' },
        );
        break;
    }

    return actions;
  }

  private async executeAction(action: ResponseAction) {
    switch (action.type) {
      case 'BLOCK_IP':
        await this.blockIP(action.target);
        break;
      case 'LOCK_ACCOUNTS':
        await this.lockAccounts(action.target);
        break;
      case 'ISOLATE_SYSTEM':
        await this.isolateSystem(action.target);
        break;
      // ... other actions
    }
  }

  private async notifyStakeholders(event: SecurityEvent) {
    const stakeholders = await this.getStakeholders(event.severity);

    for (const stakeholder of stakeholders) {
      if (event.severity === 'CRITICAL') {
        await this.smsService.sendSMS(
          stakeholder.phone,
          `CRITICAL: ${event.type} detected. Immediate action required.`,
        );
      }

      await this.emailService.sendEmail(
        stakeholder.email,
        `Security Incident: ${event.type}`,
        this.createIncidentEmail(event),
      );
    }
  }

  private async getStakeholders(severity: string) {
    // Return stakeholders based on severity
    return [];
  }

  private createIncidentEmail(event: SecurityEvent): string {
    return `
      Security Incident Report

      Type: ${event.type}
      Severity: ${event.severity}
      Time: ${event.timestamp}
      Description: ${event.description}

      Immediate Actions Required:
      ${this.getRequiredActions(event)}
    `;
  }
}
```

## 8. Testing Security Implementation

### 8.1 Security Test Suite

```typescript
// test/security/auth.security.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service';
import { MFAService } from '../../src/modules/auth/mfa.service';
import { PrismaService } from '../../src/database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService Security Tests', () => {
  let service: AuthService;
  let mfaService: MFAService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        MFAService,
        PrismaService,
        ConfigService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mfaService = module.get<MFAService>(MFAService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });

    it('should prevent weak passwords', async () => {
      const weakPasswords = ['password', '123456', 'qwerty'];

      for (const password of weakPasswords) {
        await expect(service.validatePasswordStrength(password))
          .rejects.toThrow('Password too weak');
      }
    });
  });

  describe('MFA Security', () => {
    it('should generate unique TOTP secrets', async () => {
      const secret1 = await mfaService.generateTOTPSecret('user1');
      const secret2 = await mfaService.generateTOTPSecret('user2');

      expect(secret1.secret).not.toBe(secret2.secret);
    });

    it('should verify TOTP tokens correctly', async () => {
      const userId = 'test-user';
      const { secret } = await mfaService.generateTOTPSecret(userId);
      await mfaService.enableMFA(userId, secret);

      // Generate a valid token
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      expect(await mfaService.verifyTOTP(userId, token)).toBe(true);
    });
  });

  describe('JWT Security', () => {
    it('should use secure JWT configuration', () => {
      const token = service.generateToken({ id: 'test', email: 'test@test.com' });

      expect(token).toContain('.');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should validate token expiration', async () => {
      const token = service.generateToken(
        { id: 'test', email: 'test@test.com' },
        '1ms', // Very short expiration
      );

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(service.validateToken(token))
        .rejects.toThrow('Token expired');
    });
  });
});
```

## 9. Deployment Security

### 9.1 Secure Kubernetes Deployment

```yaml
# deployment-security.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hms-backend
  namespace: ultimate-hms
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      containers:
      - name: backend
        image: hms/backend:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
        resources:
          limits:
            cpu: '1'
            memory: '1Gi'
          requests:
            cpu: '500m'
            memory: '512Mi'
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: hms-secrets
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
```

### 9.2 Network Policy Hardening

```yaml
# network-policy-hardened.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hms-backend-policy
  namespace: ultimate-hms
spec:
  podSelector:
    matchLabels:
      app: hospital-management-system
      component: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 5432 # PostgreSQL
    - protocol: TCP
      port: 6379 # Redis
```

## 10. Security Maintenance

### 10.1 Security Patch Management

```typescript
// src/modules/security/services/patch-management.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class PatchManagementService {
  private readonly logger = new Logger(PatchManagementService.name);

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkForSecurityUpdates() {
    this.logger.log('Checking for security updates...');

    const dependencies = await this.getDependencies();
    const vulnerabilities = await this.checkVulnerabilities(dependencies);

    if (vulnerabilities.length > 0) {
      await this.sendVulnerabilityAlert(vulnerabilities);
    }
  }

  private async getDependencies(): Promise<Dependency[]> {
    // Read package.json and check all dependencies
    return [];
  }

  private async checkVulnerabilities(deps: Dependency[]): Promise<Vulnerability[]> {
    // Check against NPM audit, Snyk, or other security databases
    return [];
  }

  private async sendVulnerabilityAlert(vulns: Vulnerability[]) {
    // Send alerts to security team
  }
}
```

This implementation guide provides concrete steps to address the security gaps identified in the assessment. Each section includes code examples and configuration files that can be adapted to your specific environment.

Remember to:
1. Test all security changes in a staging environment first
2. Monitor system performance after implementing security measures
3. Regularly review and update security configurations
4. Keep documentation current with any changes
5. Conduct regular security assessments and penetration tests