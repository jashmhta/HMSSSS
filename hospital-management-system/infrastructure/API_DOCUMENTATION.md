# Hospital Management System API Documentation

## Overview

The HMS API provides comprehensive healthcare management capabilities with 28+ modules covering patient management, appointments, pharmacy, laboratory, radiology, billing, and more.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication

### JWT Authentication
All API endpoints require JWT authentication except for login and registration.

**Header:**
```
Authorization: Bearer <jwt_token>
```

### Multi-Factor Authentication (MFA)
Users can enable MFA for enhanced security. MFA-enabled users must provide an additional TOTP token during login.

## API Endpoints

### Authentication (`/auth`)

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (MFA not required):**
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DOCTOR"
  }
}
```

**Response (MFA required):**
```json
{
  "requiresMFA": true,
  "temp_token": "temporary_jwt_token",
  "user": { ... }
}
```

#### POST `/auth/register`
Register a new user (admin only).

#### POST `/mfa/setup`
Setup MFA for the current user.

**Response:**
```json
{
  "message": "Scan QR code with authenticator app",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,...",
  "otpauthUrl": "otpauth://totp/HMS:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=HMS"
}
```

#### POST `/mfa/enable`
Enable MFA after setup.

**Request Body:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

#### POST `/mfa/verify`
Verify MFA token during login.

**Request Body:**
```json
{
  "tempToken": "temporary_jwt_token",
  "mfaToken": "123456"
}
```

### Patients (`/patients`)

#### GET `/patients`
Get all patients (paginated).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term

#### POST `/patients`
Create a new patient.

#### GET `/patients/:id`
Get patient by ID.

#### PATCH `/patients/:id`
Update patient information.

#### DELETE `/patients/:id`
Delete patient (admin only).

#### GET `/patients/stats`
Get patient statistics.

### Staff Management (`/staff`)

#### GET `/staff/doctors`
Get all doctors.

#### POST `/staff/doctors`
Create a new doctor.

#### GET `/staff/nurses`
Get all nurses.

#### POST `/staff/nurses`
Create a new nurse.

#### GET `/staff/receptionists`
Get all receptionists.

#### POST `/staff/receptionists`
Create a new receptionist.

#### GET `/staff/lab-technicians`
Get all lab technicians.

#### POST `/staff/lab-technicians`
Create a new lab technician.

#### GET `/staff/pharmacists`
Get all pharmacists.

#### POST `/staff/pharmacists`
Create a new pharmacist.

#### GET `/staff/admins`
Get all admins (superadmin only).

#### POST `/staff/admins`
Create a new admin (superadmin only).

#### GET `/staff/stats`
Get staff statistics.

### Appointments (`/appointments`)

#### GET `/appointments`
Get all appointments.

#### POST `/appointments`
Schedule a new appointment.

#### GET `/appointments/:id`
Get appointment by ID.

#### PATCH `/appointments/:id`
Update appointment.

#### DELETE `/appointments/:id`
Cancel appointment.

### Medical Records (`/medical-records`)

#### GET `/medical-records`
Get medical records.

#### POST `/medical-records`
Create a new medical record.

#### GET `/medical-records/:id`
Get medical record by ID.

#### PATCH `/medical-records/:id`
Update medical record.

### Pharmacy (`/pharmacy`)

#### GET `/pharmacy/medications`
Get all medications.

#### POST `/pharmacy/medications`
Add a new medication.

#### GET `/pharmacy/prescriptions`
Get prescriptions.

#### POST `/pharmacy/prescriptions`
Create a prescription.

### Inventory (`/inventory`)

#### GET `/inventory/medications`
Get all medications in inventory.

**Query Parameters:**
- `page`, `limit`, `search`, `category`, `lowStock`

#### POST `/inventory/medications`
Add medication to inventory.

#### POST `/inventory/medications/:id/stock/add`
Add stock to medication.

#### POST `/inventory/medications/:id/stock/issue`
Issue stock from medication.

#### GET `/inventory/logs`
Get inventory transaction logs.

#### GET `/inventory/reports/low-stock`
Get low stock report.

#### GET `/inventory/reports/expiring-soon`
Get medications expiring soon.

### Laboratory (`/laboratory`)

#### GET `/laboratory/tests`
Get lab tests.

#### POST `/laboratory/tests`
Order a lab test.

#### GET `/laboratory/tests/:id`
Get lab test by ID.

#### PATCH `/laboratory/tests/:id`
Update lab test status.

### Radiology (`/radiology`)

#### GET `/radiology/tests`
Get radiology tests.

#### POST `/radiology/tests`
Order a radiology test.

#### GET `/radiology/tests/:id`
Get radiology test by ID.

#### PATCH `/radiology/tests/:id`
Update radiology test status.

### OPD (Outpatient Department) (`/opd`)

#### GET `/opd/visits`
Get OPD visits.

#### POST `/opd/visits`
Create OPD visit.

#### GET `/opd/visits/:id`
Get OPD visit by ID.

#### PUT `/opd/visits/:id`
Update OPD visit.

#### DELETE `/opd/visits/:id`
Delete OPD visit.

#### GET `/opd/queue`
Get OPD queue.

#### PUT `/opd/visits/:id/status`
Update visit status.

### OT (Operating Theater) (`/ot`)

#### GET `/ot/surgeries`
Get surgeries.

#### POST `/ot/surgeries`
Schedule surgery.

#### GET `/ot/surgeries/:id`
Get surgery by ID.

#### PUT `/ot/surgeries/:id`
Update surgery.

#### DELETE `/ot/surgeries/:id`
Cancel surgery.

#### GET `/ot/schedule/:otId`
Get OT schedule.

#### GET `/ot/available`
Get available OTs.

### Emergency (`/emergency`)

#### GET `/emergency/visits`
Get emergency visits.

#### POST `/emergency/visits`
Create emergency visit.

#### GET `/emergency/visits/:id`
Get emergency visit by ID.

### Billing (`/billing`)

#### GET `/billing/bills`
Get bills.

#### POST `/billing/bills`
Create a bill.

#### GET `/billing/bills/:id`
Get bill by ID.

#### PATCH `/billing/bills/:id`
Update bill.

### Reports (`/reports`)

#### GET `/reports/patients/demographics`
Get patient demographics report.

#### GET `/reports/appointments/summary`
Get appointment summary.

#### GET `/reports/revenue/summary`
Get revenue summary.

#### GET `/reports/laboratory/tests`
Get lab test statistics.

#### GET `/reports/dashboard/summary`
Get dashboard summary data.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Rate Limiting

API endpoints are rate limited:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## Data Encryption

Sensitive data is encrypted at rest using AES-256-GCM encryption.

## Pagination

List endpoints support pagination:

**Response Format:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## File Upload

File upload endpoints accept multipart/form-data:

**Supported formats:**
- Images: JPEG, PNG, GIF (max 10MB)
- Documents: PDF, DOC, DOCX (max 25MB)

## WebSocket Events

Real-time updates are available via WebSocket:

**Connection:**
```
ws://localhost:3001
```

**Events:**
- `appointment:created`
- `appointment:updated`
- `patient:admitted`
- `emergency:alert`

## Health Check

**GET `/health`**
Returns system health status.

## API Documentation

**Swagger UI:** `http://localhost:3001/api-docs`

## Versioning

API is versioned with `/api/v1` prefix. Future versions will use `/api/v2`, etc.

## Support

For API support, contact the development team or refer to the Swagger documentation.