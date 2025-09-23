import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../login";
import { createTestContainer } from "../../../test-utils";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Get mock functions after mock is set
const mockToastSuccess = require('react-hot-toast').toast.success;
const mockToastError = require('react-hot-toast').toast.error;

// Mock next/router
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  EyeIcon: () => <div data-testid="eye-icon" />,
  EyeSlashIcon: () => <div data-testid="eye-slash-icon" />,
}));

// Setup fake timers
jest.useFakeTimers();

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    localStorage.clear();
  });

  it("renders login form with all elements", () => {
    render(<Login />);

    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remember me/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot your password?/i)).toBeInTheDocument();
  });

  it("shows demo credentials section", () => {
    render(<Login />);

    expect(screen.getByText(/Demo Credentials:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@hms.com \/ admin123/i)).toBeInTheDocument();
    expect(screen.getByText(/doctor@hms.com \/ doctor123/i)).toBeInTheDocument();
    expect(screen.getByText(/patient@hms.com \/ patient123/i)).toBeInTheDocument();
  });

  it("updates form data when typing", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const rememberMeCheckbox = screen.getByLabelText(/Remember me/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(rememberMeCheckbox);

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(rememberMeCheckbox).toBeChecked();
  });

  it("shows loading state during form submission", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign in/i });

    await user.type(emailInput, "admin@hms.com");
    await user.type(passwordInput, "admin123");

    await user.click(submitButton);

    expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("handles successful login", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign in/i });

    await user.type(emailInput, "admin@hms.com");
    await user.type(passwordInput, "admin123");
    await user.click(submitButton);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Login successful!");
    });

    expect(localStorage.getItem("token")).toBe("mock-jwt-token");
    expect(localStorage.getItem("userRole")).toBe("admin");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const submitButton = screen.getByRole("button", { name: /Sign in/i });

    await user.click(submitButton);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("handles login failure", async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign in/i });

    await user.type(emailInput, "wrong@email.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Login failed. Please check your credentials.",
      );
    });

    consoleError.mockRestore();
  });

  it("navigates to register page", () => {
    render(<Login />);

    const registerLink = screen.getByText(/create a new account/i);
    expect(registerLink.closest("a")).toHaveAttribute("href", "/auth/register");
  });

  it("navigates to forgot password page", () => {
    render(<Login />);

    const forgotPasswordLink = screen.getByText(/Forgot your password?/i);
    expect(forgotPasswordLink.closest("a")).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});