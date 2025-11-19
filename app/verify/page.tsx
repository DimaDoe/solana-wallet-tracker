'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { ChallengeDisplay } from '@/components/ChallengeDisplay'
import { PaymentSelector } from '@/components/PaymentSelector'
import { get1RWBalance, createBurnTransaction, PAYMENT_OPTIONS, PaymentTier, CONFIG } from '@/lib/solana'
import { generateChallenge, verifyChallenge, Challenge } from '@/lib/challenges'
import { mintVerificationNFT, checkVerificationStatus } from '@/lib/nft'
import Link from 'next/link'

type Step = 'connect' | 'payment' | 'challenge' | 'success' | 'already-verified'

export default function VerifyPage() {
  const { connected, publicKey, signTransaction } = useWallet()
  const [step, setStep] = useState<Step>('connect')
  const [balance, setBalance] = useState<number>(0)
  const [selectedTier, setSelectedTier] = useState<PaymentTier | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [attempts, setAttempts] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  // Check connection and balance
  useEffect(() => {
    if (connected && publicKey) {
      checkStatus()
    } else {
      setStep('connect')
    }
  }, [connected, publicKey])

  async function checkStatus() {
    if (!publicKey) return

    setLoading(true)
    try {
      // Check if already verified
      const status = await checkVerificationStatus(publicKey.toBase58())
      if (status.isVerified) {
        setStep('already-verified')
        return
      }

      // Get balance
      const bal = await get1RWBalance(publicKey.toBase58())
      setBalance(bal)
      setStep('payment')
    } catch (err) {
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  async function handlePaymentSelect(tier: PaymentTier) {
    if (!publicKey || !signTransaction) return

    setSelectedTier(tier)
    setError(null)

    // Check requirements
    if (tier === 'hold' && balance < CONFIG.MIN_HOLD) {
      setError(`Need at least ${CONFIG.MIN_HOLD} $1RW to use free verify`)
      return
    }

    if (tier !== 'hold') {
      const option = PAYMENT_OPTIONS.find(o => o.tier === tier)
      if (!option || balance < option.amount) {
        setError(`Insufficient $1RW balance`)
        return
      }

      // Process burn transaction
      setLoading(true)
      try {
        const tx = await createBurnTransaction(publicKey.toBase58(), option.amount)
        const signed = await signTransaction(tx)
        // In production: send transaction and wait for confirmation
        console.log('Signed transaction:', signed)
      } catch (err) {
        setError('Transaction failed or cancelled')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    // Generate challenge
    const newChallenge = generateChallenge()
    setChallenge(newChallenge)
    setAttempts(3)
    setStep('challenge')
  }

  async function handleChallengeSubmit(answer: string | number) {
    if (!challenge || !publicKey) return

    const isCorrect = verifyChallenge(challenge, answer)

    if (isCorrect) {
      setLoading(true)
      try {
        // Mint NFT
        const result = await mintVerificationNFT(
          publicKey.toBase58(),
          selectedTier || 'hold'
        )

        if (result.success) {
          setTxSignature(result.signature || null)
          setStep('success')
        } else {
          setError(result.error || 'Failed to mint badge')
        }
      } catch (err) {
        setError('Failed to mint verification badge')
      } finally {
        setLoading(false)
      }
    } else {
      const remaining = attempts - 1
      setAttempts(remaining)

      if (remaining === 0) {
        // Reset challenge
        setError('Too many failed attempts. Try again.')
        const newChallenge = generateChallenge()
        setChallenge(newChallenge)
        setAttempts(3)
      } else {
        setError(`Incorrect. ${remaining} attempts remaining.`)
      }
    }
  }

  function handleNewChallenge() {
    const newChallenge = generateChallenge()
    setChallenge(newChallenge)
    setError(null)
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-1rw-primary">1RW</Link>
        <WalletButton />
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step !== 'connect' ? 'bg-1rw-primary' : 'bg-white/20'
            }`}>1</div>
            <div className={`w-16 h-1 ${step === 'challenge' || step === 'success' ? 'bg-1rw-primary' : 'bg-white/20'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'challenge' || step === 'success' ? 'bg-1rw-primary' : 'bg-white/20'
            }`}>2</div>
            <div className={`w-16 h-1 ${step === 'success' ? 'bg-1rw-primary' : 'bg-white/20'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'success' ? 'bg-1rw-primary' : 'bg-white/20'
            }`}>3</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/5 rounded-2xl p-8">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-1rw-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Processing...</p>
            </div>
          )}

          {!loading && step === 'connect' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-8">
                Connect your Solana wallet to start the verification process
              </p>
              <WalletButton />
            </div>
          )}

          {!loading && step === 'already-verified' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Already Verified!</h2>
              <p className="text-gray-400 mb-8">
                This wallet already has a verification badge.
              </p>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-xl font-semibold transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          )}

          {!loading && step === 'payment' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center">Select Verification Option</h2>
              <p className="text-center text-gray-400 mb-6">
                Your balance: <span className="text-1rw-primary font-semibold">{balance.toFixed(2)} $1RW</span>
              </p>

              {error && (
                <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-center">
                  {error}
                </div>
              )}

              <PaymentSelector
                balance={balance}
                onSelect={handlePaymentSelect}
              />
            </div>
          )}

          {!loading && step === 'challenge' && challenge && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center">Solve the Challenge</h2>
              <p className="text-center text-gray-400 mb-6">
                {attempts} attempts remaining
              </p>

              {error && (
                <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-center">
                  {error}
                </div>
              )}

              <ChallengeDisplay
                challenge={challenge}
                onSubmit={handleChallengeSubmit}
                onNewChallenge={handleNewChallenge}
              />
            </div>
          )}

          {!loading && step === 'success' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Verified!</h2>
              <p className="text-gray-400 mb-8">
                Congratulations! You've proven you're human.
                Your verification badge has been minted.
              </p>

              {txSignature && (
                <p className="text-sm text-gray-500 mb-6">
                  TX: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-xl font-semibold transition-colors"
                >
                  View Dashboard
                </Link>
                <button
                  onClick={() => {
                    // Share on Twitter
                    const text = encodeURIComponent("I just got verified as human on 1RW! 🤖✓ #1RWVerified")
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  Share on Twitter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
