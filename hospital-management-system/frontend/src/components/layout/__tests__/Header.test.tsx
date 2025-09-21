import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../Header";

describe("Header", () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the header with title", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    expect(screen.getByText("Hospital Management System")).toBeInTheDocument();
  });

  it("shows menu button on mobile", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeInTheDocument();
  });

  it("calls onMenuClick when menu button is clicked", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it("shows search input on desktop", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const searchInput = screen.getByPlaceholderText(
      "Search patients, appointments...",
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("shows notification button with indicator", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const notificationButton = screen.getByRole("button", { name: "" }); // Bell icon button
    expect(notificationButton).toBeInTheDocument();

    // Check for notification indicator (red dot)
    const indicator = notificationButton.querySelector(".bg-red-400");
    expect(indicator).toBeInTheDocument();
  });

  it("shows profile avatar button", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const profileButton = screen.getByRole("button");
    const avatar = profileButton.querySelector(".bg-blue-500");
    expect(avatar).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("hides title on mobile but shows menu button", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    // On mobile, title should be hidden
    const title = screen.queryByText("Hospital Management System");
    expect(title).toHaveClass("hidden", "lg:block");
  });
});
