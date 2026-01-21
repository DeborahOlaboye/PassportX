import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Platform admin can pause and unpause the contract",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            // Check initial state
            Tx.contractCall('access-control', 'is-paused', [], deployer.address),
            // Pause
            Tx.contractCall('access-control', 'set-paused', [types.bool(true)], deployer.address),
            // Check state
            Tx.contractCall('access-control', 'is-paused', [], deployer.address),
            // Unpause
            Tx.contractCall('access-control', 'set-paused', [types.bool(false)], deployer.address),
            // Check state
            Tx.contractCall('access-control', 'is-paused', [], deployer.address)
        ]);

        assertEquals(block.receipts.length, 5);
        assertEquals(block.receipts[0].result, types.bool(false));
        block.receipts[1].result.expectOk();
        assertEquals(block.receipts[2].result, types.bool(true));
        block.receipts[3].result.expectOk();
        assertEquals(block.receipts[4].result, types.bool(false));
    },
});

Clarinet.test({
    name: "Non-admin cannot pause the contract",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('access-control', 'set-paused', [types.bool(true)], wallet1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(405); // ERR-NOT-PLATFORM-ADMIN
    },
});

Clarinet.test({
    name: "Minting is blocked when contract is paused",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const recipient = accounts.get('wallet_2')!;
        const communityId = 1;
        const templateId = 1;

        let block = chain.mineBlock([
            // Pause the contract
            Tx.contractCall('access-control', 'set-paused', [types.bool(true)], deployer.address),
            // Try to mint badge
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(recipient.address),
                types.uint(templateId),
                types.uint(communityId)
            ], deployer.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr().expectUint(110); // ERR-PAUSED
    },
});

Clarinet.test({
    name: "Template creation is blocked when contract is paused",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const communityId = 1;

        let block = chain.mineBlock([
            // Pause
            Tx.contractCall('access-control', 'set-paused', [types.bool(true)], deployer.address),
            // Try to create template
            Tx.contractCall('badge-issuer', 'create-badge-template', [
                types.ascii("Test Badge"),
                types.ascii("Description"),
                types.uint(1),
                types.uint(1),
                types.uint(communityId)
            ], deployer.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr().expectUint(110); // ERR-PAUSED
    },
});

Clarinet.test({
    name: "Revocation is blocked when contract is paused",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const communityId = 1;
        const badgeId = 1;

        let block = chain.mineBlock([
            // Pause
            Tx.contractCall('access-control', 'set-paused', [types.bool(true)], deployer.address),
            // Try to revoke badge
            Tx.contractCall('badge-issuer', 'revoke-badge', [
                types.uint(badgeId),
                types.uint(communityId)
            ], deployer.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr().expectUint(110); // ERR-PAUSED
    },
});
