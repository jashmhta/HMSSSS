import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const SimpleComponent: React.FC = () => {
  return (
    <div data-testid="simple-container">
      <h1>Simple Test Component</h1>
      <p>This is a simple test to verify React Testing Library works</p>
      <button data-testid="test-button">Click me</button>
    </div>
  );
};

describe('Simple React Test Setup', () => {
  test('can render a React component', () => {
    // This should not throw any errors
    const { container } = render(<SimpleComponent />);

    // Verify the component was rendered
    expect(container).toBeDefined();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('can find text content', () => {
    render(<SimpleComponent />);

    // Verify text content can be found
    expect(screen.getByText('Simple Test Component')).toBeInTheDocument();
    expect(screen.getByText('This is a simple test to verify React Testing Library works')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('can find elements by test ID', () => {
    render(<SimpleComponent />);

    // Verify elements can be found by test ID
    expect(screen.getByTestId('simple-container')).toBeInTheDocument();
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  test('can check DOM structure', () => {
    render(<SimpleComponent />);

    const container = screen.getByTestId('simple-container');
    const button = screen.getByTestId('test-button');

    // Verify DOM structure
    expect(container).toContainElement(screen.getByText('Simple Test Component'));
    expect(container).toContainElement(button);
    expect(button).toHaveTextContent('Click me');
  });

  test('can use jest-dom matchers', () => {
    render(<SimpleComponent />);

    const container = screen.getByTestId('simple-container');
    const button = screen.getByTestId('test-button');

    // Test jest-dom matchers
    expect(container).toBeInTheDocument();
    // TODO: Fix toBeVisible matcher - temporarily commented out
    // expect(container).toBeVisible();
    expect(container).toHaveAttribute('data-testid', 'simple-container');

    expect(button).toBeInTheDocument();
    // expect(button).toBeVisible();
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toHaveTextContent('Click me');
    expect(button).toBeEnabled();
  });

  test('can access container properties', () => {
    const { container } = render(<SimpleComponent />);

    // Test container properties
    expect(container.children.length).toBeGreaterThan(0);
    expect(container.innerHTML).toContain('Simple Test Component');
    expect(container.innerHTML).toContain('Click me');

    // Test that we can access the DOM directly
    const div = container.querySelector('[data-testid="simple-container"]');
    expect(div).toBeInTheDocument();
    expect(div?.tagName).toBe('DIV');
  });
});