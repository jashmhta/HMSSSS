import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Dashboard from '../Dashboard';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Pill: () => <div data-testid="pill-icon" />,
  TestTube: () => <div data-testid="test-tube-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock setTimeout
jest.useFakeTimers();

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);
    expect(container).toBeDefined();
  });

  it('shows loading state initially', () => {
    render(<Dashboard />);

    // Should show loading state immediately
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard with stats after loading', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Check for main content
    expect(screen.getByText(/Hospital Management System/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Patients/i)).toBeInTheDocument();
    expect(screen.getByText(/1,250/)).toBeInTheDocument();
    expect(screen.getByText(/Active Patients/i)).toBeInTheDocument();
    expect(screen.getByText(/1,180/)).toBeInTheDocument();
    expect(screen.getByText(/Pending Bills/i)).toBeInTheDocument();
    expect(screen.getByText(/23/)).toBeInTheDocument();
  });

  it('displays all stat cards with correct icons', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Check all stat cards
    expect(screen.getAllByText(/Total Patients/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Active Patients/i)).toBeInTheDocument();
    // Today's Appointments appears in both stat cards and appointments section
    expect(screen.getAllByText(/Today's Appointments/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Pending Bills/i)).toBeInTheDocument();
    expect(screen.getByText(/Low Stock Medications/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Lab Tests/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Radiology/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency Alerts/i)).toBeInTheDocument();

    // Check stat values
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total Patients
    expect(screen.getByText('1,180')).toBeInTheDocument(); // Active Patients
    expect(screen.getByText('45')).toBeInTheDocument(); // Today's Appointments
    expect(screen.getByText('23')).toBeInTheDocument(); // Pending Bills
    expect(screen.getByText('8')).toBeInTheDocument(); // Low Stock Medications
    expect(screen.getByText('12')).toBeInTheDocument(); // Pending Lab Tests
    expect(screen.getByText('6')).toBeInTheDocument(); // Pending Radiology
    expect(screen.getByText('2')).toBeInTheDocument(); // Emergency Alerts
  });

  it('shows quick action buttons', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Records/i)).toBeInTheDocument();
    expect(screen.getByText(/Billing/i)).toBeInTheDocument();
  });

  it("displays today's appointments section", async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Find the appointments section (not the stat card)
    const appointmentHeadings = screen.getAllByText(/Today's Appointments/i);
    expect(appointmentHeadings.length).toBe(2); // One in stat cards, one in appointments section

    // Check for specific appointment content in the appointments section
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Cardiology Consultation/i)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/General Checkup/i)).toBeInTheDocument();
    expect(screen.getByText(/11:30 AM/i)).toBeInTheDocument();
  });

  it('shows system alerts section', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/System Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Low Stock Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/Paracetamol tablets running low/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Lab Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance Due/i)).toBeInTheDocument();
  });

  it('displays header action buttons', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/New Appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Patient/i)).toBeInTheDocument();
  });

  it('shows welcome message with admin title', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Welcome back, Admin/i)).toBeInTheDocument();
  });

  it('handles loading state correctly', async () => {
    const { container } = render(<Dashboard />);

    // Initially shows loading state
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Loading spinner should be present
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Loading spinner should be gone
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('renders the correct number of stat cards', async () => {
    const { container } = render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Stat cards are in the grid with specific styling
    const statCards = container.querySelectorAll('.grid > .bg-white.rounded-lg.shadow-sm.p-6.border');
    expect(statCards.length).toBe(8);
  });

  it('displays all mocked Lucide icons', async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();

    // Fast-forward timers to simulate API call completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
    });

    // Check that all mocked icons are present (multiple instances may exist)
    const userIcons = screen.getAllByTestId('users-icon');
    const calendarIcons = screen.getAllByTestId('calendar-icon');
    const fileTextIcons = screen.getAllByTestId('file-text-icon');
    const pillIcons = screen.getAllByTestId('pill-icon');
    const testTubeIcons = screen.getAllByTestId('test-tube-icon');
    const activityIcons = screen.getAllByTestId('activity-icon');
    const dollarSignIcons = screen.getAllByTestId('dollar-sign-icon');
    const alertTriangleIcons = screen.getAllByTestId('alert-triangle-icon');

    expect(userIcons.length).toBeGreaterThan(0);
    expect(calendarIcons.length).toBeGreaterThan(0);
    expect(fileTextIcons.length).toBeGreaterThan(0);
    expect(pillIcons.length).toBeGreaterThan(0);
    expect(testTubeIcons.length).toBeGreaterThan(0);
    expect(activityIcons.length).toBeGreaterThan(0);
    expect(dollarSignIcons.length).toBeGreaterThan(0);
    expect(alertTriangleIcons.length).toBeGreaterThan(0);
  });
});