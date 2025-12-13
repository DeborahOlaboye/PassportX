import Link from 'next/link'
import { Award, Users, Share2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🌍 PassportX
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A portable, on-chain Achievement Passport built for communities, learners, and creators.
          Powered by Clarity 4 on Stacks.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card text-center">
          <Award className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">For Users</h3>
          <p className="text-gray-600">
            A portable Achievement Passport you control with beautiful badge display
          </p>
        </div>
        
        <div className="card text-center">
          <Users className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">For Communities</h3>
          <p className="text-gray-600">
            Create communities and issue badges with custom branding
          </p>
        </div>
        
        <div className="card text-center">
          <Share2 className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Shareable</h3>
          <p className="text-gray-600">
            Public passport pages with embeddable widgets
          </p>
        </div>
      </div>

      <div className="text-center space-x-4">
        <Link href="/passport" className="btn-primary">
          View My Passport
        </Link>
        <Link href="/admin" className="btn-secondary">
          Admin Dashboard
        </Link>
      </div>
    </div>
  )
}