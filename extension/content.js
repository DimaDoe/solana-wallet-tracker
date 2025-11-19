// 1RW Verification Badge Extension - Content Script

// Cache for verified wallets
const verificationCache = new Map();
const API_BASE = 'https://1rw.io'; // Replace with actual API URL

// Check verification status
async function checkVerification(wallet) {
  if (verificationCache.has(wallet)) {
    return verificationCache.get(wallet);
  }

  try {
    const response = await fetch(`${API_BASE}/api/check/${wallet}`);
    const data = await response.json();
    verificationCache.set(wallet, data);
    return data;
  } catch (error) {
    console.error('1RW: Failed to check verification:', error);
    return null;
  }
}

// Create badge element
function createBadge(isVerified, tier) {
  const badge = document.createElement('span');
  badge.className = 'onerwl-badge';

  if (isVerified) {
    badge.classList.add('verified');
    badge.innerHTML = '✓';
    badge.title = tier === 'lifetime' ? '1RW Verified Human (Lifetime)' : '1RW Verified Human';
    if (tier === 'lifetime') {
      badge.classList.add('lifetime');
    }
  } else {
    badge.classList.add('not-verified');
    badge.innerHTML = '?';
    badge.title = 'Not 1RW Verified';
  }

  return badge;
}

// Find and process Twitter handles
function processHandles() {
  // Look for wallet addresses in bios or pinned tweets
  // This is a simplified version - real implementation would need
  // to map Twitter handles to Solana wallets via a database

  const bioElements = document.querySelectorAll('[data-testid="UserDescription"]');

  bioElements.forEach(bio => {
    // Skip if already processed
    if (bio.dataset.onerwProcessed) return;
    bio.dataset.onerwProcessed = 'true';

    // Look for Solana wallet addresses (base58, 32-44 chars)
    const text = bio.textContent;
    const walletMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);

    if (walletMatch) {
      const wallet = walletMatch[0];

      checkVerification(wallet).then(result => {
        if (result) {
          const badge = createBadge(result.isVerified, result.tier);

          // Find the username element and append badge
          const userCell = bio.closest('[data-testid="UserCell"]') ||
                         bio.closest('[data-testid="primaryColumn"]');

          if (userCell) {
            const nameElement = userCell.querySelector('[data-testid="User-Name"]') ||
                               userCell.querySelector('span');
            if (nameElement && !nameElement.querySelector('.onerwl-badge')) {
              nameElement.appendChild(badge);
            }
          }
        }
      });
    }
  });
}

// Observe DOM changes for Twitter's dynamic content
const observer = new MutationObserver((mutations) => {
  let shouldProcess = false;

  mutations.forEach(mutation => {
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
    }
  });

  if (shouldProcess) {
    // Debounce processing
    clearTimeout(window.onerwDebounce);
    window.onerwDebounce = setTimeout(processHandles, 500);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial processing
setTimeout(processHandles, 1000);

console.log('1RW Verification Badge Extension loaded');
