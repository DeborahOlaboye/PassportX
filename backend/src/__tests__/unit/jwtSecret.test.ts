import {
  requireJwtSecret,
  _resetJwtSecretCache,
} from '../../utils/jwtSecret';

describe('requireJwtSecret()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetJwtSecretCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetJwtSecretCache();
  });

  it('returns the JWT_SECRET when set', () => {
    process.env.JWT_SECRET = 'test-secret-value';
    expect(requireJwtSecret()).toBe('test-secret-value');
  });

  it('throws a descriptive error when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => requireJwtSecret()).toThrow(
      'JWT_SECRET environment variable is not set'
    );
  });

  it('throws when JWT_SECRET is an empty string', () => {
    process.env.JWT_SECRET = '';
    expect(() => requireJwtSecret()).toThrow(
      'JWT_SECRET environment variable is not set'
    );
  });

  it('caches the secret so subsequent calls do not re-read process.env', () => {
    process.env.JWT_SECRET = 'first-secret';
    const first = requireJwtSecret();

    // Simulate env changing after first call
    process.env.JWT_SECRET = 'changed-secret';
    const second = requireJwtSecret();

    expect(first).toBe('first-secret');
    expect(second).toBe('first-secret'); // should return cached value
  });

  it('picks up a new value after cache reset', () => {
    process.env.JWT_SECRET = 'original';
    requireJwtSecret(); // prime cache

    _resetJwtSecretCache();
    process.env.JWT_SECRET = 'updated';

    expect(requireJwtSecret()).toBe('updated');
  });

  it('throws after cache reset when JWT_SECRET is missing', () => {
    process.env.JWT_SECRET = 'valid';
    requireJwtSecret(); // prime cache

    _resetJwtSecretCache();
    delete process.env.JWT_SECRET;

    expect(() => requireJwtSecret()).toThrow();
  });
});
