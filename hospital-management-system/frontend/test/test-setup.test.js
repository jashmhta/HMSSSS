/**
 * Simple test to verify the testing infrastructure is working
 */

describe('Testing Infrastructure Setup', () => {
  test('Jest environment is properly configured', () => {
    expect(global.document).toBeDefined();
    expect(global.window).toBeDefined();
    expect(global.navigator).toBeDefined();
  });

  test('Testing Library jest-dom matchers are available', () => {
    // Create a container and test basic functionality
    const container = document.createElement('div');
    container.setAttribute('role', 'button');

    // Test basic jest-dom functionality (without requiring DOM append)
    expect(container).toBeDefined();
    expect(container.getAttribute('role')).toBe('button');

    // Test jest-dom matchers work
    expect(() => {
      expect(container).toHaveAttribute('role', 'button');
    }).not.toThrow();
  });

  test('Global test utilities are available', () => {
    expect(global.testUtils).toBeDefined();
    expect(typeof global.testUtils.mockApiResponse).toBe('function');
    expect(typeof global.testUtils.mockApiError).toBe('function');
    expect(typeof global.testUtils.createMockProps).toBe('function');
  });

  test('Mock APIs are available', () => {
    expect(global.fetch).toBeDefined();
    expect(global.localStorage).toBeDefined();
    expect(global.sessionStorage).toBeDefined();
    expect(global.URL).toBeDefined();
    expect(global.FormData).toBeDefined();
  });

  test('DOM element creation works', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    div.setAttribute('data-testid', 'test-div');

    expect(div.textContent).toBe('Hello World');
    expect(div.getAttribute('data-testid')).toBe('test-div');
    expect(div).toBeDefined();
  });

  test('Event handling works', () => {
    const button = document.createElement('button');
    button.textContent = 'Click me';

    // Test basic functionality
    expect(button.textContent).toBe('Click me');

    // Test that addEventListener works
    expect(() => {
      button.addEventListener('click', () => {});
    }).not.toThrow();

    // Test that MouseEvent can be created
    expect(() => {
      new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
    }).not.toThrow();
  });

  test('React components can be imported', () => {
    // Test that React components can be imported
    expect(() => {
      require('react');
      require('react-dom');
    }).not.toThrow();
  });
});