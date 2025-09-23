# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Hospital Management System (HMS) built with a modern monorepo architecture. The system includes 28+ modules covering patient management, appointments, pharmacy, laboratory, radiology, billing, and more. It's designed as an enterprise-grade healthcare solution with multi-tenant support and comprehensive security features.

## Architecture

### Technology Stack
- **Backend**: NestJS (Node.js) with TypeScript
- **Frontend**: Next.js 14 with React and TypeScript
- **Mobile**: React Native
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with Bull
- **Containerization**: Docker & Docker Compose
- **Infrastructure**: Kubernetes with Istio service mesh (Phase 1 completed)

### Project Structure
```
hospital-management-system/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/        # Feature modules (patients, appointments, etc.)
│   │   ├── shared/         # Shared utilities and services
│   │   ├── config/         # Configuration files
│   │   └── database/       # Database setup and connection
│   └── prisma/             # Prisma schema and migrations
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API services
├── mobile/                 # React Native mobile app
├── database/               # Database files and migrations
├── infrastructure/         # Docker, Kubernetes configs
├── research/               # Architecture research and documentation
└── test/                   # Test configurations and utilities
```

### Key Backend Modules
- **AuthModule**: JWT-based authentication with role-based access control
- **PatientsModule**: Patient registration, records, and management
- **AppointmentsModule**: Doctor appointment scheduling and calendar integration
- **MedicalRecordsModule**: Comprehensive patient history and documentation
- **PharmacyModule**: Inventory, prescriptions, and medication management
- **LaboratoryModule**: Test ordering, tracking, and results
- **RadiologyModule**: Imaging requests and report management
- **BillingModule**: Multi-department billing with insurance integration
- **EmergencyModule**: Triage and emergency workflows
- **BloodBankModule**: Donor database and inventory tracking
- **InventoryModule**: Medical supplies and equipment tracking
- **ReportsModule**: Analytics and comprehensive reporting

## Development Commands

### Root Level (Monorepo)
```bash
# Install all dependencies
npm run install:all

# Build all projects
npm run build:all

# Run all tests
npm run test:all

# Lint all projects
npm run lint:all

# Start development servers
npm run dev:backend    # Backend on port 3001
npm run dev:frontend   # Frontend on port 3000
npm run dev:mobile     # Mobile app

# Docker operations
npm run docker:build   # Build all containers
npm run docker:up      # Start all services
npm run docker:down    # Stop all services

# Database setup
npm run setup          # Setup environment and database
```

### Backend (NestJS)
```bash
cd backend

# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debug mode
npm run start:prod     # Start production build

# Database operations
npm run db:migrate     # Run migrations
npm run db:generate    # Generate Prisma client
npm run db:seed        # Seed database with test data
npm run db:studio      # Open Prisma Studio
npm run db:push        # Push schema changes

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
npm run test:unit      # Run only unit tests
npm run test:integration  # Run integration tests
npm run test:performance  # Run performance tests
npm run test:security     # Run security-focused tests
npm run test:quality      # Run quality checks (lint + typecheck)

# Code quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Frontend (Next.js)
```bash
cd frontend

# Development
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server

# Testing
npm run test           # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run Playwright E2E tests
npm run test:e2e:ui    # Run E2E tests with UI mode

# Code quality
npm run lint           # Run Next.js linting
npm run lint:fix       # Fix linting issues
npm run type-check     # Run TypeScript type checking
```

### Mobile (React Native)
```bash
cd mobile

# Development
npm run android        # Start Android emulator
npm run ios            # Start iOS simulator
npm start              # Start Metro bundler

# Testing
npm run test           # Run Jest tests
```

## Database Schema

The system uses Prisma ORM with PostgreSQL. The main schema is located at `database/schema.prisma`. Key entities include:

- **User**: Authentication and role-based access (12+ roles)
- **Patient**: Patient demographics, medical history, and clinical data
- **Appointment**: Scheduling with calendar integration
- **MedicalRecord**: Comprehensive patient documentation
- **Medication**: Pharmacy inventory and prescriptions
- **LabTest**: Laboratory test ordering and results
- **RadiologyTest**: Imaging studies and reports
- **Billing**: Financial transactions and insurance claims

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database connection (PostgreSQL)
- Redis configuration
- JWT secrets
- Email/SMS service credentials
- External API keys (Stripe, Tally, etc.)

## Testing Strategy

### Test Types
- **Unit Tests**: Component and service isolation testing
- **Integration Tests**: API endpoint and database interaction testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load testing and benchmarking
- **Security Tests**: Authentication and authorization validation

### Test Database
The system includes a comprehensive test database configuration that:
- Creates isolated test databases
- Handles database migrations
- Seeds test data
- Provides cleanup utilities
- Supports multiple test user roles

## Infrastructure

### Phase 1 Status (Completed)
- Kubernetes cluster with 4 nodes
- PostgreSQL HA cluster with Patroni
- MongoDB replica set
- Elasticsearch, Logstash, Kibana (ELK) stack
- Keycloak identity management
- Kong API gateway
- Istio service mesh
- Prometheus + Grafana monitoring
- 92% infrastructure completion

### Phase 2 Status (In Progress)
- OpenMRS EHR integration
- metasfresh ERP system
- GraphQL API layer
- Data synchronization engine
- Advanced service orchestration

## Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC) with 12+ roles
- Rate limiting and request throttling
- Input validation and sanitization
- SQL injection and XSS protection
- Audit logging for all critical operations
- Data encryption at rest and in transit
- Secure file upload handling
- HIPAA/GDPR compliance features

## API Documentation

- Swagger/OpenAPI documentation available at `/api-docs`
- Comprehensive API testing with Postman collection
- GraphQL schema documentation (Phase 2)
- Real-time API monitoring with Kong

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode enabled, comprehensive type safety
- **Testing**: 90%+ code coverage required
- **Linting**: ESLint with custom rules for healthcare applications
- **Formatting**: Prettier with consistent styling
- **Security**: Regular security audits and vulnerability scanning

### Database Practices
- Always use Prisma migrations for schema changes
- Write seed scripts for test data
- Use transactions for complex operations
- Implement proper foreign key constraints
- Follow naming conventions: snake_case for database entities

### API Development
- Follow RESTful conventions
- Implement proper error handling with HTTP status codes
- Use DTOs for request/response validation
- Document all endpoints with Swagger decorators
- Implement rate limiting and caching strategies

### Frontend Development
- Use TypeScript for all components
- Implement proper error boundaries
- Follow accessibility guidelines (WCAG 2.1)
- Use responsive design patterns
- Implement proper state management with React Query

## Deployment

### Development
```bash
docker-compose up -d    # Start all services locally
```

### Production
- Use Kubernetes manifests in `infrastructure/`
- Implement blue-green deployments
- Use Istio for traffic management
- Monitor with Prometheus/Grafana
- Log aggregation with ELK stack

## Common Issues

### Database Connection Issues
- Ensure PostgreSQL is running on port 5432
- Check DATABASE_URL in .env file
- Verify database user permissions
- Run `npm run db:migrate` to ensure schema is up to date

### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- Use different ports in development if needed

### Test Failures
- Ensure test database is properly configured
- Check that Redis is running for queue tests
- Verify all environment variables are set for testing
- Run `npm run test:quality` to check code quality

## Additional Resources

- **Phase Documentation**: `PHASE1_COMPLETION_REPORT.md`, `PHASE2_IMPLEMENTATION_PLAN.md`
- **API Documentation**: Available at `/api-docs` when backend is running
- **Architecture Research**: `research/` directory contains detailed analysis
- **Infrastructure Configs**: `infrastructure/` directory contains Kubernetes and service mesh configurations