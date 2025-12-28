'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, isAuthenticated, isLoading, connectWallet } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if onboarding completed
      const onboardingCompleted = typeof window !== 'undefined'
        ? localStorage.getItem('onboarding_completed')
        : null;

      if (user.hasPassport || onboardingCompleted) {
        router.push('/passport');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PassportX</h1>
          <p className="text-gray-600">Your Digital Achievement Passport</p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="font-semibold text-blue-900 mb-2">Welcome!</h2>
            <p className="text-blue-800 text-sm">
              Connect your Stacks wallet to access your achievement passport and earn badges from
              communities around the ecosystem.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect Stacks Wallet'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have a Stacks wallet?{' '}
              <a
                href="https://www.hiro.so/wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get Hiro Wallet
              </a>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-xs text-gray-600">Earn Badges</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌐</div>
              <p className="text-xs text-gray-600">Join Communities</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📜</div>
              <p className="text-xs text-gray-600">Build Portfolio</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secured by the Stacks blockchain
          </p>
        </div>
      </div>
    </div>
  );
}
