'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { VerificationBadge } from '@/components/VerificationBadge'
import { checkVerificationStatus, VerificationStatus, formatExpiry } from '@/lib/nft'

export default function CheckPage() {
  const [walletAddress, setWalletAddress] = useState('')
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  async function handleCheck() {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }

    // Basic validation
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      setError('Invalid Solana wallet address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await checkVerificationStatus(walletAddress)
      setStatus(result)
      setChecked(true)
    } catch (err) {
      setError('Failed to check verification status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-1rw-primary">1RW</Link>
        <WalletButton />
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Verification Lookup</h1>
        <p className="text-gray-400 text-center mb-8">
          Check if a wallet is verified as human
        </p>

        {/* Search Box */}
        <div className="bg-white/5 rounded-2xl p-8 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Enter Solana wallet address"
              className="flex-1 px-4 py-3 bg-black/30 rounded-lg border border-white/10 focus:border-1rw-primary outline-none transition-colors"
            />
            <button
              onClick={handleCheck}
              disabled={loading}
              className="px-6 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Check'}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>

        {/* Result */}
        {checked && (
          <div className="bg-white/5 rounded-2xl p-8">
            {status?.isVerified ? (
              <div className="text-center">
                <VerificationBadge tier={status.tier || 'standard'} size="md" />

                <div className="mt-8 space-y-3 text-sm max-w-xs mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400 font-semibold">Verified</span>
                  </div>
                  {status.verifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Verified Date</span>
                      <span>{new Date(status.verifiedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {status.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expires</span>
                      <span>{formatExpiry(status.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">✗</div>
                <h2 className="text-2xl font-bold mb-2 text-red-400">Not Verified</h2>
                <p className="text-gray-400">
                  This wallet has not been verified as human.
                </p>
              </div>
            )}
          </div>
        )}

        {/* API Info */}
        <div className="mt-12 bg-white/5 rounded-xl p-6">
          <h3 className="font-semibold mb-4">API Access</h3>
          <p className="text-sm text-gray-400 mb-4">
            Check verification status programmatically:
          </p>
          <div className="bg-black/30 rounded-lg p-3 text-xs font-mono">
            GET /api/check/[wallet]
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Returns JSON: {"{"} isVerified, tier, verifiedAt, expiresAt {"}"}
          </p>
        </div>
      </div>
    </main>
  )
}
