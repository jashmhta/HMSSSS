// Global mock configurations for enterprise-grade testing

import { mock, mockDeep, mockReset } from 'jest-mock-extended';

// Mock external services and dependencies
jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({}),
    forFeature: jest.fn().mockReturnValue({}),
  },
  ConfigService: mock({
    get: jest.fn((key: string) => {
      const mockConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5433/hms_test',
        REDIS_URL: 'redis://localhost:6379/1',
        JWT_SECRET: 'test-jwt-secret',
        JWT_EXPIRES_IN: '3600',
        REFRESH_TOKEN_SECRET: 'test-refresh-secret',
        REFRESH_TOKEN_EXPIRES_IN: '604800',
        BCRYPT_ROUNDS: 12,
        LOG_LEVEL: 'error',
        NODE_ENV: 'test',
      };
      return mockConfig[key] || undefined;
    }),
  }),
}));

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = mockDeep({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    medicalRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    labTest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    radiologyTest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    medication: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    prescription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  });

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock external communication services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

jest.mock('twilio', () => ({
  Twilio: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' }),
    },
  })),
}));

jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'test-payment-intent-id' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'test-payment-intent-id' }),
    },
    charges: {
      create: jest.fn().mockResolvedValue({ id: 'test-charge-id' }),
    },
  })),
}));

// Mock Bull queue system
jest.mock('@nestjs/bull', () => ({
  BullModule: {
    registerQueue: jest.fn().mockReturnValue({}),
    injectQueue: jest.fn().mockReturnValue({}),
  },
  Bull: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    getQueue: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    clean: jest.fn(),
    drain: jest.fn(),
  })),
}));

// Mock cache manager
jest.mock('@nestjs/cache-manager', () => ({
  CacheModule: {
    register: jest.fn().mockReturnValue({}),
    registerAsync: jest.fn().mockReturnValue({}),
  },
  CACHE_MANAGER: jest.fn(),
}));

// Mock file upload and storage
jest.mock('multer', () => ({
  memoryStorage: jest.fn().mockReturnValue({}),
  diskStorage: jest.fn().mockReturnValue({}),
}));

jest.mock('sharp', () => ({
  default: jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test-image-data')),
  })),
}));

// Mock logging
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock security services
jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn().mockReturnValue((req, res, next) => next()),
  authorize: jest.fn().mockReturnValue((req, res, next) => next()),
}));

jest.mock('passport-jwt', () => ({
  Strategy: jest.fn().mockImplementation(() => ({
    name: 'jwt',
  })),
}));

jest.mock('passport-local', () => ({
  Strategy: jest.fn().mockImplementation(() => ({
    name: 'local',
  })),
}));

// Mock rate limiting
jest.mock('express-rate-limit', () => ({
  default: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock CORS
jest.mock('cors', () => ({
  default: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock compression
jest.mock('compression', () => ({
  default: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock helmet security
jest.mock('helmet', () => ({
  default: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock morgan logging
jest.mock('morgan', () => ({
  default: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock external APIs
jest.mock('axios', () => ({
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock utility libraries
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-v4'),
  v1: jest.fn().mockReturnValue('test-uuid-v1'),
}));

jest.mock('crypto-js', () => ({
  SHA256: jest.fn().mockReturnValue('test-hash'),
  enc: {
    Base64: {
      stringify: jest.fn().mockReturnValue('test-base64'),
      parse: jest.fn().mockReturnValue('test-decoded'),
    },
  },
}));

jest.mock('moment', () => ({
  default: jest.fn().mockImplementation(() => ({
    format: jest.fn().mockReturnValue('2024-01-01T00:00:00Z'),
    add: jest.fn().mockReturnThis(),
    subtract: jest.fn().mockReturnThis(),
    toDate: jest.fn().mockReturnValue(new Date()),
  })),
}));

// Mock file system operations
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('test-file-content'),
  exists: jest.fn().mockResolvedValue(true),
  remove: jest.fn().mockResolvedValue(undefined),
  copy: jest.fn().mockResolvedValue(undefined),
  move: jest.fn().mockResolvedValue(undefined),
}));

// Mock QR code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test-qr-data'),
  toFile: jest.fn().mockResolvedValue('test-qr-file.png'),
}));

// Mock 2FA
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    ascii: 'test-secret',
    hex: '746573742d736563726574',
    base32: 'ORUGS4ZFMFRGK43G',
    otpauth_url: 'otpauth://totp/test?secret=ORUGS4ZFMFRGK43G',
  }),
  totp: {
    verify: jest.fn().mockReturnValue(true),
    generate: jest.fn().mockReturnValue('123456'),
  },
}));

// Mock cron jobs
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  }),
}));

// Mock archiver
jest.mock('archiver', () => ({
  create: jest.fn().mockReturnValue({
    append: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis(),
    finalize: jest.fn().mockResolvedValue(true),
    on: jest.fn().mockReturnThis(),
  }),
}));

// Global test utilities
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Global performance monitoring
global.performanceMonitor = {
  start: () => {
    return Date.now();
  },
  end: (startTime: number, threshold: number = 1000) => {
    const duration = Date.now() - startTime;
    if (duration > threshold) {
      console.warn(`Performance warning: Operation took ${duration}ms (threshold: ${threshold}ms)`);
    }
    return duration;
  },
};

// Global memory monitoring
global.memoryMonitor = {
  start: () => {
    if (global.gc) {
      global.gc();
    }
    return process.memoryUsage().heapUsed;
  },
  end: (startMemory: number, threshold: number = 50 * 1024 * 1024) => {
    if (global.gc) {
      global.gc();
    }
    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;
    if (memoryIncrease > threshold) {
      console.warn(
        `Memory leak warning: Memory increased by ${memoryIncrease} bytes (threshold: ${threshold} bytes)`,
      );
    }
    return memoryIncrease;
  },
};

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Extend Jest expect with custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeValidDate(received: Date) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass,
    };
  },

  toHaveRequiredFields(received: any, fields: string[]) {
    const missingFields = fields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    return {
      message: () => `expected object to have required fields: ${missingFields.join(', ')}`,
      pass,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass,
    };
  },

  toBeValidPhoneNumber(received: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = typeof received === 'string' && phoneRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid phone number`,
      pass,
    };
  },
});

// Export mock utilities for test usage
export const mockPrisma = require('@prisma/client').PrismaClient;
export const mockConfig = require('@nestjs/config').ConfigService;
export const mockNodemailer = require('nodemailer').createTransport;
export const mockTwilio = require('twilio').Twilio;
export const mockStripe = require('stripe').Stripe;
