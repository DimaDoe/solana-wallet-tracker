const { showDatabaseStats, showTrackedWallets, showRecentTransactions } = require('./debug.js');

// Monitoring configuration
const MONITOR_INTERVAL = 30000; // 30 seconds
const DEBUG = true;

// Debug logging function
function debugLog(message, data = null) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[MONITOR ${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Previous stats for comparison
let previousStats = null;

// Monitor function
async function monitor() {
  try {
    debugLog('=== Monitoring Cycle Start ===');
    
    // Get current stats
    const currentStats = await showDatabaseStats();
    
    // Compare with previous stats
    if (previousStats) {
      const walletDiff = currentStats.wallets - previousStats.wallets;
      const transactionDiff = currentStats.transactions - previousStats.transactions;
      const alertDiff = currentStats.alerts - previousStats.alerts;
      
      if (walletDiff > 0) {
        debugLog(`🆕 New wallets added: +${walletDiff}`);
      }
      
      if (transactionDiff > 0) {
        debugLog(`💾 New transactions tracked: +${transactionDiff}`);
      }
      
      if (alertDiff > 0) {
        debugLog(`🚨 New alerts generated: +${alertDiff}`);
      }
    }
    
    previousStats = currentStats;
    
    // Show current status
    debugLog('Current Status:', {
      wallets: currentStats.wallets,
      transactions: currentStats.transactions,
      alerts: currentStats.alerts,
      uptime: process.uptime().toFixed(2) + 's'
    });
    
    debugLog('=== Monitoring Cycle End ===\n');
    
  } catch (error) {
    debugLog('Error in monitoring cycle:', error);
  }
}

// Start monitoring
function startMonitoring() {
  debugLog(`Starting application monitoring (interval: ${MONITOR_INTERVAL/1000}s)`);
  
  // Initial monitoring
  monitor();
  
  // Set up periodic monitoring
  const intervalId = setInterval(monitor, MONITOR_INTERVAL);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    debugLog('Stopping monitoring...');
    clearInterval(intervalId);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    debugLog('Stopping monitoring...');
    clearInterval(intervalId);
    process.exit(0);
  });
}

// Start monitoring if this file is executed directly
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  monitor,
  startMonitoring
};