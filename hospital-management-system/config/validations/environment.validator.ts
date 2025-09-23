import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ValidationRule {
  key: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'hex' | 'base64';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

@Injectable()
export class EnvironmentValidator {
  private readonly validationRules: ValidationRule[] = [
    // Database Configuration
    {
      key: 'DATABASE_URL',
      required: true,
      type: 'string',
      pattern: /^postgresql:\/\/.+:.+@.+:\d+\/.+/,
      errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string',
    },
    {
      key: 'DATABASE_TEST_URL',
      required: true,
      type: 'string',
      pattern: /^postgresql:\/\/.+:.+@.+:\d+\/.+/,
      errorMessage: 'DATABASE_TEST_URL must be a valid PostgreSQL connection string',
    },
    {
      key: 'DB_POOL_MAX',
      required: true,
      type: 'number',
      min: 1,
      max: 100,
      errorMessage: 'DB_POOL_MAX must be between 1 and 100',
    },
    {
      key: 'DB_POOL_MIN',
      required: true,
      type: 'number',
      min: 1,
      max: 50,
      errorMessage: 'DB_POOL_MIN must be between 1 and 50',
    },

    // Redis Configuration
    {
      key: 'REDIS_HOST',
      required: true,
      type: 'string',
      minLength: 1,
      errorMessage: 'REDIS_HOST is required',
    },
    {
      key: 'REDIS_PORT',
      required: true,
      type: 'number',
      min: 1,
      max: 65535,
      errorMessage: 'REDIS_PORT must be between 1 and 65535',
    },

    // JWT Configuration
    {
      key: 'JWT_SECRET',
      required: true,
      type: 'string',
      minLength: 32,
      errorMessage: 'JWT_SECRET must be at least 32 characters long',
    },
    {
      key: 'JWT_REFRESH_SECRET',
      required: true,
      type: 'string',
      minLength: 32,
      errorMessage: 'JWT_REFRESH_SECRET must be at least 32 characters long',
    },
    {
      key: 'JWT_EXPIRES_IN',
      required: true,
      type: 'string',
      pattern: /^\d+[smhd]$/,
      errorMessage: 'JWT_EXPIRES_IN must be in format like "1h", "2d", "7d"',
    },

    // Security Configuration
    {
      key: 'BCRYPT_ROUNDS',
      required: true,
      type: 'number',
      min: 4,
      max: 16,
      errorMessage: 'BCRYPT_ROUNDS must be between 4 and 16',
    },
    {
      key: 'SESSION_SECRET',
      required: true,
      type: 'string',
      minLength: 32,
      errorMessage: 'SESSION_SECRET must be at least 32 characters long',
    },
    {
      key: 'ENCRYPTION_KEY',
      required: true,
      type: 'hex',
      minLength: 64,
      errorMessage: 'ENCRYPTION_KEY must be a valid 256-bit hex string (64 characters)',
    },

    // Application Configuration
    {
      key: 'NODE_ENV',
      required: true,
      type: 'string',
      pattern: /^(development|test|staging|production)$/,
      errorMessage: 'NODE_ENV must be one of: development, test, staging, production',
    },
    {
      key: 'PORT',
      required: true,
      type: 'number',
      min: 1,
      max: 65535,
      errorMessage: 'PORT must be between 1 and 65535',
    },
    {
      key: 'FRONTEND_URL',
      required: true,
      type: 'url',
      errorMessage: 'FRONTEND_URL must be a valid URL',
    },

    // Email Configuration
    {
      key: 'SMTP_HOST',
      required: true,
      type: 'string',
      minLength: 1,
      errorMessage: 'SMTP_HOST is required',
    },
    {
      key: 'SMTP_PORT',
      required: true,
      type: 'number',
      min: 1,
      max: 65535,
      errorMessage: 'SMTP_PORT must be between 1 and 65535',
    },
    {
      key: 'SMTP_USER',
      required: true,
      type: 'email',
      errorMessage: 'SMTP_USER must be a valid email address',
    },
    {
      key: 'SMTP_PASS',
      required: true,
      type: 'string',
      minLength: 1,
      errorMessage: 'SMTP_PASS is required',
    },

    // SMS Configuration (Twilio)
    {
      key: 'TWILIO_ACCOUNT_SID',
      required: true,
      type: 'string',
      pattern: /^AC[a-f0-9]{32}$/,
      errorMessage: 'TWILIO_ACCOUNT_SID must be a valid Twilio Account SID',
    },
    {
      key: 'TWILIO_AUTH_TOKEN',
      required: true,
      type: 'string',
      minLength: 32,
      errorMessage: 'TWILIO_AUTH_TOKEN must be at least 32 characters long',
    },
    {
      key: 'TWILIO_PHONE_NUMBER',
      required: true,
      type: 'string',
      pattern: /^\+?\d{10,15}$/,
      errorMessage: 'TWILIO_PHONE_NUMBER must be a valid phone number',
    },

    // External API Keys
    {
      key: 'STRIPE_SECRET_KEY',
      required: true,
      type: 'string',
      pattern: /^sk_[a-zA-Z0-9]+$/,
      errorMessage: 'STRIPE_SECRET_KEY must be a valid Stripe secret key',
    },
    {
      key: 'STRIPE_PUBLISHABLE_KEY',
      required: true,
      type: 'string',
      pattern: /^pk_[a-zA-Z0-9]+$/,
      errorMessage: 'STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key',
    },
    {
      key: 'OPENAI_API_KEY',
      required: true,
      type: 'string',
      pattern: /^sk-[a-zA-Z0-9]+$/,
      errorMessage: 'OPENAI_API_KEY must be a valid OpenAI API key',
    },

    // File Upload Configuration
    {
      key: 'UPLOAD_MAX_SIZE',
      required: true,
      type: 'number',
      min: 1,
      max: 104857600, // 100MB
      errorMessage: 'UPLOAD_MAX_SIZE must be between 1 and 104857600 bytes',
    },
    {
      key: 'UPLOAD_ALLOWED_TYPES',
      required: true,
      type: 'string',
      minLength: 1,
      errorMessage: 'UPLOAD_ALLOWED_TYPES is required',
    },

    // Logging Configuration
    {
      key: 'LOG_LEVEL',
      required: true,
      type: 'string',
      pattern: /^(debug|info|warn|error|silent)$/,
      errorMessage: 'LOG_LEVEL must be one of: debug, info, warn, error, silent',
    },

    // Rate Limiting
    {
      key: 'RATE_LIMIT_TTL',
      required: true,
      type: 'number',
      min: 1000,
      max: 3600000,
      errorMessage: 'RATE_LIMIT_TTL must be between 1000 and 3600000 ms',
    },
    {
      key: 'RATE_LIMIT_LIMIT',
      required: true,
      type: 'number',
      min: 1,
      max: 10000,
      errorMessage: 'RATE_LIMIT_LIMIT must be between 1 and 10000',
    },

    // CORS Configuration
    {
      key: 'CORS_ORIGIN',
      required: true,
      type: 'string',
      minLength: 1,
      errorMessage: 'CORS_ORIGIN is required',
    },

    // Security Flags
    {
      key: 'HIPAA_ENABLED',
      required: false,
      type: 'boolean',
    },
    {
      key: 'GDPR_ENABLED',
      required: false,
      type: 'boolean',
    },
  ];

  constructor(private readonly configService: ConfigService) {}

  validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // Environment-specific validations
    this.validationRules.forEach(rule => {
      const value = this.configService.get(rule.key);
      this.validateRule(rule, value, errors);
    });

    // Additional security checks
    this.validateSecuritySettings(nodeEnv, errors);
    this.validateProductionSettings(nodeEnv, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateRule(rule: ValidationRule, value: any, errors: string[]): void {
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.key} is required`);
      return;
    }

    if (!rule.required && (value === undefined || value === null || value === '')) {
      return;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${rule.key} must be a string`);
          return;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${rule.key} must be a number`);
          return;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${rule.key} must be a boolean`);
          return;
        }
        break;
      case 'url':
        if (!this.isValidUrl(value)) {
          errors.push(`${rule.key} must be a valid URL`);
          return;
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push(`${rule.key} must be a valid email address`);
          return;
        }
        break;
      case 'hex':
        if (!/^[a-f0-9]+$/i.test(value)) {
          errors.push(`${rule.key} must be a valid hex string`);
          return;
        }
        break;
      case 'base64':
        if (!/^[a-zA-Z0-9+/]+=*$/i.test(value)) {
          errors.push(`${rule.key} must be a valid base64 string`);
          return;
        }
        break;
    }

    // String validations
    if (rule.type === 'string' || rule.type === 'url' || rule.type === 'email' || rule.type === 'hex' || rule.type === 'base64') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.key} must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.key} must be no more than ${rule.maxLength} characters long`);
      }
    }

    // Number validations
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${rule.key} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${rule.key} must be no more than ${rule.max}`);
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(rule.errorMessage || `${rule.key} format is invalid`);
    }

    // Custom validator
    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push(rule.errorMessage || `${rule.key} failed custom validation`);
    }
  }

  private validateSecuritySettings(nodeEnv: string, errors: string[]): void {
    // Check for default/weak secrets in production
    if (nodeEnv === 'production') {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const sessionSecret = this.configService.get<string>('SESSION_SECRET');
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

      const defaultPatterns = [
        /your-super-secret-jwt-key/,
        /your-session-secret-key/,
        /your-256-bit-encryption-key/,
        /change-in-production/,
        /dev-/,
        /test-/,
        /staging-/,
      ];

      defaultPatterns.forEach(pattern => {
        if (pattern.test(jwtSecret)) {
          errors.push('JWT_SECRET appears to be using default/weak value in production');
        }
        if (pattern.test(sessionSecret)) {
          errors.push('SESSION_SECRET appears to be using default/weak value in production');
        }
        if (pattern.test(encryptionKey)) {
          errors.push('ENCRYPTION_KEY appears to be using default/weak value in production');
        }
      });
    }
  }

  private validateProductionSettings(nodeEnv: string, errors: string[]): void {
    if (nodeEnv === 'production') {
      // Check for development settings in production
      const debugMode = this.configService.get<boolean>('DEBUG_MODE');
      const developerMode = this.configService.get<boolean>('DEVELOPER_MODE');
      const swaggerEnabled = this.configService.get<boolean>('SWAGGER_ENABLED');

      if (debugMode) {
        errors.push('DEBUG_MODE should not be enabled in production');
      }
      if (developerMode) {
        errors.push('DEVELOPER_MODE should not be enabled in production');
      }
      if (swaggerEnabled) {
        errors.push('SWAGGER_ENABLED should not be enabled in production');
      }

      // Check log level
      const logLevel = this.configService.get<string>('LOG_LEVEL');
      if (logLevel === 'debug') {
        errors.push('LOG_LEVEL should not be "debug" in production');
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}