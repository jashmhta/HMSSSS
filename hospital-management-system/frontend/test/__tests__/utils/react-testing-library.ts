// React Testing Library utilities for enterprise-grade component testing

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { createTheme } from '../src/theme';

// Create a custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    route?: string;
    authProviderProps?: any;
    queryClientProps?: any;
  }
) => {
  const {
    route = '/',
    authProviderProps = {},
    queryClientProps = {},
    ...renderOptions
  } = options || {};

  // Create test query client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...queryClientProps,
  });

  // Create test theme
  const theme = createTheme();

  // Mock current route
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider {...authProviderProps}>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    theme,
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Custom matchers for accessibility testing
export const a11yMatchers = {
  // Check if element has proper ARIA attributes
  hasAriaLabel: (element: HTMLElement, label: string) => {
    return element.getAttribute('aria-label') === label ||
           element.getAttribute('aria-labelledby') === label;
  },

  // Check if element is accessible
  isAccessible: (element: HTMLElement) => {
    const hasRole = element.hasAttribute('role');
    const hasLabel = element.hasAttribute('aria-label') ||
                    element.hasAttribute('aria-labelledby') ||
                    element.textContent.trim() !== '';

    return hasRole || hasLabel;
  },

  // Check if element has proper focus management
  hasFocusManagement: (element: HTMLElement) => {
    return element.tabIndex >= 0 ||
           element.getAttribute('tabindex') !== null ||
           element.tagName === 'BUTTON' ||
           element.tagName === 'A' ||
           element.tagName === 'INPUT' ||
           element.tagName === 'SELECT' ||
           element.tagName === 'TEXTAREA';
  },
};

// Form testing utilities
export const formUtils = {
  // Fill form with data
  fillForm: async (form: HTMLElement, data: Record<string, any>) => {
    for (const [key, value] of Object.entries(data)) {
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (input) {
        await userEvent.type(input, String(value));
      }
    }
  },

  // Get form data
  getFormData: (form: HTMLElement) => {
    const formData = new FormData(form as HTMLFormElement);
    const data: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  },

  // Validate form
  validateForm: (form: HTMLElement) => {
    const inputs = form.querySelectorAll('input, select, textarea');
    const errors: string[] = [];

    inputs.forEach((input) => {
      const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

      if (element.hasAttribute('required') && !element.value) {
        errors.push(`${element.name || element.id} is required`);
      }

      if (element.hasAttribute('pattern') && element.value) {
        const pattern = new RegExp(element.getAttribute('pattern')!);
        if (!pattern.test(element.value)) {
          errors.push(`${element.name || element.id} does not match required pattern`);
        }
      }

      if (element.hasAttribute('minlength') && element.value) {
        const minLength = parseInt(element.getAttribute('minlength')!);
        if (element.value.length < minLength) {
          errors.push(`${element.name || element.id} is too short`);
        }
      }

      if (element.hasAttribute('maxlength') && element.value) {
        const maxLength = parseInt(element.getAttribute('maxlength')!);
        if (element.value.length > maxLength) {
          errors.push(`${element.name || element.id} is too long`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  },

  // Submit form
  submitForm: async (form: HTMLElement) => {
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      await userEvent.click(submitButton);
    } else {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  },
};

// Table testing utilities
export const tableUtils = {
  // Get table data
  getTableData: (table: HTMLElement) => {
    const rows = table.querySelectorAll('tbody tr');
    const data: any[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const rowData: any = {};

      cells.forEach((cell, index) => {
        const header = table.querySelector(`thead th:nth-child(${index + 1})`);
        const key = header?.textContent?.trim() || `column_${index}`;
        rowData[key] = cell.textContent?.trim();
      });

      data.push(rowData);
    });

    return data;
  },

  // Find row by content
  findRowByContent: (table: HTMLElement, content: string) => {
    const rows = table.querySelectorAll('tbody tr');
    return Array.from(rows).find(row =>
      row.textContent?.includes(content)
    );
  },

  // Get row count
  getRowCount: (table: HTMLElement) => {
    return table.querySelectorAll('tbody tr').length;
  },

  // Get column count
  getColumnCount: (table: HTMLElement) => {
    return table.querySelectorAll('thead th').length;
  },
};

// Modal testing utilities
export const modalUtils = {
  // Find modal by title
  findModalByTitle: (title: string) => {
    return screen.findByRole('dialog', { name: title });
  },

  // Find modal by content
  findModalByContent: (content: string) => {
    return screen.findByRole('dialog', {}, {}, {
      timeout: 5000,
    }).then(modal => {
      if (modal.textContent?.includes(content)) {
        return modal;
      }
      throw new Error(`Modal with content "${content}" not found`);
    });
  },

  // Close modal
  closeModal: async (modal: HTMLElement) => {
    const closeButton = modal.querySelector('[aria-label="Close"], [aria-label="close"], .close, button[title="Close"]') as HTMLButtonElement;
    if (closeButton) {
      await userEvent.click(closeButton);
    } else {
      // Try to close with Escape key
      await userEvent.type(modal, '{Escape}');
    }
  },

  // Click modal action
  clickModalAction: async (modal: HTMLElement, actionText: string) => {
    const actionButton = Array.from(modal.querySelectorAll('button'))
      .find(button => button.textContent?.includes(actionText)) as HTMLButtonElement;

    if (actionButton) {
      await userEvent.click(actionButton);
    } else {
      throw new Error(`Modal action "${actionText}" not found`);
    }
  },
};

// Navigation testing utilities
export const navigationUtils = {
  // Navigate to route
  navigateTo: (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  },

  // Get current route
  getCurrentRoute: () => {
    return window.location.pathname;
  },

  // Mock navigation
  mockNavigation: () => {
    const push = jest.fn();
    const replace = jest.fn();
    const back = jest.fn();
    const forward = jest.fn();

    return { push, replace, back, forward };
  },

  // Test navigation links
  testNavigationLink: async (link: HTMLElement, expectedPath: string) => {
    await userEvent.click(link);
    expect(window.location.pathname).toBe(expectedPath);
  },
};

// Data grid testing utilities
export const dataGridUtils = {
  // Get grid data
  getGridData: (grid: HTMLElement) => {
    const rows = grid.querySelectorAll('[role="row"]');
    const data: any[] = [];

    rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) return; // Skip header row

      const cells = row.querySelectorAll('[role="gridcell"]');
      const rowData: any = {};

      cells.forEach((cell, index) => {
        const header = grid.querySelector('[role="columnheader"]:nth-child(' + (index + 1) + ')');
        const key = header?.textContent?.trim() || `column_${index}`;
        rowData[key] = cell.textContent?.trim();
      });

      data.push(rowData);
    });

    return data;
  },

  // Sort column
  sortColumn: async (grid: HTMLElement, columnName: string) => {
    const header = grid.querySelector(`[role="columnheader"][aria-label*="${columnName}"], [role="columnheader"]:has-text("${columnName}")`) as HTMLElement;
    if (header) {
      await userEvent.click(header);
    } else {
      throw new Error(`Column "${columnName}" not found`);
    }
  },

  // Filter grid
  filterGrid: async (grid: HTMLElement, filterValue: string) => {
    const filterInput = grid.querySelector('input[placeholder*="Filter"], input[placeholder*="Search"]') as HTMLInputElement;
    if (filterInput) {
      await userEvent.type(filterInput, filterValue);
    } else {
      throw new Error('Filter input not found');
    }
  },

  // Select row
  selectRow: async (grid: HTMLElement, rowIndex: number) => {
    const row = grid.querySelectorAll('[role="row"]')[rowIndex + 1] as HTMLElement; // +1 to skip header
    if (row) {
      const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        await userEvent.click(checkbox);
      } else {
        await userEvent.click(row);
      }
    } else {
      throw new Error(`Row ${rowIndex} not found`);
    }
  },
};

// Chart testing utilities
export const chartUtils = {
  // Wait for chart to render
  waitForChart: async (chartContainer: HTMLElement) => {
    return waitFor(() => {
      const canvas = chartContainer.querySelector('canvas');
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }
      return canvas;
    }, { timeout: 5000 });
  },

  // Get chart data
  getChartData: async (chartContainer: HTMLElement) => {
    const canvas = await chartUtils.waitForChart(chartContainer);
    // This is a simplified version - in real implementation you might need to access chart instance
    return {
      labels: ['Label 1', 'Label 2', 'Label 3'],
      datasets: [{
        data: [10, 20, 30],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }],
    };
  },

  // Test chart interaction
  testChartInteraction: async (chartContainer: HTMLElement, interaction: 'click' | 'hover') => {
    const canvas = await chartUtils.waitForChart(chartContainer);
    const rect = canvas.getBoundingClientRect();

    if (interaction === 'click') {
      await userEvent.click(canvas, {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
    } else if (interaction === 'hover') {
      await userEvent.hover(canvas);
    }
  },
};

// Performance testing utilities
export const performanceUtils = {
  // Measure render time
  measureRenderTime: async (component: ReactElement, iterations = 10) => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const { unmount } = render(component);
      times.push(performance.now() - start);
      unmount();
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    };
  },

  // Measure re-render time
  measureReRenderTime: async (component: ReactElement, propsUpdate: any, iterations = 10) => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { rerender, unmount } = render(component);

      const start = performance.now();
      rerender(component);
      times.push(performance.now() - start);

      unmount();
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    };
  },

  // Test memory usage
  measureMemoryUsage: async (component: ReactElement) => {
    const startMemory = process.memoryUsage().heapUsed;

    const { unmount } = render(component);
    unmount();

    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;

    return {
      startMemory,
      endMemory,
      memoryIncrease,
      memoryIncreaseMB: memoryIncrease / (1024 * 1024),
    };
  },
};

// Custom user event extensions
export const userEvent = {
  // Extended type with improved typing simulation
  type: async (element: HTMLElement, text: string, options = {}) => {
    const input = element as HTMLInputElement;

    // Focus the element
    input.focus();

    // Type each character with realistic delay
    for (const char of text) {
      input.value += char;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
    }

    // Trigger change event
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Trigger blur event
    input.blur();
  },

  // Drag and drop simulation
  dragAndDrop: async (source: HTMLElement, target: HTMLElement) => {
    // Drag start
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    source.dispatchEvent(dragStartEvent);

    // Drag over
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    target.dispatchEvent(dragOverEvent);

    // Drop
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    target.dispatchEvent(dropEvent);

    // Drag end
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    source.dispatchEvent(dragEndEvent);
  },

  // File upload simulation
  uploadFile: async (input: HTMLInputElement, files: File[]) => {
    // Create a DataTransfer object to simulate file selection
    const dataTransfer = new DataTransfer();

    files.forEach(file => {
      dataTransfer.items.add(file);
    });

    // Assign the files to the input
    input.files = dataTransfer.files;

    // Trigger change event
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },

  // Scroll simulation
  scroll: async (element: HTMLElement, options: ScrollToOptions = {}) => {
    element.scroll({
      top: options.top || 0,
      left: options.left || 0,
      behavior: options.behavior || 'auto',
    });

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  },
};

// Error boundary testing utilities
export const errorBoundaryUtils = {
  // Test error boundary
  testErrorBoundary: (component: ReactElement, error: Error) => {
    const ErrorComponent = () => {
      throw error;
    };

    return render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
  },

  // Get error boundary fallback
  getErrorFallback: (container: HTMLElement) => {
    return container.querySelector('[data-testid="error-fallback"], .error-fallback, .error-boundary');
  },

  // Test error recovery
  testErrorRecovery: async (container: HTMLElement, recoverAction: () => void) => {
    const fallback = errorBoundaryUtils.getErrorFallback(container);
    if (fallback) {
      const recoverButton = fallback.querySelector('button') as HTMLButtonElement;
      if (recoverButton) {
        await userEvent.click(recoverButton);
        recoverAction();
      }
    }
  },
};

// Export all utilities
export {
  a11yMatchers,
  formUtils,
  tableUtils,
  modalUtils,
  navigationUtils,
  dataGridUtils,
  chartUtils,
  performanceUtils,
  userEvent,
  errorBoundaryUtils,
};