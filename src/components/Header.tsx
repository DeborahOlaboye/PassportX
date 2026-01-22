import Link from 'next/link'
import WalletConnect from './WalletConnect'
import MobileMenu from './MobileMenu'
import { NetworkSelector } from './NetworkSelector'
import ErrorBoundary from './ErrorBoundary'
import { WalletErrorFallback } from './FallbackUI'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b relative">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold text-gray-900">PassportX</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/passport" className="text-gray-600 hover:text-gray-900">
              My Passport
            </Link>
            <Link href="/transactions" className="text-gray-600 hover:text-gray-900">
              Transactions
            </Link>
            <Link href="/sign" className="text-gray-600 hover:text-gray-900">
              Sign Transactions
            </Link>
            <Link href="/network" className="text-gray-600 hover:text-gray-900">
              Network
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
            <Link href="/public" className="text-gray-600 hover:text-gray-900">
              Explore
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <ErrorBoundary fallback={<div className="text-xs text-red-500">Network Error</div>}>
              <NetworkSelector variant="minimal" />
            </ErrorBoundary>
            <div className="hidden sm:block">
              <ErrorBoundary fallback={(error, reset) => <WalletErrorFallback error={error} reset={reset} />}>
                <WalletConnect />
              </ErrorBoundary>
            </div>
            <ErrorBoundary fallback={<div className="p-2 text-red-500">Menu Error</div>}>
              <MobileMenu />
            </ErrorBoundary>
          </div>
        </div>
        
        {/* Mobile wallet connect */}
        <div className="sm:hidden mt-4 pt-4 border-t">
          <ErrorBoundary fallback={(error, reset) => <WalletErrorFallback error={error} reset={reset} />}>
            <WalletConnect />
          </ErrorBoundary>
        </div>
      </div>
    </header>
  )
}