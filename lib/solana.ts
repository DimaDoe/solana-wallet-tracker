import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, createTransferInstruction } from '@solana/spl-token'

// Configuration
export const CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
  TOKEN_MINT: process.env.NEXT_PUBLIC_1RW_TOKEN_MINT || '',
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_WALLET || '',
  MIN_HOLD: Number(process.env.NEXT_PUBLIC_MIN_HOLD_AMOUNT) || 100,
  BURN_SINGLE: Number(process.env.NEXT_PUBLIC_BURN_SINGLE) || 10,
  BURN_LIFETIME: Number(process.env.NEXT_PUBLIC_BURN_LIFETIME) || 50,
}

// Get connection
export const getConnection = () => {
  return new Connection(CONFIG.RPC_URL, 'confirmed')
}

// Get $1RW token balance
export async function get1RWBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const wallet = new PublicKey(walletAddress)
    const tokenMint = new PublicKey(CONFIG.TOKEN_MINT)

    const tokenAccount = await getAssociatedTokenAddress(tokenMint, wallet)

    try {
      const account = await getAccount(connection, tokenAccount)
      // Assuming 9 decimals for the token
      return Number(account.amount) / Math.pow(10, 9)
    } catch {
      // Token account doesn't exist
      return 0
    }
  } catch (error) {
    console.error('Error getting 1RW balance:', error)
    return 0
  }
}

// Check if wallet meets minimum hold requirement
export async function checkMinimumHold(walletAddress: string): Promise<boolean> {
  const balance = await get1RWBalance(walletAddress)
  return balance >= CONFIG.MIN_HOLD
}

// Create burn transaction (transfer to treasury/burn address)
export async function createBurnTransaction(
  walletAddress: string,
  amount: number
): Promise<Transaction> {
  const connection = getConnection()
  const wallet = new PublicKey(walletAddress)
  const tokenMint = new PublicKey(CONFIG.TOKEN_MINT)
  const treasury = new PublicKey(CONFIG.TREASURY)

  const sourceAccount = await getAssociatedTokenAddress(tokenMint, wallet)
  const destAccount = await getAssociatedTokenAddress(tokenMint, treasury)

  // Amount with decimals (assuming 9)
  const tokenAmount = amount * Math.pow(10, 9)

  const transaction = new Transaction()

  transaction.add(
    createTransferInstruction(
      sourceAccount,
      destAccount,
      wallet,
      tokenAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  )

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet

  return transaction
}

// Payment tier types
export type PaymentTier = 'hold' | 'single' | 'lifetime'

export interface PaymentOption {
  tier: PaymentTier
  label: string
  description: string
  amount: number
  duration: string
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    tier: 'hold',
    label: 'Free Verify',
    description: `Hold ${CONFIG.MIN_HOLD} $1RW`,
    amount: 0,
    duration: '30 days',
  },
  {
    tier: 'single',
    label: 'Single Verify',
    description: `Burn ${CONFIG.BURN_SINGLE} $1RW`,
    amount: CONFIG.BURN_SINGLE,
    duration: '90 days',
  },
  {
    tier: 'lifetime',
    label: 'Lifetime Verify',
    description: `Burn ${CONFIG.BURN_LIFETIME} $1RW`,
    amount: CONFIG.BURN_LIFETIME,
    duration: 'Forever',
  },
]

// Get SOL balance
export async function getSOLBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const wallet = new PublicKey(walletAddress)
    const balance = await connection.getBalance(wallet)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error getting SOL balance:', error)
    return 0
  }
}
