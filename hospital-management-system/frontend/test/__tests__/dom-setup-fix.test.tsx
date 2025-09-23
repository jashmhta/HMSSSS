import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

// Simple test component
const TestComponent: React.FC = () => {
  return (
    <div data-testid="test-container">
      <h1>Hello World</h1>
      <button data-testid="test-button">Click me</button>
      <p data-testid="test-paragraph">This is a test paragraph</p>
    </div>
  );
};

describe('DOM Setup Fix Verification', () => {
  afterEach(() => {
    cleanup();
  });

  test('document.body should be properly set up', () => {
    // Verify document.body exists and is accessible
    expect(document.body).toBeDefined();
    expect(document.body.tagName).toBe('BODY');

    // Verify our containers are created
    const rootContainer = document.getElementById('root');
    const testingContainer = document.getElementById('testing-library-container');

    expect(rootContainer).toBeDefined();
    expect(rootContainer?.tagName).toBe('DIV');
    expect(rootContainer?.id).toBe('root');

    expect(testingContainer).toBeDefined();
    expect(testingContainer?.tagName).toBe('DIV');
    expect(testingContainer?.id).toBe('testing-library-container');
  });

  test('React Testing Library render should work properly', () => {
    // This should not throw any errors
    const { container } = render(<TestComponent />);

    // Verify the component was rendered
    expect(container).toBeDefined();

    // Verify content can be found with screen queries
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
    expect(screen.getByText('This is a test paragraph')).toBeInTheDocument();

    // Verify content can be found with test IDs
    expect(screen.getByTestId('test-container')).toBeInTheDocument();
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
    expect(screen.getByTestId('test-paragraph')).toBeInTheDocument();

    // Verify the component is actually in the DOM
    const testContainer = screen.getByTestId('test-container');
    expect(testContainer.tagName).toBe('DIV');
    expect(testContainer).toContainElement(screen.getByText('Hello World'));
  });

  test('React Testing Library should properly clean up after each test', () => {
    // Render a component
    const { container, unmount } = render(<TestComponent />);

    // Verify it's rendered
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(container.children.length).toBeGreaterThan(0);

    // Unmount the component
    unmount();

    // Verify it's cleaned up
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
    expect(container.children.length).toBe(0);
  });

  test('multiple renders should not interfere with each other', () => {
    // First render
    const { unmount: unmount1 } = render(<TestComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();

    // Unmount
    unmount1();
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();

    // Second render with different content
    const DifferentComponent: React.FC = () => (
      <div data-testid="different-container">
        <h2>Different Content</h2>
      </div>
    );

    const { unmount: unmount2 } = render(<DifferentComponent />);
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
    expect(screen.getByText('Different Content')).toBeInTheDocument();
    expect(screen.getByTestId('different-container')).toBeInTheDocument();

    // Unmount
    unmount2();
    expect(screen.queryByText('Different Content')).not.toBeInTheDocument();
  });

  test('DOM containers should be properly managed between tests', () => {
    // Check initial state
    const initialBodyChildren = document.body.children.length;
    expect(initialBodyChildren).toBeGreaterThan(0);

    // Render component
    render(<TestComponent />);

    // Check state during test
    const duringBodyChildren = document.body.children.length;
    expect(duringBodyChildren).toBeGreaterThanOrEqual(initialBodyChildren);

    // Clean up
    cleanup();

    // Check state after cleanup
    const finalBodyChildren = document.body.children.length;
    // Should have our containers but not the rendered component
    expect(finalBodyChildren).toBeLessThanOrEqual(duringBodyChildren);

    // Component should be gone
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();

    // Our containers should still exist
    expect(document.getElementById('root')).toBeInTheDocument();
    expect(document.getElementById('testing-library-container')).toBeInTheDocument();
  });

  test('React Testing Library utilities should work correctly', () => {
    render(<TestComponent />);

    // Test debug utility
    const { debug } = screen;
    expect(typeof debug).toBe('function');

    // Test that we can access container content
    const container = screen.getByTestId('test-container');
    expect(container.innerHTML).toContain('Hello World');
    expect(container.innerHTML).toContain('Click me');
    expect(container.innerHTML).toContain('This is a test paragraph');

    // Test basic DOM navigation
    const button = screen.getByTestId('test-button');
    expect(button.textContent).toBe('Click me');
    expect(button.tagName).toBe('BUTTON');

    // Test parent-child relationships
    expect(container).toContainElement(button);
    expect(button.parentElement).toBe(container);
  });

  test('jest-dom matchers should work correctly', () => {
    render(<TestComponent />);

    const container = screen.getByTestId('test-container');
    const button = screen.getByTestId('test-button');

    // Test various jest-dom matchers
    expect(container).toBeInTheDocument();
    expect(container).toBeVisible();
    expect(container).toHaveAttribute('data-testid', 'test-container');

    expect(button).toBeInTheDocument();
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toHaveTextContent('Click me');
    expect(button).toBeEnabled();
  });
});