'use client'

import { FC } from 'react'
import { PAYMENT_OPTIONS, PaymentTier, CONFIG } from '@/lib/solana'

interface Props {
  balance: number
  onSelect: (tier: PaymentTier) => void
}

export const PaymentSelector: FC<Props> = ({ balance, onSelect }) => {
  return (
    <div className="grid gap-4">
      {PAYMENT_OPTIONS.map((option) => {
        const canAfford = option.tier === 'hold'
          ? balance >= CONFIG.MIN_HOLD
          : balance >= option.amount

        return (
          <button
            key={option.tier}
            onClick={() => onSelect(option.tier)}
            disabled={!canAfford}
            className={`p-6 rounded-xl text-left transition-all ${
              canAfford
                ? 'bg-white/10 hover:bg-white/20 hover:scale-[1.02]'
                : 'bg-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">{option.label}</h3>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
              <div className="text-right">
                <div className="text-1rw-primary font-semibold">{option.duration}</div>
                {!canAfford && (
                  <div className="text-xs text-red-400">Insufficient balance</div>
                )}
              </div>
            </div>

            {option.tier === 'hold' && (
              <div className="mt-2 text-xs text-gray-500">
                Tokens stay in your wallet
              </div>
            )}
            {option.tier !== 'hold' && (
              <div className="mt-2 text-xs text-gray-500">
                Tokens will be burned
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
