import { NetworkSelector } from '@/components/NetworkSelector';
import { NetworkStatus } from '@/components/NetworkStatus';

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Network Settings</h1>
          <p className="text-gray-600 mt-2">
            Switch between Stacks mainnet and testnet networks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Network Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Switch Network</h2>
            <p className="text-gray-600 mb-6">
              Select the network you want to use. Switching networks will reset your transaction history and cached data.
            </p>

            <NetworkSelector variant="buttons" className="mb-6" />

            <div className="text-sm text-gray-500">
              <p className="mb-2"><strong>Note:</strong> Network switching will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear transaction history</li>
                <li>Reset wallet connections</li>
                <li>Clear cached data</li>
                <li>Update API endpoints</li>
              </ul>
            </div>
          </div>

          {/* Network Status */}
          <NetworkStatus showDetails={true} />
        </div>

        {/* Network Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Network Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Mainnet</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Production network</li>
                <li>• Real STX tokens</li>
                <li>• Live applications</li>
                <li>• Higher transaction fees</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Testnet</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Testing network</li>
                <li>• Free test STX tokens</li>
                <li>• Development environment</li>
                <li>• Lower transaction fees</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Getting Test STX</h4>
            <p className="text-sm text-blue-800 mb-3">
              When using testnet, you can get free STX tokens from the faucet to test transactions.
            </p>
            <a
              href="https://explorer.stacks.co/sandbox/faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Visit Testnet Faucet →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}