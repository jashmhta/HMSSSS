# Ultimate HMS - Phase 3 Deployment Guide

## Overview
This guide covers the deployment and operation of the Ultimate Hospital Management System (HMS) Phase 3, featuring enterprise-grade multi-tenant architecture with advanced security, monitoring, and scalability.

## Architecture Overview

### Core Components
- **Data Sync Service**: Real-time synchronization between OpenMRS, Metasfresh, and FHIR servers
- **DICOM Server**: Medical imaging with Orthanc PACS
- **FHIR Server**: HL7 FHIR-compliant clinical data API
- **GraphQL API**: Unified API gateway with advanced querying
- **OpenMRS**: Electronic Medical Records system
- **Metasfresh**: ERP and inventory management
- **PostgreSQL Cluster**: High-availability database
- **Elasticsearch**: Search and analytics
- **Redis**: Caching and session management
- **RabbitMQ**: Message queuing
- **Istio Service Mesh**: Traffic management and security
- **Prometheus/Grafana**: Monitoring and alerting

### Multi-Tenant Features (Phase 3)
- Database schema isolation per tenant
- Tenant-specific configurations
- Advanced RBAC with tenant boundaries
- Analytics dashboard per tenant
- Mobile API endpoints
- Advanced OIDC/OAuth2 integration

## Prerequisites

### System Requirements
- Kubernetes 1.27+
- Istio 1.27+
- Helm 3.12+
- kubectl configured for cluster access
- 16GB RAM minimum
- 100GB storage minimum

### Network Requirements
- External load balancer for Istio Gateway
- DNS configuration for `*.hms.local` domains
- SSL certificates for HTTPS

## Deployment Steps

### 1. Cluster Preparation

```bash
# Verify cluster access
kubectl cluster-info

# Install Istio
istioctl install --set profile=demo -y

# Enable Istio injection on namespaces
kubectl label namespace ultimate-hms istio-injection=enabled
kubectl label namespace openmrs-system istio-injection=enabled
kubectl label namespace data-sync-system istio-injection=enabled
kubectl label namespace dicom-system istio-injection=enabled
kubectl label namespace fhir-system istio-injection=enabled
kubectl label namespace graphql-system istio-injection=enabled
kubectl label namespace metasfresh-system istio-injection=enabled
```

### 2. Database Setup

```bash
# Deploy PostgreSQL cluster
kubectl apply -f infrastructure/databases/postgresql-cluster.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n ultimate-hms --timeout=300s

# Initialize databases
kubectl apply -f infrastructure/phase2/openmrs/openmrs-db-init-job.yaml
kubectl apply -f infrastructure/phase2/metasfresh/metasfresh-db-init-job.yaml
```

### 3. Core Services Deployment

```bash
# Deploy in order of dependencies
kubectl apply -f infrastructure/databases/
kubectl apply -f infrastructure/monitoring/
kubectl apply -f infrastructure/phase2/data-sync/
kubectl apply -f infrastructure/phase2/fhir/
kubectl apply -f infrastructure/phase2/dicom/
kubectl apply -f infrastructure/phase2/openmrs/
kubectl apply -f infrastructure/phase2/metasfresh/
kubectl apply -f infrastructure/phase2/graphql/
```

### 4. Istio Configuration

```bash
# Deploy Istio gateway and virtual services
kubectl apply -f infrastructure/istio/istio-gateway.yaml
kubectl apply -f infrastructure/phase2/istio/
```

### 5. Security Configuration

```bash
# Apply network policies
kubectl apply -f infrastructure/kubernetes/network-policy.yaml

# Configure RBAC (Phase 3)
kubectl apply -f infrastructure/phase3/rbac/

# Set up OIDC/OAuth2 (Phase 3)
kubectl apply -f infrastructure/phase3/oidc/
```

### 6. Monitoring Setup

```bash
# Deploy Prometheus and Grafana
kubectl apply -f infrastructure/monitoring/prometheus-grafana.yaml

# Configure Grafana dashboards
kubectl apply -f infrastructure/monitoring/hms-grafana-dashboard.json
```

## Phase 3 Multi-Tenant Configuration

### Database Schema Isolation

```sql
-- Create tenant-specific schemas
CREATE SCHEMA tenant_hospital_a;
CREATE SCHEMA tenant_hospital_b;

-- Grant permissions
GRANT ALL ON SCHEMA tenant_hospital_a TO hms_user;
GRANT ALL ON SCHEMA tenant_hospital_b TO hms_user;
```

### Tenant Configuration

```yaml
# Example tenant configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: tenant-config-hospital-a
  namespace: ultimate-hms
data:
  tenant-id: "hospital-a"
  database-schema: "tenant_hospital_a"
  allowed-domains: "hospital-a.com,hospital-a.org"
  features-enabled: "ehr,billing,pharmacy,laboratory"
```

### API Endpoints

#### FHIR Server
- Base URL: `https://fhir.hms.local/fhir`
- Authentication: Bearer token
- Documentation: `https://fhir.hms.local/fhir/metadata`

#### GraphQL API
- Base URL: `https://api.hms.local/graphql`
- Authentication: JWT token
- Playground: `https://api.hms.local/graphql/playground`

#### DICOM Server
- Base URL: `https://dicom.hms.local/dcm4chee-arc`
- Authentication: Basic auth
- PACS: `dicom://dicom.hms.local:11112`

#### OpenMRS
- Base URL: `https://openmrs.hms.local/openmrs`
- Authentication: Basic auth or OAuth2
- REST API: `/ws/rest/v1/`

## Security Configuration

### Network Policies
- Default deny all traffic
- Allow only necessary inter-service communication
- Restrict external access to required ports only

### Authentication & Authorization
- OIDC integration with Keycloak
- JWT tokens with tenant context
- Role-based access control per tenant
- Multi-factor authentication support

### TLS/SSL
- Automatic certificate management via cert-manager
- End-to-end encryption
- HSTS headers enabled

## Monitoring & Observability

### Prometheus Metrics
- Service health checks
- Response times and throughput
- Error rates
- Resource utilization

### Grafana Dashboards
- System overview
- Service-specific metrics
- Tenant usage analytics
- Alert management

### Logging
- Centralized logging with ELK stack
- Structured logs with correlation IDs
- Audit trails for compliance

## Backup & Recovery

### Database Backups
```bash
# Automated daily backups
kubectl apply -f infrastructure/backup/postgres-backup.yaml
```

### Configuration Backups
```bash
# Backup Kubernetes configurations
kubectl get all -o yaml > backup-$(date +%Y%m%d).yaml
```

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check pod status
kubectl get pods --all-namespaces

# Check pod logs
kubectl logs -n <namespace> <pod-name>

# Check service endpoints
kubectl get endpoints -n <namespace>
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -n ultimate-hms postgres-0 -- psql -U hms_user -d hms_db -c "SELECT 1"

# Check database logs
kubectl logs -n ultimate-hms postgres-0
```

#### Istio Issues
```bash
# Check Istio proxy status
kubectl exec <pod-name> -c istio-proxy -- pilot-agent request GET /stats

# Check virtual services
kubectl get virtualservice --all-namespaces
```

## Performance Tuning

### Resource Limits
- Adjust CPU/memory limits based on load
- Configure horizontal pod autoscaling
- Optimize database connection pooling

### Caching
- Redis for session and API caching
- CDN for static assets
- Database query result caching

## Compliance & Security

### HIPAA Compliance
- Data encryption at rest and in transit
- Access logging and audit trails
- Role-based access controls
- Data retention policies

### Penetration Testing
- Regular security assessments
- Vulnerability scanning
- Code security reviews

## Support & Maintenance

### Regular Tasks
- Monitor system health via Grafana
- Review and rotate secrets quarterly
- Update dependencies monthly
- Backup verification weekly

### Emergency Contacts
- Infrastructure Team: infra@hms.local
- Security Team: security@hms.local
- Development Team: dev@hms.local

---

**Document Version**: 1.0
**Last Updated**: September 21, 2025
**Phase**: 3.0 Multi-Tenant Ready