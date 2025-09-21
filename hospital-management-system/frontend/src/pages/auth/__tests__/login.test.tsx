import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../login";

// Mock next/router
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock react-hot-toast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("react-hot-toast", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it("renders login form with all elements", () => {
    render(<Login />);

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Remember me")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("create a new account")).toBeInTheDocument();
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
  });

  it("shows demo credentials section", () => {
    render(<Login />);

    expect(screen.getByText("Demo Credentials:")).toBeInTheDocument();
    expect(screen.getByText("admin@hms.com / admin123")).toBeInTheDocument();
    expect(screen.getByText("doctor@hms.com / doctor123")).toBeInTheDocument();
    expect(
      screen.getByText("patient@hms.com / patient123"),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "" }); // Eye icon button

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("updates form data when typing", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const rememberMeCheckbox = screen.getByLabelText("Remember me");

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

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "admin@hms.com");
    await user.type(passwordInput, "admin123");

    await user.click(submitButton);

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("handles successful login", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "admin@hms.com");
    await user.type(passwordInput, "admin123");
    await user.click(submitButton);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Login successful!");
    });

    // Check if localStorage was set
    expect(localStorage.getItem("token")).toBe("mock-jwt-token");
    expect(localStorage.getItem("userRole")).toBe("admin");

    // Check if router.push was called
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const submitButton = screen.getByRole("button", { name: "Sign in" });

    // Try to submit without filling fields
    await user.click(submitButton);

    // HTML5 validation should prevent submission
    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("handles login failure", async () => {
    // Mock a failed login by making the Promise reject
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((callback) => {
      // Simulate rejection instead of resolution
      throw new Error("Login failed");
    });

    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "wrong@email.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Login failed. Please check your credentials.",
      );
    });

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  it("navigates to register page", () => {
    render(<Login />);

    const registerLink = screen.getByText("create a new account");
    expect(registerLink.closest("a")).toHaveAttribute("href", "/auth/register");
  });

  it("navigates to forgot password page", () => {
    render(<Login />);

    const forgotPasswordLink = screen.getByText("Forgot your password?");
    expect(forgotPasswordLink.closest("a")).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});
