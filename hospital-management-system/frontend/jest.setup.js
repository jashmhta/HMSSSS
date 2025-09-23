// Jest setup file for Next.js frontend testing

// Import polyfills first
import './jest.polyfills.js';

// Import testing library setup
import '@testing-library/jest-dom';
import '@testing-library/user-event';

// Import necessary polyfills
import 'whatwg-fetch';
import 'abort-controller/polyfill';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js document component
jest.mock('next/document', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true,
});

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  value: jest.fn(() => 'test'),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch API
global.fetch = jest.fn();

// Mock URL API
global.URL = jest.fn().mockImplementation(url => {
  const urlObj = {
    href: url,
    origin: 'http://localhost:3000',
    pathname: url.split('/').slice(3).join('/'),
    search: '',
    searchParams: new URLSearchParams(),
    toString: () => url,
  };
  return urlObj;
});

// Mock URLSearchParams
global.URLSearchParams = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  toString: jest.fn(),
  entries: jest.fn(),
  values: jest.fn(),
  keys: jest.fn(),
  forEach: jest.fn(),
}));

// Mock File API
global.File = jest.fn().mockImplementation((parts, name, options) => ({
  parts,
  name,
  type: options?.type || '',
  size: options?.size || 0,
  lastModified: options?.lastModified || Date.now(),
}));

// Mock Blob API
global.Blob = jest.fn().mockImplementation((parts, options) => ({
  parts,
  type: options?.type || '',
  size: 0,
  text: jest.fn().mockResolvedValue(''),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  stream: jest.fn(),
  slice: jest.fn(),
}));

// Mock FormData API
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  entries: jest.fn(),
  values: jest.fn(),
  keys: jest.fn(),
  forEach: jest.fn(),
}));

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
  abort: jest.fn(),
}));

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntries: jest.fn(),
  setResourceTimingBufferSize: jest.fn(),
  toJSON: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  onresourcetimingbufferfull: null,
  timeOrigin: 0,
  timing: {
    navigationStart: 0,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: 0,
    domainLookupStart: 0,
    domainLookupEnd: 0,
    connectStart: 0,
    connectEnd: 0,
    secureConnectionStart: 0,
    requestStart: 0,
    responseStart: 0,
    responseEnd: 0,
    domLoading: 0,
    domInteractive: 0,
    domContentLoadedEventStart: 0,
    domContentLoadedEventEnd: 0,
    domComplete: 0,
    loadEventStart: 0,
    loadEventEnd: 0,
  },
};

// Mock crypto API
global.crypto = {
  getRandomValues: jest.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    digest: jest.fn(),
    generateKey: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
  },
};

// Mock Web Animations API
global.HTMLElement.prototype.animate = jest.fn().mockReturnValue({
  play: jest.fn(),
  pause: jest.fn(),
  cancel: jest.fn(),
  finish: jest.fn(),
  reverse: jest.fn(),
  onfinish: null,
  oncancel: null,
});

// Mock getComputedStyle
global.getComputedStyle = jest.fn().mockReturnValue({
  getPropertyValue: jest.fn(prop => {
    const defaults = {
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1',
      'width': 'auto',
      'height': 'auto',
      'color': 'black',
      'background-color': 'transparent',
      'border': 'none',
      'margin': '0',
      'padding': '0',
      'font-size': '16px',
      'line-height': '1.5',
    };
    return defaults[prop] || '';
  }),
});

// Mock scrollIntoView
global.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock focus
global.HTMLElement.prototype.focus = jest.fn();

// Mock blur
global.HTMLElement.prototype.blur = jest.fn();

// Mock click
global.HTMLElement.prototype.click = jest.fn();

// Mock addEventListener
global.HTMLElement.prototype.addEventListener = jest.fn();
global.HTMLElement.prototype.removeEventListener = jest.fn();
global.HTMLElement.prototype.dispatchEvent = jest.fn();

// Mock canvas API
global.HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  getTransform: jest.fn(),
  resetTransform: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  setLineDash: jest.fn(),
  getLineDash: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  clip: jest.fn(),
  quadraticCurveTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  beginPath: jest.fn(),
  measureText: jest.fn(),
  strokeText: jest.fn(),
  fillText: jest.fn(),
  direction: 'inherit',
  font: '10px sans-serif',
  fillStyle: 'black',
  strokeStyle: 'black',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'transparent',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
});

// Mock getBoundingClientRect
global.HTMLElement.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
});

// Mock getClientRects
global.HTMLElement.prototype.getClientRects = jest.fn().mockReturnValue([
  {
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
  },
]);

// Mock Element.scrollIntoView
global.Element.prototype.scrollIntoView = jest.fn();

// Mock Element.closest
global.Element.prototype.closest = jest.fn();

// Mock Element.matches
global.Element.prototype.matches = jest.fn();

// Mock Node.appendChild
global.Node.prototype.appendChild = jest.fn();

// Mock Node.removeChild
global.Node.prototype.removeChild = jest.fn();

// Mock Node.insertBefore
global.Node.prototype.insertBefore = jest.fn();

// Mock Node.replaceChild
global.Node.prototype.replaceChild = jest.fn();

// Mock Node.cloneNode
global.Node.prototype.cloneNode = jest.fn();

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Reset local storage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // Reset session storage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();

  // Reset fetch mock
  global.fetch.mockClear();

  // Ensure document.body exists and is properly set up
  if (!document.body) {
    document.body = document.createElement('body');
    document.documentElement.appendChild(document.body);
  }

  // Clear document body
  document.body.innerHTML = '';

  // Ensure root container exists for React Testing Library
  let rootContainer = document.getElementById('root');
  if (!rootContainer) {
    rootContainer = document.createElement('div');
    rootContainer.id = 'root';
    document.body.appendChild(rootContainer);
  }

  // Also create a default container for React Testing Library
  if (!document.body.querySelector('[data-testid]')) {
    const defaultContainer = document.createElement('div');
    defaultContainer.setAttribute('data-testid', 'default-test-container');
    document.body.appendChild(defaultContainer);
  }

  // Create additional container for React 18 createRoot
  const reactRootContainer = document.createElement('div');
  reactRootContainer.id = 'react-root';
  document.body.appendChild(reactRootContainer);

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });

  // Mock window.history
  Object.defineProperty(window, 'history', {
    value: {
      length: 1,
      scrollRestoration: 'auto',
      state: null,
      pushState: jest.fn(),
      replaceState: jest.fn(),
      go: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  // Clean up any remaining DOM elements
  document.body.innerHTML = '';
});

// Global test utilities
global.testUtils = {
  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: 'http://localhost:3000/api/test',
    clone: () => ({ ...this }),
  }),

  // Mock API error
  mockApiError: (message, status = 400) => ({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
    headers: new Headers(),
    redirected: false,
    type: 'error',
    url: 'http://localhost:3000/api/test',
    clone: () => ({ ...this }),
  }),

  // Wait for component updates
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  // Create mock component props
  createMockProps: (overrides = {}) => ({
    id: 'test-id',
    className: 'test-class',
    children: null,
    ...overrides,
  }),

  // Mock form data
  createMockFormData: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  },

  // Mock file upload
  createMockFile: (name, content, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  },

  // Mock user interactions
  userEvent: {
    click: async (element) => {
      element.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    type: async (element, text) => {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    clear: async (element) => {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    select: async (element, value) => {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  },

  // Performance monitoring
  measureTime: async (fn, name = 'Operation') => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 1000) {
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  },

  // Memory monitoring
  measureMemory: (fn, name = 'Operation') => {
    const startMemory = process.memoryUsage().heapUsed;
    const result = fn();
    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;

    if (memoryIncrease > 1024 * 1024) { // 1MB
      console.warn(`Memory warning: ${name} increased memory by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }

    return { result, memoryIncrease };
  },

  // Mock navigation
  navigation: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    reload: jest.fn(),
  },

  // Mock authentication
  auth: {
    getToken: () => 'mock-jwt-token',
    getUser: () => ({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT',
    }),
    isAuthenticated: () => true,
  },

  // Mock form validation
  validation: {
    required: (value) => !!value,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^\+?[1-9]\d{1,14}$/.test(value),
    minLength: (value, min) => value.length >= min,
    maxLength: (value, max) => value.length <= max,
    pattern: (value, regex) => regex.test(value),
  },
};

// Custom Jest matchers
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass,
    };
  },

  toBeValidPhoneNumber(received) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = typeof received === 'string' && phoneRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid phone number`,
      pass,
    };
  },

  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass,
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toHaveRequiredFields(received, fields) {
    const missingFields = fields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    return {
      message: () => `expected object to have required fields: ${missingFields.join(', ')}`,
      pass,
    };
  },

  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods to reduce noise during tests
const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

beforeAll(() => {
  // Only mock console methods in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Export utilities for debugging in tests
if (process.env.NODE_ENV === 'test') {
  global.originalConsole = originalConsole;
}