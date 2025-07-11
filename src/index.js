// Load environment variables
require('dotenv').config();

const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// Debug configuration
const DEBUG = process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development';

// Configuration
const config = {
  // RPC Configuration
  heliusRpcUrl: process.env.HELIUS_RPC_URL,
  quicknodeRpcUrl: process.env.QUICKNODE_RPC_URL,
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  
  // Telegram Configuration
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  
  // Database Configuration
  dbPath: process.env.DATABASE_PATH || './data/wallet_tracker.db',
  
  // Application Settings
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: process.env.PORT || 3000,
  
  // Rate Limiting
  heliusRateLimit: parseInt(process.env.HELIUS_RATE_LIMIT) || 100000,
  quicknodeRateLimit: parseInt(process.env.QUICKNODE_RATE_LIMIT) || 10000000,
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 300000,
  
  // Wallet Discovery Settings
  minWalletBalance: parseFloat(process.env.MIN_WALLET_BALANCE) || 0.1,
  minTransactionCount: parseInt(process.env.MIN_TRANSACTION_COUNT) || 10,
  discoveryInterval: parseInt(process.env.DISCOVERY_INTERVAL) || 600000,
  
  // Alert Settings
  alertCooldown: parseInt(process.env.ALERT_COOLDOWN) || 300000,
  maxAlertsPerHour: parseInt(process.env.MAX_ALERTS_PER_HOUR) || 50,
  minTokenMarketCap: parseInt(process.env.MIN_TOKEN_MARKET_CAP) || 1000,
  
  // Whale Detection Settings
  whaleSolThreshold: parseFloat(process.env.WHALE_SOL_THRESHOLD) || 1.0,
  whaleUsdThreshold: parseFloat(process.env.WHALE_USD_THRESHOLD) || 150,
  marketCapRatioThreshold: parseFloat(process.env.MARKET_CAP_RATIO_THRESHOLD) || 0.01,
  
  // Token Swap Detection
  excludedTokens: (process.env.EXCLUDED_TOKENS || 'SOL,USDT,USDC,WSOL').split(','),
  enableTokenMetadata: process.env.ENABLE_TOKEN_METADATA === 'true',
  enableDexscreenerLinks: process.env.ENABLE_DEXSCREENER_LINKS === 'true',
  
  // Monitoring Settings
  walletMonitorInterval: parseInt(process.env.WALLET_MONITOR_INTERVAL) || 300000,
  transactionHistoryDays: parseInt(process.env.TRANSACTION_HISTORY_DAYS) || 7,
  maxWalletsToMonitor: parseInt(process.env.MAX_WALLETS_TO_MONITOR) || 100,
  
  // Legacy compatibility
  trackInterval: '*/5 * * * *'
};

// Initialize Solana connection
const connection = new Connection(config.rpcUrl, 'confirmed');

// Initialize database
const db = new sqlite3.Database(config.dbPath);

// Initialize Telegram bot if token is provided
let bot = null;
if (config.telegramToken) {
  bot = new TelegramBot(config.telegramToken, { polling: false });
}

// Debug logging function
function debugLog(message, data = null) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Initialize database tables
function initializeDatabase() {
  debugLog('Initializing database...');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create wallets table
      db.run(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT UNIQUE NOT NULL,
          label TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          signature TEXT UNIQUE NOT NULL,
          amount REAL,
          token_address TEXT,
          transaction_type TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (wallet_address) REFERENCES wallets (address)
        )
      `);

      // Create alerts table
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          message TEXT NOT NULL,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (wallet_address) REFERENCES wallets (address)
        )
      `, (err) => {
        if (err) {
          debugLog('Database initialization error:', err);
          reject(err);
        } else {
          debugLog('Database initialized successfully');
          resolve();
        }
      });
    });
  });
}

// Add wallet to tracking
function addWallet(address, label = '') {
  debugLog(`Adding wallet to tracking: ${address}`);
  
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO wallets (address, label) VALUES (?, ?)',
      [address, label],
      function(err) {
        if (err) {
          debugLog('Error adding wallet:', err);
          reject(err);
        } else {
          debugLog(`Wallet added/updated: ${address}`);
          resolve(this.lastID);
        }
      }
    );
  });
}

// Get tracked wallets
function getTrackedWallets() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM wallets', (err, rows) => {
      if (err) {
        debugLog('Error getting wallets:', err);
        reject(err);
      } else {
        debugLog(`Found ${rows.length} tracked wallets`);
        resolve(rows);
      }
    });
  });
}

// Track wallet activity with whale detection
async function trackWalletActivity(walletAddress) {
  try {
    debugLog(`Tracking activity for wallet: ${walletAddress}`);
    
    const publicKey = new PublicKey(walletAddress);
    
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10
    });
    
    debugLog(`Found ${signatures.length} recent signatures for ${walletAddress}`);
    
    for (const sig of signatures) {
      // Check if transaction already exists
      const exists = await new Promise((resolve) => {
        db.get('SELECT id FROM transactions WHERE signature = ?', [sig.signature], (err, row) => {
          resolve(!err && row);
        });
      });
      
      if (!exists) {
        // Get transaction details
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (transaction) {
          // Analyze transaction for whale activity
          const whaleActivity = await analyzeWhaleActivity(transaction, walletAddress);
          
          // Store transaction
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO transactions (wallet_address, signature, amount, transaction_type, timestamp) VALUES (?, ?, ?, ?, ?)',
              [walletAddress, sig.signature, whaleActivity.amount || 0, whaleActivity.type || 'transfer', new Date(sig.blockTime * 1000).toISOString()],
              (err) => {
                if (err) {
                  debugLog('Error storing transaction:', err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
          
          debugLog(`Stored new transaction: ${sig.signature}`);
          
          // Check if this is whale activity and send alert
          if (whaleActivity.isWhale) {
            await sendWhaleAlert(walletAddress, whaleActivity, sig.signature);
          }
        }
      }
    }
  } catch (error) {
    debugLog(`Error tracking wallet ${walletAddress}:`, error);
  }
}

// Analyze transaction for whale activity and token swaps
async function analyzeWhaleActivity(transaction, walletAddress) {
  try {
    const activity = {
      amount: 0,
      type: 'transfer',
      isWhale: false,
      solAmount: 0,
      usdValue: 0,
      marketCapRatio: 0,
      isSwap: false,
      tokenMint: null,
      tokenSymbol: null,
      tokenName: null,
      swapDirection: null, // 'buy' or 'sell'
      dexscreenerUrl: null
    };
    
    if (!transaction || !transaction.meta) {
      return activity;
    }
    
    // Check if this is a token swap by analyzing the transaction
    const swapInfo = await analyzeTokenSwap(transaction);
    if (swapInfo.isSwap) {
      activity.isSwap = true;
      activity.tokenMint = swapInfo.tokenMint;
      activity.swapDirection = swapInfo.direction;
      activity.type = swapInfo.direction === 'buy' ? 'token_buy' : 'token_sell';
      
      // Skip excluded tokens
      if (swapInfo.tokenSymbol && config.excludedTokens.includes(swapInfo.tokenSymbol.toUpperCase())) {
        debugLog(`Skipping excluded token: ${swapInfo.tokenSymbol}`);
        return activity;
      }
      
      // Get token metadata
      if (config.enableTokenMetadata && swapInfo.tokenMint) {
        const tokenMetadata = await getTokenMetadata(swapInfo.tokenMint);
        activity.tokenSymbol = tokenMetadata.symbol || swapInfo.tokenSymbol;
        activity.tokenName = tokenMetadata.name || swapInfo.tokenName;
      }
      
      // Generate DexScreener URL
      if (config.enableDexscreenerLinks && swapInfo.tokenMint) {
        activity.dexscreenerUrl = `https://dexscreener.com/solana/${swapInfo.tokenMint}`;
      }
      
      // Only alert for token buys (not sells)
      if (swapInfo.direction !== 'buy') {
        return activity;
      }
    }
    
    // Calculate SOL amount from balance changes
    const preBalances = transaction.meta.preBalances || [];
    const postBalances = transaction.meta.postBalances || [];
    
    if (preBalances.length > 0 && postBalances.length > 0) {
      const balanceChange = Math.abs(postBalances[0] - preBalances[0]) / 1e9; // Convert lamports to SOL
      activity.solAmount = balanceChange;
      activity.amount = balanceChange;
      
      // Estimate USD value (simplified - in production, use real-time SOL price)
      const estimatedSolPrice = 150; // Updated estimate
      activity.usdValue = balanceChange * estimatedSolPrice;
      
      // Check whale thresholds
      if (balanceChange >= config.whaleSolThreshold && activity.usdValue >= config.whaleUsdThreshold) {
        activity.isWhale = true;
        
        // Calculate market cap ratio (simplified)
        const estimatedMarketCap = 1000000; // Placeholder - should fetch real market cap
        activity.marketCapRatio = (activity.usdValue / estimatedMarketCap) * 100;
        
        // Check if it meets market cap ratio threshold
        if (activity.marketCapRatio >= config.marketCapRatioThreshold) {
          const logMessage = activity.isSwap 
            ? `🐋 WHALE TOKEN ${activity.swapDirection.toUpperCase()} DETECTED: ${balanceChange.toFixed(4)} SOL (~$${activity.usdValue.toFixed(2)}) - Token: ${activity.tokenSymbol || activity.tokenMint}`
            : `🐋 WHALE DETECTED: ${balanceChange.toFixed(4)} SOL (~$${activity.usdValue.toFixed(2)}) - ${activity.marketCapRatio.toFixed(4)}% of market cap`;
          
          debugLog(logMessage);
        }
      }
    }
    
    return activity;
  } catch (error) {
    debugLog('Error analyzing whale activity:', error);
    return { 
      amount: 0, type: 'transfer', isWhale: false, solAmount: 0, usdValue: 0, marketCapRatio: 0,
      isSwap: false, tokenMint: null, tokenSymbol: null, tokenName: null, swapDirection: null, dexscreenerUrl: null
    };
  }
}

// Analyze if transaction is a token swap
async function analyzeTokenSwap(transaction) {
  try {
    const swapInfo = {
      isSwap: false,
      tokenMint: null,
      tokenSymbol: null,
      tokenName: null,
      direction: null // 'buy' or 'sell'
    };
    
    if (!transaction.meta || !transaction.meta.preTokenBalances || !transaction.meta.postTokenBalances) {
      return swapInfo;
    }
    
    const preTokenBalances = transaction.meta.preTokenBalances;
    const postTokenBalances = transaction.meta.postTokenBalances;
    
    // Check for token balance changes
    const tokenChanges = [];
    
    // Compare pre and post token balances
    for (const postBalance of postTokenBalances) {
      const preBalance = preTokenBalances.find(pre => 
        pre.accountIndex === postBalance.accountIndex && 
        pre.mint === postBalance.mint
      );
      
      const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.uiAmountString || '0') : 0;
      const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
      const change = postAmount - preAmount;
      
      if (Math.abs(change) > 0) {
        tokenChanges.push({
          mint: postBalance.mint,
          change: change,
          symbol: postBalance.uiTokenAmount.uiAmountString ? 'Unknown' : null,
          decimals: postBalance.uiTokenAmount.decimals
        });
      }
    }
    
    // Check for new token accounts (tokens that appear in post but not in pre)
    for (const postBalance of postTokenBalances) {
      const existsInPre = preTokenBalances.some(pre => 
        pre.accountIndex === postBalance.accountIndex && 
        pre.mint === postBalance.mint
      );
      
      if (!existsInPre && parseFloat(postBalance.uiTokenAmount.uiAmountString || '0') > 0) {
        tokenChanges.push({
          mint: postBalance.mint,
          change: parseFloat(postBalance.uiTokenAmount.uiAmountString || '0'),
          symbol: 'Unknown',
          decimals: postBalance.uiTokenAmount.decimals
        });
      }
    }
    
    // If we have token changes, this is likely a swap
    if (tokenChanges.length > 0) {
      swapInfo.isSwap = true;
      
      // Find the token that increased (bought token)
      const boughtToken = tokenChanges.find(change => change.change > 0);
      if (boughtToken) {
        swapInfo.tokenMint = boughtToken.mint;
        swapInfo.direction = 'buy';
        swapInfo.tokenSymbol = boughtToken.symbol;
      } else {
        // If no positive change, check for the largest negative change (sold token)
        const soldToken = tokenChanges.reduce((prev, current) => 
          (Math.abs(current.change) > Math.abs(prev.change)) ? current : prev
        );
        if (soldToken) {
          swapInfo.tokenMint = soldToken.mint;
          swapInfo.direction = 'sell';
          swapInfo.tokenSymbol = soldToken.symbol;
        }
      }
    }
    
    return swapInfo;
  } catch (error) {
    debugLog('Error analyzing token swap:', error);
    return { isSwap: false, tokenMint: null, tokenSymbol: null, tokenName: null, direction: null };
  }
}

// Get token metadata from mint address
async function getTokenMetadata(mintAddress) {
  try {
    // This is a simplified version - in production, you'd use a token metadata service
    // For now, we'll return basic info and rely on DexScreener for full details
    return {
      symbol: 'Unknown',
      name: 'Unknown Token',
      mint: mintAddress
    };
  } catch (error) {
    debugLog('Error getting token metadata:', error);
    return { symbol: 'Unknown', name: 'Unknown Token', mint: mintAddress };
  }
}

// Send whale alert
async function sendWhaleAlert(walletAddress, whaleActivity, signature) {
  try {
    let alertMessage;
    
    if (whaleActivity.isSwap && whaleActivity.swapDirection === 'buy') {
      // Token buy alert
      alertMessage = `🐋 WHALE TOKEN BUY ALERT! 🚀\n\n` +
        `💰 Amount: ${whaleActivity.solAmount.toFixed(4)} SOL (~$${whaleActivity.usdValue.toFixed(2)})\n` +
        `🪙 Token: ${whaleActivity.tokenSymbol || 'Unknown'}\n` +
        `📄 Mint: ${whaleActivity.tokenMint}\n` +
        `👛 Wallet: ${walletAddress.substring(0, 8)}...${walletAddress.substring(-8)}\n` +
        `📊 Market Cap Impact: ${whaleActivity.marketCapRatio.toFixed(4)}%\n` +
        `🔗 Signature: ${signature}\n` +
        `⏰ Time: ${new Date().toLocaleString()}`;
      
      // Add DexScreener link if available
      if (whaleActivity.dexscreenerUrl) {
        alertMessage += `\n\n📈 DexScreener: ${whaleActivity.dexscreenerUrl}`;
      }
      
      // Add Solscan link
      alertMessage += `\n🔍 Solscan: https://solscan.io/tx/${signature}`;
      
    } else {
      // Regular whale transfer alert
      alertMessage = `🐋 WHALE TRANSFER ALERT!\n\n` +
        `💰 Amount: ${whaleActivity.solAmount.toFixed(4)} SOL (~$${whaleActivity.usdValue.toFixed(2)})\n` +
        `👛 Wallet: ${walletAddress.substring(0, 8)}...${walletAddress.substring(-8)}\n` +
        `📊 Market Cap Impact: ${whaleActivity.marketCapRatio.toFixed(4)}%\n` +
        `🔗 Signature: ${signature}\n` +
        `⏰ Time: ${new Date().toLocaleString()}\n` +
        `🔍 Solscan: https://solscan.io/tx/${signature}`;
    }
    
    // Check alert cooldown
    const lastAlert = await new Promise((resolve) => {
      db.get(
        'SELECT sent_at FROM alerts WHERE wallet_address = ? ORDER BY sent_at DESC LIMIT 1',
        [walletAddress],
        (err, row) => {
          resolve(row);
        }
      );
    });
    
    const now = Date.now();
    const canSendAlert = !lastAlert || (now - new Date(lastAlert.sent_at).getTime()) > config.alertCooldown;
    
    if (canSendAlert) {
      // Store alert
      const alertType = whaleActivity.isSwap ? 'whale_token_buy' : 'whale_transfer';
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO alerts (wallet_address, alert_type, message) VALUES (?, ?, ?)',
          [walletAddress, alertType, alertMessage],
          (err) => {
            if (err) {
              debugLog('Error storing alert:', err);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
      
      // Send Telegram alert
      await sendAlert(alertMessage);
      
      const logMessage = whaleActivity.isSwap 
        ? `🚨 Whale token buy alert sent for wallet: ${walletAddress} - Token: ${whaleActivity.tokenSymbol || whaleActivity.tokenMint}`
        : `🚨 Whale transfer alert sent for wallet: ${walletAddress}`;
      
      debugLog(logMessage);
    } else {
      debugLog(`⏳ Alert cooldown active for wallet: ${walletAddress}`);
    }
  } catch (error) {
    debugLog('Error sending whale alert:', error);
  }
}

// Send Telegram alert
async function sendAlert(message) {
  if (!bot || !config.telegramChatId) {
    debugLog('Telegram bot not configured, skipping alert');
    return;
  }
  
  try {
    debugLog('Sending Telegram alert:', message);
    await bot.sendMessage(config.telegramChatId, message);
    debugLog('Alert sent successfully');
  } catch (error) {
    debugLog('Error sending Telegram alert:', error);
  }
}

// Main tracking function
async function runTracking() {
  debugLog('Starting wallet tracking cycle...');
  
  try {
    const wallets = await getTrackedWallets();
    
    if (wallets.length === 0) {
      debugLog('No wallets to track. Add some wallets first.');
      return;
    }
    
    for (const wallet of wallets) {
      await trackWalletActivity(wallet.address);
    }
    
    debugLog('Wallet tracking cycle completed');
  } catch (error) {
    debugLog('Error in tracking cycle:', error);
  }
}

// Start the application
async function start() {
  debugLog('Starting Solana Wallet Tracker...');
  
  try {
    // Initialize database
    await initializeDatabase();
    
    // Add some example wallets for testing
    await addWallet('11111111111111111111111111111112', 'System Program');
    await addWallet('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'Token Program');
    
    // Add some known whale wallets for monitoring
    await addWallet('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', 'Alameda Research');
    await addWallet('GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQBPdH4sLsI', 'FTX Exchange');
    await addWallet('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'Binance Hot Wallet');
    await addWallet('2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S', 'Solana Foundation');
    
    debugLog('Added whale wallets for monitoring');
    
    debugLog('Application initialized successfully');
    
    // Start cron job for tracking
    cron.schedule(config.trackInterval, () => {
      runTracking();
    });
    
    debugLog(`Tracking scheduled every 5 minutes`);
    
    // Run initial tracking
    await runTracking();
    
    // Keep the application running
    process.on('SIGINT', () => {
      debugLog('Shutting down...');
      db.close();
      process.exit(0);
    });
    
    debugLog('Application is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    debugLog('Error starting application:', error);
    process.exit(1);
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  start();
}

module.exports = {
  start,
  addWallet,
  getTrackedWallets,
  trackWalletActivity,
  sendAlert
};