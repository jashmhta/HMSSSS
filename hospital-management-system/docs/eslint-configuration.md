# ESLint Configuration for Hospital Management System

## Overview

This document describes the comprehensive ESLint configuration setup for the Hospital Management System (HMS) to ensure enterprise-grade security, code quality, and healthcare compliance.

## Configuration Files

### Backend (.eslintrc.js)

The backend configuration includes:

#### Security Plugins
- **eslint-plugin-security**: Detects common security vulnerabilities
- **eslint-plugin-no-secrets**: Prevents hardcoded secrets and credentials
- **eslint-plugin-pii**: Identifies Personally Identifiable Information (PII) and Protected Health Information (PHI)

#### Code Quality Plugins
- **@typescript-eslint**: TypeScript-specific rules with strict mode
- **eslint-plugin-sonarjs**: Code quality and bug detection
- **eslint-plugin-unicorn**: Modern JavaScript best practices
- **eslint-plugin-import**: Import organization and validation
- **eslint-plugin-jsdoc**: JSDoc documentation standards

#### Healthcare-Specific Rules
1. **PII/PHI Detection**:
   ```javascript
   'pii/no-emails': 'error',
   'pii/no-phone-numbers': 'error',
   'pii/no-ssn': 'error',
   'pii/no-credit-cards': 'error',
   ```

2. **Security Validation**:
   ```javascript
   'security/detect-object-injection': 'error',
   'security/detect-eval-with-expression': 'error',
   'security/detect-possible-timing-attacks': 'error',
   'security/detect-sql-injection': 'error',
   ```

3. **TypeScript Strict Mode**:
   ```javascript
   '@typescript-eslint/no-explicit-any': 'error',
   '@typescript-eslint/no-unsafe-assignment': 'error',
   '@typescript-eslint/no-unsafe-return': 'error',
   '@typescript-eslint/restrict-template-expressions': 'error',
   ```

### Frontend (.eslintrc.js)

The frontend configuration extends the backend with React/Next.js specific rules:

#### React Security
- **eslint-plugin-react**: React best practices
- **eslint-plugin-react-hooks**: Hooks validation
- **eslint-plugin-jsx-a11y**: WCAG 2.1 AA compliance
- **eslint-plugin-react-perf**: Performance optimization

#### Accessibility Compliance
```javascript
'jsx-a11y/alt-text': ['error', { elements: ['img', 'object', 'area', 'input[type="image"]'] }],
'jsx-a11y/label-has-associated-control': ['error', { required: { some: ['nesting', 'id'] } }],
'jsx-a11y/role-has-required-aria-props': 'error',
```

#### Next.js Specific Rules
```javascript
'@next/next/no-img-element': 'error',  // Use next/image
'@next/next/no-page-custom-font': 'error',  // Use next/font
'@next/next/no-css-tags': 'error',  // Use CSS modules
```

## Security Features

### HIPAA/GDPR Compliance

1. **Data Encryption Validation**:
   - Detects unencrypted sensitive data
   - Validates secure transmission protocols
   - Ensures proper data handling

2. **Audit Trail Requirements**:
   - Enforces logging for sensitive operations
   - Validates user action tracking
   - Ensures proper error handling

3. **Access Control Validation**:
   - RBAC implementation checks
   - Permission level validation
   - Session management security

### SQL Injection Prevention

```javascript
'no-eval': 'error',
'no-implied-eval': 'error',
'security/detect-non-literal-regexp': 'error',
'security/detect-object-injection': 'error',
```

### XSS Prevention

```javascript
'react/no-danger': ['error', { forbid: ['children'] }],
'react/jsx-no-comment-textnodes': 'error',
'react/jsx-no-script-url': 'error',
'security/detect-disable-mustache-escape': 'error',
```

## Healthcare-Specific Validations

### Medical Data Handling

1. **Input Validation**:
   - Strict type checking for medical values
   - Range validation for vitals (e.g., blood pressure, temperature)
   - Format validation for medical codes (ICD-10, CPT, etc.)

2. **Data Integrity**:
   - Immutable record validation
   - Audit log verification
   - Timestamp validation

### Authentication & Authorization

1. **Password Security**:
   - Complexity requirements
   - Hashing validation
   - Expiration policy checks

2. **Session Management**:
   - Token validation
   - Timeout enforcement
   - Secure flag validation

## File Overrides

The configurations include intelligent overrides for:

1. **Test Files**: Relaxed rules for testing scenarios
2. **Database Files**: Special handling for schema and migrations
3. **Configuration Files**: Allow environment-specific patterns
4. **API Routes**: Enhanced security validation
5. **Form Components**: Strict accessibility rules
6. **Medical Components**: PHI-specific validations

## Installation

To install the required ESLint plugins:

```bash
# Backend
cd backend
chmod +x eslint-install.sh
./eslint-install.sh

# Frontend
cd frontend
chmod +x eslint-install.sh
./eslint-install.sh
```

## Running ESLint

```bash
# Backend
npm run lint          # Check for issues
npm run lint -- --fix # Auto-fix issues

# Frontend
npm run lint          # Check for issues
npm run lint -- --fix # Auto-fix issues
```

## Integration with CI/CD

The ESLint configuration is integrated into:

1. **Pre-commit Hooks**: Using Husky
2. **Build Pipeline**: Fails build on ESLint errors
3. **Code Reviews**: Automated suggestions
4. **Quality Gates**: Part of the deployment criteria

## Custom Rules

The system includes custom rules for:

1. **Medical Terminology**: Enforce consistent naming
2. **Error Handling**: Standardized error responses
3. **Logging Requirements**: Audit trail compliance
4. **Data Validation**: Healthcare-specific patterns

## Maintenance

Regular updates ensure:

1. **Latest Security Practices**: Updated plugins and rules
2. **Healthcare Regulations**: Compliance with new requirements
3. **Performance Optimizations**: Rule efficiency improvements
4. **Framework Updates**: Compatibility with new versions

## Troubleshooting

Common issues and solutions:

1. **TypeScript Errors**: Ensure tsconfig.json is properly configured
2. **Import Errors**: Check resolver configuration
3. **Plugin Conflicts**: Review plugin compatibility
4. **Performance Issues**: Use .eslintignore to exclude large files

## Best Practices

1. **Zero-Tolerance Security**: All security violations are errors
2. **Type Safety**: Strict TypeScript mode enforcement
3. **Documentation**: JSDoc requirements for public APIs
4. **Testing**: Separate rules for test files
5. **Consistency**: Uniform formatting and naming conventions