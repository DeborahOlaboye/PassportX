/**
 * Additional test setup for WalletConnect tests
 */

// Mock console for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Global test timeout
jest.setTimeout(10000);

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
