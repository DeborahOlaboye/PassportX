import { logInfo, logError } from '../../src/utils/logger';

describe('logger', () => {
  it('calls console methods without throwing', () => {
    // smoke test
    expect(() => logInfo('hello')).not.toThrow();
    expect(() => logError('oops')).not.toThrow();
  });
});
