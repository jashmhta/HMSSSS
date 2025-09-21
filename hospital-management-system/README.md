# Hospital Management System (HMS)

A comprehensive, enterprise-grade Hospital Management System built with modern technologies. This system covers 28+ modules including patient management, appointments, pharmacy, laboratory, radiology, billing, and more.

## 🚀 Features

### Core Modules
- **Patient Management** - Registration, records, and portal access
- **Appointment Scheduling** - Doctor appointments with calendar integration
- **Medical Records** - Comprehensive patient history and documentation
- **Pharmacy Management** - Inventory, prescriptions, and billing
- **Laboratory Management** - Test ordering, tracking, and reporting
- **Radiology Management** - Imaging requests and report management
- **Billing & Invoicing** - Multi-department billing with insurance integration
- **Emergency Department** - Triage, critical alerts, and emergency workflows
- **Blood Bank Management** - Donor database and inventory tracking
- **Staff Management** - HR, payroll, and biometric attendance
- **Inventory Management** - Medical supplies and equipment tracking
- **Reports & Analytics** - Comprehensive reporting and dashboards

### Advanced Features
- **Role-Based Access Control (RBAC)** - 12+ user roles with granular permissions
- **Multi-tenant Architecture** - Support for multiple hospitals/clinics
- **Real-time Notifications** - SMS, Email, and WhatsApp integration
- **API Integration** - Tally accounting, payment gateways, and external systems
- **Mobile Applications** - Patient and doctor mobile apps
- **Advanced Security** - End-to-end encryption, 2FA, and audit logs
- **Compliance Ready** - NABH/JCI compliance checklists
- **Backup & Recovery** - Automated backups and disaster recovery

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Caching**: Redis
- **Queue**: Bull (Redis-based)
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom components with Lucide icons
- **Charts**: Recharts

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit + Redux Persist
- **API Client**: Axios
- **Offline Support**: Redux Persist + AsyncStorage

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Monitoring**: Prometheus + Grafana (optional)
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/hospital-management-system.git
cd hospital-management-system
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Manual Setup (Alternative)

#### Backend Setup
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Mobile Setup
```bash
cd mobile
npm install
npm run android  # or npm run ios
```

## 📊 Database Setup

### Using Docker
The database will be automatically created when you run `docker-compose up`.

### Manual Setup
```bash
# Install PostgreSQL and create database
createdb hms_db

# Run migrations
cd backend
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Database Configuration
The system uses Prisma ORM. Database schema is defined in `database/schema.prisma`.

### API Documentation
Once running, visit `http://localhost:3001/api-docs` for Swagger documentation.

## 🏗️ Project Structure

```
hospital-management-system/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── shared/         # Shared utilities
│   │   ├── config/         # Configuration files
│   │   └── database/       # Database setup
│   └── prisma/             # Database schema
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API services
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # React Native components
│   │   ├── screens/        # App screens
│   │   └── services/       # API services
├── database/               # Database files and migrations
├── infrastructure/         # Docker, Kubernetes, monitoring
├── tests/                  # Test suites
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:cov  # With coverage
npm run test:e2e  # End-to-end tests
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:cov
```

### Mobile Tests
```bash
cd mobile
npm run test
```

## 📱 Mobile Apps

### Patient App Features
- Appointment booking
- Medical records access
- Bill payment
- Prescription tracking
- Health reminders

### Doctor App Features
- Appointment management
- Patient records
- Prescription writing
- Lab/radiology ordering
- Schedule management

## 🔒 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Audit logging
- Data encryption at rest
- Secure file uploads

## 📊 Monitoring & Analytics

### Built-in Dashboards
- Patient statistics
- Revenue analytics
- Appointment tracking
- Inventory levels
- Staff performance

### External Monitoring (Optional)
- Prometheus for metrics collection
- Grafana for visualization
- ELK stack for logging
- Sentry for error tracking

## 🚀 Deployment

### Production Deployment
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./scripts/deploy.sh
```

### Environment-specific Configurations
- Development: `docker-compose.yml`
- Staging: `docker-compose.staging.yml`
- Production: `docker-compose.prod.yml`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/hospital-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/hospital-management-system/discussions)

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core patient management
- ✅ Basic appointment system
- ✅ Medical records
- ✅ Pharmacy management
- ✅ User authentication & RBAC

### Phase 2 (Next)
- 🔄 Laboratory management
- 🔄 Radiology management
- 🔄 Billing & insurance
- 🔄 Emergency department
- 🔄 Mobile applications

### Phase 3 (Future)
- 📋 Blood bank management
- 📋 Advanced analytics
- 📋 AI/ML integration
- 📋 IoT device integration
- 📋 Internationalization

---

**Built with ❤️ for healthcare professionals worldwide**