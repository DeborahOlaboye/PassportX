import Link from 'next/link'
import WalletConnect from './WalletConnect'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
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
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
            <Link href="/public" className="text-gray-600 hover:text-gray-900">
              Explore
            </Link>
          </nav>
          
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}