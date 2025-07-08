# Solana Wallet Tracker

A Node.js application for tracking Solana wallet activities and transactions with real-time monitoring and debugging capabilities.

## Features

- 🔍 **Wallet Tracking**: Monitor multiple Solana wallet addresses
- 💾 **Database Storage**: SQLite database for storing transactions and alerts
- 🔔 **Telegram Alerts**: Optional Telegram bot integration for notifications
- ⏰ **Scheduled Monitoring**: Automatic tracking every 5 minutes
- 🐛 **Debug Mode**: Comprehensive debugging and logging
- 📊 **Real-time Monitoring**: Live status monitoring and statistics

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
# Start with debugging enabled
DEBUG=true NODE_ENV=development npm start

# Or start in background
DEBUG=true NODE_ENV=development node src/index.js &
```

### 3. Check Application Status
```bash
node status.js
```

## Debugging Tools

### Debug Script (`debug.js`)
Provides detailed debugging information and database queries:
```bash
node debug.js
```

**Features:**
- Show tracked wallets
- Display recent transactions
- Database statistics
- Add test wallets

### Monitor Script (`monitor.js`)
Real-time monitoring with periodic status updates:
```bash
node monitor.js
```

**Features:**
- Live status monitoring (30-second intervals)
- Transaction count tracking
- Change detection
- Performance metrics

### Status Script (`status.js`)
Quick overview of application status:
```bash
node status.js
```

**Features:**
- Current database statistics
- Running processes
- Application health check
- Usage instructions

## Configuration

### Environment Variables (.env file)
The application uses a `.env` file in the project root to load configuration:

```env
# Debug and Development
DEBUG=true
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Telegram Bot Configuration (optional)
# TELEGRAM_BOT_TOKEN=your_bot_token_here
# TELEGRAM_CHAT_ID=your_chat_id_here

# Database Configuration
DB_PATH=./wallet_tracker.db

# Tracking Configuration
TRACK_INTERVAL=*/5 * * * *

# Application Settings
PORT=3000
```

**Available Variables:**
- `DEBUG=true` - Enable debug logging
- `NODE_ENV=development` - Development mode
- `SOLANA_RPC_URL` - Custom Solana RPC endpoint (default: mainnet-beta)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for alerts
- `TELEGRAM_CHAT_ID` - Telegram chat ID for alerts
- `DB_PATH` - Database file path (default: ./wallet_tracker.db)
- `TRACK_INTERVAL` - Cron schedule for tracking (default: */5 * * * *)
- `PORT` - Application port (default: 3000)

### Database
- **File**: `wallet_tracker.db`
- **Tables**: 
  - `wallets` - Tracked wallet addresses
  - `transactions` - Stored transactions
  - `alerts` - Generated alerts

## Application Structure

```
├── src/
│   └── index.js          # Main application
├── debug.js              # Debugging utilities
├── monitor.js            # Real-time monitoring
├── status.js             # Status overview
├── package.json          # Dependencies
└── README.md            # This file
```

## Current Status

The application is currently running with:
- ✅ **2 wallets tracked** (System Program, Token Program)
- ✅ **110+ transactions stored**
- ✅ **Real-time monitoring active**
- ✅ **Debug mode enabled**

## Usage Examples

### Add a New Wallet
```javascript
const { addWallet } = require('./src/index.js');
await addWallet('WALLET_ADDRESS', 'Wallet Label');
```

### Get Tracked Wallets
```javascript
const { getTrackedWallets } = require('./src/index.js');
const wallets = await getTrackedWallets();
```

### Monitor Application
```bash
# Start monitoring in background
node monitor.js &

# Check status
node status.js

# Detailed debug info
node debug.js
```

## Stopping the Application

```bash
# Stop all Node.js processes
pkill -f "node src/index.js"
pkill -f "node monitor.js"

# Or stop specific processes
kill 3005  # Main application PID
kill 3152  # Monitor PID
```

## Troubleshooting

### Common Issues
1. **429 Too Many Requests**: RPC rate limiting - application handles this automatically
2. **Database locked**: Ensure only one instance is running
3. **Process not found**: Check if application is running with `ps aux | grep node`

### Debug Mode
Always run with debug mode enabled for detailed logging:
```bash
DEBUG=true NODE_ENV=development node src/index.js
```

## Development

The application is built with:
- **Node.js** (v18+ recommended)
- **@solana/web3.js** - Solana blockchain interaction
- **sqlite3** - Database storage
- **node-telegram-bot-api** - Telegram integration
- **node-cron** - Scheduled tasks

## License

This project is for educational and development purposes.