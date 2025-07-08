const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const sqlite3 = require('sqlite3').verbose();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// Configuration
const config = {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    dbPath: './wallet_tracker.db',
    checkInterval: '*/5 * * * *' // Every 5 minutes
};

// Initialize database
function initializeDatabase() {
    console.log('🔧 Initializing database...');
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.dbPath);
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS wallets (
                address TEXT PRIMARY KEY,
                label TEXT,
                last_balance REAL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT,
                signature TEXT,
                amount REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_address) REFERENCES wallets (address)
            )`);
        });
        
        db.close((err) => {
            if (err) {
                console.error('❌ Database initialization failed:', err);
                reject(err);
            } else {
                console.log('✅ Database initialized successfully');
                resolve();
            }
        });
    });
}

// Initialize Solana connection
function initializeSolanaConnection() {
    console.log('🔗 Connecting to Solana network...');
    try {
        const connection = new Connection(config.solanaRpcUrl, 'confirmed');
        console.log('✅ Solana connection established');
        return connection;
    } catch (error) {
        console.error('❌ Failed to connect to Solana:', error);
        throw error;
    }
}

// Get wallet balance
async function getWalletBalance(connection, walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
        console.error(`❌ Error getting balance for ${walletAddress}:`, error);
        return null;
    }
}

// Add wallet to tracking
function addWalletToTracking(address, label = '') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.dbPath);
        
        db.run(
            'INSERT OR REPLACE INTO wallets (address, label) VALUES (?, ?)',
            [address, label],
            function(err) {
                db.close();
                if (err) {
                    console.error('❌ Error adding wallet:', err);
                    reject(err);
                } else {
                    console.log(`✅ Wallet ${address} added to tracking`);
                    resolve();
                }
            }
        );
    });
}

// Get tracked wallets
function getTrackedWallets() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.dbPath);
        
        db.all('SELECT * FROM wallets', [], (err, rows) => {
            db.close();
            if (err) {
                console.error('❌ Error getting tracked wallets:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Update wallet balance
function updateWalletBalance(address, balance) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.dbPath);
        
        db.run(
            'UPDATE wallets SET last_balance = ?, last_updated = CURRENT_TIMESTAMP WHERE address = ?',
            [balance, address],
            function(err) {
                db.close();
                if (err) {
                    console.error('❌ Error updating wallet balance:', err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Send Telegram notification
function sendTelegramNotification(message) {
    if (!config.telegramToken || !config.telegramChatId) {
        console.log('📱 Telegram not configured, skipping notification');
        return;
    }
    
    try {
        const bot = new TelegramBot(config.telegramToken);
        bot.sendMessage(config.telegramChatId, message, { parse_mode: 'HTML' });
        console.log('📱 Telegram notification sent');
    } catch (error) {
        console.error('❌ Error sending Telegram notification:', error);
    }
}

// Main tracking function
async function trackWallets() {
    console.log('🔍 Starting wallet tracking...');
    
    try {
        const connection = initializeSolanaConnection();
        const wallets = await getTrackedWallets();
        
        if (wallets.length === 0) {
            console.log('⚠️  No wallets configured for tracking');
            return;
        }
        
        console.log(`📊 Tracking ${wallets.length} wallets...`);
        
        for (const wallet of wallets) {
            const currentBalance = await getWalletBalance(connection, wallet.address);
            
            if (currentBalance !== null) {
                const previousBalance = wallet.last_balance || 0;
                const balanceChange = currentBalance - previousBalance;
                
                await updateWalletBalance(wallet.address, currentBalance);
                
                console.log(`💰 ${wallet.label || wallet.address}: ${currentBalance.toFixed(4)} SOL (${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(4)})`);
                
                // Send notification for significant changes
                if (Math.abs(balanceChange) > 0.1) {
                    const message = `🔔 <b>Wallet Activity Detected</b>\n\n` +
                                  `Wallet: ${wallet.label || wallet.address}\n` +
                                  `Balance: ${currentBalance.toFixed(4)} SOL\n` +
                                  `Change: ${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(4)} SOL`;
                    sendTelegramNotification(message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error in wallet tracking:', error);
    }
}

// Initialize Telegram bot (if configured)
function initializeTelegramBot() {
    if (!config.telegramToken) {
        console.log('⚠️  Telegram bot token not configured');
        return null;
    }
    
    try {
        const bot = new TelegramBot(config.telegramToken, { polling: true });
        
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, '🚀 Solana Wallet Tracker Bot Started!\n\nUse /help for available commands.');
        });
        
        bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `📋 <b>Available Commands:</b>\n\n` +
                              `/add <wallet_address> [label] - Add wallet to tracking\n` +
                              `/list - List tracked wallets\n` +
                              `/balance <wallet_address> - Check specific wallet balance\n` +
                              `/status - Show tracking status`;
            bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
        });
        
        bot.onText(/\/add (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const parts = match[1].split(' ');
            const address = parts[0];
            const label = parts.slice(1).join(' ') || '';
            
            try {
                new PublicKey(address); // Validate address
                await addWalletToTracking(address, label);
                bot.sendMessage(chatId, `✅ Wallet ${address} added to tracking`);
            } catch (error) {
                bot.sendMessage(chatId, '❌ Invalid Solana wallet address');
            }
        });
        
        bot.onText(/\/list/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const wallets = await getTrackedWallets();
                if (wallets.length === 0) {
                    bot.sendMessage(chatId, '📝 No wallets currently tracked');
                } else {
                    let message = '📝 <b>Tracked Wallets:</b>\n\n';
                    for (const wallet of wallets) {
                        message += `${wallet.label || 'No label'}: <code>${wallet.address}</code>\n`;
                    }
                    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
                }
            } catch (error) {
                bot.sendMessage(chatId, '❌ Error retrieving wallet list');
            }
        });
        
        console.log('✅ Telegram bot initialized');
        return bot;
    } catch (error) {
        console.error('❌ Error initializing Telegram bot:', error);
        return null;
    }
}

// Main application startup
async function startApplication() {
    console.log('🚀 Starting Solana Wallet Tracker...');
    console.log('📊 Debug mode enabled');
    
    try {
        // Initialize database
        await initializeDatabase();
        
        // Initialize Telegram bot
        const bot = initializeTelegramBot();
        
        // Set up cron job for periodic tracking
        cron.schedule(config.checkInterval, () => {
            console.log('⏰ Scheduled tracking check...');
            trackWallets();
        });
        
        // Initial tracking run
        await trackWallets();
        
        console.log('✅ Application started successfully');
        console.log(`⏰ Tracking interval: ${config.checkInterval}`);
        console.log('🔍 Monitoring wallets for activity...');
        
        // Keep the application running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down application...');
            if (bot) {
                bot.stopPolling();
            }
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
startApplication();