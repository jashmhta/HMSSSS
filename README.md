# 🏥 Hospital Management System (HMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue.svg)](https://kubernetes.io/)

A comprehensive, enterprise-grade Hospital Management System built with modern technologies. Features 28+ modules covering patient management, appointments, pharmacy, laboratory, radiology, billing, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (for caching and queues)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jashmhta/HMSSSS.git
   cd HMSSSS
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run setup
   ```

5. **Start Development Servers**
   ```bash
   npm run dev:backend    # Backend on http://localhost:3001
   npm run dev:frontend   # Frontend on http://localhost:3000
   npm run dev:mobile     # Mobile app
   ```

## 🏗️ Architecture

### Technology Stack
- **Backend**: NestJS (Node.js) with TypeScript
- **Frontend**: Next.js 14 with React and TypeScript
- **Mobile**: React Native
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with Bull
- **Containerization**: Docker & Docker Compose
- **Infrastructure**: Kubernetes with Istio service mesh

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

## 📋 Core Modules

### 🏥 Patient Management
- Patient registration and profiles
- Medical history and records
- Emergency contacts and insurance
- Appointment scheduling

### 👨‍⚕️ Healthcare Services
- **Appointments**: Doctor scheduling with calendar integration
- **Medical Records**: Comprehensive patient documentation
- **Laboratory**: Test ordering, tracking, and results
- **Radiology**: Imaging requests and report management
- **Pharmacy**: Inventory, prescriptions, and medication management
- **Emergency**: Triage and emergency workflows

### 💰 Administrative
- **Billing**: Multi-department billing with insurance integration
- **Inventory**: Medical supplies and equipment tracking
- **Blood Bank**: Donor database and inventory tracking
- **Reports**: Analytics and comprehensive reporting

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) with 12+ roles
- Rate limiting and request throttling
- Input validation and sanitization
- SQL injection and XSS protection
- Audit logging for all critical operations
- Data encryption at rest and in transit
- HIPAA/GDPR compliance features

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Component and service isolation testing
- **Integration Tests**: API endpoint and database interaction testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load testing and benchmarking
- **Security Tests**: Authentication and authorization validation

### Running Tests
```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance tests
npm run test:security     # Security tests
```

## 🚀 Development Commands

### Root Level (Monorepo)
```bash
npm run install:all       # Install all dependencies
npm run build:all         # Build all projects
npm run test:all          # Run all tests
npm run lint:all          # Lint all projects
npm run dev:backend       # Start backend development server
npm run dev:frontend      # Start frontend development server
npm run dev:mobile        # Start mobile development server
```

### Backend (NestJS)
```bash
cd backend
npm run start:dev         # Start with hot reload
npm run start:debug       # Start with debug mode
npm run db:migrate        # Run database migrations
npm run db:generate       # Generate Prisma client
npm run db:studio         # Open Prisma Studio
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev               # Start development server
npm run build             # Build for production
npm run test              # Run Jest tests
npm run test:e2e          # Run Playwright E2E tests
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d      # Start all services locally
```

### Production
- Kubernetes manifests available in `infrastructure/`
- Use Istio for traffic management
- Monitor with Prometheus/Grafana

## 📚 API Documentation

- **Swagger/OpenAPI**: Available at `/api-docs` when backend is running
- **GraphQL Schema**: Available in Phase 2
- **Postman Collection**: Available in `docs/api/`

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: JWT signing secret
- `EMAIL_CONFIG`: Email service credentials
- `STRIPE_SECRET`: Payment processing (Stripe)

### Database Schema
The system uses Prisma ORM with PostgreSQL. Main entities include:
- **User**: Authentication and role-based access
- **Patient**: Patient demographics and clinical data
- **Appointment**: Scheduling with calendar integration
- **MedicalRecord**: Comprehensive patient documentation
- **Medication**: Pharmacy inventory and prescriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Maintain 90%+ code coverage
- Use ESLint and Prettier
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern healthcare standards in mind
- Designed for scalability and performance
- Implements industry best practices for medical software

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jashmhta/HMSSSS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jashmhta/HMSSSS/discussions)
- **Documentation**: [Wiki](https://github.com/jashmhta/HMSSSS/wiki)

---

**🏥 HMS - Transforming Healthcare Management**
