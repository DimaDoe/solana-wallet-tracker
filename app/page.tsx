'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { getVerificationStats } from '@/lib/nft'

export default function Home() {
  const [stats, setStats] = useState({ totalVerified: 0 })

  useEffect(() => {
    getVerificationStats().then(setStats)
  }, [])

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-1rw-primary">1RW</div>
        <WalletButton />
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-1rw-primary to-1rw-secondary bg-clip-text text-transparent">
          Prove You're Human.
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-gray-300">
          Cut AI Noise.
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Self-service human verification through AI-resistant challenges.
          Earn your on-chain badge and stand out from the bots.
        </p>

        {/* Live Counter */}
        <div className="mb-12">
          <div className="inline-block bg-1rw-dark/50 rounded-2xl px-8 py-6 glow">
            <div className="text-4xl font-bold text-1rw-primary mb-2">
              {stats.totalVerified.toLocaleString()}
            </div>
            <div className="text-gray-400">Humans Verified</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/verify"
            className="px-8 py-4 bg-1rw-primary hover:bg-1rw-secondary rounded-xl font-semibold text-lg transition-colors"
          >
            Get Verified Now
          </Link>
          <Link
            href="/check"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-lg transition-colors"
          >
            Check a Wallet
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">1</div>
            <h4 className="text-xl font-semibold mb-2">Connect Wallet</h4>
            <p className="text-gray-400">
              Link your Solana wallet and check your $1RW balance
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">2</div>
            <h4 className="text-xl font-semibold mb-2">Solve Challenge</h4>
            <p className="text-gray-400">
              Complete an AI-resistant challenge to prove you're human
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">3</div>
            <h4 className="text-xl font-semibold mb-2">Get Badge</h4>
            <p className="text-gray-400">
              Receive your on-chain verification NFT badge
            </p>
          </div>
        </div>
      </section>

      {/* Token Info */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-1rw-dark to-1rw-primary/20 rounded-2xl p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">$1RW Token</h3>
          <p className="text-gray-300 mb-6">
            Hold or burn $1RW tokens to access human verification. Your tokens power the network and prove your commitment.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="font-semibold">Hold 100</div>
              <div className="text-sm text-gray-400">Free verify (30 days)</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="font-semibold">Burn 10</div>
              <div className="text-sm text-gray-400">Single verify (90 days)</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="font-semibold">Burn 50</div>
              <div className="text-sm text-gray-400">Lifetime verify</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-1rw-accent hover:text-1rw-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy $1RW on Jupiter →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 border-t border-white/10">
        <p>© 2024 1RW Protocol. Built on Solana.</p>
      </footer>
    </main>
  )
}
