# 1RW Verification Badge - Browser Extension

Shows 1RW human verification badges next to Twitter/X profiles.

## Installation

### Chrome / Brave / Edge

1. Open `chrome://extensions/` (or `brave://extensions/` or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

## How It Works

The extension:
1. Scans Twitter/X profiles for Solana wallet addresses in bios
2. Checks each wallet against the 1RW verification API
3. Shows a badge next to verified profiles

### Badge Types

- **Purple badge (✓)**: Standard verified human
- **Gold badge (✓)**: Lifetime verified human
- **Gray badge (?)**: Not verified

## Configuration

To use with your own API, update `API_BASE` in `content.js`:

```javascript
const API_BASE = 'https://your-api-url.com';
```

## Development

The extension uses Manifest V3 and consists of:

- `manifest.json` - Extension configuration
- `content.js` - Injects badges into Twitter/X pages
- `background.js` - Service worker for cache management
- `popup.html/js` - Extension popup UI
- `styles.css` - Badge styling

## Icons

You'll need to create icons for production:
- `icons/icon16.png` - 16x16
- `icons/icon48.png` - 48x48
- `icons/icon128.png` - 128x128

## Notes

- Cache is cleared every 15 minutes
- Only checks wallets found in user bios
- For production, implement a Twitter handle → Solana wallet mapping
