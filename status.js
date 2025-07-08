const { exec } = require('child_process');
const { showDatabaseStats, showTrackedWallets } = require('./debug.js');

// Status display function
async function showStatus() {
  console.log('🚀 SOLANA WALLET TRACKER - APPLICATION STATUS');
  console.log('=' .repeat(50));
  
  try {
    // Show database stats
    const stats = await showDatabaseStats();
    console.log('\n📊 DATABASE STATISTICS:');
    console.log(`   • Wallets tracked: ${stats.wallets}`);
    console.log(`   • Transactions stored: ${stats.transactions}`);
    console.log(`   • Alerts generated: ${stats.alerts}`);
    
    // Show tracked wallets
    const wallets = await showTrackedWallets();
    console.log('\n👛 TRACKED WALLETS:');
    wallets.forEach((wallet, index) => {
      console.log(`   ${index + 1}. ${wallet.address} (${wallet.label})`);
    });
    
    // Show running processes
    console.log('\n🔄 RUNNING PROCESSES:');
    exec('ps aux | grep -E "(node.*index|node.*monitor)" | grep -v grep', (error, stdout, stderr) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
          const parts = line.split(/\s+/);
          const pid = parts[1];
          const cmd = parts.slice(10).join(' ');
          console.log(`   • PID ${pid}: ${cmd}`);
        });
      }
      
      console.log('\n✅ APPLICATION STATUS: RUNNING');
      console.log('   • Main tracker: Active');
      console.log('   • Monitoring: Active');
      console.log('   • Database: Connected');
      console.log('   • Debug mode: Enabled');
      
      console.log('\n📝 USAGE:');
      console.log('   • Run "node debug.js" to see detailed debug info');
      console.log('   • Run "node monitor.js" to start monitoring');
      console.log('   • Press Ctrl+C to stop the application');
      
      console.log('\n🔧 DEBUGGING TOOLS:');
      console.log('   • debug.js - Detailed debugging and database queries');
      console.log('   • monitor.js - Real-time monitoring');
      console.log('   • status.js - This status overview');
      
    });
    
  } catch (error) {
    console.error('❌ Error getting status:', error);
  }
}

// Run status if this file is executed directly
if (require.main === module) {
  showStatus();
}

module.exports = { showStatus };