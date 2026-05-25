import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Test: Can mint badge with proper permissions
Clarinet.test({
  name: 'Can mint badge with proper permissions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    // First create a badge template
    const templateBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Test Badge'),
          types.ascii('A test badge'),
          types.uint(1),
          types.uint(1),
          types.uint(1),
          types.uint(0),
        ],
        deployer.address
      ),
    ]);

    assertEquals(templateBlock.receipts.length, 1);
    templateBlock.receipts[0].result.expectOk().expectUint(1);

    // Authorize deployer as issuer
    const authBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'authorize-issuer',
        [types.principal(deployer.address)],
        deployer.address
      ),
    ]);

    assertEquals(authBlock.receipts.length, 1);
    authBlock.receipts[0].result.expectOk();

    // Now mint the badge
    const block = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [types.principal(user1.address), types.uint(1), types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
  },
});

// Test: Non-transferable NFT prevents transfers
Clarinet.test({
  name: 'Non-transferable NFT prevents transfers',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;

    const block = chain.mineBlock([
      Tx.contractCall(
        'passport-nft',
        'transfer',
        [
          types.uint(1),
          types.principal(user1.address),
          types.principal(user2.address),
        ],
        user1.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result.expectErr(), types.uint(103));
  },
});

// Test: Get badge owner
Clarinet.test({
  name: 'Can retrieve badge owner',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    // Create and authorize issuer
    chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Owner Test'),
          types.ascii('Desc'),
          types.uint(1),
          types.uint(1),
          types.uint(1),
          types.uint(0),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'authorize-issuer',
        [types.principal(deployer.address)],
        deployer.address
      ),
    ]);

    // Mint badge
    const mintBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [types.principal(user1.address), types.uint(1), types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(mintBlock.receipts.length, 1);
    mintBlock.receipts[0].result.expectOk().expectUint(1);

    // Check owner via badge-reader
    const ownerBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-reader',
        'get-badge-owner',
        [types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(ownerBlock.receipts.length, 1);
    const ownerResult = ownerBlock.receipts[0].result.expectOk().expectSome();
    assertEquals(ownerResult, types.principal(user1.address));
  },
});

// Test: Badge metadata retrieval
Clarinet.test({
  name: 'Can retrieve badge metadata',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    // Create and authorize issuer
    chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Metadata Test'),
          types.ascii('Testing metadata'),
          types.uint(2),
          types.uint(3),
          types.uint(1),
          types.uint(100),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'authorize-issuer',
        [types.principal(deployer.address)],
        deployer.address
      ),
    ]);

    // Mint badge
    chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [types.principal(user1.address), types.uint(1), types.uint(1)],
        deployer.address
      ),
    ]);

    // Get badge metadata via reader
    const metaBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-reader',
        'get-badge-metadata',
        [types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(metaBlock.receipts.length, 1);
    const metaResult = metaBlock.receipts[0].result.expectOk().expectSome();
    const metaTuple = metaResult.expectTuple();
    assertEquals(metaTuple['category'], types.uint(2));
    assertEquals(metaTuple['level'], types.uint(3));
    assertEquals(metaTuple['active'], types.bool(true));
  },
});

// Test: Badge expiration check
Clarinet.test({
  name: 'Badge expiration check works correctly',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'create-badge-template',
        [
          types.ascii('Expiring Badge'),
          types.ascii('Expires in 10 blocks'),
          types.uint(1),
          types.uint(1),
          types.uint(1),
          types.uint(10),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'authorize-issuer',
        [types.principal(deployer.address)],
        deployer.address
      ),
    ]);

    // Mint badge
    const mintBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [types.principal(user1.address), types.uint(1), types.uint(1)],
        deployer.address
      ),
    ]);

    const badgeId = mintBlock.receipts[0].result.expectOk().expectUint();

    // Check not expired initially
    const checkBlock = chain.mineBlock([
      Tx.contractCall(
        'badge-metadata',
        'is-badge-expired',
        [types.uint(badgeId)],
        deployer.address
      ),
    ]);

    assertEquals(checkBlock.receipts[0].result, types.bool(false));
  },
});
