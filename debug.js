const { getTrackedWallets, addWallet } = require('./src/index.js');
const sqlite3 = require('sqlite3').verbose();

// Debug configuration
const DEBUG = true;

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

// Database connection for direct queries
const db = new sqlite3.Database('./wallet_tracker.db');

// Debug functions
async function showTrackedWallets() {
  try {
    debugLog('Fetching tracked wallets...');
    const wallets = await getTrackedWallets();
    debugLog(`Found ${wallets.length} tracked wallets:`, wallets);
    return wallets;
  } catch (error) {
    debugLog('Error fetching wallets:', error);
  }
}

async function showRecentTransactions(limit = 10) {
  return new Promise((resolve, reject) => {
    debugLog(`Fetching last ${limit} transactions...`);
    db.all(
      'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          debugLog('Error fetching transactions:', err);
          reject(err);
        } else {
          debugLog(`Found ${rows.length} recent transactions:`, rows);
          resolve(rows);
        }
      }
    );
  });
}

async function showDatabaseStats() {
  return new Promise((resolve, reject) => {
    debugLog('Fetching database statistics...');
    
    const stats = {};
    
    // Count wallets
    db.get('SELECT COUNT(*) as count FROM wallets', (err, row) => {
      if (err) {
        debugLog('Error counting wallets:', err);
        reject(err);
        return;
      }
      stats.wallets = row.count;
      
      // Count transactions
      db.get('SELECT COUNT(*) as count FROM transactions', (err, row) => {
        if (err) {
          debugLog('Error counting transactions:', err);
          reject(err);
          return;
        }
        stats.transactions = row.count;
        
        // Count alerts
        db.get('SELECT COUNT(*) as count FROM alerts', (err, row) => {
          if (err) {
            debugLog('Error counting alerts:', err);
            reject(err);
            return;
          }
          stats.alerts = row.count;
          
          debugLog('Database statistics:', stats);
          resolve(stats);
        });
      });
    });
  });
}

async function addTestWallet(address, label = 'Test Wallet') {
  try {
    debugLog(`Adding test wallet: ${address} (${label})`);
    const result = await addWallet(address, label);
    debugLog('Test wallet added successfully:', result);
    return result;
  } catch (error) {
    debugLog('Error adding test wallet:', error);
  }
}

// Main debug function
async function runDebug() {
  debugLog('Starting debug session...');
  
  try {
    // Show database stats
    await showDatabaseStats();
    
    // Show tracked wallets
    await showTrackedWallets();
    
    // Show recent transactions
    await showRecentTransactions(5);
    
    debugLog('Debug session completed');
    
  } catch (error) {
    debugLog('Error in debug session:', error);
  } finally {
    db.close();
  }
}

// Export functions for use in other scripts
module.exports = {
  showTrackedWallets,
  showRecentTransactions,
  showDatabaseStats,
  addTestWallet,
  runDebug
};

// Run debug if this file is executed directly
if (require.main === module) {
  runDebug();
}