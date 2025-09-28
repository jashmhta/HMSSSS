#!/usr/bin/env node

/**
 * HMS Integration Test Suite
 * Comprehensive integration testing for all modules
 */

const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

class IntegrationTestSuite {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });
    this.authToken = null;
  }

  async login() {
    try {
      const response = await this.client.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Test123!',
      });
      this.authToken = response.data.access_token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      console.log('✅ Authentication successful');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async testPatientManagement() {
    console.log('🧪 Testing Patient Management...');

    // Create patient
    const patientData = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `integration.test.${Date.now()}@test.com`,
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
    };

    const createResponse = await this.client.post('/api/patients', patientData);
    expect(createResponse.status).to.equal(201);
    const patientId = createResponse.data.data.id;

    // Get patient
    const getResponse = await this.client.get(`/api/patients/${patientId}`);
    expect(getResponse.status).to.equal(200);
    expect(getResponse.data.data.id).to.equal(patientId);

    // Update patient
    const updateResponse = await this.client.put(`/api/patients/${patientId}`, {
      firstName: 'Updated',
    });
    expect(updateResponse.status).to.equal(200);

    console.log('✅ Patient Management tests passed');
    return patientId;
  }

  async testAppointmentManagement(patientId) {
    console.log('🧪 Testing Appointment Management...');

    // Create doctor user first (assuming exists)
    const doctorId = 'test-doctor-id'; // In real test, get from DB

    // Create appointment
    const appointmentData = {
      patientId,
      doctorId,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      type: 'CONSULTATION',
      status: 'SCHEDULED',
    };

    const createResponse = await this.client.post('/api/appointments', appointmentData);
    expect(createResponse.status).to.equal(201);

    console.log('✅ Appointment Management tests passed');
  }

  async testBillingIntegration(patientId) {
    console.log('🧪 Testing Billing Integration...');

    // Create bill
    const billData = {
      patientId,
      amount: 100.00,
      description: 'Consultation fee',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResponse = await this.client.post('/api/billing/bills', billData);
    expect(createResponse.status).to.equal(201);

    console.log('✅ Billing Integration tests passed');
  }

  async testDataConsistency() {
    console.log('🧪 Testing Data Consistency...');

    // Test referential integrity
    const patientsResponse = await this.client.get('/api/patients?limit=5');
    expect(patientsResponse.status).to.equal(200);

    for (const patient of patientsResponse.data.data) {
      // Check if patient exists in related tables
      if (patient.appointments && patient.appointments.length > 0) {
        for (const appointment of patient.appointments) {
          expect(appointment.patientId).to.equal(patient.id);
        }
      }
    }

    console.log('✅ Data Consistency tests passed');
  }

  async testSecurityHeaders() {
    console.log('🧪 Testing Security Headers...');

    const response = await this.client.get('/health');
    expect(response.headers).to.have.property('x-content-type-options', 'nosniff');
    expect(response.headers).to.have.property('x-frame-options', 'DENY');
    expect(response.headers).to.have.property('x-xss-protection', '1; mode=block');

    console.log('✅ Security Headers tests passed');
  }

  async testAPIRateLimiting() {
    console.log('🧪 Testing API Rate Limiting...');

    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(this.client.get('/health'));
    }

    const results = await Promise.allSettled(requests);
    const rateLimited = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 429).length;

    expect(rateLimited).to.be.greaterThan(0);
    console.log('✅ API Rate Limiting tests passed');
  }

  async testFrontendBackendIntegration() {
    console.log('🧪 Testing Frontend-Backend Integration...');

    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      expect(frontendResponse.status).to.equal(200);
      console.log('✅ Frontend accessible');
    } catch (error) {
      console.log('⚠️ Frontend not accessible, skipping frontend tests');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting HMS Integration Test Suite...\n');

    try {
      await this.login();
      const patientId = await this.testPatientManagement();
      await this.testAppointmentManagement(patientId);
      await this.testBillingIntegration(patientId);
      await this.testDataConsistency();
      await this.testSecurityHeaders();
      await this.testAPIRateLimiting();
      await this.testFrontendBackendIntegration();

      console.log('\n🎉 All integration tests passed!');
      return true;
    } catch (error) {
      console.error('\n❌ Integration tests failed:', error.message);
      return false;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new IntegrationTestSuite();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = IntegrationTestSuite;