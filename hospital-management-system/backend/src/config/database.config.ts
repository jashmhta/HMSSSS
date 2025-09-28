import { registerAs } from '@nestjs/config';
import { VaultService } from './vault.service';

export default registerAs('database', () => ({
  // Primary Database URL
  url: process.env.DATABASE_URL,

  // Test Database URL
  testUrl: process.env.DATABASE_TEST_URL,

  // Development Database URL
  devUrl: process.env.DATABASE_DEV_URL,

  // Shadow Database for Prisma Migrations
  shadowUrl: process.env.SHADOW_DATABASE_URL,

  // Connection Pooling Configuration
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000,
    createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT) || 10000,
    destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT) || 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  // SSL Configuration
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    ca: process.env.DATABASE_SSL_CA,
    key: process.env.DATABASE_SSL_KEY,
    cert: process.env.DATABASE_SSL_CERT,
  },

  // Connection Timeout Configuration
  timeout: {
    connection: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    query: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
    idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  },

  // Health Check Configuration
  healthCheck: {
    enabled: process.env.DB_HEALTH_CHECK_ENABLED !== 'false',
    interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 30000,
    timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT) || 5000,
    retries: parseInt(process.env.DB_HEALTH_CHECK_RETRIES) || 3,
  },

  // Logging Configuration
  logging: {
    enabled: process.env.DB_LOGGING_ENABLED !== 'false',
    level: process.env.DB_LOG_LEVEL || 'info',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 5000,
    format: process.env.DB_LOG_FORMAT || 'simple',
  },

  // Backup Configuration
  backup: {
    enabled: process.env.DB_BACKUP_ENABLED !== 'false',
    schedule: process.env.DB_BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.DB_BACKUP_RETENTION_DAYS) || 30,
    compression: process.env.DB_BACKUP_COMPRESSION !== 'false',
    encryption: process.env.DB_BACKUP_ENCRYPTION !== 'false',
    storage: process.env.DB_BACKUP_STORAGE || './backups',
  },

  // Replication Configuration (for HA)
  replication: {
    enabled: process.env.DB_REPLICATION_ENABLED === 'true',
    primary: {
      host: process.env.DB_PRIMARY_HOST,
      port: parseInt(process.env.DB_PRIMARY_PORT) || 5432,
      database: process.env.DB_PRIMARY_DATABASE,
      username: process.env.DB_PRIMARY_USERNAME,
      password: process.env.DB_PRIMARY_PASSWORD,
    },
    replicas:
      process.env.DB_REPLICA_HOSTS?.split(',').map((host, index) => ({
        host: host.trim(),
        port: parseInt(process.env.DB_REPLICA_PORTS?.split(',')[index]) || 5432,
        database: process.env.DB_REPLICA_DATABASES?.split(',')[index] || 'hms_db',
        username: process.env.DB_REPLICA_USERNAMES?.split(',')[index] || 'hms_replica_user',
        password: process.env.DB_REPLICA_PASSWORDS?.split(',')[index],
        readOnly: true,
      })) || [],
  },

  // Connection Management
  connection: {
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
    lockTimeout: parseInt(process.env.DB_LOCK_TIMEOUT) || 10000,
    idleInTransactionSessionTimeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT) || 60000,
  },

  // Performance Optimization
  performance: {
    enableQueryCache: process.env.DB_ENABLE_QUERY_CACHE === 'true',
    queryCacheSize: parseInt(process.env.DB_QUERY_CACHE_SIZE) || 1000,
    enableIndexUsageStats: process.env.DB_ENABLE_INDEX_USAGE_STATS === 'true',
    enableVacuum: process.env.DB_ENABLE_VACUUM !== 'false',
    vacuumSchedule: process.env.DB_VACUUM_SCHEDULE || '0 3 * * *', // Daily at 3 AM
  },

  // Monitoring
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED !== 'false',
    metrics: {
      enabled: process.env.DB_METRICS_ENABLED !== 'false',
      port: parseInt(process.env.DB_METRICS_PORT) || 9091,
      path: process.env.DB_METRICS_PATH || '/metrics',
    },
    alerts: {
      enabled: process.env.DB_ALERTS_ENABLED !== 'false',
      channels: process.env.DB_ALERT_CHANNELS?.split(',') || ['email', 'slack'],
      thresholds: {
        cpu: parseFloat(process.env.DB_ALERT_CPU_THRESHOLD) || 80,
        memory: parseFloat(process.env.DB_ALERT_MEMORY_THRESHOLD) || 80,
        disk: parseFloat(process.env.DB_ALERT_DISK_THRESHOLD) || 80,
        connections: parseFloat(process.env.DB_ALERT_CONNECTIONS_THRESHOLD) || 80,
      },
    },
  },

  // Security
  security: {
    encryption: {
      enabled: process.env.DB_ENCRYPTION_ENABLED === 'true',
      algorithm: process.env.DB_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      keyRotationDays: parseInt(process.env.DB_ENCRYPTION_KEY_ROTATION_DAYS) || 90,
    },
    accessControl: {
      enabled: process.env.DB_ACCESS_CONTROL_ENABLED !== 'false',
      rowLevelSecurity: process.env.DB_ROW_LEVEL_SECURITY_ENABLED === 'true',
      columnLevelEncryption: process.env.DB_COLUMN_LEVEL_ENCRYPTION_ENABLED === 'true',
    },
    audit: {
      enabled: process.env.DB_AUDIT_ENABLED !== 'false',
      level: process.env.DB_AUDIT_LEVEL || 'all',
      retentionDays: parseInt(process.env.DB_AUDIT_RETENTION_DAYS) || 2555,
    },
  },

  // Development Settings
  development: {
    dropDatabase: process.env.NODE_ENV === 'development' && process.env.DB_DROP_DATABASE === 'true',
    synchronize: process.env.NODE_ENV === 'development' && process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.NODE_ENV === 'development',
  },

  // Production Settings
  production: {
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN_PROD) || 5,
      max: parseInt(process.env.DB_POOL_MAX_PROD) || 50,
    },
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT_PROD) || 20000,
    logging: false,
  },
}));
