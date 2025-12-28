import LoadingSpinner from '@/components/LoadingSpinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading PassportX</h2>
        <p className="text-gray-600">Please wait while we load your content...</p>
      </div>
    </div>
  )
}