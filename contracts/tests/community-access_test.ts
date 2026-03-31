import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: 'Can manage community issuer roles',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const communityId = 1;

    // First, setup community since permissions check can-manage-community-members
    let block = chain.mineBlock([
      Tx.contractCall(
        'community-manager',
        'create-community',
        [types.ascii("Test Community"), types.ascii("Description")],
        deployer.address
      ),
      // Grant role
      Tx.contractCall(
        'access-control',
        'grant-community-issuer-role',
        [types.uint(communityId), types.principal(wallet1.address)],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();

    // Check role using callReadOnlyFn for accuracy
    let checkRole = chain.callReadOnlyFn(
      'access-control',
      'is-community-issuer',
      [types.uint(communityId), types.principal(wallet1.address)],
      deployer.address
    );
    assertEquals(checkRole.result, types.bool(true));

    block = chain.mineBlock([
      // Revoke role
      Tx.contractCall(
        'access-control',
        'revoke-community-issuer-role',
        [types.uint(communityId), types.principal(wallet1.address)],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectOk();
    
    checkRole = chain.callReadOnlyFn(
      'access-control',
      'is-community-issuer',
      [types.uint(communityId), types.principal(wallet1.address)],
      deployer.address
    );
    assertEquals(checkRole.result, types.bool(false));
  },
});

Clarinet.test({
  name: 'Community issuer can mint badge for their community',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const issuer = accounts.get('wallet_1')!;
    const recipient = accounts.get('wallet_2')!;
    const communityId = 1;

    let block = chain.mineBlock([
      // Setup
      Tx.contractCall('community-manager', 'create-community', [types.ascii("C1"), types.ascii("D1")], deployer.address),
      Tx.contractCall('badge-metadata', 'create-badge-template', [types.ascii("T1"), types.ascii("D1"), types.uint(1), types.uint(1), types.uint(0)], deployer.address),
      Tx.contractCall('access-control', 'grant-community-issuer-role', [types.uint(communityId), types.principal(issuer.address)], deployer.address),
      // Mint
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [
          types.principal(recipient.address),
          types.uint(1), // templateId
          types.uint(communityId),
        ],
        issuer.address
      ),
    ]);

    assertEquals(block.receipts.length, 4);
    block.receipts[3].result.expectOk().expectUint(1); // First badge ID should be 1
  },
});

Clarinet.test({
  name: 'Unauthorized user cannot mint badge for community',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const unauthorized = accounts.get('wallet_3')!;
    const recipient = accounts.get('wallet_2')!;
    const communityId = 1;

    chain.mineBlock([
       Tx.contractCall('community-manager', 'create-community', [types.ascii("C1"), types.ascii("D1")], deployer.address),
       Tx.contractCall('badge-metadata', 'create-badge-template', [types.ascii("T1"), types.ascii("D1"), types.uint(1), types.uint(1), types.uint(0)], deployer.address),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        'badge-issuer',
        'mint-badge',
        [
          types.principal(recipient.address),
          types.uint(1),
          types.uint(communityId),
        ],
        unauthorized.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(104); // ERR-UNAUTHORIZED
  },
});
