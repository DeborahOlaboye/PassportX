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

    const block = chain.mineBlock([
      // 1. Create a template with 10 blocks expiration
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Expiring Badge'),
          types.ascii('This badge expires in 10 blocks'),
          types.uint(1), // category
          types.uint(1), // default-level
          types.uint(communityId),
          types.uint(expirationDuration),
        ],
        deployer.address
      ),

      // 2. Mint the badge
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [
          types.principal(recipient.address),
          types.uint(1), // template-id
          types.uint(communityId),
        ],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectOk().expectUint(1); // template-id 1
    block.receipts[1].result.expectOk().expectUint(1); // badge-id 1

    const initialHeight = block.height;
    const expectedExpiration = initialHeight + expirationDuration;

    // 3. Check metadata
    const metadataBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-metadata',
        'get-badge-metadata',
        [types.uint(1)],
        deployer.address
      ),
      Tx.contractCall(
        'badge-metadata',
        'is-badge-expired',
        [types.uint(1)],
        deployer.address
      ),
      Tx.contractCall(
        'badge-metadata',
        'is-badge-valid',
        [types.uint(1)],
        deployer.address
      ),
    ]);

    const metadata = metadataBlock.receipts[0].result.expectSome().expectTuple();
    assertEquals(metadata['expiration-height'], types.uint(expectedExpiration));
    assertEquals(metadataBlock.receipts[1].result, types.bool(false)); // Not expired yet
    assertEquals(metadataBlock.receipts[2].result, types.bool(true)); // Valid

    // 4. Mine blocks until expiration
    chain.mineEmptyBlockUntil(expectedExpiration);

    // 5. Check expiration again
    const expiredBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-metadata',
        'is-badge-expired',
        [types.uint(1)],
        deployer.address
      ),
      Tx.contractCall(
        'badge-metadata',
        'is-badge-valid',
        [types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(expiredBlock.receipts[0].result, types.bool(true)); // Expired
    assertEquals(expiredBlock.receipts[1].result, types.bool(false)); // Not valid anymore
  },
});

Clarinet.test({
  name: 'Badge renewal logic: renew an expired badge',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const communityId = 1;
    const expirationDuration = 5;

    const block = chain.mineBlock([
      // 1. Create template
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
      // 2. Mint badge
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

    block.receipts[1].result.expectOk();

    // 3. Wait for expiration
    chain.mineEmptyBlockUntil(block.height + expirationDuration);

    // 4. Check expired
    const checkBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-metadata',
        'is-badge-expired',
        [types.uint(1)],
        deployer.address
      ),
    ]);
    assertEquals(checkBlock.receipts[0].result, types.bool(true));

    // 5. Renew badge
    const renewBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'renew-badge',
        [types.uint(1), types.uint(communityId)],
        deployer.address
      ),
    ]);

    renewBlock.receipts[0].result.expectOk().expectBool(true);

    // 6. Check if valid again
    const finalCheck = chain.mineBlock([
      Tx.contractCall(
        'badge-metadata',
        'is-badge-expired',
        [types.uint(1)],
        deployer.address
      ),
      Tx.contractCall(
        'badge-metadata',
        'is-badge-valid',
        [types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(finalCheck.receipts[0].result, types.bool(false)); // Not expired
    assertEquals(finalCheck.receipts[1].result, types.bool(true)); // Valid
  },
});
