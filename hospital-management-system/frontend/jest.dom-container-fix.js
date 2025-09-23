// Fix for React 18 createRoot DOM container issues

// Setup DOM before each test
beforeEach(() => {
  // Clear the document body
  document.body.innerHTML = '';

  // Create a root container for React Testing Library
  const rootContainer = document.createElement('div');
  rootContainer.id = 'root';
  document.body.appendChild(rootContainer);

  // Also create a default container for React Testing Library
  const defaultContainer = document.createElement('div');
  defaultContainer.setAttribute('data-testid', 'default-test-container');
  document.body.appendChild(defaultContainer);

  // Ensure the DOM is properly set up for React 18
  if (typeof window !== 'undefined') {
    window.scrollTo = jest.fn();
  }
});

// Clean up after each test
afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = '';
});