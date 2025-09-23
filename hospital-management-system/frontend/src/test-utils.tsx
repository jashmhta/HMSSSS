import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that works with the existing Jest setup
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Use the standard React Testing Library render
  const result = render(ui, {
    ...options,
    // Let RTL handle the container creation automatically
  });

  // Ensure the container is attached to document.body
  if (result.container && !document.body.contains(result.container)) {
    document.body.appendChild(result.container);
  }

  return {
    ...result,
    // Add custom unmount that ensures cleanup
    unmount: () => {
      if (result.container && document.body.contains(result.container)) {
        document.body.removeChild(result.container);
      }
      result.unmount();
    }
  };
};

// Test container creation utility
const createTestContainer = () => {
  // Ensure document.body exists
  if (!document.body) {
    document.body = document.createElement('body');
    document.documentElement.appendChild(document.body);
  }

  // Clear document body but preserve essential containers
  const essentialContainers = document.body.querySelectorAll('[data-testid]');
  document.body.innerHTML = '';

  // Restore essential containers
  essentialContainers.forEach(container => {
    document.body.appendChild(container);
  });

  // Create root container if it doesn't exist
  let rootContainer = document.getElementById('root');
  if (!rootContainer) {
    rootContainer = document.createElement('div');
    rootContainer.id = 'root';
    document.body.appendChild(rootContainer);
  }

  // Also create a default container for React Testing Library
  let defaultContainer = document.querySelector('[data-testid="default-test-container"]');
  if (!defaultContainer) {
    defaultContainer = document.createElement('div');
    defaultContainer.setAttribute('data-testid', 'default-test-container');
    document.body.appendChild(defaultContainer);
  }

  return rootContainer;
};

// Helper for async operations
const waitForAsync = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to advance timers
const advanceTimers = (ms: number = 1000) => {
  jest.advanceTimersByTime(ms);
};

export * from '@testing-library/react';
export { customRender as render, createTestContainer, waitForAsync, advanceTimers };