import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestApp, setupTestEnvironment, teardownTestEnvironment, createAuthHelper, TestDataBuilder, TestAssertions, TestSecurity } from '../test-helpers';
import { TestDatabaseManager, setupTestDatabase, teardownTestDatabase } from '../test-database.config';

describe('Authentication Integration Tests', () => {
  let app: TestApp;
  let authHelper: any;
  let testDbManager: TestDatabaseManager;

  beforeAll(async () => {
    await setupTestDatabase();
    testDbManager = new TestDatabaseManager();
    await testDbManager.initialize();

    app = await setupTestEnvironment();
    authHelper = await createAuthHelper(app);
  });

  afterAll(async () => {
    await teardownTestEnvironment(app);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clear database before each test
    await testDbManager.clearDatabase();
    await authHelper.createTestUsers();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      TestAssertions.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'admin@test.com');
      expect(response.body.user).toHaveProperty('role', 'ADMIN');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid email', async () => {
      const response = await app.post('/auth/login', {
        email: 'invalid@example.com',
        password: 'Test123!',
      });

      TestAssertions.expectError(response, 401, 'Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'wrongpassword',
      });

      TestAssertions.expectError(response, 401, 'Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const response = await app.post('/auth/login', {
        password: 'Test123!',
      });

      TestAssertions.expectError(response, 400);
    });

    it('should reject login with missing password', async () => {
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
      });

      TestAssertions.expectError(response, 400);
    });

    it('should reject login with empty credentials', async () => {
      const response = await app.post('/auth/login', {
        email: '',
        password: '',
      });

      TestAssertions.expectError(response, 400);
    });

    it('should handle inactive user login attempt', async () => {
      // Create inactive user
      const inactiveUser = TestDataBuilder.user({
        email: 'inactive@test.com',
        isActive: false,
      });

      await app.post('/api/users', inactiveUser, authHelper.getAuthHeaders('ADMIN'));

      const response = await app.post('/auth/login', {
        email: 'inactive@test.com',
        password: 'Test123!',
      });

      TestAssertions.expectError(response, 401, 'Account is inactive');
    });

    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'wrongpassword',
      };

      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(app.post('/auth/login', loginData));
      }

      const results = await Promise.allSettled(requests);
      const rateLimited = results.filter(r => r.status === 'rejected' && r.reason.response.status === 429).length;

      expect(rateLimited).toBeGreaterThan(0);
    });

    it('should include proper security headers', async () => {
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const newUser = TestDataBuilder.user({
        email: 'newuser@test.com',
        password: 'NewUser123!',
      });

      const response = await app.post('/auth/register', newUser);

      TestAssertions.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'newuser@test.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      const existingUser = TestDataBuilder.user({
        email: 'admin@test.com',
      });

      const response = await app.post('/auth/register', existingUser);

      TestAssertions.expectError(response, 409, 'Email already exists');
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = TestDataBuilder.user({
        email: 'weak@test.com',
        password: 'weak',
      });

      const response = await app.post('/auth/register', weakPasswordUser);

      TestAssertions.expectError(response, 400, 'Password must be at least 8 characters');
    });

    it('should validate email format', async () => {
      const invalidEmailUser = TestDataBuilder.user({
        email: 'invalid-email',
      });

      const response = await app.post('/auth/register', invalidEmailUser);

      TestAssertions.expectError(response, 400, 'Invalid email format');
    });

    it('should require required fields', async () => {
      const incompleteUser = {
        email: 'test@test.com',
      };

      const response = await app.post('/auth/register', incompleteUser);

      TestAssertions.expectError(response, 400);
    });

    it('should sanitize user input', async () => {
      const xssUser = TestDataBuilder.user({
        email: 'xss@test.com',
        firstName: '<script>alert("xss")</script>',
      });

      const response = await app.post('/auth/register', xssUser);

      TestAssertions.expectSuccess(response, 201);
      expect(response.body.user.firstName).not.toContain('<script>');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      const token = loginResponse.body.access_token;

      const response = await app.post('/auth/logout', {}, {
        Authorization: `Bearer ${token}`,
      });

      TestAssertions.expectSuccess(response, 200);

      // Token should be invalidated
      const accessResponse = await app.get('/api/users', {
        Authorization: `Bearer ${token}`,
      });

      TestSecurity.expectAuthenticationRequired(accessResponse);
    });

    it('should reject logout without token', async () => {
      const response = await app.post('/auth/logout');

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject logout with invalid token', async () => {
      const response = await app.post('/auth/logout', {}, {
        Authorization: 'Bearer invalid-token',
      });

      TestSecurity.expectAuthenticationRequired(response);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      const refreshToken = loginResponse.body.refresh_token;

      const response = await app.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      TestAssertions.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).not.toBe(loginResponse.body.access_token);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await app.post('/auth/refresh', {
        refresh_token: 'invalid-token',
      });

      TestAssertions.expectError(response, 401, 'Invalid refresh token');
    });

    it('should reject refresh without token', async () => {
      const response = await app.post('/auth/refresh');

      TestAssertions.expectError(response, 400);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/auth/profile', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'admin@test.com');
      expect(response.body).toHaveProperty('role', 'ADMIN');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject profile access without token', async () => {
      const response = await app.get('/auth/profile');

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject profile access with invalid token', async () => {
      const response = await app.get('/auth/profile', {
        Authorization: 'Bearer invalid-token',
      });

      TestSecurity.expectAuthenticationRequired(response);
    });
  });

  describe('PUT /auth/profile', () => {
    it('should update user profile successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const updateData = {
        firstName: 'Updated',
        lastName: 'Admin',
        phone: '+1234567890',
      };

      const response = await app.put('/auth/profile', updateData, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('Admin');
      expect(response.body.phone).toBe('+1234567890');
    });

    it('should reject profile update without authentication', async () => {
      const updateData = {
        firstName: 'Updated',
      };

      const response = await app.put('/auth/profile', updateData);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should prevent updating sensitive fields', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const updateData = {
        role: 'DOCTOR',
        isActive: false,
      };

      const response = await app.put('/auth/profile', updateData, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body.role).toBe('ADMIN'); // Should not change
      expect(response.body.isActive).toBe(true); // Should not change
    });

    it('should validate profile data', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const invalidData = {
        phone: 'invalid-phone',
        email: 'invalid-email',
      };

      const response = await app.put('/auth/profile', invalidData, authHeaders);

      TestAssertions.expectError(response, 400);
    });
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const passwordData = {
        currentPassword: 'Test123!',
        newPassword: 'NewPassword123!',
      };

      const response = await app.post('/auth/change-password', passwordData, authHeaders);

      TestAssertions.expectSuccess(response, 200);

      // Should be able to login with new password
      const loginResponse = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'NewPassword123!',
      });

      TestAssertions.expectSuccess(loginResponse, 200);
    });

    it('should reject password change with wrong current password', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123!',
      };

      const response = await app.post('/auth/change-password', passwordData, authHeaders);

      TestAssertions.expectError(response, 401, 'Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const passwordData = {
        currentPassword: 'Test123!',
        newPassword: 'weak',
      };

      const response = await app.post('/auth/change-password', passwordData, authHeaders);

      TestAssertions.expectError(response, 400, 'New password must be at least 8 characters');
    });

    it('should reject password change without authentication', async () => {
      const passwordData = {
        currentPassword: 'Test123!',
        newPassword: 'NewPassword123!',
      };

      const response = await app.post('/auth/change-password', passwordData);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should prevent password reuse', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const passwordData = {
        currentPassword: 'Test123!',
        newPassword: 'Test123!', // Same as current
      };

      const response = await app.post('/auth/change-password', passwordData, authHeaders);

      TestAssertions.expectError(response, 400, 'New password must be different from current password');
    });
  });

  describe('Password Recovery', () => {
    describe('POST /auth/forgot-password', () => {
      it('should send password reset email for valid email', async () => {
        const response = await app.post('/auth/forgot-password', {
          email: 'admin@test.com',
        });

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('message', 'Password reset email sent');
      });

      it('should not reveal if email exists or not', async () => {
        const response = await app.post('/auth/forgot-password', {
          email: 'nonexistent@test.com',
        });

        // Should return same response as for valid email for security
        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('message', 'Password reset email sent');
      });

      it('should validate email format', async () => {
        const response = await app.post('/auth/forgot-password', {
          email: 'invalid-email',
        });

        TestAssertions.expectError(response, 400, 'Invalid email format');
      });

      it('should require email field', async () => {
        const response = await app.post('/auth/forgot-password', {});

        TestAssertions.expectError(response, 400, 'Email is required');
      });
    });

    describe('POST /auth/reset-password', () => {
      it('should reset password with valid token', async () => {
        // First request reset token
        await app.post('/auth/forgot-password', {
          email: 'admin@test.com',
        });

        // Note: In a real test, you would need to extract the token from the email
        // For this test, we'll assume we have a valid token
        const resetToken = 'valid-reset-token';

        const response = await app.post('/auth/reset-password', {
          token: resetToken,
          newPassword: 'ResetPassword123!',
        });

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('message', 'Password reset successful');
      });

      it('should reject reset with invalid token', async () => {
        const response = await app.post('/auth/reset-password', {
          token: 'invalid-token',
          newPassword: 'ResetPassword123!',
        });

        TestAssertions.expectError(response, 401, 'Invalid or expired reset token');
      });

      it('should validate new password strength', async () => {
        const response = await app.post('/auth/reset-password', {
          token: 'valid-token',
          newPassword: 'weak',
        });

        TestAssertions.expectError(response, 400, 'New password must be at least 8 characters');
      });

      it('should require token and new password', async () => {
        const response = await app.post('/auth/reset-password', {});

        TestAssertions.expectError(response, 400);
      });
    });
  });

  describe('Multi-factor Authentication', () => {
    describe('POST /auth/2fa/enable', () => {
      it('should enable 2FA successfully', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.post('/auth/2fa/enable', {}, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('qrCode');
        expect(response.body).toHaveProperty('secret');
      });

      it('should reject 2FA enable without authentication', async () => {
        const response = await app.post('/auth/2fa/enable');

        TestSecurity.expectAuthenticationRequired(response);
      });
    });

    describe('POST /auth/2fa/verify', () => {
      it('should verify 2FA setup successfully', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        // First enable 2FA
        const enableResponse = await app.post('/auth/2fa/enable', {}, authHeaders);
        const secret = enableResponse.body.secret;

        // Generate test token (in real app, this would come from authenticator app)
        const testToken = '123456'; // Mock token

        const response = await app.post('/auth/2fa/verify', {
          token: testToken,
          secret: secret,
        }, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('backupCodes');
        expect(Array.isArray(response.body.backupCodes)).toBe(true);
      });

      it('should reject invalid 2FA token', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.post('/auth/2fa/verify', {
          token: 'invalid-token',
          secret: 'test-secret',
        }, authHeaders);

        TestAssertions.expectError(response, 401, 'Invalid 2FA token');
      });
    });

    describe('POST /auth/2fa/login', () => {
      it('should login with 2FA successfully', async () => {
        // First login with username/password
        const loginResponse = await app.post('/auth/login', {
          email: 'admin@test.com',
          password: 'Test123!',
        });

        expect(loginResponse.body).toHaveProperty('requires2FA', true);

        // Then verify 2FA token
        const response = await app.post('/auth/2fa/login', {
          token: '123456',
          tempToken: loginResponse.body.tempToken,
        });

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('access_token');
      });

      it('should reject invalid 2FA token', async () => {
        const response = await app.post('/auth/2fa/login', {
          token: 'invalid-token',
          tempToken: 'invalid-temp-token',
        });

        TestAssertions.expectError(response, 401, 'Invalid 2FA token');
      });
    });
  });

  describe('Session Management', () => {
    describe('GET /auth/sessions', () => {
      it('should list user sessions', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.get('/auth/sessions', authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(Array.isArray(response.body.sessions)).toBe(true);
        expect(response.body.sessions.length).toBeGreaterThan(0);
      });

      it('should reject session listing without authentication', async () => {
        const response = await app.get('/auth/sessions');

        TestSecurity.expectAuthenticationRequired(response);
      });
    });

    describe('DELETE /auth/sessions/:id', () => {
      it('should revoke specific session', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        // Get sessions first
        const sessionsResponse = await app.get('/auth/sessions', authHeaders);
        const sessionId = sessionsResponse.body.sessions[0].id;

        const response = await app.delete(`/auth/sessions/${sessionId}`, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('message', 'Session revoked successfully');
      });

      it('should reject session revocation without authentication', async () => {
        const response = await app.delete('/auth/sessions/session-id');

        TestSecurity.expectAuthenticationRequired(response);
      });
    });

    describe('DELETE /auth/sessions', () => {
      it('should revoke all sessions except current', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.delete('/auth/sessions', authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('message', 'All other sessions revoked successfully');
      });

      it('should reject mass session revocation without authentication', async () => {
        const response = await app.delete('/auth/sessions');

        TestSecurity.expectAuthenticationRequired(response);
      });
    });
  });

  describe('Security Headers and Rate Limiting', () => {
    it('should include security headers in all auth responses', async () => {
      const response = await app.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should enforce rate limiting on sensitive endpoints', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(app.post('/auth/forgot-password', {
          email: 'test@test.com',
        }));
      }

      const results = await Promise.allSettled(requests);
      const rateLimited = results.filter(r => r.status === 'rejected' && r.reason.response.status === 429).length;

      expect(rateLimited).toBeGreaterThan(0);
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await app.post('/auth/login', {
        email: 'nonexistent@test.com',
        password: 'testpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });
});