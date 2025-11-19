import { NextRequest, NextResponse } from 'next/server'
import { checkVerificationStatus } from '@/lib/nft'

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const wallet = params.wallet

    // Basic validation
    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    const status = await checkVerificationStatus(wallet)

    return NextResponse.json({
      wallet,
      isVerified: status.isVerified,
      tier: status.tier || null,
      verifiedAt: status.verifiedAt || null,
      expiresAt: status.expiresAt || null,
      badgeAddress: status.badgeAddress || null
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    )
  }
}

// Add CORS headers for external access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
