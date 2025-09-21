import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../Dashboard";

// Mock setTimeout
jest.useFakeTimers();

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it("shows loading state initially", () => {
    render(<Dashboard />);

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    expect(screen.getByRole("img", { hidden: true })).toHaveClass(
      "animate-spin",
    );
  });

  it("renders dashboard with stats after loading", async () => {
    render(<Dashboard />);

    // Fast-forward timers
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(
        screen.getByText("Hospital Management System"),
      ).toBeInTheDocument();
    });

    // Check main stats
    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("Active Patients")).toBeInTheDocument();
    expect(screen.getByText("1,180")).toBeInTheDocument();
    expect(screen.getByText("Pending Bills")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("displays all stat cards with correct icons and colors", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("Low Stock Medications")).toBeInTheDocument();
    });

    // Check all stat titles are present
    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByText("Active Patients")).toBeInTheDocument();
    expect(screen.getByText("Pending Bills")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Medications")).toBeInTheDocument();
    expect(screen.getByText("Pending Lab Tests")).toBeInTheDocument();
    expect(screen.getByText("Pending Radiology")).toBeInTheDocument();
    expect(screen.getByText("Emergency Alerts")).toBeInTheDocument();
  });

  it("shows quick action buttons", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    expect(screen.getByText("Patient Registration")).toBeInTheDocument();
    expect(screen.getByText("Schedule Appointment")).toBeInTheDocument();
    expect(screen.getByText("Medical Records")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("displays today's appointments section", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Cardiology Consultation")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("General Checkup")).toBeInTheDocument();
    expect(screen.getByText("11:30 AM")).toBeInTheDocument();
  });

  it("shows system alerts section", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("System Alerts")).toBeInTheDocument();
    });

    expect(screen.getByText("Low Stock Alert")).toBeInTheDocument();
    expect(
      screen.getByText("Paracetamol tablets running low"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending Lab Results")).toBeInTheDocument();
    expect(screen.getByText("Maintenance Due")).toBeInTheDocument();
  });

  it("displays header action buttons", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("New Appointment")).toBeInTheDocument();
    });

    expect(screen.getByText("New Appointment")).toBeInTheDocument();
    expect(screen.getByText("Add Patient")).toBeInTheDocument();
  });

  it("shows welcome message with admin title", async () => {
    render(<Dashboard />);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText("Welcome back, Admin")).toBeInTheDocument();
    });
  });
});
