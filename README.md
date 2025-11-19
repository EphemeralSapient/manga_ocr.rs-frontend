# Manga Text Processor - Chrome Extension

Chrome extension frontend for manga text detection, translation, and rendering. Communicates with the manga_ocr.rs backend server.

## Overview

This extension provides a browser-based interface for processing manga images directly on web pages:

- Detects large images (>200x200px) on the current page
- Sends images to the backend server for processing
- Replaces original images with translated versions
- Displays processing progress and analytics

## Features

- One-click processing via keyboard shortcut (Alt+Q)
- Configurable translation models (Gemini Flash/Pro variants)
- Multiple API key rotation for rate limit management
- Translation caching for faster reprocessing
- Detailed processing statistics and metrics
- Page notifications with expandable details
- Restore original images functionality

## Installation

### Prerequisites

- manga_ocr.rs backend server running (default: http://localhost:1420)
- Google Gemini API key(s)

### Build from Source

```bash
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Usage

1. Configure your Gemini API keys in the extension popup (API Keys tab)
2. Verify server connection status (green dot = connected)
3. Navigate to a page with manga images
4. Press **Alt+Q** to process all detected images

### Settings

| Setting | Description |
|---------|-------------|
| Translation Model | Gemini model variant (Flash/Pro) |
| Include Free Text | Process unstructured text outside bubbles |
| Text Stroke | Add outline to translated text |
| Blur Free Text BG | Apply blur behind free text |
| Banana Mode | Enhanced detection for complex layouts |
| Enable Cache | Cache translations on server |
| Detailed Metrics | Show comprehensive statistics |

## Configuration

The extension stores settings locally via Chrome storage API. API keys are stored securely and sent to the backend server on each request.

**Server URL**: Default is `http://localhost:1420`. Change in the extension popup if your backend runs on a different port.

**API Keys**: Create multiple API keys in different Google Cloud projects to avoid hitting rate limits quickly.

## Technical Stack

- **Build**: Vite + TypeScript
- **Target**: Chrome Manifest V3
- **API**: Chrome Extensions API (storage, scripting, activeTab)
- **Communication**: Fetch API to backend server

## Troubleshooting

**No images detected:**
- Ensure images are larger than 200x200 pixels
- Scroll to load lazy-loaded images
- Check browser console for errors

**Server connection failed:**
- Verify backend is running: `curl http://localhost:1420/health`
- Check server URL in extension settings
- Ensure no firewall blocking localhost connections

**Processing errors:**
- Verify API keys are valid at https://aistudio.google.com/apikey
- Check server logs for detailed error messages
- Ensure images are accessible (no CORS restrictions)

**Extension not loading:**
- Rebuild: `npm run build`
- Reload extension in chrome://extensions/
- Check for TypeScript errors: `npm run type-check`

## Development

```bash
# Watch mode
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## Disclaimer

This software is provided for educational and personal use only. It is not intended for commercial use or distribution. Users are responsible for ensuring they have appropriate rights to any content they process. This project is not associated with or endorsed by any copyright holders. Use at your own risk and respect intellectual property rights.
