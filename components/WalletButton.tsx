'use client'

import { FC } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export const WalletButton: FC = () => {
  const { connected, publicKey } = useWallet()

  return (
    <div className="flex flex-col items-center gap-2">
      <WalletMultiButton className="!bg-1rw-primary hover:!bg-1rw-secondary transition-colors" />
      {connected && publicKey && (
        <p className="text-sm text-gray-400">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </p>
      )}
    </div>
  )
}
