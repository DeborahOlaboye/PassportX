import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Badge template creation works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'create-badge-template', [
                types.ascii("Test Badge"),
                types.ascii("A test badge for testing"),
                types.uint(1),
                types.uint(1)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
    },
});

Clarinet.test({
    name: "Badge minting requires authorization",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;
        
        // Create template first
        const templateBlock = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'create-badge-template', [
                types.ascii("Test Badge"),
                types.ascii("A test badge"),
                types.uint(1),
                types.uint(1)
            ], deployer.address)
        ]);
        
        // Unauthorized user tries to mint
        const mintBlock = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user2.address),
                types.uint(1)
            ], user1.address)
        ]);
        
        assertEquals(mintBlock.receipts[0].result.expectErr(), types.uint(104));
    },
});

Clarinet.test({
    name: "Authorized issuer can mint badges",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        // Create template
        const templateBlock = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'create-badge-template', [
                types.ascii("Test Badge"),
                types.ascii("A test badge"),
                types.uint(1),
                types.uint(1)
            ], deployer.address)
        ]);
        
        // Deployer (authorized) mints badge
        const mintBlock = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user1.address),
                types.uint(1)
            ], deployer.address)
        ]);
        
        assertEquals(mintBlock.receipts[0].result.expectOk(), types.uint(1));
    },
});