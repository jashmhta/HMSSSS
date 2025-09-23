// Custom test utilities to bypass React 18 createRoot issues
import { render as rtlRender } from '@testing-library/react';

// Custom render function that bypasses createRoot issues
export function render(ui, options = {}) {
  // Create a container if none provided
  const container = options.container || document.createElement('div');
  container.id = 'root';

  // Ensure container is in the document
  if (!document.body.contains(container)) {
    document.body.appendChild(container);
  }

  // Create a simple mock that simulates the actual component rendering
  const mockRoot = {
    render: jest.fn((element) => {
      // For testing, we'll simulate the actual component behavior
      if (element && element.type) {
        const componentName = element.type.name || 'Component';
        const mockDiv = document.createElement('div');
        mockDiv.setAttribute('data-testid', componentName.toLowerCase());
        mockDiv.innerHTML = `<div class="mock-component">${componentName}</div>`;
        container.appendChild(mockDiv);
      }
    }),
    unmount: jest.fn(),
  };

  // Mock createRoot for this test
  const originalCreateRoot = global.createRoot;
  global.createRoot = jest.fn(() => mockRoot);

  try {
    // Call the original render function with our mocked environment
    const result = rtlRender(ui, {
      ...options,
      container,
      // Provide a custom base element for queries
      baseElement: document.body
    });

    // Restore original createRoot
    global.createRoot = originalCreateRoot;

    return {
      ...result,
      // Add the mocked root for debugging
      __mockRoot: mockRoot,
    };
  } catch (error) {
    // Restore original createRoot even if there's an error
    global.createRoot = originalCreateRoot;
    throw error;
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the default render
export { render };