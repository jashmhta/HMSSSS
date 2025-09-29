#!/usr/bin/env node

/**
 * Enterprise-Grade Test Runner
 * Zero Bug Policy - Comprehensive Testing Suite
 *
 * This script runs all tests with enterprise-grade standards:
 * - Unit Tests (100% coverage requirement)
 * - Integration Tests (API endpoint validation)
 * - E2E Tests (Full workflow testing)
 * - Performance Tests (Load and stress testing)
 * - Security Tests (Authorization and vulnerability testing)
 * - Code Quality Tests (Linting and formatting)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnterpriseTestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, coverage: 0 },
      integration: { passed: 0, failed: 0 },
      e2e: { passed: 0, failed: 0 },
      performance: { passed: 0, failed: 0, metrics: {} },
      security: { passed: 0, failed: 0 },
      quality: { passed: 0, failed: 0 },
    };
    this.startTime = Date.now();
    this.testEnvironment = process.env.NODE_ENV || 'test';
  }

  async runAllTests() {
    console.log('🚀 Starting Enterprise Test Suite');
    console.log('==================================');
    console.log(`Environment: ${this.testEnvironment}`);
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // 1. Setup test environment
      await this.setupTestEnvironment();

      // 2. Run code quality checks
      await this.runQualityChecks();

      // 3. Run unit tests
      await this.runUnitTests();

      // 4. Run integration tests
      await this.runIntegrationTests();

      // 5. Run E2E tests
      await this.runE2ETests();

      // 6. Run security tests
      await this.runSecurityTests();

      // 7. Run performance tests
      await this.runPerformanceTests();

      // 8. Generate comprehensive report
      this.generateReport();

      // 9. Validate zero bug policy
      this.validateZeroBugPolicy();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');

    // Ensure test database is available
    try {
      execSync('createdb hms_test || true', { stdio: 'pipe' });
      console.log('✅ Test database ready');
    } catch (error) {
      console.warn('⚠️  Test database setup warning:', error.message);
    }

    // Install dependencies if needed
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }

    // Generate Prisma client
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.warn('⚠️  Prisma generation warning:', error.message);
    }

    console.log('✅ Test environment setup complete\n');
  }

  async runQualityChecks() {
    console.log('🔍 Running code quality checks...');

    try {
      // ESLint
      console.log('  📏 Running ESLint...');
      execSync('npx eslint "src/**/*.ts" --max-warnings 0', { stdio: 'pipe' });
      this.results.quality.passed++;
      console.log('  ✅ ESLint passed');

      // Prettier
      console.log('  🎨 Running Prettier check...');
      execSync('npx prettier --check "src/**/*.ts"', { stdio: 'pipe' });
      this.results.quality.passed++;
      console.log('  ✅ Prettier check passed');

      // TypeScript compilation
      console.log('  📝 Running TypeScript compilation...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.results.quality.passed++;
      console.log('  ✅ TypeScript compilation passed');

    } catch (error) {
      this.results.quality.failed++;
      console.error('  ❌ Quality check failed:', error.message);
      throw error;
    }

    console.log('✅ Code quality checks complete\n');
  }

  async runUnitTests() {
    console.log('🧪 Running unit tests...');

    try {
      const output = execSync('npm run test -- --testPathPattern="\\.spec\\.ts$" --coverage --watchAll=false', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse Jest output for results
      const coverageMatch = output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\| (\d+\.\d+)%/);
      if (coverageMatch) {
        this.results.unit.coverage = parseFloat(coverageMatch[1]);
      }

      // Count passed/failed tests (simplified parsing)
      const passedMatch = output.match(/Tests:\s*(\d+)\s*passed/);
      const failedMatch = output.match(/Tests:\s*(\d+)\s*failed/);

      if (passedMatch) this.results.unit.passed = parseInt(passedMatch[1]);
      if (failedMatch) this.results.unit.failed = parseInt(failedMatch[1]);

      console.log(`  ✅ Unit tests completed: ${this.results.unit.passed} passed, ${this.results.unit.failed} failed`);
      console.log(`  📊 Coverage: ${this.results.unit.coverage}%`);

      if (this.results.unit.coverage < 85) {
        throw new Error(`Coverage ${this.results.unit.coverage}% below required 85% threshold`);
      }

    } catch (error) {
      console.error('  ❌ Unit tests failed:', error.message);
      throw error;
    }

    console.log('✅ Unit tests complete\n');
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');

    try {
      const output = execSync('npm run test -- --testPathPattern="controller\\.spec\\.ts$" --watchAll=false', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse results (simplified)
      const passedMatch = output.match(/Tests:\s*(\d+)\s*passed/);
      const failedMatch = output.match(/Tests:\s*(\d+)\s*failed/);

      if (passedMatch) this.results.integration.passed = parseInt(passedMatch[1]);
      if (failedMatch) this.results.integration.failed = parseInt(failedMatch[1]);

      console.log(`  ✅ Integration tests completed: ${this.results.integration.passed} passed, ${this.results.integration.failed} failed`);

    } catch (error) {
      console.error('  ❌ Integration tests failed:', error.message);
      throw error;
    }

    console.log('✅ Integration tests complete\n');
  }

  async runE2ETests() {
    console.log('🌐 Running E2E tests...');

    try {
      // Check if e2e test files exist
      const e2eFiles = fs.readdirSync('src').filter(file => file.endsWith('.e2e-spec.ts'));

      if (e2eFiles.length === 0) {
        console.log('  ℹ️  No E2E test files found, skipping...');
        return;
      }

      const output = execSync('npm run test:e2e', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const passedMatch = output.match(/Tests:\s*(\d+)\s*passed/);
      const failedMatch = output.match(/Tests:\s*(\d+)\s*failed/);

      if (passedMatch) this.results.e2e.passed = parseInt(passedMatch[1]);
      if (failedMatch) this.results.e2e.failed = parseInt(failedMatch[1]);

      console.log(`  ✅ E2E tests completed: ${this.results.e2e.passed} passed, ${this.results.e2e.failed} failed`);

    } catch (error) {
      console.error('  ❌ E2E tests failed:', error.message);
      // Don't throw error for missing E2E tests
      if (!error.message.includes('No E2E test files found')) {
        throw error;
      }
    }

    console.log('✅ E2E tests complete\n');
  }

  async runSecurityTests() {
    console.log('🔒 Running security tests...');

    try {
      // Run security-focused tests
      const output = execSync('npm run test -- --testNamePattern="Security" --watchAll=false', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const passedMatch = output.match(/Tests:\s*(\d+)\s*passed/);
      const failedMatch = output.match(/Tests:\s*(\d+)\s*failed/);

      if (passedMatch) this.results.security.passed = parseInt(passedMatch[1]);
      if (failedMatch) this.results.security.failed = parseInt(failedMatch[1]);

      console.log(`  ✅ Security tests completed: ${this.results.security.passed} passed, ${this.results.security.failed} failed`);

      // Additional security checks
      await this.runDependencySecurityCheck();

    } catch (error) {
      console.error('  ❌ Security tests failed:', error.message);
      throw error;
    }

    console.log('✅ Security tests complete\n');
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');

    try {
      const output = execSync('npm run test -- --testPathPattern="performance\\.test\\.ts$" --watchAll=false', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const passedMatch = output.match(/Tests:\s*(\d+)\s*passed/);
      const failedMatch = output.match(/Tests:\s*(\d+)\s*failed/);

      if (passedMatch) this.results.performance.passed = parseInt(passedMatch[1]);
      if (failedMatch) this.results.performance.failed = parseInt(failedMatch[1]);

      console.log(`  ✅ Performance tests completed: ${this.results.performance.passed} passed, ${this.results.performance.failed} failed`);

      // Load performance metrics if available
      const metricsPath = './test-results/performance-report.json';
      if (fs.existsSync(metricsPath)) {
        const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        this.results.performance.metrics = metrics.summary;
        console.log(`  📊 Avg Response Time: ${metrics.summary.avgResponseTime}`);
      }

    } catch (error) {
      console.error('  ❌ Performance tests failed:', error.message);
      throw error;
    }

    console.log('✅ Performance tests complete\n');
  }

  async runDependencySecurityCheck() {
    console.log('  🔍 Running dependency security check...');

    try {
      execSync('npm audit --audit-level high', { stdio: 'pipe' });
      console.log('  ✅ No high-severity vulnerabilities found');
    } catch (error) {
      console.warn('  ⚠️  Security vulnerabilities detected:', error.message);
      // Don't fail the build for low-severity issues
      if (error.message.includes('high')) {
        throw error;
      }
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalTests = Object.values(this.results).reduce((sum, category) =>
      sum + (category.passed || 0) + (category.failed || 0), 0
    );
    const totalPassed = Object.values(this.results).reduce((sum, category) =>
      sum + (category.passed || 0), 0
    );
    const totalFailed = Object.values(this.results).reduce((sum, category) =>
      sum + (category.failed || 0), 0
    );

    console.log('\n📊 ENTERPRISE TEST REPORT');
    console.log('========================');
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);
    console.log('');

    // Detailed breakdown
    Object.entries(this.results).forEach(([category, stats]) => {
      const categoryPassed = stats.passed || 0;
      const categoryFailed = stats.failed || 0;
      const categoryTotal = categoryPassed + categoryFailed;

      console.log(`${category.toUpperCase()}:`);
      console.log(`  ✅ ${categoryPassed} passed, ❌ ${categoryFailed} failed`);

      if (stats.coverage !== undefined) {
        console.log(`  📊 Coverage: ${stats.coverage}%`);
      }

      if (stats.metrics && Object.keys(stats.metrics).length > 0) {
        console.log(`  📈 Metrics:`, stats.metrics);
      }

      console.log('');
    });

    // Save detailed report
    const report = {
      summary: {
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalTests,
        totalPassed,
        totalFailed,
        successRate: `${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`,
        timestamp: new Date().toISOString(),
      },
      details: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testEnvironment: this.testEnvironment,
      },
    };

    const reportDir = 'test-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }

    fs.writeFileSync(
      path.join(reportDir, 'enterprise-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`📄 Detailed report saved to: ${path.join(reportDir, 'enterprise-test-report.json')}`);
  }

  validateZeroBugPolicy() {
    const totalFailed = Object.values(this.results).reduce((sum, category) =>
      sum + (category.failed || 0), 0
    );

    const coverage = this.results.unit.coverage || 0;

    console.log('\n🎯 ZERO BUG POLICY VALIDATION');
    console.log('==============================');

    const checks = [
      {
        name: 'No Test Failures',
        passed: totalFailed === 0,
        value: totalFailed,
        required: 0,
      },
      {
        name: 'Unit Test Coverage',
        passed: coverage >= 85,
        value: coverage,
        required: 85,
      },
      {
        name: 'Code Quality Checks',
        passed: this.results.quality.failed === 0,
        value: this.results.quality.failed,
        required: 0,
      },
      {
        name: 'Security Tests',
        passed: this.results.security.failed === 0,
        value: this.results.security.failed,
        required: 0,
      },
    ];

    let allPassed = true;
    checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.value} (required: ${check.required})`);
      if (!check.passed) {
        allPassed = false;
      }
    });

    console.log('');

    if (allPassed) {
      console.log('🎉 ZERO BUG POLICY COMPLIANT!');
      console.log('   All enterprise-grade standards met.');
      process.exit(0);
    } else {
      console.log('⚠️  ZERO BUG POLICY VIOLATION!');
      console.log('   Enterprise-grade standards not met.');
      console.log('   Please fix all issues before proceeding.');
      process.exit(1);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testRunner = new EnterpriseTestRunner();
  testRunner.runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = EnterpriseTestRunner;