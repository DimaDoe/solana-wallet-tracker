# 1RW Human Verification

Self-service human verification app for Solana. Prove you're human through AI-resistant challenges and earn an on-chain verification badge.

## Features

- **Wallet Connection**: Multi-wallet support (Phantom, Solflare, Torus, Ledger)
- **$1RW Token Integration**: Hold or burn tokens for verification
- **AI-Resistant Challenges**: 3 challenge types (distorted text, symbol code, pattern recognition)
- **NFT Badge**: Non-transferable verification badge minted on-chain
- **Public Verification**: Check any wallet's verification status
- **Browser Extension**: Shows badges on Twitter/X profiles

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Solana Web3.js
- Solana Wallet Adapter
- Metaplex (NFT minting)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Solana CLI (optional, for local development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your values
```

### Environment Variables

```env
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_1RW_TOKEN_MINT=<your-token-mint>
NEXT_PUBLIC_TREASURY_WALLET=<your-treasury>
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=<your-collection>
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
/app
  page.tsx          # Landing page
  /verify           # Verification flow
  /dashboard        # User dashboard
  /check            # Public verification lookup
  /api/check/[wallet] # Verification API
/components
  WalletProvider.tsx
  WalletButton.tsx
  ChallengeDisplay.tsx
  PaymentSelector.tsx
  VerificationBadge.tsx
/lib
  solana.ts         # Solana utilities
  challenges.ts     # Challenge generation
  nft.ts            # NFT minting logic
/extension          # Browser extension
```

## Verification Flow

1. Connect Solana wallet
2. Choose payment option:
   - Hold 100 $1RW (free, 30 days)
   - Burn 10 $1RW (90 days)
   - Burn 50 $1RW (lifetime)
3. Solve AI-resistant challenge
4. Receive verification NFT badge

## API

### Check Verification Status

```
GET /api/check/{wallet}
```

Response:
```json
{
  "wallet": "...",
  "isVerified": true,
  "tier": "standard",
  "verifiedAt": 1234567890,
  "expiresAt": 1234567890,
  "badgeAddress": "..."
}
```

## Browser Extension

See `/extension/README.md` for installation and usage.

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## TODO for Production

- [ ] Deploy $1RW token on mainnet
- [ ] Set up NFT collection with Metaplex
- [ ] Implement actual NFT minting (currently placeholder)
- [ ] Add challenge difficulty scaling
- [ ] Implement on-chain verification storage
- [ ] Add rate limiting and anti-abuse measures
- [ ] Create extension icons
- [ ] Build Twitter handle → wallet mapping database

## License

MIT
