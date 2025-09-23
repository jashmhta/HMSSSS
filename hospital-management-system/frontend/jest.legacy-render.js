// Legacy render setup to bypass React 18 createRoot issues
import { render } from 'react-dom';

// Mock react-dom/client to avoid createRoot issues
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

// Mock @testing-library/react to use legacy render
jest.mock('@testing-library/react', () => {
  const original = jest.requireActual('@testing-library/react');

  return {
    ...original,
    render: (ui, options = {}) => {
      const container = options.container || document.createElement('div');
      container.id = 'root';

      if (!document.body.contains(container)) {
        document.body.appendChild(container);
      }

      // Use legacy ReactDOM render
      render(ui, container);

      return {
        container,
        baseElement: document.body,
        debug: () => console.log(container.innerHTML),
        unmount: () => {
          render(null, container);
        },
        rerender: (newUi) => {
          render(newUi, container);
        },
        asFragment: () => document.createDocumentFragment(),
      };
    },
  };
});

// Setup DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
  const rootContainer = document.createElement('div');
  rootContainer.id = 'root';
  document.body.appendChild(rootContainer);
});

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = '';
});