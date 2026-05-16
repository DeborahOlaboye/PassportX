/**
 * Tests for validateCommunityOptionalFields helper in api-validation
 */

import { validateCommunityOptionalFields } from '../../../src/lib/api-validation';

describe('validateCommunityOptionalFields', () => {
  it('returns empty array for an empty body (all optional)', () => {
    expect(validateCommunityOptionalFields({})).toEqual([]);
  });

  it('returns empty array when website is a valid https URL', () => {
    expect(
      validateCommunityOptionalFields({ website: 'https://example.com' })
    ).toEqual([]);
  });

  it('returns error when website is not a valid URL', () => {
    const errors = validateCommunityOptionalFields({ website: 'not-a-url' });
    expect(errors).toContain('website must be a valid http or https URL');
  });

  it('returns error for ftp website URL', () => {
    const errors = validateCommunityOptionalFields({
      website: 'ftp://example.com',
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns empty array when network is testnet', () => {
    expect(validateCommunityOptionalFields({ network: 'testnet' })).toEqual([]);
  });

  it('returns empty array when network is mainnet', () => {
    expect(validateCommunityOptionalFields({ network: 'mainnet' })).toEqual([]);
  });

  it('returns error when network is unknown', () => {
    const errors = validateCommunityOptionalFields({ network: 'devnet' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('network must be one of');
  });

  it('returns empty array when primaryColor is valid hex', () => {
    expect(
      validateCommunityOptionalFields({
        theme: { primaryColor: '#ff0000', secondaryColor: '#000' },
      })
    ).toEqual([]);
  });

  it('returns error when primaryColor is not a valid hex color', () => {
    const errors = validateCommunityOptionalFields({
      theme: { primaryColor: 'red' },
    });
    expect(errors).toContain(
      'theme.primaryColor must be a valid hex color (e.g. #fff or #ffffff)'
    );
  });

  it('returns error when secondaryColor is not a valid hex color', () => {
    const errors = validateCommunityOptionalFields({
      theme: { primaryColor: '#fff', secondaryColor: 'blue' },
    });
    expect(errors).toContain(
      'theme.secondaryColor must be a valid hex color (e.g. #fff or #ffffff)'
    );
  });

  it('returns empty array for a valid tags list', () => {
    expect(
      validateCommunityOptionalFields({ tags: ['web3', 'defi'] })
    ).toEqual([]);
  });

  it('returns error when tags exceed item limit', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const errors = validateCommunityOptionalFields({ tags: tooMany });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error when tags contains an empty string', () => {
    const errors = validateCommunityOptionalFields({ tags: ['ok', ''] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns multiple errors for multiple invalid fields', () => {
    const errors = validateCommunityOptionalFields({
      website: 'bad-url',
      network: 'devnet',
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores fields not under validation without error', () => {
    expect(
      validateCommunityOptionalFields({ stxPayment: 100, txId: '0xabc' })
    ).toEqual([]);
  });
});
