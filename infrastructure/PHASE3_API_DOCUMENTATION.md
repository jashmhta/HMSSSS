# Ultimate HMS - Phase 3 API Documentation

## Overview
The Ultimate Hospital Management System provides comprehensive REST and GraphQL APIs for healthcare operations, supporting multi-tenant architecture with advanced security and compliance features.

## Authentication

### JWT Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "username": "doctor@example.com",
  "password": "password",
  "tenantId": "hospital-a"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tenantId": "hospital-a",
  "user": {
    "id": "123",
    "roles": ["DOCTOR"],
    "permissions": ["READ_PATIENT", "WRITE_PRESCRIPTION"]
  }
}
```

### OIDC/OAuth2 (Phase 3)
```http
GET /auth/oidc/login?provider=keycloak&tenant=hospital-a
```

## FHIR Server API

### Base URL
`https://fhir.hms.local/fhir`

### Patient Operations

#### Create Patient
```http
POST /Patient
Authorization: Bearer {token}
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "identifier": [{
    "system": "urn:oid:1.2.36.146.595.217.0.1",
    "value": "12345"
  }],
  "name": [{
    "family": "Smith",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1980-01-01"
}
```

#### Search Patients
```http
GET /Patient?family=Smith&given=John
Authorization: Bearer {token}
```

### Encounter Operations

#### Create Encounter
```http
POST /Encounter
Authorization: Bearer {token}
Content-Type: application/fhir+json

{
  "resourceType": "Encounter",
  "status": "in-progress",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "IMP"
  },
  "subject": {
    "reference": "Patient/123"
  },
  "participant": [{
    "individual": {
      "reference": "Practitioner/456"
    }
  }]
}
```

## GraphQL API

### Base URL
`https://api.hms.local/graphql`

### Patient Query
```graphql
query GetPatient($id: ID!) {
  patient(id: $id) {
    id
    name {
      first
      last
    }
    dateOfBirth
    gender
    contacts {
      type
      value
    }
    medicalRecords {
      id
      type
      date
      provider {
        name
      }
      diagnosis {
        code
        description
      }
      medications {
        name
        dosage
        frequency
      }
    }
    appointments {
      id
      date
      provider {
        name
        specialty
      }
      status
    }
  }
}
```

### Create Appointment Mutation
```graphql
mutation CreateAppointment($input: AppointmentInput!) {
  createAppointment(input: $input) {
    id
    date
    duration
    patient {
      name {
        first
        last
      }
    }
    provider {
      name
      specialty
    }
    status
    notes
  }
}
```

**Variables:**
```json
{
  "input": {
    "patientId": "123",
    "providerId": "456",
    "date": "2025-09-25T10:00:00Z",
    "duration": 30,
    "type": "CONSULTATION",
    "notes": "Follow-up visit"
  }
}
```

## OpenMRS REST API

### Base URL
`https://openmrs.hms.local/openmrs/ws/rest/v1`

### Authentication
```http
GET /session
Authorization: Basic {base64(username:password)}
```

### Patient Management

#### Get Patient
```http
GET /patient/{uuid}
Authorization: Bearer {token}
```

#### Create Patient
```http
POST /patient
Authorization: Bearer {token}
Content-Type: application/json

{
  "person": {
    "names": [{
      "givenName": "John",
      "familyName": "Doe"
    }],
    "gender": "M",
    "birthdate": "1990-01-01",
    "addresses": [{
      "address1": "123 Main St",
      "cityVillage": "Anytown",
      "country": "US"
    }]
  },
  "identifiers": [{
    "identifier": "123456",
    "identifierType": "05a29f94-c0ed-11e2-94be-8c13b969e334",
    "location": "c1e42932-3f10-11e4-adec-0800271c1b75",
    "preferred": true
  }]
}
```

### Encounter Management

#### Create Encounter
```http
POST /encounter
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient": "patient-uuid",
  "encounterType": "encounter-type-uuid",
  "encounterDatetime": "2025-09-21T10:00:00.000+0000",
  "location": "location-uuid",
  "obs": [{
    "concept": "concept-uuid",
    "value": "observation value"
  }]
}
```

## DICOM Operations

### PACS Connection
- **AE Title**: ULTIMATEHMS
- **Host**: dicom.hms.local
- **Port**: 11112

### Web Interface
`https://dicom.hms.local/`

### REST API
```http
GET /instances
Authorization: Basic {username:password}
```

## Metasfresh ERP API

### Base URL
`https://erp.hms.local/api/v1`

### Product Management
```http
GET /products
Authorization: Bearer {token}
```

### Inventory Operations
```http
POST /inventory/adjustment
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "123",
  "quantity": 50,
  "reason": "Stock receipt",
  "warehouseId": "456"
}
```

## Mobile API Endpoints (Phase 3)

### Patient App APIs

#### Get Appointments
```http
GET /mobile/patient/appointments
Authorization: Bearer {token}
```

#### Book Appointment
```http
POST /mobile/patient/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "providerId": "123",
  "date": "2025-09-25T10:00:00Z",
  "type": "CONSULTATION"
}
```

### Doctor App APIs

#### Get Today's Schedule
```http
GET /mobile/doctor/schedule?date=2025-09-21
Authorization: Bearer {token}
```

#### Update Patient Record
```http
PUT /mobile/doctor/patients/{id}/record
Authorization: Bearer {token}
Content-Type: application/json

{
  "diagnosis": "Hypertension",
  "prescription": "Lisinopril 10mg daily",
  "notes": "Patient reports improved symptoms"
}
```

## Webhook Endpoints

### Real-time Notifications
```http
POST /webhooks/appointment/created
Content-Type: application/json
X-Webhook-Signature: {signature}

{
  "event": "appointment.created",
  "tenantId": "hospital-a",
  "data": {
    "appointmentId": "123",
    "patientId": "456",
    "providerId": "789",
    "date": "2025-09-25T10:00:00Z"
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-09-21T10:00:00Z",
  "requestId": "req-12345"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

### Limits
- **Authenticated requests**: 1000/hour per user
- **Anonymous requests**: 100/hour per IP
- **Burst limit**: 50 requests per minute

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1632230400
```

## Pagination

### Standard Pagination
```http
GET /patients?page=1&size=20&sort=name,asc
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Versioning

### API Versioning
- **Header**: `Accept: application/vnd.hms.v1+json`
- **URL**: `/v1/patients`
- **Query**: `/patients?version=1`

## SDKs and Libraries

### JavaScript SDK
```javascript
import { HMSClient } from '@ultimate-hms/sdk';

const client = new HMSClient({
  baseURL: 'https://api.hms.local',
  tenantId: 'hospital-a'
});

await client.auth.login('user@example.com', 'password');
const patients = await client.patients.list();
```

### Mobile SDKs
- **React Native**: `@ultimate-hms/react-native-sdk`
- **Flutter**: `ultimate_hms_flutter`
- **iOS**: `UltimateHMSSDK`
- **Android**: `com.ultimate.hms.sdk`

## Testing

### Sandbox Environment
- **Base URL**: `https://sandbox.api.hms.local`
- **Data**: Automatically reset daily
- **Rate Limits**: No restrictions

### Test Data
```http
POST /test-data/generate
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "patients": 100,
  "providers": 20,
  "appointments": 500
}
```

---

**API Version**: 3.0
**Last Updated**: September 21, 2025
**Specification**: OpenAPI 3.0, GraphQL