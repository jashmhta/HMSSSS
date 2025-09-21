# HMS Backup Service Dockerfile
FROM postgres:15-alpine

# Install additional tools for backup operations
RUN apk add --no-cache \
    curl \
    aws-cli \
    postgresql-client \
    gzip \
    openssl

# Create backup user
RUN addgroup -g 1001 -S backup && \
    adduser -S backup -u 1001 -G backup

# Create necessary directories
RUN mkdir -p /backup /scripts /var/log/backup && \
    chown -R backup:backup /backup /scripts /var/log/backup

# Copy backup scripts
COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Switch to backup user
USER backup

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD pg_isready -h postgres -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1

# Default command
CMD ["/scripts/backup.sh"]