// 1RW Verification Badge Extension - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Get stats from storage
  chrome.storage.local.get(['badgesShown'], (result) => {
    if (result.badgesShown) {
      // Could display stats here
      console.log('Badges shown:', result.badgesShown);
    }
  });
});
