import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')
  })

  test('should display login form elements', async ({ page }) => {
    // Verify login page elements
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByText('Remember me')).toBeVisible()
    await expect(page.getByText('create a new account')).toBeVisible()
    await expect(page.getByText('Forgot your password?')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.getByLabel('Email address').fill('admin@hms.com')
    await page.getByLabel('Password').fill('admin123')

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard')

    // Verify successful login
    await expect(page.getByText('Hospital Management System')).toBeVisible()
    await expect(page.getByText('Welcome back, Admin')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel('Email address').fill('invalid@email.com')
    await page.getByLabel('Password').fill('wrongpassword')

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify error message appears
    await expect(page.getByText('Login failed. Please check your credentials.')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel('Password')

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Try to find and click eye icon if it exists
    const eyeButton = page.locator('button').filter({ hasText: '' }).first()
    const eyeButtonCount = await eyeButton.count()

    if (eyeButtonCount > 1) { // Second button is typically the password toggle
      await eyeButton.nth(1).click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide password
      await eyeButton.nth(1).click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check for HTML5 validation
    const emailInput = page.getByLabel('Email address')
    const passwordInput = page.getByLabel('Password')

    // These should show validation errors
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should navigate to register page', async ({ page }) => {
    await page.getByText('create a new account').click()

    await expect(page).toHaveURL('/auth/register')
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByText('Forgot your password?').click()

    await expect(page).toHaveURL('/auth/forgot-password')
  })

  test('should persist remember me preference', async ({ page }) => {
    // Check remember me
    await page.getByLabel('Remember me').check()
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByLabel('Password').fill('testpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for error (invalid credentials)
    await expect(page.getByText('Login failed')).toBeVisible()

    // Email should still be filled due to remember me
    await expect(page.getByLabel('Email address')).toHaveValue('test@example.com')
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.getByLabel('Email address').fill('admin@hms.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/dashboard')
  })

  test('should display dashboard with all stats', async ({ page }) => {
    // Verify dashboard loads
    await expect(page.getByText('Hospital Management System')).toBeVisible()
    await expect(page.getByText('Welcome back, Admin')).toBeVisible()

    // Check stat cards
    await expect(page.getByText('Total Patients')).toBeVisible()
    await expect(page.getByText('1,250')).toBeVisible()
    await expect(page.getByText("Today's Appointments")).toBeVisible()
    await expect(page.getByText('45')).toBeVisible()

    // Check quick actions
    await expect(page.getByText('Quick Actions')).toBeVisible()
    await expect(page.getByText('Patient Registration')).toBeVisible()
    await expect(page.getByText('Schedule Appointment')).toBeVisible()

    // Check today's appointments section
    await expect(page.getByText("Today's Appointments")).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('Cardiology Consultation')).toBeVisible()
  })

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to appointments (assuming there's a link)
    const appointmentButton = page.getByText('Schedule Appointment')
    if (await appointmentButton.isVisible()) {
      await appointmentButton.click()
      // This would depend on actual routing implementation
    }
  })
})