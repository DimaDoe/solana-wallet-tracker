// 1RW Verification Badge Extension - Background Service Worker

// Clear cache periodically (every 15 minutes)
chrome.alarms.create('clearCache', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'clearCache') {
    // Send message to content scripts to clear cache
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
          chrome.tabs.sendMessage(tab.id, { action: 'clearCache' }).catch(() => {});
        }
      });
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup or 1RW website
  chrome.tabs.create({ url: 'https://1rw.io' });
});

console.log('1RW Verification Badge Extension background loaded');
