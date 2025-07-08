# Solana Wallet Tracker

A Node.js application for tracking Solana wallet balances and activities with Telegram notifications.

## Features

- 🔍 Real-time wallet balance monitoring
- 📱 Telegram bot integration for notifications
- 🗄️ SQLite database for data persistence
- ⏰ Automated tracking with cron jobs
- 🐛 Debug mode support
- 📊 Balance change notifications

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
```bash
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

### Running the Application

#### Normal Mode
```bash
npm start
```

#### Development Mode
```bash
npm run dev
```

#### Debug Mode
```bash
npm run debug
```

#### Debug with Breakpoint
```bash
npm run debug-brk
```

#### Development with Auto-restart
```bash
npm run dev:watch
```

## Debugging

The application supports multiple debugging options:

### 1. VS Code Debugging
- Open the project in VS Code
- Go to the Debug panel (Ctrl+Shift+D)
- Select "Debug Solana Wallet Tracker" or "Debug with Environment Variables"
- Press F5 to start debugging

### 2. Chrome DevTools
- Start the application with `npm run debug`
- Open Chrome and navigate to `chrome://inspect`
- Click "Open dedicated DevTools for Node"
- The debugger will connect automatically

### 3. Command Line Debugging
- Use `npm run debug` for inspector mode
- Use `npm run debug-brk` to pause on first line
- Connect with any debugger client

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | None |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | None |

### Database

The application uses SQLite for data storage:
- Database file: `wallet_tracker.db`
- Tables: `wallets`, `transactions`

## Telegram Bot Commands

If Telegram is configured, the bot supports these commands:

- `/start` - Start the bot
- `/help` - Show available commands
- `/add <address> [label]` - Add wallet to tracking
- `/list` - List tracked wallets
- `/balance <address>` - Check specific wallet balance
- `/status` - Show tracking status

## Project Structure

```
├── src/
│   └── index.js          # Main application file
├── .vscode/
│   └── launch.json       # VS Code debug configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **Node.js version warning**: The application requires Node.js 18.x, but newer versions should work fine.

2. **Database errors**: Ensure the application has write permissions in the project directory.

3. **Telegram bot not working**: Check that `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set correctly.

4. **Solana connection issues**: Verify the RPC URL is accessible and not rate-limited.

### Debug Port

The debug port (9229) should be accessible at:
- HTTP: `http://localhost:9229/json`
- WebSocket: `ws://localhost:9229/[debug-id]`

## License

This project is for educational purposes.