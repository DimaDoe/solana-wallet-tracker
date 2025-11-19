'use client'

import { FC } from 'react'

interface Props {
  tier: 'standard' | 'lifetime'
  size?: 'sm' | 'md' | 'lg'
}

export const VerificationBadge: FC<Props> = ({ tier, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Badge background */}
        <div className="absolute inset-0 bg-gradient-to-br from-1rw-primary to-1rw-secondary rounded-full animate-pulse-slow opacity-20" />

        {/* Badge main */}
        <div className="absolute inset-2 bg-gradient-to-br from-1rw-dark to-1rw-primary/30 rounded-full border-4 border-1rw-primary flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'}`}>
              ✓
            </div>
            <div className={`${textSizes[size]} text-gray-300 mt-1`}>
              Verified
            </div>
          </div>
        </div>

        {/* Lifetime badge */}
        {tier === 'lifetime' && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
            LIFETIME
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <div className="font-semibold">1RW Verified Human</div>
        <div className="text-sm text-gray-400 capitalize">{tier} Badge</div>
      </div>
    </div>
  )
}
