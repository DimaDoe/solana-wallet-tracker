import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { getConnection, CONFIG } from './solana'

// NFT Metadata structure
export interface VerificationBadgeMetadata {
  name: string
  symbol: string
  description: string
  image: string
  external_url: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
}

// Verification status
export interface VerificationStatus {
  isVerified: boolean
  verifiedAt?: number
  expiresAt?: number
  tier?: 'standard' | 'lifetime'
  badgeAddress?: string
}

// Generate badge metadata
export function generateBadgeMetadata(
  tier: 'standard' | 'lifetime',
  verifiedAt: number,
  expiresAt: number
): VerificationBadgeMetadata {
  return {
    name: '1RW Verified Human',
    symbol: '1RW-HUMAN',
    description: 'This badge certifies that the holder has passed AI-resistant human verification through the 1RW protocol.',
    image: 'ipfs://QmVerifiedHumanBadgeImage', // TODO: Replace with actual IPFS hash
    external_url: 'https://1rw.io/verify',
    attributes: [
      {
        trait_type: 'Status',
        value: 'Verified'
      },
      {
        trait_type: 'Verified Date',
        value: verifiedAt
      },
      {
        trait_type: 'Expiry',
        value: tier === 'lifetime' ? 'Never' : expiresAt
      },
      {
        trait_type: 'Tier',
        value: tier === 'lifetime' ? 'Lifetime' : 'Standard'
      }
    ]
  }
}

// Check if wallet has verification badge
export async function checkVerificationStatus(walletAddress: string): Promise<VerificationStatus> {
  try {
    const connection = getConnection()
    const wallet = new PublicKey(walletAddress)

    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    })

    // Look for verification NFT
    // In production, this would check for the specific NFT collection
    for (const account of tokenAccounts.value) {
      const tokenData = account.account.data.parsed.info

      // Check if it's an NFT (amount = 1, decimals = 0)
      if (tokenData.tokenAmount.decimals === 0 && tokenData.tokenAmount.uiAmount === 1) {
        // TODO: Verify this is from our collection by checking metadata
        // For now, we'll simulate the check
        const mintAddress = tokenData.mint

        // In production: fetch metadata and verify it's a 1RW badge
        // const metadata = await getMetadata(mintAddress)
        // if (metadata.symbol === '1RW-HUMAN') { ... }
      }
    }

    // For MVP, return not verified (real implementation would check on-chain)
    return { isVerified: false }
  } catch (error) {
    console.error('Error checking verification status:', error)
    return { isVerified: false }
  }
}

// Calculate expiry based on tier
export function calculateExpiry(tier: 'hold' | 'single' | 'lifetime'): number {
  const now = Date.now()

  switch (tier) {
    case 'hold':
      return now + 30 * 24 * 60 * 60 * 1000 // 30 days
    case 'single':
      return now + 90 * 24 * 60 * 60 * 1000 // 90 days
    case 'lifetime':
      return now + 100 * 365 * 24 * 60 * 60 * 1000 // 100 years
  }
}

// Format expiry date
export function formatExpiry(timestamp: number): string {
  if (timestamp > Date.now() + 50 * 365 * 24 * 60 * 60 * 1000) {
    return 'Never'
  }
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Mint verification NFT (placeholder - real implementation needs Metaplex)
export async function mintVerificationNFT(
  walletAddress: string,
  tier: 'hold' | 'single' | 'lifetime'
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // In production, this would:
    // 1. Create NFT metadata
    // 2. Upload to IPFS/Arweave
    // 3. Mint NFT using Metaplex
    // 4. Make it non-transferable (using Token-2022 or custom program)

    const verifiedAt = Date.now()
    const expiresAt = calculateExpiry(tier)
    const metadata = generateBadgeMetadata(
      tier === 'lifetime' ? 'lifetime' : 'standard',
      verifiedAt,
      expiresAt
    )

    console.log('Minting NFT with metadata:', metadata)

    // Placeholder response
    return {
      success: true,
      signature: 'placeholder_signature_' + Math.random().toString(36).substring(7)
    }
  } catch (error) {
    console.error('Error minting NFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get verification stats (for landing page counter)
export async function getVerificationStats(): Promise<{ totalVerified: number }> {
  try {
    // In production, this would query on-chain data
    // For MVP, return placeholder
    return { totalVerified: 1247 }
  } catch (error) {
    console.error('Error getting stats:', error)
    return { totalVerified: 0 }
  }
}
