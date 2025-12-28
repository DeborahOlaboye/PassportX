import { TransactionSigningInterface } from '@/components/transactions/TransactionSigningInterface';

export default function SignPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Signing</h1>
          <p className="text-gray-600 mt-2">
            Sign and broadcast transactions securely through WalletConnect
          </p>
        </div>

        <TransactionSigningInterface />
      </div>
    </div>
  );
}