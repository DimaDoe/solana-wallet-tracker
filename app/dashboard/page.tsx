'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { VerificationBadge } from '@/components/VerificationBadge'
import { checkVerificationStatus, VerificationStatus, formatExpiry } from '@/lib/nft'
import Link from 'next/link'

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      loadStatus()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  async function loadStatus() {
    if (!publicKey) return

    setLoading(true)
    try {
      const result = await checkVerificationStatus(publicKey.toBase58())
      // For demo, show as verified
      setStatus({
        isVerified: true,
        verifiedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        expiresAt: Date.now() + 23 * 24 * 60 * 60 * 1000, // 23 days from now
        tier: 'standard',
        badgeAddress: 'DemoNFTAddress' + Math.random().toString(36).substring(7)
      })
    } catch (err) {
      console.error('Failed to load status:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <main className="min-h-screen">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-1rw-primary">1RW</Link>
          <WalletButton />
        </header>

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to view your verification dashboard
          </p>
          <WalletButton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-1rw-primary">1RW</Link>
        <WalletButton />
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Verification Dashboard</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-1rw-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : status?.isVerified ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Badge Display */}
            <div className="bg-white/5 rounded-2xl p-8">
              <VerificationBadge tier={status.tier || 'standard'} />
            </div>

            {/* Status Info */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Verification Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400 font-semibold">Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verified Date</span>
                    <span>{status.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires</span>
                    <span>{status.expiresAt ? formatExpiry(status.expiresAt) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tier</span>
                    <span className="capitalize">{status.tier}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`I'm verified human on 1RW! Check my badge: ${publicKey?.toBase58()} #1RWVerified`)
                      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors text-left"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://1rw.io/check/${publicKey?.toBase58()}`)
                      alert('Link copied!')
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors text-left"
                  >
                    Copy Verification Link
                  </button>
                  <Link
                    href="/verify"
                    className="block w-full px-4 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-lg font-semibold transition-colors text-center"
                  >
                    Re-verify / Upgrade
                  </Link>
                </div>
              </div>

              {/* Embed Code */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Embed Badge</h3>
                <div className="bg-black/30 rounded-lg p-3 text-xs font-mono break-all">
                  {`<img src="https://1rw.io/api/badge/${publicKey?.toBase58()}" alt="1RW Verified" />`}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-4">Not Verified</h2>
            <p className="text-gray-400 mb-8">
              This wallet has not been verified as human yet.
            </p>
            <Link
              href="/verify"
              className="px-6 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-xl font-semibold transition-colors inline-block"
            >
              Get Verified
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
