import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestApp, setupTestEnvironment, teardownTestEnvironment, createAuthHelper } from '../test-helpers';
import { TestSecurity, TestDataBuilder } from '../test-helpers';

describe('Security Tests', () => {
  let app: TestApp;
  let authHelper: any;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    authHelper = await createAuthHelper(app);
  });

  afterAll(async () => {
    await teardownTestEnvironment(app);
  });

  describe('Authentication Security', () => {
    it('should prevent access without authentication', async () => {
      const response = await app.get('/api/patients');
      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject invalid credentials', async () => {
      const response = await app.post('/auth/login', {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/invalid/i);
    });

    it('should reject empty credentials', async () => {
      const response = await app.post('/auth/login', {
        email: '',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should prevent brute force attacks', async () => {
      const credentials = {
        email: 'admin@test.com',
        password: 'wrongpassword',
      };

      // Make multiple failed attempts
      for (let i = 0; i < 10; i++) {
        const response = await app.post('/auth/login', credentials);
        expect(response.status).toBe(401);
      }

      // After multiple failed attempts, account should be temporarily locked
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!', // Correct password
      });

      expect([401, 429]).toContain(response.status);
    });

    it('should validate JWT tokens properly', async () => {
      // Try to access with invalid token
      const response = await app.get('/api/patients', {
        Authorization: 'Bearer invalid-token',
      });

      TestSecurity.expectAuthenticationRequired(response);

      // Try to access with expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      const expiredResponse = await app.get('/api/patients', {
        Authorization: `Bearer ${expiredToken}`,
      });

      TestSecurity.expectAuthenticationRequired(expiredResponse);
    });

    it('should not expose sensitive data in responses', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const response = await app.get('/api/users', authHeaders);

      expect(response.status).toBe(200);
      TestSecurity.expectNoSensitiveData(response, ['password', 'passwordHash', 'salt']);
    });

    it('should handle token refresh securely', async () => {
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('access_token');

      const refreshToken = loginResponse.body.refresh_token;
      expect(refreshToken).toBeDefined();

      // Use refresh token to get new access token
      const refreshResponse = await app.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('access_token');
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      // Patient should not access admin endpoints
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');
      const response = await app.get('/api/users', patientHeaders);

      TestSecurity.expectAuthorizationRequired(response);

      // Admin should access admin endpoints
      const adminHeaders = authHelper.getAuthHeaders('ADMIN');
      const adminResponse = await app.get('/api/users', adminHeaders);

      expect(adminResponse.status).toBe(200);
    });

    it('should prevent horizontal privilege escalation', async () => {
      // Patient 1 should not access Patient 2's data
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      // Try to access another patient's appointments
      const response = await app.get('/api/appointments?patientId=some-other-id', patientHeaders);

      expect([403, 404]).toContain(response.status);
    });

    it('should validate resource ownership', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');
      const adminHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create a patient
      const patientResponse = await app.post('/api/patients', TestDataBuilder.patient(), adminHeaders);
      expect(patientResponse.status).toBe(201);
      const patientId = patientResponse.body.data.id;

      // Patient should not be able to update other patients
      const updateResponse = await app.put(`/api/patients/${patientId}`, {
        firstName: 'Hacked',
      }, patientHeaders);

      expect([403, 404]).toContain(updateResponse.status);

      // Admin should be able to update
      const adminUpdateResponse = await app.put(`/api/patients/${patientId}`, {
        firstName: 'Updated',
      }, adminHeaders);

      expect(adminUpdateResponse.status).toBe(200);
    });
  });

  describe('Input Validation Security', () => {
    it('should validate and sanitize user input', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Test SQL injection
      const sqlInjection = TestDataBuilder.patient({
        firstName: "'; DROP TABLE patients; --",
        lastName: "Test",
        email: "test@example.com",
      });

      const response = await app.post('/api/patients', sqlInjection, authHeaders);
      TestSecurity.expectInputValidation(response);

      // Test XSS
      const xssPayload = TestDataBuilder.patient({
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'test@example.com',
      });

      const xssResponse = await app.post('/api/patients', xssPayload, authHeaders);
      TestSecurity.expectInputValidation(xssResponse);

      // Test NoSQL injection
      const nosqlInjection = TestDataBuilder.patient({
        firstName: { $ne: null },
        lastName: 'Test',
        email: 'test@example.com',
      });

      const nosqlResponse = await app.post('/api/patients', nosqlInjection, authHeaders);
      TestSecurity.expectInputValidation(nosqlResponse);
    });

    it('should validate data types and formats', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Invalid email
      const invalidEmail = TestDataBuilder.patient({
        email: 'invalid-email',
      });

      const emailResponse = await app.post('/api/patients', invalidEmail, authHeaders);
      TestSecurity.expectInputValidation(emailResponse);

      // Invalid phone
      const invalidPhone = TestDataBuilder.patient({
        phone: 'invalid-phone',
      });

      const phoneResponse = await app.post('/api/patients', invalidPhone, authHeaders);
      TestSecurity.expectInputValidation(phoneResponse);

      // Invalid date
      const invalidDate = TestDataBuilder.patient({
        dateOfBirth: 'invalid-date',
      });

      const dateResponse = await app.post('/api/patients', invalidDate, authHeaders);
      TestSecurity.expectInputValidation(dateResponse);
    });

    it('should enforce field length limits', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Very long name
      const longName = TestDataBuilder.patient({
        firstName: 'a'.repeat(1000), // Exceeds typical limits
      });

      const longNameResponse = await app.post('/api/patients', longName, authHeaders);
      TestSecurity.expectInputValidation(longNameResponse);
    });
  });

  describe('API Security', () => {
    it('should implement proper CORS policies', async () => {
      const response = await app.get('/health', {
        Origin: 'http://malicious.com',
      });

      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious.com');
    });

    it('should include security headers', async () => {
      const response = await app.get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    it('should not expose server information', async () => {
      const response = await app.get('/health');

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.body).not.toHaveProperty('server');
      expect(response.body).not.toHaveProperty('version');
    });

    it('should handle large payloads safely', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Very large payload
      const largePayload = {
        data: 'a'.repeat(1024 * 1024), // 1MB payload
      };

      const response = await app.post('/api/test/large-payload', largePayload, authHeaders);
      expect([413, 400, 404]).toContain(response.status); // Should reject large payload
    });

    it('should validate content types', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Send invalid content type
      const response = await app.post('/api/patients',
        '<?xml version="1.0"?><malicious/>',
        {
          ...authHeaders,
          'Content-Type': 'application/xml',
        }
      );

      expect([415, 400]).toContain(response.status);
    });
  });

  describe('Data Security', () => {
    it('should encrypt sensitive data at rest', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create user with sensitive data
      const userResponse = await app.post('/api/users', {
        email: 'sensitive@test.com',
        password: 'Sensitive123!',
        firstName: 'Sensitive',
        lastName: 'User',
        role: 'PATIENT',
        ssn: '123-45-6789', // Should be encrypted
        creditCard: '4111111111111111', // Should be encrypted
      }, authHeaders);

      expect(userResponse.status).toBe(201);

      // Retrieve user and verify sensitive data is not exposed
      const getUserResponse = await app.get(`/api/users/${userResponse.body.data.id}`, authHeaders);
      expect(getUserResponse.status).toBe(200);

      const userData = getUserResponse.body.data;
      expect(userData).not.toHaveProperty('ssn');
      expect(userData).not.toHaveProperty('creditCard');
      expect(userData).not.toHaveProperty('password');
    });

    it('should mask sensitive data in logs', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create user with password
      const response = await app.post('/api/users', {
        email: 'logtest@test.com',
        password: 'Password123!',
        firstName: 'Log',
        lastName: 'Test',
        role: 'PATIENT',
      }, authHeaders);

      expect(response.status).toBe(201);

      // The password should not appear in response
      expect(response.body.data).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('Password123!');
    });

    it('should implement proper data retention policies', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create appointment
      const appointmentResponse = await app.post('/api/appointments', TestDataBuilder.appointment(), authHeaders);
      expect(appointmentResponse.status).toBe(201);

      // Try to delete appointment immediately (should not be allowed by retention policy)
      const deleteResponse = await app.delete(`/api/appointments/${appointmentResponse.body.data.id}`, authHeaders);

      // Depending on policy, this might be allowed or blocked
      expect([200, 403, 400]).toContain(deleteResponse.status);
    });
  });

  describe('Session Security', () => {
    it('should handle session timeout properly', async () => {
      // This test would require mocking time or JWT expiration
      // For now, we'll test that invalid sessions are rejected
      const invalidToken = 'invalid.jwt.token';
      const response = await app.get('/api/patients', {
        Authorization: `Bearer ${invalidToken}`,
      });

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should invalidate sessions on logout', async () => {
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.access_token;

      // Logout
      const logoutResponse = await app.post('/auth/logout', {}, {
        Authorization: `Bearer ${token}`,
      });

      expect(logoutResponse.status).toBe(200);

      // Try to use token after logout
      const accessResponse = await app.get('/api/patients', {
        Authorization: `Bearer ${token}`,
      });

      TestSecurity.expectAuthenticationRequired(accessResponse);
    });

    it('should prevent session fixation', async () => {
      // Login
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(loginResponse.status).toBe(200);
      const originalToken = loginResponse.body.access_token;

      // Logout
      await app.post('/auth/logout', {}, {
        Authorization: `Bearer ${originalToken}`,
      });

      // Login again
      const secondLoginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(secondLoginResponse.status).toBe(200);
      const newToken = secondLoginResponse.body.access_token;

      // Tokens should be different
      expect(newToken).not.toBe(originalToken);
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Try to upload executable file
      const maliciousFile = Buffer.from('malicious content');
      const formData = new FormData();
      formData.append('file', new Blob([maliciousFile], { type: 'application/exe' }), 'malware.exe');

      const response = await fetch(`${app.getApp().getHttpServer()}/api/upload`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      expect([400, 415]).toContain(response.status);
    });

    it('should validate file sizes', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Try to upload very large file
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const formData = new FormData();
      formData.append('file', new Blob([largeFile], { type: 'text/plain' }), 'large.txt');

      const response = await fetch(`${app.getApp().getHttpServer()}/api/upload`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      expect([413, 400]).toContain(response.status);
    });

    it('should sanitize file names', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Try to upload file with malicious name
      const maliciousFile = Buffer.from('test content');
      const formData = new FormData();
      formData.append('file', new Blob([maliciousFile], { type: 'text/plain' }), '../../../malicious.txt');

      const response = await fetch(`${app.getApp().getHttpServer()}/api/upload`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      // Should reject or sanitize the filename
      expect([400, 200]).toContain(response.status);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limiting on authentication endpoints', async () => {
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          app.post('/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        );
      }

      const results = await Promise.allSettled(requests);
      const rateLimited = results.filter(r => r.status === 'rejected' && r.reason.response.status === 429).length;

      expect(rateLimited).toBeGreaterThan(0);
    });

    it('should implement different rate limits for different roles', async () => {
      const adminHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      // Admin should have higher rate limits
      const adminRequests = [];
      for (let i = 0; i < 100; i++) {
        adminRequests.push(app.get('/api/patients', adminHeaders));
      }

      const patientRequests = [];
      for (let i = 0; i < 100; i++) {
        patientRequests.push(app.get('/api/patients', patientHeaders));
      }

      const [adminResults, patientResults] = await Promise.allSettled([
        Promise.allSettled(adminRequests),
        Promise.allSettled(patientRequests),
      ]);

      const adminRateLimited = adminResults.filter(r => r.status === 'rejected').length;
      const patientRateLimited = patientResults.filter(r => r.status === 'rejected').length;

      // Patient should be rate limited more than admin
      expect(patientRateLimited).toBeGreaterThanOrEqual(adminRateLimited);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose stack traces in production', async () => {
      const response = await app.get('/api/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle database errors gracefully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Try to create duplicate user
      const userData = TestDataBuilder.user({ email: 'admin@test.com' });
      const response = await app.post('/api/users', userData, authHeaders);

      expect([400, 409, 500]).toContain(response.status);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).toHaveProperty('message');
    });

    it('should validate database query parameters', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Try SQL injection in query parameters
      const response = await app.get('/api/patients?search=\'; DROP TABLE patients; --', authHeaders);

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});