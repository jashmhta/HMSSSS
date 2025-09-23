// Polyfills for Jest testing environment

import 'whatwg-fetch';
import 'abort-controller/polyfill';

// Ensure DOM is properly initialized for React 18 createRoot
if (typeof global.document === 'undefined') {
  const { JSDOM } = require('jsdom');
  const jsdom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously',
  });

  const { window } = jsdom;

  // Setup globals
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.Node = window.Node;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.Document = window.Document;
  global.DocumentFragment = window.DocumentFragment;
  global.XMLHttpRequest = window.XMLHttpRequest;
  global.FormData = window.FormData;
  global.URL = window.URL;
  global.URLSearchParams = window.URLSearchParams;

  // Copy window properties to global
  Object.keys(window).forEach(property => {
    if (typeof global[property] === 'undefined') {
      global[property] = window[property];
    }
  });

  // Ensure React can find the DOM root
  global.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });

  // Create a global container for React Testing Library
  global.testingContainer = document.createElement('div');
  document.body.appendChild(global.testingContainer);
} else {
  // Create a global container for React Testing Library
  if (!global.testingContainer) {
    global.testingContainer = document.createElement('div');
    document.body.appendChild(global.testingContainer);
  }
}

// Create initial containers if they don't exist
if (typeof document !== 'undefined') {
  // Ensure the root container exists
  if (!document.getElementById('root')) {
    const rootContainer = document.createElement('div');
    rootContainer.id = 'root';
    document.body.appendChild(rootContainer);
  }

  // Ensure testing container exists
  if (!global.testingContainer) {
    global.testingContainer = document.createElement('div');
    document.body.appendChild(global.testingContainer);
  }
}

// Additional polyfills for comprehensive browser API support

// TextDecoder and TextEncoder
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// ReadableStream
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream;
}

// URL and URLSearchParams
if (typeof global.URL === 'undefined') {
  const { URL, URLSearchParams } = require('url');
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

// WebSocket
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class WebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.bufferedAmount = 0;
      this.extensions = '';
      this.protocol = '';
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
    }

    send(data) {
      // Mock send implementation
    }

    close() {
      this.readyState = 3;
      if (this.onclose) {
        this.onclose({ wasClean: true, code: 1000, reason: '' });
      }
    }

    addEventListener(type, listener) {
      this[`on${type}`] = listener;
    }

    removeEventListener(type, listener) {
      if (this[`on${type}`] === listener) {
        this[`on${type}`] = null;
      }
    }
  };
}

// EventSource
if (typeof global.EventSource === 'undefined') {
  global.EventSource = class EventSource {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.withCredentials = false;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
    }

    close() {
      this.readyState = 2;
    }

    addEventListener(type, listener) {
      this[`on${type}`] = listener;
    }

    removeEventListener(type, listener) {
      if (this[`on${type}`] === listener) {
        this[`on${type}`] = null;
      }
    }
  };
}

// Notification
if (typeof global.Notification === 'undefined') {
  global.Notification = class Notification {
    constructor(title, options = {}) {
      this.title = title;
      this.options = options;
      this.permission = 'granted';
    }

    static requestPermission(callback) {
      const permission = 'granted';
      if (callback) {
        callback(permission);
      }
      return Promise.resolve(permission);
    }

    static get permission() {
      return 'granted';
    }
  };
}

// Service Worker
if (typeof global.ServiceWorker === 'undefined') {
  global.ServiceWorker = class ServiceWorker {
    constructor() {
      this.state = 'activated';
      this.onstatechange = null;
    }

    postMessage(message) {
      // Mock postMessage implementation
    }
  };

  global.ServiceWorkerRegistration = class ServiceWorkerRegistration {
    constructor() {
      this.active = new ServiceWorker();
      this.installing = null;
      this.waiting = null;
      this.scope = '/';
    }

    showNotification(title, options = {}) {
      return Promise.resolve();
    }

    unregister() {
      return Promise.resolve(true);
    }
  };

  global.ServiceWorkerContainer = class ServiceWorkerContainer {
    constructor() {
      this.controller = null;
      this.oncontrollerchange = null;
    }

    register(url, options = {}) {
      return Promise.resolve(new ServiceWorkerRegistration());
    }

    getRegistration() {
      return Promise.resolve(new ServiceWorkerRegistration());
    }

    getRegistrations() {
      return Promise.resolve([new ServiceWorkerRegistration()]);
    }
  };

  navigator.serviceWorker = new ServiceWorkerContainer();
}

// Permissions API
if (typeof global.navigator.permissions === 'undefined') {
  global.navigator.permissions = {
    query: (descriptor) => {
      return Promise.resolve({ state: 'granted' });
    },
    request: (descriptor) => {
      return Promise.resolve({ state: 'granted' });
    },
    revoke: (descriptor) => {
      return Promise.resolve({ state: 'prompt' });
    }
  };
}

// Geolocation API
if (typeof global.navigator.geolocation === 'undefined') {
  global.navigator.geolocation = {
    getCurrentPosition: (success, error, options) => {
      const position = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 100,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };
      success(position);
    },
    watchPosition: (success, error, options) => {
      const watchId = Date.now();
      const position = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 100,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };
      success(position);
      return watchId;
    },
    clearWatch: (watchId) => {
      // Mock clearWatch implementation
    }
  };
}

// Battery API
if (typeof global.navigator.getBattery === 'undefined') {
  global.navigator.getBattery = () => {
    return Promise.resolve({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });
  };
}

// Vibration API
if (typeof global.navigator.vibrate === 'undefined') {
  global.navigator.vibrate = (pattern) => {
    return true;
  };
}

// Screen Orientation API
if (typeof global.screen.orientation === 'undefined') {
  Object.defineProperty(global.screen, 'orientation', {
    value: {
      type: 'portrait-primary',
      angle: 0,
      lock: jest.fn(),
      unlock: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    },
    writable: false
  });
}

// Device Motion API
if (typeof global.DeviceMotionEvent === 'undefined') {
  global.DeviceMotionEvent = class DeviceMotionEvent extends Event {
    constructor(type, init) {
      super(type);
      this.acceleration = init.acceleration;
      this.accelerationIncludingGravity = init.accelerationIncludingGravity;
      this.rotationRate = init.rotationRate;
      this.interval = init.interval;
    }
  };
}

// Device Orientation API
if (typeof global.DeviceOrientationEvent === 'undefined') {
  global.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
    constructor(type, init) {
      super(type);
      this.alpha = init.alpha;
      this.beta = init.beta;
      this.gamma = init.gamma;
      this.absolute = init.absolute;
    }
  };
}

// Touch Events
if (typeof global.TouchEvent === 'undefined') {
  global.TouchEvent = class TouchEvent extends UIEvent {
    constructor(type, init) {
      super(type, init);
      this.touches = init.touches || [];
      this.targetTouches = init.targetTouches || [];
      this.changedTouches = init.changedTouches || [];
      this.ctrlKey = init.ctrlKey || false;
      this.shiftKey = init.shiftKey || false;
      this.altKey = init.altKey || false;
      this.metaKey = init.metaKey || false;
    }
  };
}

// Pointer Events
if (typeof global.PointerEvent === 'undefined') {
  global.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, init) {
      super(type, init);
      this.pointerId = init.pointerId || 0;
      this.width = init.width || 1;
      this.height = init.height || 1;
      this.pressure = init.pressure || 0.5;
      this.tangentialPressure = init.tangentialPressure || 0;
      this.tiltX = init.tiltX || 0;
      this.tiltY = init.tiltY || 0;
      this.twist = init.twist || 0;
      this.pointerType = init.pointerType || 'mouse';
      this.isPrimary = init.isPrimary || false;
    }
  };
}

// Web Animations API
if (typeof global.Animation === 'undefined') {
  global.Animation = class Animation {
    constructor(effect, timeline) {
      this.effect = effect;
      this.timeline = timeline;
      this.currentTime = 0;
      this.startTime = null;
      this.playState = 'idle';
      this.onfinish = null;
      this.oncancel = null;
    }

    play() {
      this.playState = 'running';
    }

    pause() {
      this.playState = 'paused';
    }

    cancel() {
      this.playState = 'idle';
      if (this.oncancel) {
        this.oncancel(new Event('cancel'));
      }
    }

    finish() {
      this.playState = 'finished';
      if (this.onfinish) {
        this.onfinish(new Event('finish'));
      }
    }
  };
}

// Web Speech API
if (typeof global.SpeechRecognition === 'undefined') {
  global.SpeechRecognition = class SpeechRecognition extends EventTarget {
    constructor() {
      super();
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.maxAlternatives = 1;
      this.serviceURI = '';
    }

    start() {
      this.dispatchEvent(new Event('start'));
    }

    stop() {
      this.dispatchEvent(new Event('end'));
    }

    abort() {
      this.dispatchEvent(new Event('error'));
    }
  };
}

// WebGL Context
if (typeof global.WebGLRenderingContext === 'undefined') {
  const mockWebGLContext = {
    canvas: null,
    drawingBufferWidth: 300,
    drawingBufferHeight: 150,
    getContextAttributes: () => ({
      alpha: true,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'default'
    }),
    isContextLost: () => false,
    getSupportedExtensions: () => [],
    getExtension: () => null,
    activeTexture: jest.fn(),
    attachShader: jest.fn(),
    bindAttribLocation: jest.fn(),
    bindBuffer: jest.fn(),
    bindFramebuffer: jest.fn(),
    bindRenderbuffer: jest.fn(),
    bindTexture: jest.fn(),
    blendColor: jest.fn(),
    blendEquation: jest.fn(),
    blendEquationSeparate: jest.fn(),
    blendFunc: jest.fn(),
    blendFuncSeparate: jest.fn(),
    bufferData: jest.fn(),
    bufferSubData: jest.fn(),
    checkFramebufferStatus: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    clearDepth: jest.fn(),
    clearStencil: jest.fn(),
    colorMask: jest.fn(),
    compileShader: jest.fn(),
    compressedTexImage2D: jest.fn(),
    compressedTexSubImage2D: jest.fn(),
    copyTexImage2D: jest.fn(),
    copyTexSubImage2D: jest.fn(),
    createBuffer: jest.fn(),
    createFramebuffer: jest.fn(),
    createProgram: jest.fn(),
    createRenderbuffer: jest.fn(),
    createShader: jest.fn(),
    createTexture: jest.fn(),
    cullFace: jest.fn(),
    deleteBuffer: jest.fn(),
    deleteFramebuffer: jest.fn(),
    deleteProgram: jest.fn(),
    deleteRenderbuffer: jest.fn(),
    deleteShader: jest.fn(),
    deleteTexture: jest.fn(),
    depthFunc: jest.fn(),
    depthMask: jest.fn(),
    depthRange: jest.fn(),
    detachShader: jest.fn(),
    disable: jest.fn(),
    disableVertexAttribArray: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    enable: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    finish: jest.fn(),
    flush: jest.fn(),
    framebufferRenderbuffer: jest.fn(),
    framebufferTexture2D: jest.fn(),
    frontFace: jest.fn(),
    generateMipmap: jest.fn(),
    getActiveAttrib: jest.fn(),
    getActiveUniform: jest.fn(),
    getAttachedShaders: jest.fn(),
    getAttribLocation: jest.fn(),
    getBufferParameter: jest.fn(),
    getContextAttributes: jest.fn(),
    getError: () => 0,
    getExtension: () => null,
    getFramebufferAttachmentParameter: jest.fn(),
    getParameter: jest.fn(),
    getProgramInfoLog: () => '',
    getProgramParameter: jest.fn(),
    getRenderbufferParameter: jest.fn(),
    getShaderInfoLog: () => '',
    getShaderParameter: jest.fn(),
    getShaderPrecisionFormat: () => ({
      rangeMin: 0,
      rangeMax: 0,
      precision: 0
    }),
    getSupportedExtensions: () => [],
    getTexParameter: jest.fn(),
    getUniform: jest.fn(),
    getUniformLocation: jest.fn(),
    getVertexAttrib: jest.fn(),
    getVertexAttribOffset: jest.fn(),
    isBuffer: () => true,
    isContextLost: () => false,
    isEnabled: () => true,
    isFramebuffer: () => true,
    isProgram: () => true,
    isRenderbuffer: () => true,
    isShader: () => true,
    isTexture: () => true,
    lineWidth: jest.fn(),
    linkProgram: jest.fn(),
    pixelStorei: jest.fn(),
    polygonOffset: jest.fn(),
    readPixels: jest.fn(),
    renderbufferStorage: jest.fn(),
    sampleCoverage: jest.fn(),
    scissor: jest.fn(),
    shaderSource: jest.fn(),
    stencilFunc: jest.fn(),
    stencilFuncSeparate: jest.fn(),
    stencilMask: jest.fn(),
    stencilMaskSeparate: jest.fn(),
    stencilOp: jest.fn(),
    stencilOpSeparate: jest.fn(),
    texImage2D: jest.fn(),
    texParameterf: jest.fn(),
    texParameteri: jest.fn(),
    texSubImage2D: jest.fn(),
    uniform1f: jest.fn(),
    uniform1i: jest.fn(),
    uniform1fv: jest.fn(),
    uniform1iv: jest.fn(),
    uniform2f: jest.fn(),
    uniform2i: jest.fn(),
    uniform2fv: jest.fn(),
    uniform2iv: jest.fn(),
    uniform3f: jest.fn(),
    uniform3i: jest.fn(),
    uniform3fv: jest.fn(),
    uniform3iv: jest.fn(),
    uniform4f: jest.fn(),
    uniform4i: jest.fn(),
    uniform4fv: jest.fn(),
    uniform4iv: jest.fn(),
    uniformMatrix2fv: jest.fn(),
    uniformMatrix3fv: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    useProgram: jest.fn(),
    validateProgram: jest.fn(),
    vertexAttrib1f: jest.fn(),
    vertexAttrib1fv: jest.fn(),
    vertexAttrib2f: jest.fn(),
    vertexAttrib2fv: jest.fn(),
    vertexAttrib3f: jest.fn(),
    vertexAttrib3fv: jest.fn(),
    vertexAttrib4f: jest.fn(),
    vertexAttrib4fv: jest.fn(),
    vertexAttribPointer: jest.fn(),
    viewport: jest.fn()
  };

  global.WebGLRenderingContext = mockWebGLContext;
}

// Mock HTMLCanvasElement.getContext for WebGL
const originalGetContext = global.HTMLCanvasElement.prototype.getContext;
global.HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  return originalGetContext.call(this, contextType, ...args);
};