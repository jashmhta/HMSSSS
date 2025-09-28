/*[object Object]*/
import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // JWT Configuration - ZERO TOLERANCE FOR HARDCODED SECRETS
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'hospital-management-system',
    audience: process.env.JWT_AUDIENCE || 'hms-users',
  },

  // Bcrypt Configuration
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Encryption Configuration - ENTERPRISE-GRADE SECURITY REQUIRED
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  },

  // Session Configuration - SECURE BY DEFAULT
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
    rolling: true,
    resave: false,
    saveUninitialized: false,
  },

  // CSRF Protection - ZERO TOLERANCE FOR VULNERABILITIES
  csrf: {
    secret: process.env.CSRF_SECRET,
    cookieName: '_csrf',
    headerName: 'x-csrf-token',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_TTL) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_LIMIT) || 100,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIPsuccessfulrequests === 'true',
    skipFailedRequests: false,
    /**
     *
     */
    keyGenerator: (req: { ip: string }) => req.ip,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: process.env.CORS_METHODS?.split(',') || [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
    ],
    allowedHeaders: process.env.CORS_ALLOWEDHEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  },

  // Helmet Configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf'],
    maxFiles: parseInt(process.env.UPLOAD_MAX_FILES) || 5,
    destination: process.env.UPLOAD_DESTINATION || './uploads',
  },

  // Database Security
  database: {
    poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
    connectionTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000,
    idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  },

  // Audit Logging
  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    level: process.env.AUDIT_LOG_LEVEL || 'all',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 2555,
    file: process.env.AUDIT_LOG_FILE || './logs/audit.log',
  },

  // HIPAA Compliance
  hipaa: {
    enabled: process.env.HIPAA_ENABLED === 'true',
    auditLogging: process.env.HIPAA_AUDIT_LOGGING === 'true',
    dataRetentionDays: parseInt(process.env.HIPAA_DATA_RETENTION_DAYS) || 3650,
    encryptionAtRest: process.env.HIPAA_ENCRYPTION_AT_REST === 'true',
    encryptionInTransit: process.env.HIPAA_ENCRYPTION_IN_TRANSIT === 'true',
    accessLogging: process.env.HIPAA_ACCESS_LOGGING === 'true',
  },

  // GDPR Compliance
  gdpr: {
    enabled: process.env.GDPR_ENABLED === 'true',
    dataSubjectRights: process.env.GDPR_DATA_SUBJECT_RIGHTS === 'true',
    consentManagement: process.env.GDPR_CONSENT_MANAGEMENT === 'true',
    dataPortability: process.env.GDPR_DATA_PORTABILITY === 'true',
    rightToBeForgotten: process.env.GDPR_RIGHT_TO_BE_FORGOTTEN === 'true',
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  // Authentication Security
  auth: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordResetTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    mfaEnabled: process.env.FEATURE_MULTI_FACTOR_AUTH === 'true',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // API Security
  api: {
    version: process.env.API_VERSION || 'v1',
    rateLimiting: {
      windowMs: 60000, // 1 minute
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    },
    throttling: {
      windowMs: 60000, // 1 minute
      max: 50,
      message: 'Too many requests from this IP, please try again later.',
    },
  },
}));
