# 🔌 REST API Reference

The HMS REST API provides comprehensive endpoints for managing healthcare operations. All endpoints require authentication except for authentication-related routes.

## 🌐 Base URL
```
https://api.hms-system.com/v1
```

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "doctor@hospital.com",
    "role": "DOCTOR",
    "permissions": ["read:patients", "write:prescriptions"]
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

## 👥 Patients

### Get All Patients
```http
GET /patients
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Patient status (active, inactive, discharged)

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1980-01-15",
      "gender": "MALE",
      "phone": "+1234567890",
      "email": "john.doe@email.com",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345"
      },
      "emergencyContact": {
        "name": "Jane Doe",
        "relationship": "Spouse",
        "phone": "+1234567891"
      },
      "insurance": {
        "provider": "Blue Cross",
        "policyNumber": "BC123456",
        "groupNumber": "GRP789"
      },
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Create Patient
```http
POST /patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-15",
  "gender": "MALE",
  "phone": "+1234567890",
  "email": "john.doe@email.com",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1234567891"
  },
  "insurance": {
    "provider": "Blue Cross",
    "policyNumber": "BC123456",
    "groupNumber": "GRP789"
  }
}
```

### Get Patient by ID
```http
GET /patients/{id}
Authorization: Bearer <access_token>
```

### Update Patient
```http
PUT /patients/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+1987654321",
  "address": {
    "street": "456 Oak Ave",
    "city": "Newtown",
    "state": "NY",
    "zipCode": "67890"
  }
}
```

### Delete Patient
```http
DELETE /patients/{id}
Authorization: Bearer <access_token>
```

## 📅 Appointments

### Get Appointments
```http
GET /appointments
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `date`: Filter by date (YYYY-MM-DD)
- `status`: Filter by status (scheduled, completed, cancelled)

### Create Appointment
```http
POST /appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "123",
  "doctorId": "456",
  "appointmentDate": "2024-02-15T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Follow-up visit for hypertension",
  "reason": "Blood pressure check"
}
```

### Update Appointment
```http
PUT /appointments/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "COMPLETED",
  "notes": "Patient showed improvement. Prescribed new medication."
}
```

## 🏥 Medical Records

### Get Patient Medical Records
```http
GET /patients/{patientId}/medical-records
Authorization: Bearer <access_token>
```

### Create Medical Record
```http
POST /patients/{patientId}/medical-records
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "CONSULTATION",
  "date": "2024-01-20T10:00:00Z",
  "provider": "Dr. Smith",
  "diagnosis": [
    {
      "code": "I10",
      "description": "Essential hypertension"
    }
  ],
  "symptoms": "Headache, dizziness",
  "treatment": "Prescribed lisinopril 10mg daily",
  "notes": "Patient to return in 2 weeks for follow-up",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 180,
    "height": 70
  }
}
```

## 🧪 Laboratory

### Get Lab Tests
```http
GET /lab/tests
Authorization: Bearer <access_token>
```

### Order Lab Test
```http
POST /lab/tests
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "123",
  "testType": "CBC",
  "priority": "ROUTINE",
  "instructions": "Fasting required",
  "orderedBy": "Dr. Smith"
}
```

### Get Lab Results
```http
GET /lab/results/{testId}
Authorization: Bearer <access_token>
```

## 🏥 Pharmacy

### Get Medications
```http
GET /pharmacy/medications
Authorization: Bearer <access_token>
```

### Create Prescription
```http
POST /pharmacy/prescriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "123",
  "medicationId": "456",
  "dosage": "10mg",
  "frequency": "Once daily",
  "duration": 30,
  "instructions": "Take with food",
  "prescribedBy": "Dr. Smith"
}
```

## 💰 Billing

### Get Patient Bills
```http
GET /billing/patients/{patientId}/bills
Authorization: Bearer <access_token>
```

### Create Bill
```http
POST /billing/bills
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "123",
  "items": [
    {
      "description": "Office Visit",
      "quantity": 1,
      "unitPrice": 150.00,
      "total": 150.00
    },
    {
      "description": "Blood Test",
      "quantity": 1,
      "unitPrice": 75.00,
      "total": 75.00
    }
  ],
  "subtotal": 225.00,
  "tax": 22.50,
  "total": 247.50,
  "dueDate": "2024-02-15"
}
```

## 📊 Reports

### Get System Reports
```http
GET /reports/{reportType}
Authorization: Bearer <access_token>
```

**Report Types:**
- `patient-stats`: Patient statistics
- `appointment-stats`: Appointment analytics
- `revenue-report`: Financial reports
- `inventory-report`: Inventory status

## ⚠️ Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  }
}
```

## 📋 HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

## 🔄 Rate Limiting

API requests are rate limited:
- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

## 📖 Additional Resources

- [Swagger Documentation](https://api.hms-system.com/api-docs)
- [Postman Collection](https://github.com/jashmhta/HMSSSS/releases)
- [API Changelog](https://github.com/jashmhta/HMSSSS/blob/main/CHANGELOG.md)