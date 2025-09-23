/**
 * React 18 Testing Setup for Jest
 * Simplified setup to bypass createRoot issues
 */

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
    addListener: jest.fn(),
    removeListener: jest.fn(),
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
  getRandomValues: jest.fn((arr) => {
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

// Mock getComputedStyle to return a proper CSSStyleDeclaration object
global.getComputedStyle = jest.fn().mockImplementation((element) => {
  // Create a simple object that acts as CSSStyleDeclaration
  const style = {
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    width: 'auto',
    height: 'auto',
    color: 'black',
    backgroundColor: 'transparent',
    border: 'none',
    margin: '0',
    padding: '0',
    fontSize: '16px',
    lineHeight: '1.5',
    position: 'static',
    top: 'auto',
    left: 'auto',
    bottom: 'auto',
    right: 'auto',
    zIndex: 'auto',
    overflow: 'visible',
    textAlign: 'left',
    textDecoration: 'none',
    textTransform: 'none',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'sans-serif',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    textIndent: '0',
    whiteSpace: 'normal',
    clip: 'auto',
    cursor: 'auto',
    direction: 'ltr',
    boxShadow: 'none',
    transform: 'none',
    transition: 'none',
    animation: 'none',
    flex: 'none',
    order: '0',
    flexGrow: '0',
    flexShrink: '1',
    flexBasis: 'auto',
    gridArea: 'auto',
    gridColumn: 'auto',
    gridRow: 'auto',
    justifySelf: 'auto',
    alignSelf: 'auto',
    listStyleType: 'disc',
    listStylePosition: 'outside',
    listStyleImage: 'none',
    quotes: 'auto',
    outline: 'none',
    outlineWidth: '0',
    outlineStyle: 'none',
    outlineColor: 'invert',
    tableLayout: 'auto',
    borderCollapse: 'separate',
    borderSpacing: '0',
    captionSide: 'top',
    emptyCells: 'show',
    verticalAlign: 'baseline',
    content: 'normal',
    counterIncrement: 'none',
    counterReset: 'none',
    orphans: '2',
    widows: '2',
    pageBreakBefore: 'auto',
    pageBreakAfter: 'auto',
    pageBreakInside: 'auto',
    float: 'none',
    clear: 'none',
    unicodeBidi: 'normal',
    borderRadius: '0',
    borderTopLeftRadius: '0',
    borderTopRightRadius: '0',
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
    perspective: 'none',
    backfaceVisibility: 'visible',
    transformStyle: 'flat',
    transformOrigin: '50% 50% 0',
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignContent: 'stretch',
    gridTemplateColumns: 'none',
    gridTemplateRows: 'none',
    gridTemplateAreas: 'none',
    gridAutoColumns: 'auto',
    gridAutoRows: 'auto',
    gridAutoFlow: 'row',
    gridColumnGap: '0',
    gridRowGap: '0',
    pointerEvents: 'auto',
    cssText: '',
    parentRule: null,
    // Additional properties for user-event compatibility
    overflowX: 'visible',
    overflowY: 'visible',
    boxSizing: 'content-box',
    float: 'none',
    clear: 'none',
    clip: 'auto',
    filter: 'none',
    backdropFilter: 'none',
    mixBlendMode: 'normal',
    isolation: 'auto',
    backgroundBlendMode: 'normal',
    mask: 'none',
    maskType: 'luminance',
    clipPath: 'none',
    clipRule: 'nonzero',
    maskImage: 'none',
    maskMode: 'match-source',
    maskRepeat: 'repeat',
    maskPosition: 'center',
    maskSize: 'auto',
    maskComposite: 'add',
    maskBorder: 'none',
    maskBorderMode: 'alpha',
    maskBorderSource: 'none',
    maskBorderSlice: '100%',
    maskBorderWidth: '1',
    maskBorderOutset: '0',
    maskBorderRepeat: 'stretch',
    maskPositionX: 'center',
    maskPositionY: 'center',
    maskOrigin: 'border-box',
    maskClip: 'border-box',
  };

  // Add getPropertyValue method - this is the key one that's failing
  style.getPropertyValue = jest.fn((property) => {
    // Handle both camelCase and kebab-case
    const propMap = {
      'display': style.display,
      'visibility': style.visibility,
      'opacity': style.opacity,
      'width': style.width,
      'height': style.height,
      'color': style.color,
      'background-color': style.backgroundColor,
      'backgroundColor': style.backgroundColor,
      'border': style.border,
      'margin': style.margin,
      'padding': style.padding,
      'font-size': style.fontSize,
      'fontSize': style.fontSize,
      'line-height': style.lineHeight,
      'lineHeight': style.lineHeight,
      'position': style.position,
      'top': style.top,
      'left': style.left,
      'bottom': style.bottom,
      'right': style.right,
      'z-index': style.zIndex,
      'zIndex': style.zIndex,
      'overflow': style.overflow,
      'text-align': style.textAlign,
      'textAlign': style.textAlign,
      'text-decoration': style.textDecoration,
      'textDecoration': style.textDecoration,
      'text-transform': style.textTransform,
      'textTransform': style.textTransform,
      'font-weight': style.fontWeight,
      'fontWeight': style.fontWeight,
      'font-style': style.fontStyle,
      'fontStyle': style.fontStyle,
      'font-family': style.fontFamily,
      'fontFamily': style.fontFamily,
      'pointer-events': style.pointerEvents,
      'pointerEvents': style.pointerEvents,
      'cursor': style.cursor,
      'float': style.float,
      'clear': style.clear,
      'overflow-x': style.overflowX,
      'overflowX': style.overflowX,
      'overflow-y': style.overflowY,
      'overflowY': style.overflowY,
      'box-sizing': style.boxSizing,
      'boxSizing': style.boxSizing,
      'flex': style.flex,
      'flex-grow': style.flexGrow,
      'flexGrow': style.flexGrow,
      'flex-shrink': style.flexShrink,
      'flexShrink': style.flexShrink,
      'flex-basis': style.flexBasis,
      'flexBasis': style.flexBasis,
      'grid-template-columns': style.gridTemplateColumns,
      'gridTemplateColumns': style.gridTemplateColumns,
      'grid-template-rows': style.gridTemplateRows,
      'gridTemplateRows': style.gridTemplateRows,
      'grid-auto-columns': style.gridAutoColumns,
      'gridAutoColumns': style.gridAutoColumns,
      'grid-auto-rows': style.gridAutoRows,
      'gridAutoRows': style.gridAutoRows,
      'grid-auto-flow': style.gridAutoFlow,
      'gridAutoFlow': style.gridAutoFlow,
      'grid-column-gap': style.gridColumnGap,
      'gridColumnGap': style.gridColumnGap,
      'grid-row-gap': style.gridRowGap,
      'gridRowGap': style.gridRowGap,
      'justify-content': style.justifyContent,
      'justifyContent': style.justifyContent,
      'align-content': style.alignContent,
      'alignContent': style.alignContent,
      'align-items': style.alignItems,
      'alignItems': style.alignItems,
      'justify-self': style.justifySelf,
      'justifySelf': style.justifySelf,
      'align-self': style.alignSelf,
      'alignSelf': style.alignSelf,
      'order': style.order,
      'transform': style.transform,
      'transform-origin': style.transformOrigin,
      'transformOrigin': style.transformOrigin,
      'perspective': style.perspective,
      'perspective-origin': style.perspectiveOrigin,
      'perspectiveOrigin': style.perspectiveOrigin,
      'backface-visibility': style.backfaceVisibility,
      'backfaceVisibility': style.backfaceVisibility,
      'transform-style': style.transformStyle,
      'transformStyle': style.transformStyle,
      'transition': style.transition,
      'animation': style.animation,
      'animation-name': style.animationName,
      'animationName': style.animationName,
      'animation-duration': style.animationDuration,
      'animationDuration': style.animationDuration,
      'animation-timing-function': style.animationTimingFunction,
      'animationTimingFunction': style.animationTimingFunction,
      'animation-delay': style.animationDelay,
      'animationDelay': style.animationDelay,
      'animation-iteration-count': style.animationIterationCount,
      'animationIterationCount': style.animationIterationCount,
      'animation-direction': style.animationDirection,
      'animationDirection': style.animationDirection,
      'animation-fill-mode': style.animationFillMode,
      'animationFillMode': style.animationFillMode,
      'animation-play-state': style.animationPlayState,
      'animationPlayState': style.animationPlayState,
      'opacity': style.opacity,
      'filter': style.filter,
      'backdrop-filter': style.backdropFilter,
      'backdropFilter': style.backdropFilter,
      'mix-blend-mode': style.mixBlendMode,
      'mixBlendMode': style.mixBlendMode,
      'isolation': style.isolation,
      'background-blend-mode': style.backgroundBlendMode,
      'backgroundBlendMode': style.backgroundBlendMode,
      'mask': style.mask,
      'mask-type': style.maskType,
      'maskType': style.maskType,
      'clip': style.clip,
      'clip-path': style.clipPath,
      'clipPath': style.clipPath,
      'clip-rule': style.clipRule,
      'clipRule': style.clipRule,
      'mask-image': style.maskImage,
      'maskImage': style.maskImage,
      'mask-mode': style.maskMode,
      'maskMode': style.maskMode,
      'mask-repeat': style.maskRepeat,
      'maskRepeat': style.maskRepeat,
      'mask-position': style.maskPosition,
      'maskPosition': style.maskPosition,
      'mask-size': style.maskSize,
      'maskSize': style.maskSize,
      'mask-composite': style.maskComposite,
      'maskComposite': style.maskComposite,
      'mask-border': style.maskBorder,
      'maskBorder': style.maskBorder,
      'mask-border-mode': style.maskBorderMode,
      'maskBorderMode': style.maskBorderMode,
      'mask-border-source': style.maskBorderSource,
      'maskBorderSource': style.maskBorderSource,
      'mask-border-slice': style.maskBorderSlice,
      'maskBorderSlice': style.maskBorderSlice,
      'mask-border-width': style.maskBorderWidth,
      'maskBorderWidth': style.maskBorderWidth,
      'mask-border-outset': style.maskBorderOutset,
      'maskBorderOutset': style.maskBorderOutset,
      'mask-border-repeat': style.maskBorderRepeat,
      'maskBorderRepeat': style.maskBorderRepeat,
      'mask-position-x': style.maskPositionX,
      'maskPositionX': style.maskPositionX,
      'mask-position-y': style.maskPositionY,
      'maskPositionY': style.maskPositionY,
      'mask-origin': style.maskOrigin,
      'maskOrigin': style.maskOrigin,
      'mask-clip': style.maskClip,
      'maskClip': style.maskClip,
      'mask-type': style.maskType,
      'maskType': style.maskType,
      'overflow-x': style.overflowX,
      'overflowX': style.overflowX,
      'overflow-y': style.overflowY,
      'overflowY': style.overflowY,
      'box-sizing': style.boxSizing,
      'boxSizing': style.boxSizing,
      'filter': style.filter,
      'backdrop-filter': style.backdropFilter,
      'backdropFilter': style.backdropFilter,
      'mix-blend-mode': style.mixBlendMode,
      'mixBlendMode': style.mixBlendMode,
      'isolation': style.isolation,
      'background-blend-mode': style.backgroundBlendMode,
      'backgroundBlendMode': style.backgroundBlendMode,
      'clip-path': style.clipPath,
      'clipPath': style.clipPath,
      'clip-rule': style.clipRule,
      'clipRule': style.clipRule,
      'mask-image': style.maskImage,
      'maskImage': style.maskImage,
      'mask-mode': style.maskMode,
      'maskMode': style.maskMode,
      'mask-repeat': style.maskRepeat,
      'maskRepeat': style.maskRepeat,
      'mask-position': style.maskPosition,
      'maskPosition': style.maskPosition,
      'mask-size': style.maskSize,
      'maskSize': style.maskSize,
      'mask-composite': style.maskComposite,
      'maskComposite': style.maskComposite,
      'mask-border': style.maskBorder,
      'maskBorder': style.maskBorder,
      'mask-border-mode': style.maskBorderMode,
      'maskBorderMode': style.maskBorderMode,
      'mask-border-source': style.maskBorderSource,
      'maskBorderSource': style.maskBorderSource,
      'mask-border-slice': style.maskBorderSlice,
      'maskBorderSlice': style.maskBorderSlice,
      'mask-border-width': style.maskBorderWidth,
      'maskBorderWidth': style.maskBorderWidth,
      'mask-border-outset': style.maskBorderOutset,
      'maskBorderOutset': style.maskBorderOutset,
      'mask-border-repeat': style.maskBorderRepeat,
      'maskBorderRepeat': style.maskBorderRepeat,
      'mask-position-x': style.maskPositionX,
      'maskPositionX': style.maskPositionX,
      'mask-position-y': style.maskPositionY,
      'maskPositionY': style.maskPositionY,
      'mask-origin': style.maskOrigin,
      'maskOrigin': style.maskOrigin,
      'mask-clip': style.maskClip,
      'maskClip': style.maskClip,
    };
    return propMap[property] || '';
  });

  // Add other methods
  style.setProperty = jest.fn();
  style.removeProperty = jest.fn();
  style.item = jest.fn();
  style.getPropertyPriority = jest.fn(() => '');

  // Ensure the object has the proper prototype
  Object.setPrototypeOf(style, CSSStyleDeclaration.prototype);

  return style;
});

// Mock scrollIntoView
global.HTMLElement.prototype.scrollIntoView = jest.fn();
global.HTMLElement.prototype.focus = jest.fn();
global.HTMLElement.prototype.blur = jest.fn();
global.HTMLElement.prototype.click = jest.fn();
global.HTMLElement.prototype.addEventListener = jest.fn();
global.HTMLElement.prototype.removeEventListener = jest.fn();
global.HTMLElement.prototype.dispatchEvent = jest.fn();
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

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup and teardown hooks
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

  // Clear document body
  document.body.innerHTML = '';

  // Create root container for React Testing Library
  const rootContainer = document.createElement('div');
  rootContainer.id = 'root';
  document.body.appendChild(rootContainer);
});

afterEach(() => {
  // Clean up any remaining DOM elements
  document.body.innerHTML = '';
});

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
});