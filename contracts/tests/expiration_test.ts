import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: 'Badge expiration logic: template creation, minting, and expiration check',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const communityId = 1;
    const expirationDuration = 10; // 10 blocks

    // Initial setup: create community and template
    let block = chain.mineBlock([
      Tx.contractCall('community-manager', 'create-community', [types.ascii('C1'), types.ascii('D1')], deployer.address),
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Expiring Badge'),
          types.ascii('This badge expires in 10 blocks'),
          types.uint(1),
          types.uint(1),
          types.uint(communityId),
          types.uint(expirationDuration),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [
          types.principal(recipient.address),
          types.uint(1),
          types.uint(communityId),
        ],
        deployer.address
      ),
    ]);

    // The mint-badge happened at a specific block height
    const mintHeight = block.height;
    const expectedExpiration = mintHeight + expirationDuration;

    // Check metadata via read-only calls
    let metadataResult = chain.callReadOnlyFn('badge-metadata', 'get-badge-metadata', [types.uint(1)], deployer.address);
    let isExpiredResult = chain.callReadOnlyFn('badge-metadata', 'is-badge-expired', [types.uint(1)], deployer.address);
    let isValidResult = chain.callReadOnlyFn('badge-metadata', 'is-badge-valid', [types.uint(1)], deployer.address);

    const metadata = metadataResult.result.expectSome().expectTuple();
    assertEquals(metadata['expiration-height'], types.uint(expectedExpiration));
    assertEquals(isExpiredResult.result, types.bool(false)); 
    assertEquals(isValidResult.result, types.bool(true));

    // Mine blocks until expiration
    chain.mineEmptyBlockUntil(expectedExpiration);

    // Check expiration again (Block height is now >= expectedExpiration)
    isExpiredResult = chain.callReadOnlyFn('badge-metadata', 'is-badge-expired', [types.uint(1)], deployer.address);
    isValidResult = chain.callReadOnlyFn('badge-metadata', 'is-badge-valid', [types.uint(1)], deployer.address);

    assertEquals(isExpiredResult.result, types.bool(true));
    assertEquals(isValidResult.result, types.bool(false));
  },
});

Clarinet.test({
  name: 'Badge renewal logic: renew an expired badge',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const communityId = 1;
    const expirationDuration = 5;

    let block = chain.mineBlock([
      Tx.contractCall('community-manager', 'create-community', [types.ascii('C1'), types.ascii('D1')], deployer.address),
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Renewable Badge'),
          types.ascii('Description'),
          types.uint(1),
          types.uint(1),
          types.uint(communityId),
          types.uint(expirationDuration),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [
          types.principal(recipient.address),
          types.uint(1),
          types.uint(communityId),
        ],
        deployer.address
      ),
    ]);

    const mintHeight = block.height;

    // Wait for expiration
    chain.mineEmptyBlockUntil(mintHeight + expirationDuration);

    // Verify expired
    let isExpired = chain.callReadOnlyFn('badge-metadata', 'is-badge-expired', [types.uint(1)], deployer.address);
    assertEquals(isExpired.result, types.bool(true));

    // Renew badge
    let renewBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'renew-badge',
        [types.uint(1), types.uint(communityId)],
        deployer.address
      ),
    ]);

    renewBlock.receipts[0].result.expectOk().expectBool(true);

    // Check if valid again
    let isExpiredFinal = chain.callReadOnlyFn('badge-metadata', 'is-badge-expired', [types.uint(1)], deployer.address);
    let isValidFinal = chain.callReadOnlyFn('badge-metadata', 'is-badge-valid', [types.uint(1)], deployer.address);

    assertEquals(isExpiredFinal.result, types.bool(false));
    assertEquals(isValidFinal.result, types.bool(true));
  },
});
