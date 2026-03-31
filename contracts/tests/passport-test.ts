import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: 'Can mint badge with proper permissions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    // Setup: Must create community and template first for permissions to pass
    const block = chain.mineBlock([
      Tx.contractCall(
        'community-manager',
        'create-community',
        [types.ascii("Test Community"), types.ascii("Description")],
        deployer.address
      ),
      Tx.contractCall(
        'badge-metadata',
        'create-badge-template',
        [
          types.ascii("Test Template"),
          types.ascii("Description"),
          types.uint(1), // category
          types.uint(1), // level
          types.uint(0), // expiration
        ],
        deployer.address
      ),
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [types.principal(user1.address), types.uint(1), types.uint(1)],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 3);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: 'Non-transferable NFT prevents transfers',
  async fn(chain: Chain, accounts: Map<string, Account>) {
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
    // ERR-TRANSFER-DISABLED is u103
    block.receipts[0].result.expectErr().expectUint(103);
  },
});
