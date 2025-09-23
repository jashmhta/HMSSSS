import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const BodyTestComponent: React.FC = () => {
  return (
    <div data-testid="body-test">
      <h1>DOM Body Test</h1>
      <p>Testing that components render to document.body properly</p>
    </div>
  );
};

describe('DOM Body Container Setup Verification', () => {
  test('document.body should have content after render', () => {
    // Verify document.body exists before render
    expect(document.body).toBeDefined();
    expect(document.body.tagName).toBe('BODY');

    // Render component
    render(<BodyTestComponent />);

    // Verify document.body now has content
    expect(document.body.innerHTML).not.toBe('');
    expect(document.body.innerHTML).toContain('DOM Body Test');
    expect(document.body.innerHTML).toContain('Testing that components render to document.body properly');

    // Verify the root container exists
    const rootContainer = document.getElementById('root');
    expect(rootContainer).toBeDefined();
    expect(rootContainer?.tagName).toBe('DIV');

    // Verify content can be found with screen queries
    expect(screen.getByText('DOM Body Test')).toBeInTheDocument();
    expect(screen.getByText('Testing that components render to document.body properly')).toBeInTheDocument();
    expect(screen.getByTestId('body-test')).toBeInTheDocument();

    // Verify document.body.children is not empty
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  test('multiple renders should not accumulate in document.body', () => {
    // Get initial body children count
    const initialChildren = document.body.children.length;

    // First render
    const { unmount: unmount1 } = render(<BodyTestComponent />);
    expect(screen.getByText('DOM Body Test')).toBeInTheDocument();

    // Body should have our containers plus the rendered component
    expect(document.body.children.length).toBeGreaterThan(initialChildren);

    // Unmount first component
    unmount1();
    expect(screen.queryByText('DOM Body Test')).not.toBeInTheDocument();

    // Second render with different content
    const DifferentComponent: React.FC = () => (
      <div data-testid="different-component">
        <h2>Different Content</h2>
      </div>
    );

    const { unmount: unmount2 } = render(<DifferentComponent />);
    expect(screen.getByText('Different Content')).toBeInTheDocument();
    expect(screen.getByTestId('different-component')).toBeInTheDocument();

    // Unmount second component
    unmount2();
    expect(screen.queryByText('Different Content')).not.toBeInTheDocument();

    // Our setup containers should still exist but components should be cleaned up
    expect(document.body.children.length).toBeGreaterThanOrEqual(initialChildren);
    expect(document.getElementById('root')).toBeInTheDocument();
  });

  test('document.body should be properly cleaned up between tests', () => {
    // This test verifies that cleanup between tests works properly
    expect(document.body).toBeDefined();

    // The body should contain our setup containers but not components from previous tests
    const rootContainer = document.getElementById('root');
    expect(rootContainer).toBeInTheDocument();

    // Should not contain content from other tests
    expect(screen.queryByText('DOM Body Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Different Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Simple Test Component')).not.toBeInTheDocument();
  });
});