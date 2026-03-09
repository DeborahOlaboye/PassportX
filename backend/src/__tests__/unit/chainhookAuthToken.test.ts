/**
 * Tests that the getChainhookAuthToken() helper used inside predicate builders
 * throws when CHAINHOOK_AUTH_TOKEN is unset, preventing predicates from being
 * registered with blank authorization headers.
 */

describe('Chainhook auth token — predicate builders', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.CHAINHOOK_AUTH_TOKEN;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws when CHAINHOOK_AUTH_TOKEN is missing', () => {
    jest.resetModules();
    const { getPredicateConfigs } = require('../../config/predicates');
    expect(() => getPredicateConfigs()).toThrow(
      'CHAINHOOK_AUTH_TOKEN is not set'
    );
  });

  it('embeds the token in the predicate authorization_header when set', () => {
    process.env.CHAINHOOK_AUTH_TOKEN = 'secure-test-token';
    jest.resetModules();
    const { getPredicateConfigs } = require('../../config/predicates');
    const config = getPredicateConfigs();
    expect(
      config.communityCreation.then_that.http_post.authorization_header
    ).toBe('secure-test-token');
  });

  it('uses the full token value without alteration', () => {
    const token = 'abc123-unique-secret-xyz';
    process.env.CHAINHOOK_AUTH_TOKEN = token;
    jest.resetModules();
    const { getPredicateConfigs } = require('../../config/predicates');
    const config = getPredicateConfigs();
    expect(
      config.communityCreation.then_that.http_post.authorization_header
    ).toBe(token);
  });
});
