import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { ReactElement } from 'react';

// Create a simple custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, options);
};

// Re-export testing library utilities
export { screen, waitFor };
export { customRender as render };

// Custom user event extensions
export const userEvent = {
  // Extended type with improved typing simulation
  type: async (element: HTMLElement, text: string, _options = {}) => {
    const input = element as HTMLInputElement;

    // Focus the element
    input.focus();

    // Type each character with realistic delay
    for (const char of text) {
      await userEventLib.type(input, char);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  },

  click: async (element: HTMLElement) => {
    await userEventLib.click(element);
  },

  hover: async (element: HTMLElement) => {
    await userEventLib.hover(element);
  },

  // Add more custom methods as needed
};