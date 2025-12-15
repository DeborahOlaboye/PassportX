import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react'

interface VerificationBadgeProps {
  verified: boolean
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function VerificationBadge({
  verified,
  active = true,
  size = 'md',
  showLabel = true,
  className = ''
}: VerificationBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3'
        }
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5'
        }
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4'
        }
    }
  }

  const sizes = getSizeClasses()

  const getStatus = () => {
    if (!verified) {
      return {
        icon: AlertCircle,
        text: 'Unverified',
        color: 'bg-gray-100 text-gray-700 border-gray-300'
      }
    }

    if (!active) {
      return {
        icon: ShieldAlert,
        text: 'Revoked',
        color: 'bg-red-100 text-red-700 border-red-300'
      }
    }

    return {
      icon: ShieldCheck,
      text: 'Verified',
      color: 'bg-green-100 text-green-700 border-green-300'
    }
  }

  const status = getStatus()
  const Icon = status.icon

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizes.container} ${status.color} ${className}`}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{status.text}</span>}
    </div>
  )
}

export function VerificationStatus({
  verified,
  active,
  onChainVerified,
  className = ''
}: {
  verified: boolean
  active: boolean
  onChainVerified?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <VerificationBadge verified={verified} active={active} />
        {onChainVerified && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <ShieldCheck className="w-3 h-3" />
            <span>On-chain</span>
          </div>
        )}
      </div>

      {!verified && (
        <p className="text-xs text-gray-600">
          This badge has not been verified on the blockchain
        </p>
      )}

      {verified && !active && (
        <p className="text-xs text-red-600">
          This badge has been revoked by the issuer
        </p>
      )}

      {verified && active && (
        <p className="text-xs text-green-600">
          This badge is verified and active on the blockchain
        </p>
      )}
    </div>
  )
}
